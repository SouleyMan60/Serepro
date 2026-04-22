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
        PUPPETEER_EXECUTABLE_PATH: "/usr/bin/chromium-browser",
        NODE_ENV: 'production',
        PORT: 3001,
        ALLOWED_ORIGINS: 'https://app.serepro.net',
        APP_URL: 'https://app.serepro.net',
        API_URL: 'https://api.serepro.net',
        PAYSTACK_SECRET_KEY: 'sk_test_52ffb2f875d421cda45f7a666fce32ababa715e7',
      },
      error_file: '/var/www/serepro/logs/api-error.log',
      out_file:   '/var/www/serepro/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      restart_delay: 3000,
      max_restarts: 10,
    }
  ]
}
