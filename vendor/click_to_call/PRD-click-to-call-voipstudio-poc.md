# PRD — Prueba de concepto Click-to-Call con VoIPstudio

**Versión:** 0.1 (borrador para PoC)
**Autor:** [completar]
**Fecha:** 2026-05-11
**Estado:** Pendiente de validación técnica
**Audiencia de este documento:** Claude Code (implementación) + responsable de producto/negocio (validación)

---

## 1. Resumen ejecutivo

Implementar una prueba de concepto (PoC) de funcionalidad **click-to-call** integrada con la cuenta existente de VoIPstudio, donde un visitante de la web (o usuario interno) pueda solicitar una llamada inmediata pulsando un botón e introduciendo su número de teléfono. La plataforma de VoIPstudio enrutará la llamada al softphone del agente disponible y, cuando este descuelgue, conectará automáticamente con el cliente.

**Objetivo principal:** validar que la integración técnica funciona de extremo a extremo con mínima fricción de desarrollo, antes de decidir una inversión mayor en producción.

---

## 2. Contexto y motivación

La empresa ya dispone de:

- Cuenta activa de **VoIPstudio**.
- Usuarios (agentes) con **softphone SIP registrado**.

VoIPstudio ofrece tres caminos para implementar click-to-call (CTI Connector JavaScript, REST API, enlaces `tel:` al softphone). Esta PoC busca seleccionar **el camino más adecuado** y dejar montado un prototipo funcional sobre el que iterar.

---

## 3. Objetivos de la PoC

### 3.1 Objetivo de negocio

- Reducir la fricción de contacto telefónico de los clientes potenciales.
- Validar si el coste/beneficio justifica el despliegue en producción.

### 3.2 Objetivos técnicos (criterio de éxito)

1. Un visitante pulsa un botón en la web, introduce su número y recibe una llamada en menos de **30 segundos**.
2. El agente disponible recibe la llamada en su softphone antes de que esta se enrute al cliente.
3. Se registra cada intento (timestamp, número, agente asignado, resultado) en un log mínimo.
4. La PoC funciona en **Chrome y Firefox** actuales (escritorio y móvil).

### 3.3 Fuera de alcance

- Diseño visual final del botón/formulario (basta con algo funcional y limpio).
- Integración con CRM existente (queda para fase siguiente).
- Grabación de llamadas, IVR, colas, métricas avanzadas.
- Gestión multilingüe.
- Tratamiento RGPD completo (se incluirá solo el checkbox de consentimiento básico).

---

## 4. Decisiones pendientes

Estos puntos deben confirmarse **antes** de empezar a codificar. Claude Code debe preguntar si no están resueltos:

| ID | Decisión | Valor por defecto sugerido |
|----|----------|---------------------------|
| D1 | ¿Dónde vive el botón? Web pública / CRM interno / ambos | Web pública (landing) |
| D2 | ¿Cómo se elige el agente? Fijo / round-robin por departamento / lo elige el cliente | Agente fijo (más simple para PoC) |
| D3 | Enfoque técnico: CTI Connector JS / REST API / `tel:` | **REST API** (menos dependencias) |
| D4 | Horario de servicio (¿qué pasa fuera de horario laboral?) | L-V 9:00-18:00, fuera muestra mensaje |
| D5 | Idioma de la interfaz | Español |
| D6 | Dónde se aloja la PoC (subdominio, ruta, página existente) | Subdominio `poc.[dominio].com` |

---

## 5. Requisitos funcionales

### 5.1 Flujo principal (happy path)

1. El visitante accede a la página que aloja el widget click-to-call.
2. Pulsa el botón **"¿Te llamamos gratis?"**.
3. Se abre un formulario modal con:
   - Campo "Tu número de teléfono" (obligatorio, validación E.164).
   - Campo "Tu nombre" (opcional).
   - Checkbox de consentimiento ("Acepto que me llaméis...").
   - Botón "Llamadme ahora".
4. Al enviar, se muestra feedback inmediato: *"Te llamamos en unos segundos"*.
5. El backend (o cliente, según D3) invoca la API de VoIPstudio para iniciar la llamada.
6. VoIPstudio llama al softphone del agente. Cuando descuelga, marca al cliente.
7. La llamada queda establecida entre agente y cliente.
8. El intento se registra en log/BBDD.

### 5.2 Casos alternativos

- **Fuera de horario:** el botón se desactiva o muestra "Llámanos mañana de 9 a 18h", con un formulario de "te llamamos al abrir".
- **Agente no disponible** (D2 = fijo) o **todos ocupados** (round-robin): mensaje *"Todos nuestros agentes están ocupados, vuelve a intentarlo en unos minutos"*.
- **Número inválido:** validación en cliente antes de enviar.
- **Fallo de la API de VoIPstudio:** mensaje genérico de error y registro en log para revisión.

### 5.3 Requisitos no funcionales

- **Tiempo de respuesta del botón:** < 2 segundos hasta confirmación visual.
- **Tiempo total hasta recibir la llamada:** < 30 segundos.
- **Seguridad:** credenciales de VoIPstudio nunca expuestas en cliente (si se elige REST API, debe pasar por backend).
- **Protección anti-abuso:** rate limit de 3 solicitudes por número/IP cada 10 minutos.
- **Logs:** retención mínima 30 días.

---

## 6. Arquitectura propuesta

### 6.1 Si se elige REST API (recomendado para PoC)

```
[Visitante] → [Frontend widget] → [Backend propio] → [VoIPstudio REST API]
                                         ↓
                                    [Log/BBDD]
```

- **Frontend:** widget en HTML/JS vanilla o React (según stack actual). Sin dependencias externas pesadas.
- **Backend:** endpoint único `POST /api/click-to-call` que:
  1. Valida el número y el rate limit.
  2. Comprueba horario.
  3. Llama a la API de VoIPstudio con credenciales seguras.
  4. Registra el intento.
  5. Devuelve estado al frontend.
- **Almacén de logs:** SQLite o JSON estructurado para la PoC (no requiere BBDD productiva).

### 6.2 Si se elige CTI Connector JS

- Solo frontend, sin backend propio.
- Requiere autenticar al agente con sus credenciales VoIPstudio desde el navegador, lo cual **no es viable para web pública** (expone credenciales). Esta opción solo aplica si el botón vive en una intranet con sesión propia.

### 6.3 Diagrama de secuencia

```
Visitante       Frontend       Backend       VoIPstudio       Softphone     Cliente
   │              │              │              │                │            │
   │── pulsa ──→  │              │              │                │            │
   │              │── POST ────→ │              │                │            │
   │              │              │── auth+call → │                │            │
   │              │              │              │── ring ──────→ │            │
   │              │              │              │                │            │
   │              │              │              │  (descuelga)   │            │
   │              │              │              │← ── OK ─────── │            │
   │              │              │              │── dial ─────────────────── →│
   │              │              │              │                │  conectado │
   │              │← respuesta ── │              │                │            │
   │← "te llamamos en segundos" ─│              │                │            │
   │              │              │              │                │            │
   │  (recibe la llamada en su móvil personal) ─────────────────────────────→│
```

---

## 7. Especificación de la integración VoIPstudio

### 7.1 Endpoint de iniciación de llamada

VoIPstudio ofrece una REST API accesible vía HTTPS. La petición concreta debe consultarse en el manual oficial de VoIPstudio:

- **Documentación principal:** https://voipstudio.com/docs/
- **Repositorio del conector CTI:** https://github.com/VoIPstudio/cti-connector
- **Blog con ejemplos:** https://voipstudio.com/blog/click-to-call-with-voipstudio-api/

**Acción para Claude Code:** antes de implementar, fetch a la documentación oficial actualizada y confirma:
- URL exacta del endpoint para iniciar una llamada.
- Método de autenticación (API key, OAuth, basic auth).
- Formato del payload (origen = extensión del agente, destino = número del cliente).
- Códigos de respuesta y manejo de errores.

### 7.2 Credenciales

- Las credenciales VoIPstudio se almacenan en variables de entorno del backend:
  - `VOIPSTUDIO_API_URL`
  - `VOIPSTUDIO_API_KEY` (o usuario/contraseña según el método)
  - `VOIPSTUDIO_DEFAULT_AGENT_EXT` (extensión del agente fijo para la PoC)
- **Nunca** se exponen al frontend.
- Se incluye un `.env.example` en el repositorio sin valores reales.

---

## 8. Plan de entrega

### Fase 1 — Validación técnica (1-2 días)
- [ ] Confirmar decisiones pendientes (sección 4).
- [ ] Hacer una llamada de prueba manual contra la API de VoIPstudio con `curl` o Postman.
- [ ] Documentar el comando exacto que funciona.

### Fase 2 — Backend mínimo (1-2 días)
- [ ] Endpoint `POST /api/click-to-call`.
- [ ] Validación de entrada (número E.164, consentimiento).
- [ ] Llamada a VoIPstudio.
- [ ] Rate limiting básico.
- [ ] Log estructurado.

### Fase 3 — Frontend (1 día)
- [ ] Botón + modal con formulario.
- [ ] Validación cliente.
- [ ] Estados de feedback (enviando, éxito, error).
- [ ] Control de horario (mostrar/ocultar botón).

### Fase 4 — Pruebas e iteración (1 día)
- [ ] Test end-to-end con un agente real.
- [ ] Medir tiempos reales contra el objetivo (< 30s).
- [ ] Probar casos de error: número inválido, agente no disponible, fuera de horario.
- [ ] Test móvil (Chrome Android, Safari iOS).

### Total estimado: 4-6 días de desarrollo.

---

## 9. Métricas de éxito de la PoC

Tras 1 semana de PoC con el botón activo (o con 20 llamadas de prueba si no se publica):

| Métrica | Objetivo |
|---------|----------|
| Tasa de conexión exitosa (de pulsado a hablado) | ≥ 80% |
| Tiempo medio pulsado → suena teléfono cliente | ≤ 20s |
| Errores técnicos no recuperables | ≤ 5% |
| Compatibilidad navegadores (Chrome, Firefox, Safari) | 100% del flujo funcional |

Si se alcanzan ≥ 3 de 4 métricas → **luz verde para fase productiva**.

---

## 10. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| API de VoIPstudio devuelve errores inesperados | Media | Alto | Validar manualmente en Fase 1 antes de codificar |
| El softphone del agente no recibe la llamada | Baja | Alto | Confirmar que el SIP endpoint está registrado y operativo antes de empezar |
| Latencia mayor a 30s | Media | Medio | Medir desde Fase 1, escalar a soporte VoIPstudio si pasa |
| Abuso del formulario (números aleatorios) | Alta | Bajo | Rate limit + captcha si crece |
| Exposición de credenciales en frontend | Baja | Crítico | Arquitectura con backend obligatorio (descartado CTI Connector para web pública) |

---

## 11. Entregables esperados

Al final de la PoC, Claude Code debe haber producido:

1. **Repositorio Git** con código del backend y frontend.
2. **README** con instrucciones de despliegue local.
3. **Archivo `.env.example`** con todas las variables necesarias.
4. **Log de pruebas** con los resultados de Fase 4.
5. **Documento breve de hallazgos** (1 página): qué funcionó, qué no, recomendación final.

---

## 12. Anexo — Instrucciones específicas para Claude Code

- Antes de generar código, **leer la documentación actual de VoIPstudio vía web fetch** (la URL ha cambiado de estructura en el pasado, no asumir endpoints).
- Si una decisión de la sección 4 no está confirmada, **preguntar antes de codificar** en lugar de elegir por defecto silenciosamente.
- Stack sugerido si no hay preferencia previa: **Node.js + Express** para backend, **HTML/JS vanilla** para frontend (reduce fricción para la PoC).
- Mantener el código simple. Esto es una PoC: priorizar legibilidad sobre arquitectura escalable.
- Incluir comentarios en español en el código (acorde al equipo).
- Tests: uno o dos tests de integración que validen el endpoint del backend con un mock de VoIPstudio.
