const API_URL = process.env.VOIPSTUDIO_API_URL || 'https://l7api.com/v1.2/voipstudio';
const REQUEST_TIMEOUT_MS = 12_000;

function authHeaders() {
  return {
    'X-Auth-Token': process.env.VOIP_STUDIO_API_KEY,
    'Content-Type': 'application/json',
  };
}

export async function initiateCall({ to, from }) {
  const res = await fetch(`${API_URL}/calls`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ to, from }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

export async function getQueue(id) {
  const res = await fetch(`${API_URL}/queues/${id}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    throw new Error(`getQueue ${id}: HTTP ${res.status}`);
  }
  const body = await res.json();
  return body.data;
}

export async function listUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) {
    throw new Error(`listUsers: HTTP ${res.status}`);
  }
  const body = await res.json();
  return Array.isArray(body.data) ? body.data : [];
}
