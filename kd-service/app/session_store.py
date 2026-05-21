"""
Gestion de la sesion DWR contra el portal de Red.es.

Tres formas de obtener cookies, en orden de preferencia:

  1. session_keeper (servicio externo que mantiene login con .p12 y
     refresca cookies en background). Es la fuente preferida en
     desarrollo y produccion: GET {URL}/cookies con X-Admin-Key.

  2. cookies.json en disco (break-glass). Se usa como fallback si el
     keeper no esta configurado, no responde, o devuelve datos invalidos.

  3. Sesion en memoria del proceso actual (cache). Si las cookies aun no
     han expirado y son menos antiguas que SESSION_KEEPER_MAX_AGE_S, se
     reutilizan sin pegarle al keeper.

Cuando comprobar_elegibilidad() lanza SessionExpiredError (el portal
devolvio "Se ha perdido la sesion"), `invalidate()` marca la sesion como
invalida y la siguiente request fuerza un refresh desde el keeper.
"""

from __future__ import annotations

import threading
import time
from pathlib import Path
from typing import Literal

import requests

from .elegibilidad import DWRSession


SessionSource = Literal["keeper", "file", "unknown"]


class SessionUnavailable(Exception):
    """No hay cookies validas cargadas."""


class KeeperError(Exception):
    """Error al hablar con el session_keeper."""


class _SessionStore:
    """
    Singleton thread-safe que mantiene la DWRSession actual en memoria.

    No es persistente: si el proceso reinicia, hay que recargar.
    """

    # 5 claves obligatorias en el JSON del keeper / cookies.json.
    _REQUIRED_KEYS = (
        "INGRESSCOOKIE",
        "JSESSIONID",
        "owasp_csrf",
        "script_session_id",
        "window_name",
    )

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._session: DWRSession | None = None
        self._cookies_path: Path | None = None
        self._invalidation_reason: str = ""
        self._source: SessionSource = "unknown"
        self._loaded_at: float | None = None
        self._last_keeper_attempt_at: float | None = None
        self._last_keeper_ok: bool | None = None
        self._last_keeper_error: str = ""

    # ------------------------------------------------------------------
    # Cargas
    # ------------------------------------------------------------------

    def load_from_file(self, path: Path) -> DWRSession:
        """Carga (o recarga) las cookies desde disco (cookies.json)."""
        path = Path(path)
        if not path.is_file():
            raise FileNotFoundError(f"cookies.json no encontrado en {path}")
        session = DWRSession.from_file(str(path))
        with self._lock:
            self._session = session
            self._cookies_path = path
            self._invalidation_reason = ""
            self._source = "file"
            self._loaded_at = time.time()
        return session

    def load_from_keeper(
        self,
        url: str,
        admin_key: str,
        timeout_s: float,
    ) -> DWRSession:
        """
        Obtiene cookies frescas del session_keeper y las pone como sesion
        activa. Lanza KeeperError si la llamada falla, el JSON es
        invalido o faltan claves.
        """
        if not url or not admin_key:
            raise KeeperError("session_keeper no configurado (URL o admin key vacios)")

        endpoint = f"{url.rstrip('/')}/cookies"
        attempt_at = time.time()
        try:
            response = requests.get(
                endpoint,
                headers={"X-Admin-Key": admin_key, "Accept": "application/json"},
                timeout=timeout_s,
            )
        except requests.RequestException as e:
            with self._lock:
                self._last_keeper_attempt_at = attempt_at
                self._last_keeper_ok = False
                self._last_keeper_error = f"network: {e}"
            raise KeeperError(f"No se pudo contactar al keeper en {endpoint}: {e}") from e

        if response.status_code != 200:
            err = f"HTTP {response.status_code}: {response.text[:200]}"
            with self._lock:
                self._last_keeper_attempt_at = attempt_at
                self._last_keeper_ok = False
                self._last_keeper_error = err
            raise KeeperError(f"Keeper respondio {err}")

        try:
            data = response.json()
        except ValueError as e:
            with self._lock:
                self._last_keeper_attempt_at = attempt_at
                self._last_keeper_ok = False
                self._last_keeper_error = f"json: {e}"
            raise KeeperError(f"Respuesta del keeper no es JSON: {e}") from e

        missing = [k for k in self._REQUIRED_KEYS if not data.get(k)]
        if missing:
            err = f"faltan claves en respuesta del keeper: {missing}"
            with self._lock:
                self._last_keeper_attempt_at = attempt_at
                self._last_keeper_ok = False
                self._last_keeper_error = err
            raise KeeperError(err)

        session = DWRSession(
            ingress_cookie=data["INGRESSCOOKIE"],
            jsessionid=data["JSESSIONID"],
            owasp_csrf=data["owasp_csrf"],
            script_session_id=data["script_session_id"],
            window_name=data["window_name"],
        )

        with self._lock:
            self._session = session
            self._invalidation_reason = ""
            self._source = "keeper"
            self._loaded_at = time.time()
            self._last_keeper_attempt_at = attempt_at
            self._last_keeper_ok = True
            self._last_keeper_error = ""
        return session

    # ------------------------------------------------------------------
    # Lecturas / control
    # ------------------------------------------------------------------

    def get(self) -> DWRSession:
        """Devuelve la sesion actual o lanza SessionUnavailable."""
        with self._lock:
            if self._session is None:
                raise SessionUnavailable(
                    self._invalidation_reason
                    or "Sesion no inicializada (sin keeper ni cookies.json)"
                )
            return self._session

    def invalidate(self, reason: str) -> None:
        """Marca la sesion actual como invalida (p.ej. tras SessionExpired)."""
        with self._lock:
            self._session = None
            self._invalidation_reason = reason
            self._loaded_at = None

    def age_seconds(self) -> float | None:
        """Segundos desde la ultima carga. None si nunca se cargo."""
        with self._lock:
            if self._loaded_at is None:
                return None
            return time.time() - self._loaded_at

    def status(self) -> dict:
        """Snapshot para exponer en /health."""
        with self._lock:
            age = (
                time.time() - self._loaded_at if self._loaded_at is not None else None
            )
            last_attempt_age = (
                time.time() - self._last_keeper_attempt_at
                if self._last_keeper_attempt_at is not None
                else None
            )
            return {
                "session_loaded": self._session is not None,
                "session_source": self._source,
                "session_age_s": round(age, 1) if age is not None else None,
                "keeper_last_ok": self._last_keeper_ok,
                "keeper_last_attempt_age_s": (
                    round(last_attempt_age, 1)
                    if last_attempt_age is not None
                    else None
                ),
                "keeper_last_error": self._last_keeper_error or None,
                "invalidation_reason": self._invalidation_reason or None,
            }

    @property
    def cookies_path(self) -> Path | None:
        return self._cookies_path

    @property
    def is_loaded(self) -> bool:
        return self._session is not None

    @property
    def source(self) -> SessionSource:
        return self._source


# Singleton de modulo
session_store = _SessionStore()
