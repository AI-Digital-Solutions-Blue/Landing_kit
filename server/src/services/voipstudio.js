import { config } from '../config.js'

const REQUEST_TIMEOUT_MS = 12_000
const READ_TIMEOUT_MS = 8_000

function authHeaders() {
  return {
    'X-Auth-Token': config.VOIP_STUDIO_API_KEY,
    'Content-Type': 'application/json',
  }
}

function baseUrl() {
  return config.VOIPSTUDIO_API_URL.replace(/\/+$/, '')
}

export async function initiateCall({ to, from }) {
  const res = await fetch(`${baseUrl()}/calls`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ to, from }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

export async function getQueue(id) {
  const res = await fetch(`${baseUrl()}/queues/${id}`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`getQueue ${id}: HTTP ${res.status}`)
  }
  const body = await res.json()
  return body.data
}

export async function listUsers() {
  const res = await fetch(`${baseUrl()}/users`, {
    headers: authHeaders(),
    signal: AbortSignal.timeout(READ_TIMEOUT_MS),
  })
  if (!res.ok) {
    throw new Error(`listUsers: HTTP ${res.status}`)
  }
  const body = await res.json()
  return Array.isArray(body.data) ? body.data : []
}
