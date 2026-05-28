# Findings — PoC Click-to-Call con VoIPstudio

**Estado:** ✅ Validada end-to-end · **Fecha:** 2026-05-11 · **Duración real:** 1 sesión

## TL;DR

La integración click-to-call con VoIPstudio funciona. El patrón validado y recomendado para producción es:

```
[Visitante] → [Frontend (form propio)] → [Backend Express] → [VoIPstudio POST /calls] → [Softphone agente] → [Cliente]
```

Con orquestador de cola en el backend (lee miembros, filtra los configurados, secuencial con shuffle hasta encontrar uno online). El "flujo agente-primero" del endpoint `POST /calls` garantiza que **el cliente solo suena cuando ya hay un agente al otro lado** — UX óptima sin locuciones de espera.

## Lo que funcionó

| Ítem | Detalle |
|---|---|
| Validación API REST | `POST /calls` confirmado con llamada real `call_id=4278003532`. Latencia happy path: ~6s |
| Backend Express | Endpoint `POST /api/click-to-call` con validación E.164, normalización España, consentimiento, rate limit configurable, logs JSON Lines |
| Frontend propio | Form modal en HTML/CSS/JS vanilla. Normaliza `630733730`, `+34 630 733 730`, `(+34) 630-733-730`, etc. a `34630733730` antes de enviar |
| Orquestador de cola | Lee `/queues/{id}` + `/users`, filtra por `active ∧ !dnd ∧ nb_sip_locations>0`, hace shuffle y prueba secuencialmente hasta `MAX_ATTEMPTS` |
| Tests | 12/12 con `node:test` y mocks. Cubren happy paths, errores de validación, modo single-agent, modo cola con todas sus ramas |
| Manejo de errores | 412 (agente offline) → `503 agent_unavailable` con mensaje claro al usuario. Otros errores → `502 voip_error` y log |

## Lo que no funcionó (y por qué)

### 1. "Ringeer toda la cola simultáneamente y conectar al primero" no es viable vía REST API

VoIPstudio no expone un endpoint REST que, originando desde fuera, ringee N agentes en paralelo y al primero que descuelgue lo bridgee con un número externo. Las únicas alternativas teóricas (`POST /webcalls`, Call Me Back widget) imponen un flujo **cliente-primero**: el cliente suena primero, oye espera/locución, y solo entonces los agentes empiezan a ringear. UX inferior — el cliente percibe la llamada como spam automatizado.

**Mitigación adoptada:** orquestador en backend que simula la cola probando agentes uno a uno con `POST /calls` (que SÍ es agente-primero). Pierdes el "all ring" simultáneo del SIP nativo, pero ganas la UX correcta de cara al cliente.

### 2. `POST /webcalls` está bloqueado en la cuenta

3 intentos con `from` distintos (móvil cliente, otro móvil cliente, CLI propio de la cuenta) siempre devuelven `400 — Maximum per minute call rate exceeded ... Please contact support to remove this restriction`. Antes de descartar definitivamente conviene confirmar con soporte VoIPstudio:

- Si el endpoint está activable en el plan actual.
- Qué `from` espera realmente (la doc dice "Source number in e164 format" sin precisar).
- Cómo se relaciona con el rate limit `max_call_rate`.

Aunque lo activen, la consideración de la UX cliente-primero sigue aplicando.

### 3. Call Me Back widget — descartado por UX y replicabilidad

El módulo nativo `/callmeback/*` de VoIPstudio resuelve el routing a cola limpiamente vía un widget hosted. Probado configurándolo, pero descartado porque:

- **Flujo cliente-primero obligatorio**: cliente suena primero, oye locución, espera con tonos. No configurable.
- **UI proprietaria**: iframe servido desde `static.ssl7.net/callme/` con WebSocket no documentado a `wss://lt.ssl7.net`. Replicar el "trigger" desde un form propio implicaría reverse-engineer frágil.

Detalle técnico en `docs/voipstudio-api.md`. El settings de prueba (`id=1552`) puede borrarse desde el panel o vía API.

### 4. CTI Connector JS — incompatible con web pública

Pensado para apps internas donde el usuario del navegador ya es agente de VoIPstudio. Para visitantes anónimos requeriría meter credenciales en cliente — riesgo crítico de seguridad. Descartado de entrada (PRD §10).

## Métricas reales medidas

| Métrica | Objetivo PRD | Real medido |
|---|---|---|
| Latencia formulario → llamada en cliente | ≤ 20s | **~6s** (happy path: agente online en 1º intento) |
| Tasa de conexión (de pulsado a llamada cursada) | ≥ 80% | No medida estadísticamente. Tras añadir el filtro `nb_sip>0`, las llamadas se cursan al 1er intento en la prueba E2E |
| Errores técnicos no recuperables | ≤ 5% | 0 en las pruebas controladas |
| Compatibilidad navegadores | Chrome, Firefox, Safari | Solo se probó Chrome durante PoC. Pendiente verificación cross-browser para producción |

> Nota: la PoC se hizo con un solo cliente y un solo agente (Pablo) en condiciones controladas. Las métricas estadísticas reales solo serán fiables tras un período de tráfico real en producción.

## Hallazgos técnicos relevantes

1. **`from` en `POST /calls` SOLO acepta user_id**. Pasar queue_id, extensión o DID devuelve `400 SF0010`.

2. **`nb_sip_locations > 0` no significa "online ahora"**. El campo indica que el usuario tiene SIP configurado en su cuenta, pero el softphone puede estar cerrado o sin registro al servidor SIP. Solo intentando `POST /calls` se sabe con certeza.

3. **`POST /calls` con softphone offline tarda ~10s en devolver 412**. Por eso `VOIP_QUEUE_MAX_ATTEMPTS=3` por defecto: si los 3 candidatos están offline son 30s de espera, ya en el límite de lo tolerable. Subir el cap es razonable si el filtro `nb_sip>0` reduce los candidatos a pocos.

4. **El filtro `active ∧ !dnd ∧ nb_sip_locations>0` reduce drásticamente intentos vacíos**. En la cola Canarias real (7 miembros), el filtro pasó de 7 candidatos posibles a 2 efectivamente intentables (Pablo + Bea). El resto no tenía softphone configurado y habrían sido 412 garantizados.

5. **Normalización de teléfono España-friendly**: `\D` quita todo lo que no sea dígito (incluido `+`); si quedan 9 dígitos se prepende `34`. Cubre los formatos que los autocompletados de navegador suelen producir (`+34 600 000 000`, `(+34) 600-000-000`, `600 000 000`, etc.).

## Recomendación

**Luz verde para fase productiva** siguiendo este patrón. Para el equipo de desarrollo, antes de desplegar:

1. **Endurecer infraestructura**
   - Rate limit en Redis (no in-memory).
   - Caché de `/users` (30-60s) para evitar 2 GET por petición.
   - HTTPS obligatorio detrás de Nginx/Caddy.
   - Logger productivo (pino → transport) en lugar de fichero plano.

2. **Capa anti-abuso**
   - CAPTCHA (hCaptcha o Cloudflare Turnstile) en el form.
   - Rate limit por `phone` (no solo por IP) si el caso de uso lo justifica.

3. **Reglas de negocio del PRD que la PoC dejó fuera**
   - Control horario (`L-V 9-18`, mensaje "te llamamos mañana" fuera de horario).
   - Página de política de privacidad real (la URL del form remite a `siweb.es/privacidad` — debe existir y estar al día).

4. **Persistencia**
   - Sustituir `logs/calls.log` por almacenamiento estructurado (BBDD, CRM, lo que aplique).
   - Considerar `GET /calls/{id}` post-creación para seguir el estado de la llamada (descolgada, en curso, terminada, duración) y enriquecer el lead.

5. **Confirmaciones pendientes con soporte VoIPstudio**
   - ¿Se puede activar `POST /webcalls` en este plan? Si sí, abre la puerta a la versión "all-ring" oficial (aunque con la pega del cliente-primero).
   - ¿La locución de Call Me Back es desactivable? Si sí, Call Me Back vuelve a ser una alternativa viable.

6. **Limpiezas del entorno tras PoC**
   - Borrar el settings Call Me Back de pruebas (`id=1552`) si no se va a usar.
   - Decidir si Pablo (`user_id=42598`) se queda como miembro de la cola Canarias o vuelve a removerse — fue añadido para esta PoC.

## Entregables

| Artefacto | Ubicación |
|---|---|
| Código del backend + frontend | Este repositorio (`server.js`, `voipstudio.js`, `public/*`) |
| Instrucciones de despliegue local | `README.md` |
| `.env.example` | Raíz del repo |
| Tests | `server.test.js` (12 tests, `npm test`) |
| Referencia técnica VoIPstudio | `docs/voipstudio-api.md` |
| Log de pruebas | `logs/calls.log` (incluye la llamada real `call_id=4278003532`) |
| Este documento | `findings.md` |
