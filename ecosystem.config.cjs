/**
 * PM2 Ecosystem Configuration
 *
 * Start backend with: pm2 start ecosystem.config.js
 * Stop backend with: pm2 stop dashboard-backend
 * Restart backend with: pm2 restart dashboard-backend
 * View logs with: pm2 logs dashboard-backend
 * Monitor with: pm2 monit
 */

module.exports = {
  apps: [{
    name: 'dashboard-backend',
    script: 'server/index.js',
    cwd: '/mnt/c/Users/bette/Desktop/projects-dashboard',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    error_file: '.swarm/logs/backend-error.log',
    out_file: '.swarm/logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
