# VoIPstudio REST API — referencia validada

Notas técnicas de los endpoints de VoIPstudio que esta PoC consume. Todo lo que aparece aquí está confirmado con `curl` contra la cuenta real (customer_id 1203112), no asumido.

Fecha de validación: 2026-05-11.

## Base URL y autenticación

- **Base URL:** `https://l7api.com/v1.2/voipstudio/`
- **Auth oficial:** header `X-Auth-Token: <api_key>` en todas las peticiones
- La API key se obtiene del panel web de VoIPstudio (sección "API Keys")
- Basic Auth con `user_id:api_key` también funciona, pero `X-Auth-Token` es el camino documentado
- `v1.1` y `v1.2` aceptan los mismos requests; esta PoC usa `v1.2`

```bash
# Verificación rápida de auth
curl -s "https://l7api.com/v1.2/voipstudio/ping" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"
# → {"data":{"response":"Pong",...}}
```

## Endpoints usados por la PoC

### POST /calls — iniciar llamada saliente (2-leg, agent-first)

Patrón: ringea el dispositivo del usuario `from`. Cuando `from` descuelga, marca al número `to` y los bridgea. El cliente NO espera en línea: solo suena cuando `from` ya está conectado.

```
POST /v1.2/voipstudio/calls
X-Auth-Token: <api_key>
Content-Type: application/json

{
  "to": "<E.164 sin '+'>",       // obligatorio. Ej: "34630733730"
  "from": "<user_id_agente>",     // opcional pero recomendado. Ej: "42598"
  "caller_id": "<E.164 sin '+'>" | "anonymous"  // opcional. Omitir si no hay CLI prefix configurado
}
```

- `from` es el **`id` del usuario** en VoIPstudio (no la extensión, no el email). Se obtiene con `GET /users`.
- `from` **solo acepta user_id**. Validado: pasar un queue_id (80892) devuelve `400` con `SF0010` "This value is not valid".
- El número en `to` debe estar en E.164 **sin** el prefijo `+`.
- Latencia observada en happy path: **~5-6s**.

**Respuesta 201 Created (ejemplo real):**

```json
{
  "data": {
    "id": 4278003532,
    "state": "RINGING",
    "src_id": "42598",
    "src_name": "Pablo Gonzalez",
    "src_ua": "VoIPstudio 3.4.0 / win32",
    "dst": "34630733730",
    "dst_name": "Spain Mobile (Local)",
    "dst_rate": 0.035,
    "clid": "\"+34886020705\" <+34886020705>",
    "start_time": 1778517353
  }
}
```

**Códigos de error observados:**

| Código | Significado | Latencia | Notas |
|---|---|---|---|
| `400` | Validation error | ~250ms | Cuerpo `errors` lista cada campo inválido. P.ej. `from: "This value is not valid."` si pasas queue_id |
| `401` | Unauthorized | ~250ms | Token ausente o inválido |
| `412` | "Unable to make a call with no VoIP clients registered" | **~10s** | El usuario `from` tiene SIP configurado pero no está online (no registrado al servidor SIP ahora mismo). El backend debe traducir esto a "agente no disponible" |

### GET /queues/{id} — leer una cola

```bash
curl -s "https://l7api.com/v1.2/voipstudio/queues/80892" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"
```

Campos relevantes del objeto cola:

```json
{
  "id": 80892,
  "name": "Cola de llamadas siwebcanarias.es",
  "number": 601,                              // extensión interna
  "users": [360648, 42598, 360618, ...],      // user_ids miembros
  "ring_strategy": "A",                        // "A" = All ring
  "ring_time": 15,
  "skip_busy": true
}
```

### GET /users — listar usuarios

Devuelve `data` con todos los usuarios del customer. Útil para resolver los miembros de una cola y filtrar por estado.

Campos relevantes por usuario:

| Campo | Tipo | Uso |
|---|---|---|
| `id` | int | El que se pasa como `from` en `POST /calls` |
| `ext` | string | Extensión interna (no usada por la API REST) |
| `email` | string | Identificación humana |
| `active` | bool | El usuario está habilitado en la cuenta |
| `dnd` | bool | Do Not Disturb activado por el usuario |
| `nb_sip_locations` | int | Nº de SIP locations CONFIGURADAS. **NO indica si está online ahora mismo** |
| `cli` | string | Caller ID que VoIPstudio presenta al destino |

Importante: `nb_sip_locations > 0` significa "tiene softphone configurado", no "softphone registrado al servidor SIP en este instante". La única forma 100% fiable de saber si un usuario está reachable es intentar `POST /calls` y comprobar si llega 201 o 412.

## Endpoints inspeccionados y descartados para la PoC

### POST /webcalls — 3-leg call (3PCC)

```json
POST /v1.2/voipstudio/webcalls
{ "from": "<e164>", "to": "<e164 or extension>" }
```

Sobre el papel es el endpoint ideal para "queue-aware click-to-call" (`to: "601"` = extensión cola). En nuestra cuenta devuelve siempre:

```
400 — "Maximum per minute call rate exceeded for <number>. Please contact support to remove this restriction."
```

Reproducido con 3 números distintos como `from` (incluyendo el CLI propio de la cuenta) — siempre falla con el mismo error, sin lograr cursar ninguna llamada. Lo interpretamos como **no activo en el plan actual** o gobernado por una salvaguarda anti-fraude estricta.

Si el equipo VoIPstudio lo activa en el futuro, el patrón teórico sería:

```bash
POST /v1.2/voipstudio/webcalls
{ "from": "<móvil cliente>", "to": "601" }   # 601 = ext cola
```

Pero con un **gran caveat**: el flujo nativo de `/webcalls` es **cliente-primero** — VoIPstudio llamaría al móvil del cliente, este descuelga, oye espera/locución mientras la cola ringea agentes, y al final se conecta. Mala UX en click-to-call genuino.

### Call Me Back widget

Módulo dedicado de VoIPstudio para click-to-call público (`/v1.2/voipstudio/callmeback/*`). Soporta enrutamiento a cola (campo `ddi_e164`) y resuelve el problema de seguridad de credenciales en cliente. Es la solución "oficial" para este caso de uso. Lo descartamos por dos razones:

1. **Flujo cliente-primero con locución obligatoria**: el cliente recibe la llamada antes de que esté un agente disponible, oye una locución de identificación, espera con tonos. Misma penalización UX que `/webcalls`.
2. **UI propietaria**: el widget es un script `https://static.ssl7.net/l7t.js` que inyecta un iframe con UI propia de VoIPstudio (`https://static.ssl7.net/callme/`). Comunicación por WebSocket `wss://lt.ssl7.net` con un protocolo no documentado. Replicar el trigger desde un form propio implicaría reverse-engineer del protocolo, frágil.

Hay un settings de prueba creado en la cuenta (`id=1552`, name "PoC click-to-call (cola Canarias)") que se puede borrar con:

```bash
curl -X DELETE "https://l7api.com/v1.2/voipstudio/callmeback/settings/1552" \
  -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"
```

### CTI Connector JavaScript

`https://voipstudio.com/docs/administrador/integraciones/conectorcti/`. Es un cliente SIP-over-WebSocket que se incrusta en el navegador. Requiere autenticación con credenciales VoIPstudio **desde el browser** (email+password o API key embebida). No viable para web pública: cualquier visitante puede leer las credenciales con DevTools y abusar de la cuenta. Solo válido para apps internas donde el usuario logueado ya es un agente de VoIPstudio.

## Notas operativas

### Rate limit "max_call_rate"

VoIPstudio aplica un rate limit per-number per-minute en algunos endpoints (`/webcalls` lo dispara muy agresivamente). El campo `max_call_rate` que se ve en `/callmeback/settings` parece controlarlo a nivel widget (default 0.15 €/min). El backend de la PoC reintenta cuando ve 412 pero NO reintenta cuando ve este 400 — devolvemos `voip_error` y dejamos pasar la siguiente petición.

### Caller ID y "No CLI prefix set"

Pasar `caller_id` en `POST /calls` puede devolver `400` con mensaje `"No CLI prefix set"` si la cuenta no tiene configurado el prefijo CLI. Para evitarlo, esta PoC **no envía `caller_id`** y deja que VoIPstudio use el por defecto del usuario `from` (su campo `cli`).

### v1.1 vs v1.2

La página de introducción de la doc menciona `v1.2`; las páginas de recursos individuales aún listan paths con `v1.1`. Empíricamente ambos funcionan idénticamente. Usamos `v1.2`.

## Comandos curl útiles

```bash
# Cargar credenciales
set -a && . ./.env && set +a

# Ping
curl -s "https://l7api.com/v1.2/voipstudio/ping" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"

# Listar colas (descubrir queue_id y miembros)
curl -s "https://l7api.com/v1.2/voipstudio/queues" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY" \
  | python3 -m json.tool | head -50

# Detalle de una cola
curl -s "https://l7api.com/v1.2/voipstudio/queues/80892" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"

# Listar usuarios (para identificar user_ids)
curl -s "https://l7api.com/v1.2/voipstudio/users" -H "X-Auth-Token: $VOIP_STUDIO_API_KEY"

# Iniciar click-to-call (single-agent)
curl -s -X POST "https://l7api.com/v1.2/voipstudio/calls" \
  -H "X-Auth-Token: $VOIP_STUDIO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"34630733730","from":"42598"}'
```
