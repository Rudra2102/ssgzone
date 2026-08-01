module.exports = {
  apps: [{
    name: 'ssgzone-api',
    script: 'src/server.js',
    cwd: '/opt/ssgzone/api-gateway',
    env_file: '/opt/ssgzone/.env',
    env: {
      NODE_ENV: 'production',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/root/.pm2/logs/ssgzone-api-error.log',
    out_file: '/root/.pm2/logs/ssgzone-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
  }]
};
