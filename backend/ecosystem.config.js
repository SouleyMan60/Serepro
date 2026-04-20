module.exports = {
  apps: [
    {
      name: 'serepro-api',
      script: 'dist/index.js',
      cwd: '/var/www/serepro/backend',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
	ALLOWED_ORIGINS: 'https://app.serepro.net',
      },
      error_file: '/var/www/serepro/logs/api-error.log',
      out_file:   '/var/www/serepro/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    }
  ]
}
