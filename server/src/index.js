import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { config } from './config.js'
import { logger } from './logger.js'
import { perDayLimiter, perMinuteLimiter } from './middlewares/rateLimit.js'
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js'
import healthRouter from './routes/health.js'
import elegibilidadRouter from './routes/elegibilidad.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: config.LANDING_ORIGIN,
    methods: ['GET', 'POST'],
    maxAge: 600,
  }),
)
app.use(express.json({ limit: '20kb' }))

app.use('/health', healthRouter)
app.use('/elegibilidad', perMinuteLimiter, perDayLimiter, elegibilidadRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const server = app.listen(config.PORT, '127.0.0.1', () => {
  logger.info(
    { port: config.PORT, env: config.NODE_ENV },
    'landing-kit-api listening on port ' + config.PORT,
  )
})

function shutdown(signal) {
  logger.info({ signal }, 'shutting down')
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException')
  process.exit(1)
})
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandledRejection')
  process.exit(1)
})
