import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LANDING_ORIGIN: z.string().url().default('https://siweb.es'),
  KD_BASE_URL: z.string().url(),
  KD_API_KEY: z.string().min(8, 'KD_API_KEY es obligatorio y debe tener al menos 8 caracteres'),
  KD_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')
  console.error(`Configuración inválida:\n${issues}`)
  process.exit(1)
}

export const config = Object.freeze(parsed.data)
