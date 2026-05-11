# landing-kit-api

Backend mínimo para la landing Kit Digital de Siweb. Hace de proxy seguro entre
la web pública y el servicio interno [`kd_contract_parser`](#) (consulta de
elegibilidad / planes de acuerdo contra Red.es).

La landing **no** habla directamente con `kd_contract_parser` porque ese servicio
requiere `X-API-Key` y un certificado de digitalizador. Esa key no puede vivir
en el bundle del navegador.

## Endpoints expuestos

| Método | Ruta              | Auth | Descripción                                         |
| ------ | ----------------- | ---- | --------------------------------------------------- |
| GET    | `/health`         | —    | Healthcheck para nginx / monitor.                   |
| POST   | `/elegibilidad`   | —    | Proxy hacia `kd_contract_parser:/elegibilidad`.     |

> El frontend NO firma con `X-API-Key`; la clave se añade en este backend a
> partir de la variable de entorno `KD_API_KEY`.

## Estructura

```
server/
├── package.json
├── ecosystem.config.cjs      ← PM2
├── .env.example
└── src/
    ├── index.js              ← bootstrap Express
    ├── config.js             ← lectura + validación env con zod
    ├── logger.js             ← pino
    ├── middlewares/
    │   ├── rateLimit.js
    │   └── errorHandler.js
    └── routes/
        ├── health.js
        └── elegibilidad.js
```

## Setup local

```bash
cd server
npm install
cp .env.example .env
# rellenar KD_API_KEY desde 1Password
npm run dev
```

El servidor escucha solo en `127.0.0.1:3001`. En desarrollo puedes consultarlo
directamente; en producción se accede a través de nginx (`siweb.es/api/...`).

```bash
curl http://127.0.0.1:3001/health

curl -X POST http://127.0.0.1:3001/elegibilidad \
  -H 'Content-Type: application/json' \
  -d '{"nif":"B12345678","bono":"BONO-X","categoria":"04"}'
```

## Despliegue en producción (PM2 + nginx)

### 1. Subir código

```bash
ssh deploy@servidor
cd /opt/landing-kit
git pull
cd server
npm ci --omit=dev
```

### 2. Variables de entorno

```bash
cp .env.example .env
$EDITOR .env       # rellenar KD_API_KEY
chmod 600 .env
```

### 3. PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup        # genera systemd unit que sobrevive a reboot
```

Para actualizar tras un deploy:

```bash
pm2 reload landing-kit-api
```

### 4. nginx

Añadir al server block de `siweb.es`:

```nginx
# Rate limit zone (en el http {} global, fuera del server block)
limit_req_zone $binary_remote_addr zone=apilimit:10m rate=10r/s;

# Dentro del server siweb.es
location /api/ {
    proxy_pass http://127.0.0.1:3001/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 30s;
    proxy_send_timeout 30s;

    limit_req zone=apilimit burst=20 nodelay;
}
```

Recargar:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## Variables de entorno

| Variable          | Default                     | Descripción                                   |
| ----------------- | --------------------------- | --------------------------------------------- |
| `PORT`            | `3001`                      | Puerto interno del proceso Node.              |
| `NODE_ENV`        | `production`                | `development` activa logs pretty.             |
| `LOG_LEVEL`       | `info`                      | `trace|debug|info|warn|error`.                |
| `LANDING_ORIGIN`  | `https://siweb.es`          | Origen permitido por CORS.                    |
| `KD_BASE_URL`     | `http://127.0.0.1:8001`     | URL base de `kd_contract_parser`.             |
| `KD_API_KEY`      | (vacío, **obligatorio**)    | API key de `kd_contract_parser`.              |
| `KD_TIMEOUT_MS`   | `15000`                     | Timeout para la llamada upstream.             |

## Seguridad

- El servidor escucha **solo en loopback** (`127.0.0.1`). Nadie debería poder
  llegar por puerto público; lo gobierna nginx.
- `helmet` activa cabeceras seguras por defecto.
- `express.json({ limit: '20kb' })` limita el tamaño del body.
- Rate-limit a nivel Express (10 req/min, 50 req/día por IP) + a nivel nginx.
- Validación con `zod` antes de llamar al upstream.
- Nunca se propaga `KD_API_KEY` al cliente ni se loggea.
- Logs estructurados con `pino`; en producción salen por stdout y los recoge
  PM2 en `/root/.pm2/logs/`. Configurar `logrotate` aparte si el volumen sube.
