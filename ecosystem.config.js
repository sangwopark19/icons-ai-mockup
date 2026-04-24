// PM2 프로세스 관리 설정
module.exports = {
  apps: [
    {
      name: 'mockup-api',
      script: './apps/api/dist/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        API_PORT: 4000,
        JWT_ACCESS_EXPIRY: '1d',
        JWT_REFRESH_EXPIRY: '7d',
      },
    },
    {
      name: 'mockup-worker',
      script: './apps/api/dist/worker.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        JWT_ACCESS_EXPIRY: '1d',
        JWT_REFRESH_EXPIRY: '7d',
      },
    },
    {
      name: 'mockup-web',
      script: 'pnpm',
      args: 'run start',
      cwd: './apps/web',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
