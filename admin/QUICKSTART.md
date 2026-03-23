# Analytics Dashboard - Quick Start Guide

Get the OpenPDF Studio Analytics Dashboard up and running in 5 minutes.

## 30-Second Setup (Local)

```bash
cd admin
npm install
cp .env.example .env
npm run seed        # Optional: load sample data
npm run dev
# Open http://localhost:3001
# Login: admin / admin123
```

That's it! You're running the analytics dashboard.

---

## Integration into Your App

### 1. Add Analytics Client

Copy the analytics module to your app:
```bash
cp src/analytics.js your-app/src/
```

### 2. Initialize in Your App

```javascript
// At app startup
import { initAnalytics } from './analytics.js';

initAnalytics({
  analyticsUrl: 'http://localhost:3001/api/track',
  debug: true
});
```

### 3. Track Events

```javascript
import { getAnalytics } from './analytics.js';

// Track feature usage
const analytics = getAnalytics();
analytics.trackEvent('pdf_converted', {
  format: 'image',
  pages: 10
});
```

See `src/analytics-integration-example.js` for more examples.

---

## Common Tasks

### Load Sample Data

```bash
npm run seed
```

Then refresh the dashboard. You'll see:
- 500+ download records
- 150 active users
- 1000+ feature usage events
- 30 crash reports
- Geographic distribution data

### Change Admin Password

Edit `.env`:
```env
ADMIN_PASSWORD=your_new_secure_password
```

Then restart:
```bash
npm start
```

### Export Analytics Data

In dashboard:
1. Click "Export CSV" button
2. Downloads as `analytics-export-YYYY-MM-DD.csv`

Or via curl:
```bash
curl -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  http://localhost:3001/api/export/csv \
  -o analytics.csv
```

### Deploy to Railway

1. Push code to GitHub
2. Go to https://railway.app
3. Create new project → "Deploy from GitHub repo"
4. Select your repository and admin directory
5. Set environment variables:
   - `ADMIN_USERNAME=admin`
   - `ADMIN_PASSWORD=secure_password`
   - `NODE_ENV=production`
6. Deploy

Done! Railway provides a public URL for your dashboard.

### Run with Docker

```bash
docker build -t openpdf-analytics .
docker run -p 3001:3001 \
  -e ADMIN_PASSWORD=secure_password \
  openpdf-analytics
```

---

## API Quick Reference

### Track Event (Public)

```bash
curl -X POST http://localhost:3001/api/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "feature_use",
    "platform": "Windows",
    "version": "1.0.0",
    "userId": "user-123",
    "data": {
      "feature_name": "pdf_to_image",
      "duration_ms": 2500
    }
  }'
```

### Get Stats (Admin)

```bash
curl -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  http://localhost:3001/api/stats
```

### Get Downloads Stats (Admin)

```bash
curl -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  http://localhost:3001/api/stats/downloads?days=30
```

### Get User Stats (Admin)

```bash
curl -H "Authorization: Basic $(echo -n 'admin:password' | base64)" \
  http://localhost:3001/api/stats/users
```

---

## Debugging

### Enable Debug Mode

```env
# In .env
NODE_ENV=development

# Or in your app:
initAnalytics({ debug: true })
```

Check browser console:
```javascript
// In DevTools console
const analytics = getAnalytics();
analytics.debugAnalytics();
// Outputs: User ID, Session ID, queue size, etc.
```

### Check if Server is Running

```bash
curl http://localhost:3001/health
# Response: {"status":"ok","timestamp":"2024-03-23T..."}
```

### View Server Logs

```bash
# Development
npm run dev
# Logs appear in terminal

# Production
journalctl -u openpdf-analytics -f
```

### Verify Database

```bash
# Check if database exists
ls -lh analytics.db

# Check record counts
sqlite3 analytics.db "SELECT COUNT(*) FROM downloads;"
```

---

## Customization

### Change Theme Colors

Edit `admin/public/index.html`:
```css
:root {
  --bg: #0f172a;              /* Dark background */
  --bg-secondary: #1e293b;    /* Secondary background */
  --text: #f1f5f9;            /* Text color */
  --accent: #3b82f6;          /* Accent color (blue) */
  --danger: #ef4444;          /* Error color (red) */
  --success: #10b981;         /* Success color (green) */
}
```

### Add Custom Analytics Endpoint

In `server.js`:
```javascript
app.get('/api/stats/custom', basicAuth, (req, res) => {
  const data = db.prepare('SELECT * FROM custom_table').all();
  res.json(data);
});
```

Then in dashboard HTML:
```javascript
const response = await fetch('/api/stats/custom', { headers: authHeader });
const data = await response.json();
```

---

## Next Steps

1. **Integrate into your app** - Copy analytics.js and initialize it
2. **Test locally** - Send some test events and verify in dashboard
3. **Deploy** - Push to Railway or your preferred platform
4. **Monitor** - Set up alerts for crashes and unusual activity
5. **Optimize** - Use analytics to improve your app

---

## File Structure

```
admin/
├── server.js              # Express app & API endpoints
├── package.json           # Dependencies
├── Dockerfile             # Docker configuration
├── railway.json           # Railway deployment config
├── .env.example           # Environment template
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Deployment guide
├── QUICKSTART.md          # This file
├── public/
│   └── index.html         # Dashboard UI
├── scripts/
│   └── seed-data.js       # Sample data generator
└── src/
    └── analytics.js       # Client library (copy to your app)
```

---

## Useful Commands

```bash
# Install dependencies
npm install

# Development (with auto-reload)
npm run dev

# Production
npm start

# Load sample data
npm run seed

# Check if running
curl http://localhost:3001/health

# View logs
npm run dev 2>&1 | tail -20

# Build Docker image
docker build -t openpdf-analytics .

# Run Docker container
docker run -p 3001:3001 openpdf-analytics
```

---

## FAQs

**Q: Where is my data stored?**
A: In `analytics.db` (SQLite). For Docker/Railway, it's in `/app/data/analytics.db`.

**Q: How long is data retained?**
A: By default, all data is kept. You can archive/delete old data manually or set up a maintenance script.

**Q: Can I change the admin password?**
A: Yes. Update `ADMIN_PASSWORD` in `.env` and restart the server.

**Q: Does this work offline?**
A: The analytics client queues events offline and syncs when back online. The dashboard requires internet.

**Q: How do I backup the database?**
A: Simply copy `analytics.db` to a safe location. Use `cp analytics.db analytics.db.backup`.

**Q: Can I use PostgreSQL instead of SQLite?**
A: You'd need to modify the server code. SQLite works fine for most cases.

**Q: What if I don't want to collect analytics?**
A: Set `optOut: true` in analytics initialization or add an opt-out button in your settings.

---

## Support

- **Docs**: See README.md and DEPLOYMENT.md in this directory
- **Examples**: Check `analytics-integration-example.js` for code samples
- **Issues**: Enable debug mode and check the console/server logs
- **Sample Data**: Run `npm run seed` to load test data

---

**Ready to go?** Start with `npm run dev` and open http://localhost:3001! 🚀
