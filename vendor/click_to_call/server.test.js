import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './server.js';

process.env.VOIP_DEFAULT_AGENT_ID = '255828';
process.env.VOIP_STUDIO_API_KEY = 'test-key';

function mockInitiateCall(response) {
  return async () => response;
}

async function postJson(app, url, body) {
  return await new Promise((resolve, reject) => {
    const server = app.listen(0, async () => {
      const { port } = server.address();
      try {
        const res = await fetch(`http://127.0.0.1:${port}${url}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => null);
        server.close();
        resolve({ status: res.status, body: data });
      } catch (e) {
        server.close();
        reject(e);
      }
    });
  });
}

test('happy path: número válido + consentimiento → 200 ok con call_id', async () => {
  const app = createApp({
    initiateCall: mockInitiateCall({ status: 201, body: { data: { id: 999 } } }),
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, true);
  assert.equal(res.body.code, 'ok');
  assert.equal(res.body.call_id, 999);
});

test('normalización: 9 dígitos sueltos → prepend 34 y llamada OK', async () => {
  let received;
  const app = createApp({
    initiateCall: async (args) => {
      received = args;
      return { status: 201, body: { data: { id: 1 } } };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '630733730',
    consent: true,
  });
  assert.equal(res.status, 200);
  assert.equal(received.to, '34630733730');
});

test('normalización: "+34 630-733 730" se limpia y llega como 34630733730', async () => {
  let received;
  const app = createApp({
    initiateCall: async (args) => {
      received = args;
      return { status: 201, body: { data: { id: 2 } } };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '+34 630-733 730',
    consent: true,
  });
  assert.equal(res.status, 200);
  assert.equal(received.to, '34630733730');
});

test('validación: número inválido → 400 invalid_phone', async () => {
  const app = createApp({ initiateCall: mockInitiateCall({ status: 201, body: {} }) });
  const res = await postJson(app, '/api/click-to-call', {
    phone: 'abc',
    consent: true,
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'invalid_phone');
});

test('validación: sin consentimiento → 400 consent_required', async () => {
  const app = createApp({ initiateCall: mockInitiateCall({ status: 201, body: {} }) });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: false,
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.code, 'consent_required');
});

test('VoIPstudio 412 (agente offline) → 503 agent_unavailable', async () => {
  const app = createApp({
    initiateCall: mockInitiateCall({ status: 412, body: { message: 'No VoIP clients registered' } }),
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'agent_unavailable');
});

// --- Modo cola ---

function mkUsers(ids, opts = {}) {
  return ids.map((id) => ({
    id,
    active: true,
    dnd: false,
    nb_sip_locations: 1,
    ...(opts[id] ?? {}),
  }));
}

test('modo cola: primer miembro 201 → llamada creada con ese agente', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  const callsTo = [];
  const app = createApp({
    getQueue: async () => ({ users: [100, 200, 300] }),
    listUsers: async () => mkUsers([100, 200, 300]),
    initiateCall: async ({ from }) => {
      callsTo.push(from);
      return { status: 201, body: { data: { id: 555 } } };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  assert.equal(res.status, 200);
  assert.equal(res.body.call_id, 555);
  assert.equal(callsTo.length, 1, 'solo debió llamarse a un agente');
});

test('modo cola: 1º y 2º devuelven 412, 3º 201 → éxito tras 3 intentos', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  let n = 0;
  const responses = [
    { status: 412, body: { message: 'offline' } },
    { status: 412, body: { message: 'offline' } },
    { status: 201, body: { data: { id: 777 } } },
  ];
  const app = createApp({
    getQueue: async () => ({ users: [100, 200, 300] }),
    listUsers: async () => mkUsers([100, 200, 300]),
    initiateCall: async () => responses[n++],
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  assert.equal(res.status, 200);
  assert.equal(res.body.call_id, 777);
  assert.equal(n, 3, 'debió intentar 3 veces');
});

test('modo cola: todos los miembros 412 → 503 agent_unavailable', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  let n = 0;
  const app = createApp({
    getQueue: async () => ({ users: [100, 200, 300] }),
    listUsers: async () => mkUsers([100, 200, 300]),
    initiateCall: async () => {
      n++;
      return { status: 412, body: { message: 'offline' } };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'agent_unavailable');
  assert.equal(n, 3, 'debió agotar los 3 candidatos');
});

test('modo cola: cola vacía → 503 agent_unavailable', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  let initiateCalled = false;
  const app = createApp({
    getQueue: async () => ({ users: [] }),
    listUsers: async () => mkUsers([]),
    initiateCall: async () => {
      initiateCalled = true;
      return { status: 201, body: {} };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'agent_unavailable');
  assert.equal(initiateCalled, false, 'no debió intentarse ninguna llamada');
});

test('modo cola: cap a VOIP_QUEUE_MAX_ATTEMPTS (2 de 5)', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  process.env.VOIP_QUEUE_MAX_ATTEMPTS = '2';
  let n = 0;
  const app = createApp({
    getQueue: async () => ({ users: [1, 2, 3, 4, 5] }),
    listUsers: async () => mkUsers([1, 2, 3, 4, 5]),
    initiateCall: async () => {
      n++;
      return { status: 412, body: {} };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  delete process.env.VOIP_QUEUE_MAX_ATTEMPTS;
  assert.equal(res.status, 503);
  assert.equal(n, 2, 'debió respetar el cap de 2 intentos');
});

test('modo cola: filtra miembros sin nb_sip_locations / dnd / inactivos', async () => {
  process.env.VOIP_QUEUE_ID = '80892';
  const tried = [];
  const app = createApp({
    getQueue: async () => ({ users: [1, 2, 3, 4] }),
    listUsers: async () => mkUsers([1, 2, 3, 4], {
      1: { nb_sip_locations: 0 },           // descartado: sin SIP
      2: { dnd: true },                     // descartado: en DnD
      3: { active: false },                 // descartado: inactivo
      4: { nb_sip_locations: 1 },           // único elegible
    }),
    initiateCall: async ({ from }) => {
      tried.push(from);
      return { status: 201, body: { data: { id: 888 } } };
    },
  });
  const res = await postJson(app, '/api/click-to-call', {
    phone: '34630733730',
    consent: true,
  });
  delete process.env.VOIP_QUEUE_ID;
  assert.equal(res.status, 200);
  assert.deepEqual(tried, ['4'], 'solo el miembro elegible debió ser intentado');
});
