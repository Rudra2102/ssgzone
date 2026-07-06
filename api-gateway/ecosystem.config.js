module.exports = {
  apps: [{
    name: 'ssgzone-api',
    script: 'src/server.js',
    cwd: '/opt/ssgzone/api-gateway',
    env: {
      NODE_ENV: 'production',
      JWT_SECRET: 'ssgzone_pems_production_secret_2025_secure',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_NAME: 'ssgzone_mail',
      DB_USER: 'postgres',
      DB_PASSWORD: 'academy'
    }
  }]
}
