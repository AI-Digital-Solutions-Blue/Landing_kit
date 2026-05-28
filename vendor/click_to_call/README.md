# Click-to-Call PoC con VoIPstudio

Prueba de concepto de click-to-call: un visitante introduce su número en una página web y la API REST de VoIPstudio enruta una llamada al softphone del agente (o de un miembro de una cola), que al descolgar marca al cliente.

Stack: Node.js 20.6+ · Express · JS vanilla. Sin frameworks frontend, sin TypeScript, sin base de datos.

> **Estado:** PoC validada end-to-end el 2026-05-11 con llamada real (`call_id=4278003532`). Lista para que el equipo de desarrollo la tome como base para producción.

## Estructura

```
.
├── server.js              # Express + endpoint /api/click-to-call + orquestador de cola + log + static
├── voipstudio.js          # Cliente HTTP: initiateCall, getQueue, listUsers
├── server.test.js         # Tests (node:test) con mocks (12/12 pass)
├── public/
│   ├── index.html         # Página + form propio
│   ├── style.css
│   └── app.js
├── docs/voipstudio-api.md # Referencia técnica de los endpoints validados
├── findings.md            # Conclusiones de la PoC (entregable PRD §11.5)
├── logs/calls.log         # JSON Lines, generado al usar el endpoint (gitignored)
├── .env                   # Credenciales reales (no se commitea)
└── .env.example
```

## Requisitos

- Node.js ≥ 20.6 (necesario para `--env-file` nativo, sin `dotenv`)
- Cuenta de VoIPstudio con API key
- Al menos un usuario con softphone registrado para recibir las llamadas

## Configuración

1. Copia `.env.example` a `.env` y rellena las variables.

   ```bash
   cp .env.example .env
   ```

   | Variable | Obligatoria | Descripción |
   |---|---|---|
   | `VOIP_STUDIO_API_KEY` | ✓ | API key del panel de VoIPstudio. |
   | `VOIP_QUEUE_ID` | * | ID numérico de la cola. Si está definido, activa el orquestador de cola. |
   | `VOIP_DEFAULT_AGENT_ID` | * | `user_id` (no extensión) del agente fijo. Solo se usa si `VOIP_QUEUE_ID` está vacío. |
   | `VOIP_QUEUE_MAX_ATTEMPTS` | — | Máximo de miembros a intentar por petición. Default 3. |
   | `PORT` | — | Puerto del servidor. Default 3000. |
   | `RATE_LIMIT_MAX` | — | Máximo de peticiones por IP cada 10 min. Default 3. `0` = desactivado. |
   | `VOIPSTUDIO_API_URL` | — | Override de la URL base. Default `https://l7api.com/v1.2/voipstudio`. |

   `*` Define **uno de los dos**: `VOIP_QUEUE_ID` (modo cola) **o** `VOIP_DEFAULT_AGENT_ID` (modo single-agent).

2. Instala dependencias:

   ```bash
   npm install
   ```

## Arrancar

```bash
npm start          # producción
npm run dev        # con --watch (recarga al cambiar)
```

## Modos de operación

### Modo single-agent

`VOIP_QUEUE_ID` vacío, `VOIP_DEFAULT_AGENT_ID` definido. El backend usa siempre el mismo agente como `from` en `POST /calls`. Simple, predecible.

### Modo cola (recomendado para producción)

`VOIP_QUEUE_ID` definido. El backend hace en cada petición:

1. `GET /queues/{VOIP_QUEUE_ID}` — recupera la lista de miembros.
2. `GET /users` — recupera el estado de los miembros.
3. **Filtra** miembros que cumplan: `active` ∧ `!dnd` ∧ `nb_sip_locations > 0`.
4. Hace shuffle y toma los primeros `VOIP_QUEUE_MAX_ATTEMPTS`.
5. Llama secuencialmente a `POST /calls` con cada uno como `from` hasta:
   - Recibir `201` → llamada cursada, devuelve `call_id` y termina.
   - Recibir `412` (softphone offline) → siguiente candidato.
   - Recibir otro error → para y devuelve `voip_error`.
6. Si todos los candidatos fallan con 412 → `503 agent_unavailable`.

Nota: `nb_sip_locations > 0` indica que el usuario tiene un SIP **configurado**, no que esté **online en este momento**. Por eso el flujo todavía puede acabar en 412 — pero descarta los obvios.

## Endpoint backend

`POST /api/click-to-call`

Body:

```json
{
  "phone": "+34 600 000 000",     // se normaliza a E.164 sin '+', con 34 si vienen 9 dígitos
  "name": "Pablo",                 // opcional
  "consent": true                  // obligatorio
}
```

Respuestas:

| HTTP | code | Cuándo |
|------|------|--------|
| 200 | `ok` | Llamada creada. Devuelve `call_id`. |
| 400 | `invalid_phone` | El número no es E.164 válido. |
| 400 | `consent_required` | Falta el consentimiento. |
| 429 | `rate_limited` | Más de `RATE_LIMIT_MAX` intentos en 10 min desde la misma IP. |
| 500 | `config_error` | Faltan variables de entorno. |
| 502 | `voip_error` | VoIPstudio respondió con un error no contemplado, o falló el `getQueue` / `listUsers`. |
| 503 | `agent_unavailable` | Todos los candidatos elegibles devolvieron 412 (offline), o la cola está vacía. |

## Logs

Cada intento (ok o fallo) se anexa a `logs/calls.log` en formato JSON Lines:

```json
{"ts":"2026-05-11T18:16:30.414Z","event":"call_created","ip":"::ffff:127.0.0.1","phone":"34630733730","name":null,"queue_id":"80892","agent_id":"42598","attempts":[{"agent_id":"42598","status":201}],"call_id":4278003532}
```

Eventos posibles: `call_created`, `agent_unavailable`, `voip_error`, `queue_empty`, `queue_fetch_error`, `config_error`, `exception`.

## Tests

```bash
npm test
```

12 tests con `node:test` y mocks del cliente VoIPstudio. Cubren validación de entrada, normalización España, modo single-agent, modo cola (happy path, fallback secuencial, todos offline, cola vacía, cap de intentos, filtro nb_sip/dnd/active).

## Pendientes antes de producción

Esto es PoC. Antes de desplegar tal cual hay cosas que conviene tocar:

- **Rate limit en memoria** — `express-rate-limit` con store por defecto no sobrevive a reinicios ni a múltiples instancias. Para producción, usar Redis store (`rate-limit-redis`).
- **Sin caché de `/users`** — cada petición hace 2 GET a VoIPstudio antes del POST. Con tráfico alto conviene cachear 30-60s.
- **Sin CAPTCHA** — el formulario es público, vulnerable a relleno automatizado. Plantear hCaptcha o Cloudflare Turnstile si se va a exponer a internet.
- **Sin control horario** — el PRD lo pide para producción (`L-V 9-18`). Añadir middleware que devuelva mensaje específico fuera de horario.
- **Log a fichero plano** — no rotado, no estructurado para SIEM. Migrar a un logger productivo (pino + transport) y/o a stdout para que lo recoja la plataforma.
- **HTTPS obligatorio** — la PoC va por HTTP local. En producción detrás de Nginx/Caddy con TLS.
- **Política de privacidad real** — el `privacy_policy_url` del form remite a una página que debe existir y estar al día.
- **Almacén de leads** — actualmente solo log. En producción conviene grabar también en CRM o base de datos para seguimiento.
- **Eventos de estado** — `GET /calls/{id}` permite consultar el estado de la llamada en tiempo real; útil para mostrar al cliente "agente descolgó", "llamada en curso". Fuera de alcance de PoC.

Consultar `findings.md` para el detalle de qué se validó y qué quedó fuera.
