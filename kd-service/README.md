# iniciar servicio (desarrollo local)
source .venv/Scripts/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload

# kd-service

Microservicio **FastAPI** que expone por HTTP el PoC `kd_contract_parser`
(consulta de elegibilidad de bonos Kit Digital contra el portal de Red.es).

Es un servicio **interno**: escucha solo en `127.0.0.1:8001` y lo consume
exclusivamente el backend Node de la landing (`server/`) por loopback,
firmando con `X-API-Key`. Nunca debe estar accesible desde internet.

## Arquitectura

```
Navegador  ─────►  Nginx :443  ─────►  Node Express :3001
                                              │
                                              │  loopback + X-API-Key
                                              ▼
                                       FastAPI :8001 (este servicio)
                                              │ ▲
                                              │ │ GET /cookies + X-Admin-Key
                                              │ │
                                              │ │  session_keeper :8080
                                              │ │  (mantiene login con .p12
                                              │ │   y refresca cookies)
                                              │
                                              │  HTTPS + cookies DWR
                                              ▼
                              portal.gestion.sedepkd.red.gob.es
```

## Endpoints

| Método | Ruta                            | Auth        | Descripción                                                  |
| ------ | ------------------------------- | ----------- | ------------------------------------------------------------ |
| GET    | `/health`                       | —           | Healthcheck con info de sesión y del keeper.                 |
| POST   | `/elegibilidad`                 | `X-API-Key` | Consulta elegibilidad para `(nif, bono, categoria)`.         |
| POST   | `/admin/refresh-from-keeper`    | `X-API-Key` | Pide cookies frescas al `session_keeper`.                    |
| POST   | `/admin/reload-session`         | `X-API-Key` | Releera `cookies.json` (fallback / break-glass).             |

## Fuentes de la sesión DWR

El portal de Red.es exige login con certificado digital `.p12`. Este
servicio **no** loguea con el `.p12` directamente; lo delega en el
`session_keeper`. Hay dos fuentes posibles, en orden de preferencia:

### 1. session_keeper (preferido)

Servicio externo que mantiene un login activo con el `.p12`, hace pings
periódicos al portal y refresca cookies si caducan. Expone un endpoint
`GET /cookies` con cabecera `X-Admin-Key` que devuelve las 5 claves DWR
en el mismo formato que `cookies.json`.

Cuando `SESSION_KEEPER_URL` está definido en `.env`, `kd-service` le
pide cookies al arrancar y cada vez que el portal devuelve
`SessionExpired` (refresh en background tras un 503). También refresca
proactivamente cuando las cookies cacheadas superan
`SESSION_KEEPER_MAX_AGE_S` segundos.

### 2. cookies.json (fallback / break-glass)

Si el keeper no está configurado o no responde, se usa el fichero local
`cookies.json` generado a mano. Para regenerarlo cuando hace falta:

1. Loguearse en Chrome con el certificado en
   `https://portal.gestion.sedepkd.red.gob.es/adacuerdos/`.
2. Entrar a "Iniciar nuevo acuerdo" para que carguen los DWR.
3. Sacar de DevTools las 5 piezas (ver siguiente sección) y pegarlas en
   `cookies.json`.
4. `curl -X POST http://127.0.0.1:8001/admin/reload-session -H "X-API-Key: ..."`.

### Cómo generar `cookies.json`

1. Abrir `https://portal.gestion.sedepkd.red.gob.es/adacuerdos/` en
   Chrome/Edge con el certificado del digitalizador instalado.
2. Loguearse y entrar a "Iniciar nuevo acuerdo" para que carguen los DWR.
3. DevTools → **Application → Cookies** → seleccionar el dominio. Copiar:
   - `INGRESSCOOKIE` (incluido el separador `|`)
   - `JSESSIONID`
4. DevTools → **Network** → buscar cualquier llamada `*.dwr`:
   - Cabecera `owasp-csrftoken` → `owasp_csrf`
   - Cuerpo de la request, línea `scriptSessionId=...` → `script_session_id`
   - Cuerpo de la request, línea `windowName=DWR-...` → `window_name`
5. Crear `kd-service/cookies.json`:

```json
{
  "INGRESSCOOKIE": "1d2d1786...|dcb78ae71...",
  "JSESSIONID": "096F5C9BD28E738D136E82E1ED2F1F91",
  "owasp_csrf": "WSLE-CSOF-8M2X-A5CG-DG5G-8VU6-6QZN-AUSA",
  "script_session_id": "7FA5A771EC4773C415F7A2B15DFE3D5C",
  "window_name": "DWR-F297AC7BB40353EDB65996516C79EB59"
}
```

Está en `.gitignore`. **No commitearlo nunca.**

## Setup local (Windows / macOS / Linux)

Requiere Python ≥ 3.11.

```powershell
cd kd-service
python -m venv .venv
.venv\Scripts\Activate.ps1     # PowerShell
# . .venv/bin/activate          # bash/zsh
pip install -r requirements.txt
copy .env.example .env          # rellenar API_KEY (debe coincidir con server/.env)
# crear cookies.json siguiendo la guia de arriba
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Probar:

```powershell
curl http://127.0.0.1:8001/health

curl -X POST http://127.0.0.1:8001/elegibilidad `
  -H "Content-Type: application/json" `
  -H "X-API-Key: <la_misma_que_en_server_env>" `
  -d '{"nif":"B55467617","bono":"2025/C022/04629936","categoria":"04"}'
```

## Tests offline (sin red)

Los tests reproducen las 6 respuestas reales del portal capturadas en el
PoC original y las pasan por el parser DWR + el algoritmo de elegibilidad.

```powershell
cd kd-service
.venv\Scripts\Activate.ps1
pip install pytest
pytest tests/ -v
```

## Despliegue producción (PM2)

```bash
ssh deploy@servidor
cd /opt/landing-kit/kd-service
git pull   # (o lo gestiona el deploy de GitHub Actions)
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
$EDITOR .env       # rellenar API_KEY (la misma que server/.env)
chmod 600 .env
nano cookies.json  # pegar el JSON con cookies validas
chmod 600 cookies.json
pm2 start ecosystem.config.cjs
pm2 save
```

Para actualizar tras un deploy:

```bash
pm2 reload kd-service
```

Para recargar cookies sin reiniciar el proceso:

```bash
curl -X POST http://127.0.0.1:8001/admin/reload-session \
  -H "X-API-Key: $KD_API_KEY"
```

## Variables de entorno

| Variable                   | Default              | Descripción                                                                  |
| -------------------------- | -------------------- | ---------------------------------------------------------------------------- |
| `PORT`                     | `8001`               | Puerto loopback. Debe coincidir con `KD_BASE_URL` del Node.                  |
| `ENV`                      | `production`         | `development` o `production`.                                                |
| `LOG_LEVEL`                | `info`               | `debug | info | warning | error`.                                            |
| `API_KEY`                  | (vacío, obligatorio) | Compartida con el Node. Generar con `openssl rand -hex 32`.                  |
| `COOKIES_PATH`             | `./cookies.json`     | Ruta al fichero de cookies DWR (fallback del keeper).                        |
| `SESSION_KEEPER_URL`       | (vacío)              | URL del session_keeper, ej. `http://127.0.0.1:8080`. Vacío = desactivado.    |
| `ADMIN_API_KEY`            | (vacío)              | Token `X-Admin-Key` del keeper.                                              |
| `SESSION_KEEPER_TIMEOUT_S` | `10`                 | Timeout en segundos al hablar con el keeper.                                 |
| `SESSION_KEEPER_MAX_AGE_S` | `600`                | Edad máx. de cookies cacheadas antes de refrescar proactivamente. `0` = off. |
| `CORS_ORIGINS`             | (vacío)              | Solo si necesitas pegarle desde el navegador en debug.                       |

## Seguridad

- Solo loopback (`127.0.0.1`). Nginx no debería exponer este puerto.
- `X-API-Key` obligatoria en `/elegibilidad` y `/admin/*`. La `/health` queda abierta.
- `/docs`, `/redoc` y `/openapi.json` desactivados en producción.
- `cookies.json` y `*.p12` en `.gitignore`.
- Logs por stdout: los recoge PM2 en `~/.pm2/logs/kd-service-*.log`.
