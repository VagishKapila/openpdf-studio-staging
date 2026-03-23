# Analytics Dashboard - File Index & Quick Reference

**Location**: `/admin/`

## Quick Navigation

### First Time? Start Here
1. **QUICKSTART.md** - Get running in 5 minutes
2. **admin/public/index.html** - View the dashboard UI
3. **src/analytics.js** - See the client library

### Planning Integration?
1. **ANALYTICS-SETUP.md** - Integration guide
2. **src/analytics-integration-example.js** - Code examples
3. **ADMIN-DASHBOARD-SUMMARY.md** - System overview

### Deploying?
1. **DEPLOYMENT.md** - Deployment guide for all platforms
2. **Dockerfile** - Docker configuration
3. **railway.json** - Railway deployment config

### Managing Admin?
1. **README.md** - Full documentation
2. **FILES-OVERVIEW.md** - File descriptions
3. **server.js** - Backend code

---

## File Directory

### Configuration Files

| File | Purpose | Edit? |
|------|---------|-------|
| `package.json` | Dependencies & scripts | Add deps if needed |
| `.env.example` | Environment template | Copy to .env, edit |
| `Dockerfile` | Docker config | No changes needed |
| `railway.json` | Railway config | Change env vars |

### Core Application

| File | Purpose | Size |
|------|---------|------|
| `server.js` | Express backend server | 568 lines |
| `public/index.html` | Dashboard UI | 1206 lines |
| `scripts/seed-data.js` | Test data generator | 302 lines |

### Analytics Client (in src/)

| File | Purpose | Size |
|------|---------|------|
| `analytics.js` | Client library | 399 lines |
| `analytics-integration-example.js` | Integration examples | 300+ lines |

### Documentation

| File | Read Time | Purpose |
|------|-----------|---------|
| `QUICKSTART.md` | 5 min | Fast setup guide |
| `README.md` | 15 min | Full documentation |
| `DEPLOYMENT.md` | 20 min | Deployment instructions |
| `FILES-OVERVIEW.md` | 10 min | File descriptions |
| `INDEX.md` | 3 min | This file |

---

## Commands Cheat Sheet

```bash
# Setup
npm install                 # Install dependencies
cp .env.example .env        # Create .env file
npm run seed               # Load test data

# Development
npm run dev                # Start with auto-reload
npm start                  # Start production server

# Deployment
docker build -t app .      # Build Docker image
docker run -p 3001:3001 app # Run Docker container
```

---

## API Endpoints Cheat Sheet

```bash
# Track an event (public)
curl -X POST http://localhost:3001/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feature_use",
    "platform": "Windows",
    "version": "1.0.0",
    "userId": "user-123",
    "data": { "feature_name": "pdf_to_image" }
  }'

# Get stats (requires auth)
CREDS=$(echo -n 'admin:admin123' | base64)
curl -H "Authorization: Basic $CREDS" \
  http://localhost:3001/api/stats

# Get downloads (requires auth)
curl -H "Authorization: Basic $CREDS" \
  http://localhost:3001/api/stats/downloads?days=30

# Health check (public)
curl http://localhost:3001/health
```

---

## Common Tasks

### Change Admin Password
1. Edit `.env`
2. Set `ADMIN_PASSWORD=new_password`
3. Restart server

### Load Test Data
```bash
npm run seed
```

### View Dashboard
```bash
npm run dev
# Open http://localhost:3001
# Login with credentials from .env
```

### Export Analytics Data
In dashboard:
- Click "Export CSV" button
- Data downloads as CSV file

Or via API:
```bash
curl -H "Authorization: Basic $(echo -n 'admin:pass' | base64)" \
  http://localhost:3001/api/export/csv \
  -o analytics.csv
```

### Deploy to Railway
1. Push code to GitHub
2. Go to https://railway.app
3. Create project from GitHub repo
4. Select `/admin` directory
5. Set environment variables
6. Deploy!

---

## Environment Variables

### Required
```env
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_me
```

### Optional
```env
NODE_ENV=development
DB_PATH=./analytics.db
CORS_ORIGIN=*
```

---

## Database

### Tables
- `events` - All events
- `downloads` - Download records
- `active_users` - User sessions
- `feature_usage` - Feature interactions
- `crashes` - Error reports
- `geographic_data` - User locations
- `version_stats` - Version analytics

### File Location
- Local: `./analytics.db`
- Docker/Railway: `/app/data/analytics.db`

---

## Integration Steps

1. Copy `src/analytics.js` to your app
2. Initialize: `initAnalytics({ analyticsUrl: '...' })`
3. Track features: `getAnalytics().trackFeature(...)`
4. Handle errors: `getAnalytics().trackCrash(error)`

See `ANALYTICS-SETUP.md` for detailed instructions.

---

## Common Issues

### Port Already in Use
```bash
lsof -i :3001
kill -9 <PID>
```

### Database Locked
```bash
# Restart server
npm start
```

### Can't Access Dashboard
1. Check server running: `curl http://localhost:3001/health`
2. Check credentials
3. Check CORS setting

See `README.md` troubleshooting section for more.

---

## Deployment Platforms

| Platform | Time | Difficulty |
|----------|------|-----------|
| Railway | 2 min | Easy |
| Docker | 3 min | Easy |
| Heroku | 5 min | Medium |
| AWS EC2 | 10 min | Medium |
| AWS ECS | 15 min | Hard |

See `DEPLOYMENT.md` for instructions.

---

## Documentation Map

```
Getting Started?
  └─ QUICKSTART.md

Need Help Integrating?
  └─ ANALYTICS-SETUP.md

Want All Details?
  ├─ README.md
  └─ FILES-OVERVIEW.md

Ready to Deploy?
  └─ DEPLOYMENT.md

Understanding the System?
  └─ ADMIN-DASHBOARD-SUMMARY.md

Specific File Questions?
  └─ This INDEX.md
```

---

## Key Contacts & Resources

- **Railway**: https://railway.app
- **Docker**: https://docker.com
- **Node.js**: https://nodejs.org
- **Express**: https://expressjs.com
- **Chart.js**: https://chartjs.org

---

## File Sizes

```
server.js                  15 KB
public/index.html          34 KB
scripts/seed-data.js        8 KB
analytics.js                9 KB
package.json              <1 KB
Dockerfile                <1 KB
railway.json              <1 KB
.env.example              <1 KB

Documentation:
README.md                  10 KB
DEPLOYMENT.md              25 KB
QUICKSTART.md              15 KB
FILES-OVERVIEW.md          17 KB
Total docs                 67 KB

Total:                    ~115 KB
```

---

## Success Criteria

You've successfully set up when:

- [ ] Admin dashboard loads at localhost:3001
- [ ] Can login with admin credentials
- [ ] Sample data loads (after `npm run seed`)
- [ ] Can see download charts
- [ ] Can see user activity
- [ ] Analytics client copied to your app
- [ ] Events sending to dashboard
- [ ] Events visible in real-time

---

## Next Steps

1. Read `QUICKSTART.md` (5 minutes)
2. Run `npm run dev` to start
3. Run `npm run seed` to load test data
4. View dashboard at `http://localhost:3001`
5. Review `analytics-integration-example.js`
6. Integrate `analytics.js` into your app
7. Deploy to Railway or your preferred platform

---

**Last Updated**: 2024-03-23
**Version**: 1.0.0
**Status**: Production Ready
