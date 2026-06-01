/**
 * PM2 ecosystem para kd-service (FastAPI + uvicorn).
 *
 * Despliegue:
 *   cd kd-service
 *   python3 -m venv .venv
 *   .venv/bin/pip install -r requirements.txt
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'kd-service',
      cwd: __dirname,
      script: '.venv/bin/uvicorn',
      args: 'app.main:app --host 127.0.0.1 --port 8003 --workers 1 --log-level info',
      interpreter: 'none',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        PYTHONUNBUFFERED: '1',
        ENV: 'production',
      },
      time: true,
    },
  ],
}
