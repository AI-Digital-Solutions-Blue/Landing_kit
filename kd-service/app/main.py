"""
FastAPI app: expone kd_contract_parser por HTTP detras de X-API-Key.

Endpoints:
  GET  /health                        publico (para nginx / pm2 / monitor)
  POST /elegibilidad                  requiere X-API-Key
  POST /admin/refresh-from-keeper     requiere X-API-Key (pide cookies al keeper)
  POST /admin/reload-session          requiere X-API-Key (relee cookies.json, fallback)

El servicio escucha SOLO en loopback (127.0.0.1) y se asume que el unico
cliente legitimo es el backend Node de la landing. CORS por defecto vacio.
"""

from __future__ import annotations

import logging
import threading
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import __version__
from .api_models import (
    ElegibilidadRequest,
    ElegibilidadResponse,
    ErrorResponse,
    to_response,
)
from .elegibilidad import DWRError, SessionExpiredError, comprobar_elegibilidad
from .session_store import KeeperError, SessionUnavailable, session_store
from .settings import Settings, get_settings


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logger = logging.getLogger("kd-service")


def _setup_logging(level: str) -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s %(levelname)-5s %(name)s :: %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )


# ---------------------------------------------------------------------------
# Helpers de session loading: keeper -> cookies.json
# ---------------------------------------------------------------------------

# Lock que serializa los refrescos en background para evitar tormentas.
_refresh_lock = threading.Lock()


def _try_load_from_keeper(settings: Settings) -> bool:
    """Intenta cargar la sesion desde el keeper. Devuelve True si OK."""
    if not settings.keeper_enabled:
        return False
    try:
        session = session_store.load_from_keeper(
            url=settings.SESSION_KEEPER_URL,
            admin_key=settings.ADMIN_API_KEY,
            timeout_s=settings.SESSION_KEEPER_TIMEOUT_S,
        )
    except KeeperError as e:
        logger.warning("session_keeper no disponible: %s", e)
        return False
    logger.info(
        "Cookies cargadas desde keeper window=%s", session.window_name
    )
    return True


def _try_load_from_file(settings: Settings) -> bool:
    """Intenta cargar la sesion desde cookies.json. Devuelve True si OK."""
    try:
        session_store.load_from_file(settings.COOKIES_PATH)
    except FileNotFoundError as e:
        logger.warning("cookies.json no encontrado: %s", e)
        return False
    except Exception as e:
        logger.error("Fallo cargando cookies.json: %s", e)
        return False
    logger.info("Cookies cargadas desde fichero %s", settings.COOKIES_PATH)
    return True


def _refresh_session_background(settings: Settings) -> None:
    """
    Lanza un refresh asincrono desde el keeper en un thread daemon.
    Si otro refresh esta en curso, no hace nada (debounce).
    """
    if not settings.keeper_enabled:
        return

    def _worker() -> None:
        # tryacquire: si otro refresh esta corriendo, salimos.
        if not _refresh_lock.acquire(blocking=False):
            logger.debug("Refresh ya en curso, omito")
            return
        try:
            logger.info("Refresh de sesion desde keeper (background)...")
            _try_load_from_keeper(settings)
        finally:
            _refresh_lock.release()

    threading.Thread(target=_worker, daemon=True, name="keeper-refresh").start()


# ---------------------------------------------------------------------------
# Lifespan: cargar cookies al arrancar (no bloqueante si fallan)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    _setup_logging(settings.LOG_LEVEL)
    logger.info("kd-service v%s arrancando en modo %s", __version__, settings.ENV)

    # Orden de preferencia: keeper -> cookies.json
    if settings.keeper_enabled:
        logger.info(
            "session_keeper configurado en %s (timeout=%ss)",
            settings.SESSION_KEEPER_URL,
            settings.SESSION_KEEPER_TIMEOUT_S,
        )
        loaded = _try_load_from_keeper(settings)
        if not loaded:
            logger.info("Fallback a cookies.json por fallo del keeper")
            _try_load_from_file(settings)
    else:
        logger.info("session_keeper no configurado, usando cookies.json")
        _try_load_from_file(settings)

    if not session_store.is_loaded:
        # No abortamos el arranque: el proceso queda vivo pero /elegibilidad
        # responde 503 hasta que vuelva una fuente de cookies.
        logger.warning(
            "Arrancando SIN cookies cargadas. /elegibilidad respondera 503."
        )

    yield
    logger.info("kd-service apagandose")


app = FastAPI(
    title="kd-service",
    version=__version__,
    description="Wrapper HTTP del PoC kd_contract_parser para la landing Kit Digital.",
    lifespan=lifespan,
    # En produccion no exponemos /docs ni /redoc por loopback no es critico,
    # pero por higiene los desactivamos cuando ENV=production.
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.middleware("http")
async def _enable_docs_in_dev(request, call_next):
    """Activa /docs solo en development. No-op en produccion."""
    return await call_next(request)


# CORS: solo si hay origenes definidos (debug). En produccion vacio.
_settings_for_cors = get_settings()
if _settings_for_cors.cors_origins_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_settings_for_cors.cors_origins_list,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-API-Key"],
    )


# ---------------------------------------------------------------------------
# Auth dependency
# ---------------------------------------------------------------------------

def require_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    settings: Settings = Depends(get_settings),
) -> None:
    if not x_api_key or x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key",
        )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health(settings: Settings = Depends(get_settings)) -> dict:
    base = {
        "status": "ok",
        "version": __version__,
        "keeper_enabled": settings.keeper_enabled,
    }
    base.update(session_store.status())
    return base


@app.post(
    "/elegibilidad",
    response_model=ElegibilidadResponse,
    responses={
        401: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
def post_elegibilidad(
    payload: ElegibilidadRequest,
    _: None = Depends(require_api_key),
    settings: Settings = Depends(get_settings),
) -> ElegibilidadResponse:
    # Refresh proactivo si las cookies son mas viejas que MAX_AGE_S.
    if settings.keeper_enabled and settings.SESSION_KEEPER_MAX_AGE_S > 0:
        age = session_store.age_seconds()
        if age is not None and age >= settings.SESSION_KEEPER_MAX_AGE_S:
            logger.info(
                "Cookies con %.0fs de antiguedad (>=%ss), refrescando",
                age,
                settings.SESSION_KEEPER_MAX_AGE_S,
            )
            _refresh_session_background(settings)

    try:
        session = session_store.get()
    except SessionUnavailable as e:
        # Si la sesion no esta cargada y tenemos keeper, intentamos cargarla
        # inline antes de devolver 503. Es la "primera carga" tras un
        # arranque sin keeper disponible.
        if settings.keeper_enabled and _try_load_from_keeper(settings):
            try:
                session = session_store.get()
            except SessionUnavailable as e2:
                logger.warning("/elegibilidad sin sesion tras keeper: %s", e2)
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail={"error": "session_unavailable", "message": str(e2)},
                )
        else:
            logger.warning("/elegibilidad sin sesion: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={"error": "session_unavailable", "message": str(e)},
            )

    try:
        resultado = comprobar_elegibilidad(
            session=session,
            nif=payload.nif.upper(),
            bono=payload.bono,
            categoria_preferida=payload.categoria,
        )
    except SessionExpiredError as e:
        # Marcamos la sesion como invalida y disparamos refresh en background
        # para que la siguiente request tenga cookies nuevas.
        session_store.invalidate(f"Sesion expirada: {e}")
        logger.warning("Sesion DWR expirada; lanzando refresh en background")
        _refresh_session_background(settings)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "session_expired",
                "message": (
                    "La sesion DWR contra el portal ha expirado. Reintenta "
                    "en unos segundos; el servicio esta renovandola."
                ),
            },
        )
    except DWRError as e:
        logger.error("DWRError llamando al portal: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "upstream_error",
                "message": str(e),
            },
        )

    logger.info(
        "elegibilidad nif=%s bono=%s cat=%s eligible=%s ms=%d",
        payload.nif,
        payload.bono,
        payload.categoria,
        resultado.elegible,
        resultado.duracion_ms,
    )
    return to_response(resultado)


@app.post("/admin/refresh-from-keeper")
def refresh_from_keeper(
    _: None = Depends(require_api_key),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Pide cookies frescas al session_keeper y las pone como sesion activa.
    Es la forma normal de refrescar manualmente cuando algo va mal.
    """
    if not settings.keeper_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "keeper_not_configured",
                "message": "Define SESSION_KEEPER_URL y ADMIN_API_KEY en .env",
            },
        )
    try:
        session = session_store.load_from_keeper(
            url=settings.SESSION_KEEPER_URL,
            admin_key=settings.ADMIN_API_KEY,
            timeout_s=settings.SESSION_KEEPER_TIMEOUT_S,
        )
    except KeeperError as e:
        logger.error("Error pidiendo cookies al keeper: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error": "keeper_unreachable", "message": str(e)},
        )

    logger.info("Cookies refrescadas desde keeper window=%s", session.window_name)
    return {
        "status": "ok",
        "source": "keeper",
        "window_name": session.window_name,
    }


@app.post("/admin/reload-session")
def reload_session(
    _: None = Depends(require_api_key),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Releera cookies.json desde disco (break-glass). Usar tras regenerar el
    fichero a mano cuando ni el keeper ni el fichero responden.
    """
    try:
        session = session_store.load_from_file(settings.COOKIES_PATH)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "cookies_not_found", "message": str(e)},
        )
    except Exception as e:
        logger.error("Error recargando cookies.json: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "invalid_cookies", "message": str(e)},
        )

    logger.info("cookies.json recargado correctamente desde %s", settings.COOKIES_PATH)
    return {
        "status": "ok",
        "source": "file",
        "window_name": session.window_name,
    }


# ---------------------------------------------------------------------------
# Manejo uniforme de errores no capturados
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def _unhandled_exception(_request, exc: Exception):
    logger.exception("Excepcion no manejada: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_error", "message": "Error interno del servicio"},
    )
