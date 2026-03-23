# Analytics Dashboard Deployment Guide

Complete instructions for deploying the OpenPDF Studio Analytics Dashboard to various platforms.

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Railway Deployment](#railway-deployment)
4. [Vercel/Netlify (Frontend Only)](#vercel-deployment)
5. [Heroku Deployment](#heroku-deployment)
6. [AWS Deployment](#aws-deployment)
7. [Environment Variables](#environment-variables)
8. [Database Management](#database-management)
9. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Local Development

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- npm or yarn
- Git

### Setup

1. **Clone/navigate to admin directory**
```bash
cd admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Edit .env with your settings**
```env
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dev_password_123
DB_PATH=./analytics.db
NODE_ENV=development
```

5. **Seed sample data (optional)**
```bash
npm run seed
```

6. **Start development server**
```bash
npm run dev
```

7. **Access dashboard**
- Open http://localhost:3001
- Login with credentials from .env
- Click "Refresh Data" to load analytics

### Development Workflow

```bash
# Watch file changes and auto-restart
npm run dev

# Start production server
npm start

# Check code quality
npm run lint

# Run tests (when available)
npm test
```

---

## Docker Deployment

### Build and Run Locally

1. **Build Docker image**
```bash
docker build -t openpdf-analytics:latest .
```

2. **Run container**
```bash
docker run \
  -p 3001:3001 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=secure_password \
  -e NODE_ENV=production \
  -v analytics-data:/app/data \
  --name openpdf-analytics \
  openpdf-analytics:latest
```

3. **Verify it's running**
```bash
curl http://localhost:3001/health
```

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  analytics:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-change_me}
      DB_PATH: /app/data/analytics.db
      NODE_ENV: production
    volumes:
      - analytics-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s

volumes:
  analytics-data:
```

Run with Docker Compose:
```bash
docker-compose up -d
```

### Docker Registry Push

Push to Docker Hub:
```bash
docker tag openpdf-analytics:latest username/openpdf-analytics:latest
docker push username/openpdf-analytics:latest
```

---

## Railway Deployment

### Method 1: Connect GitHub Repository (Recommended)

1. **Create Railway project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Configure repository**
   - Connect your GitHub account
   - Select the repository containing the admin code
   - Select the admin directory as the root

3. **Set environment variables**
   - Go to Variables in Railway dashboard
   - Add:
     ```
     PORT=3001
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=your_very_secure_password_here
     DB_PATH=/app/data/analytics.db
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway automatically builds and deploys on git push
   - Monitor deploy status in dashboard

### Method 2: Railway CLI

1. **Install Railway CLI**
```bash
npm i -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize project**
```bash
cd admin
railway init
```

4. **Add environment variables**
```bash
railway variables set ADMIN_USERNAME=admin
railway variables set ADMIN_PASSWORD=your_secure_password
railway variables set DB_PATH=/app/data/analytics.db
railway variables set NODE_ENV=production
```

5. **Deploy**
```bash
railway up
```

6. **Get deployment URL**
```bash
railway domain
```

### Railway Volumes for Persistent Storage

The Dockerfile includes setup for persistent storage at `/app/data`. Railway automatically handles volume persistence.

To verify:
- Check Railway dashboard → Services → Volumes
- Database will persist across deployments

---

## Vercel Deployment

### Limitations
Vercel is optimized for serverless functions. For full deployment:
- Use Vercel for frontend (dashboard UI)
- Deploy Node.js backend separately

### Frontend Deployment

1. **Extract frontend files**
```bash
# The public/index.html can be deployed separately
cp -r admin/public/* ./vercel-frontend/
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

3. **Configure backend URL**
   - Set environment variable for analytics server
   - Update API_BASE in index.html

### Not Recommended for Full Stack
For a complete solution, use Railway, Heroku, or AWS instead.

---

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Heroku account with credit card (paid tier for persistent storage)

### Deploy Steps

1. **Create Heroku app**
```bash
heroku create openpdf-analytics
```

2. **Set environment variables**
```bash
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your_secure_password
heroku config:set DB_PATH=/app/analytics.db
heroku config:set NODE_ENV=production
```

3. **Add Procfile**
Create `Procfile`:
```
web: npm start
```

4. **Add postgres for persistence (optional)**
```bash
heroku addons:create heroku-postgresql:standard-0
```

5. **Deploy**
```bash
git push heroku main
```

6. **View logs**
```bash
heroku logs --tail
```

### SQLite on Heroku
Note: Heroku's ephemeral filesystem means SQLite database is lost on dyno restart.

**Alternatives:**
- Use PostgreSQL add-on (recommended)
- Use external S3 storage for database backup
- Archive old data regularly

---

## AWS Deployment

### Option 1: EC2 Instance

1. **Create EC2 instance**
   - Ubuntu 22.04 LTS
   - t3.micro or larger
   - Allow inbound on port 3001

2. **Connect via SSH**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Clone repository**
```bash
cd /opt
sudo git clone your-repo-url
cd openpdf-studio/admin
sudo chown -R ubuntu:ubuntu .
```

5. **Install and start**
```bash
npm install --production
npm start
```

6. **Setup PM2 for persistence**
```bash
sudo npm install -g pm2
pm2 start server.js --name openpdf-analytics
pm2 startup
pm2 save
```

7. **Setup Nginx reverse proxy**
```bash
sudo apt-get install nginx
```

Create `/etc/nginx/sites-available/analytics`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/analytics /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

8. **Setup SSL with Let's Encrypt**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: AWS ECS (Elastic Container Service)

1. **Create ECR repository**
```bash
aws ecr create-repository --repository-name openpdf-analytics
```

2. **Build and push image**
```bash
docker build -t openpdf-analytics .
docker tag openpdf-analytics:latest YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/openpdf-analytics:latest
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com
docker push YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/openpdf-analytics:latest
```

3. **Create ECS task definition**
   - Use ECR image URL
   - Set port 3001
   - Set environment variables

4. **Create ECS service**
   - Launch type: EC2 or Fargate
   - Set desired count: 2+ for redundancy
   - Load balancer: ALB

---

## Environment Variables

### Required Variables

```env
# Server configuration
PORT=3001
NODE_ENV=production

# Admin authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_very_secure_password_change_this

# Database
DB_PATH=/app/data/analytics.db (for Docker/Railway)
DB_PATH=./analytics.db (for local)
```

### Optional Variables

```env
# CORS configuration
CORS_ORIGIN=https://your-app-domain.com

# Analytics client configuration
ANALYTICS_BATCH_SIZE=10
ANALYTICS_BATCH_TIMEOUT=30000

# Database backup
DB_BACKUP_ENABLED=true
DB_BACKUP_FREQUENCY=daily

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Security Best Practices

1. **Never commit .env files**
```bash
echo ".env" >> .gitignore
```

2. **Use strong passwords**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Don't use common words

3. **Rotate credentials regularly**
   - Monthly password changes
   - Store in password manager
   - Use different credentials per environment

4. **Environment-specific configs**
   - Development: localhost, test credentials
   - Staging: staging domain, staging credentials
   - Production: production domain, strong credentials

---

## Database Management

### Local Database Backup

```bash
# Backup
cp analytics.db analytics.db.backup

# Restore
cp analytics.db.backup analytics.db
```

### Export Data

```bash
# Using curl with auth
curl -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  http://localhost:3001/api/export/csv \
  > analytics-export.csv
```

### Database Maintenance

```javascript
// scripts/maintenance.js
import Database from 'better-sqlite3';

const db = new Database('analytics.db');

// Archive old data (older than 90 days)
db.exec(`
  INSERT INTO analytics_archive
  SELECT * FROM events WHERE timestamp < datetime('now', '-90 days');

  DELETE FROM events WHERE timestamp < datetime('now', '-90 days');
  DELETE FROM feature_usage WHERE timestamp < datetime('now', '-90 days');

  -- Optimize database
  VACUUM;
  ANALYZE;
`);

console.log('Database maintenance complete');
db.close();
```

Run periodically:
```bash
node scripts/maintenance.js
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Manual check
curl http://localhost:3001/health

# Automated monitoring (cron job)
*/5 * * * * curl -f http://localhost:3001/health || alert
```

### Log Monitoring

```bash
# Docker logs
docker logs openpdf-analytics -f

# PM2 logs
pm2 logs openpdf-analytics

# Systemd logs
journalctl -u openpdf-analytics -f
```

### Performance Monitoring

```bash
# Check database size
du -h analytics.db

# Monitor memory usage
ps aux | grep node

# Check disk space
df -h
```

### Automated Backups

```bash
# scripts/backup.sh
#!/bin/bash
BACKUP_DIR="/backups/analytics"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

mkdir -p $BACKUP_DIR
cp analytics.db $BACKUP_DIR/analytics-$DATE.db
gzip $BACKUP_DIR/analytics-$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Monitoring Dashboard

Recommended tools:
- **Railway**: Built-in monitoring
- **Datadog**: APM and logs
- **New Relic**: Performance monitoring
- **Sentry**: Error tracking

### Update & Maintenance Windows

```bash
# Update dependencies
npm update
npm audit fix

# Test updates
npm run seed
npm start

# Deploy to production
git push deployment main
```

---

## Troubleshooting

### Common Issues

**Port already in use**
```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

**Database locked**
```bash
# Restart server
systemctl restart openpdf-analytics

# Or with PM2
pm2 restart openpdf-analytics
```

**Memory issues**
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 server.js
```

**CORS errors**
- Check CORS_ORIGIN environment variable
- Ensure analytics client is sending from allowed domain
- Verify headers in request

### Getting Help

- Check logs first
- Review environment variables
- Test with curl
- Enable debug mode
- Check Railway/hosting provider status

---

## Success Checklist

- [ ] Environment variables configured
- [ ] Database initialized and accessible
- [ ] Admin credentials changed from defaults
- [ ] HTTPS/SSL enabled (production)
- [ ] Health check passing
- [ ] Analytics events being collected
- [ ] Dashboard loading without errors
- [ ] Backups scheduled
- [ ] Monitoring/alerts configured
- [ ] Documentation updated for team

---

For detailed help with specific platforms, refer to:
- Railway: https://docs.railway.app
- Docker: https://docs.docker.com
- Heroku: https://devcenter.heroku.com
- AWS: https://docs.aws.amazon.com
