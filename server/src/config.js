import 'dotenv/config'
import { z } from 'zod'

const schema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
    LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    LANDING_ORIGIN: z
      .string()
      .default('https://siwebcanarias.es')
      .refine(
        (value) =>
          value
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
            .every((o) => {
              try {
                new URL(o)
                return true
              } catch {
                return false
              }
            }),
        { message: 'LANDING_ORIGIN debe ser una URL válida (o lista de URLs separadas por coma)' },
      ),
    KD_BASE_URL: z.string().url(),
    KD_API_KEY: z.string().min(8, 'KD_API_KEY es obligatorio y debe tener al menos 8 caracteres'),
    KD_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
    VOIP_STUDIO_API_KEY: z
      .string()
      .min(8, 'VOIP_STUDIO_API_KEY es obligatorio y debe tener al menos 8 caracteres'),
    VOIPSTUDIO_API_URL: z.string().url().default('https://l7api.com/v1.2/voipstudio'),
    VOIP_QUEUE_ID: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    VOIP_QUEUE_ID_MORNING: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    VOIP_QUEUE_ID_AFTERNOON: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    VOIP_DEFAULT_AGENT_ID: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    VOIP_QUEUE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    BUSINESS_TIMEZONE: z.string().trim().default('Europe/Madrid'),
    XILON_API_URL: z.string().url(),
    XILON_AUTH_TOKEN: z
      .string()
      .trim()
      .min(8, 'XILON_AUTH_TOKEN es obligatorio y debe tener al menos 8 caracteres'),
    XILON_DEFAULT_GROUP: z.string().trim().min(1, 'XILON_DEFAULT_GROUP es obligatorio'),
    XILON_DEFAULT_USER: z.string().trim().min(1, 'XILON_DEFAULT_USER es obligatorio'),
    XILON_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  })
  .superRefine((value, ctx) => {
    const hasAnyQueue =
      value.VOIP_QUEUE_ID || value.VOIP_QUEUE_ID_MORNING || value.VOIP_QUEUE_ID_AFTERNOON
    if (!hasAnyQueue && !value.VOIP_DEFAULT_AGENT_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['VOIP_QUEUE_ID'],
        message:
          'Define al menos una cola (VOIP_QUEUE_ID, VOIP_QUEUE_ID_MORNING o VOIP_QUEUE_ID_AFTERNOON) o VOIP_DEFAULT_AGENT_ID.',
      })
    }
  })

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `- ${i.path.join('.')}: ${i.message}`).join('\n')
  console.error(`Configuración inválida:\n${issues}`)
  process.exit(1)
}

export const config = Object.freeze(parsed.data)
