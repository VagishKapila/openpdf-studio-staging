# OpenPDF Studio Admin Dashboard

A comprehensive analytics and admin dashboard for OpenPDF Studio with real-time monitoring, crash reporting, and feature usage tracking.

## Features

- **Real-time Analytics**: Monitor downloads, active users, and app activity
- **Downloads Tracking**: Platform-specific downloads, version adoption, geographic distribution
- **User Analytics**: Daily/weekly/monthly active users with retention tracking
- **Feature Usage**: Track which features are used most, success rates, and performance
- **Crash Reporting**: Centralized crash reports with error tracking and resolution status
- **Geographic Distribution**: See where your users are coming from
- **Version Adoption**: Monitor version distribution across user base
- **Dark Theme UI**: Beautiful, responsive dashboard with Chart.js visualizations
- **Data Export**: Export analytics data to CSV for further analysis
- **Offline Support**: Analytics client queues events when offline

## Quick Start

### Installation

```bash
cd admin
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
DB_PATH=./analytics.db
NODE_ENV=development
```

### Running Locally

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

The dashboard will be available at `http://localhost:3001`

### Accessing the Dashboard

1. Navigate to `http://localhost:3001`
2. You'll be prompted for credentials
3. Enter your `ADMIN_USERNAME` and `ADMIN_PASSWORD`
4. Click "Refresh Data" to load analytics

## Analytics Events

The analytics client sends the following event types:

### Core Events

- **app_open**: User launches the app
- **app_active**: Periodic activity tracking (sent at intervals)
- **feature_use**: User interacts with a feature
- **crash**: Application error/crash
- **geo_update**: Geographic location update
- **download**: App download/installation

### Event Structure

```javascript
{
  type: "feature_use",
  platform: "Windows",
  version: "1.0.0",
  userId: "unique-user-id",
  sessionId: "session-id",
  timestamp: "2024-03-23T10:30:00Z",
  data: {
    feature_name: "pdf_to_image",
    feature_action: "convert",
    duration_ms: 2500,
    success: true,
    language: "en-US",
    timezone: "America/New_York",
    screenWidth: 1920,
    screenHeight: 1080
  }
}
```

## Using the Analytics Client

### Installation in Your App

Copy `analytics.js` to your app's source directory:

```javascript
import { initAnalytics } from './analytics.js';

// Initialize at app startup
const analytics = initAnalytics({
  analyticsUrl: 'https://your-analytics-server.com/api/track',
  enabled: true,
  debug: false // Set to true for development
});
```

### Tracking Features

```javascript
// Simple feature tracking
analytics.trackEvent('feature_use', {
  feature_name: 'pdf_to_image',
  feature_action: 'convert'
});

// Track with performance timing
const tracker = analytics.trackFeature('pdf_compression', 'compress');
// ... do the work ...
tracker.complete(true, actualDurationMs);

// Track errors
try {
  // ... risky operation ...
} catch (error) {
  analytics.trackCrash(error);
}

// Track user activity periodically
setInterval(() => {
  analytics.trackActivity();
}, 5 * 60 * 1000); // Every 5 minutes
```

### Privacy Controls

```javascript
// Opt out of analytics
analytics.setOptOut(true);

// Check localStorage for user's privacy preferences
if (localStorage.getItem('analytics_optout') === 'true') {
  analytics.setOptOut(true);
}
```

## API Endpoints

### Public (No Auth Required)
- `POST /api/track` - Submit analytics event
- `GET /health` - Health check

### Admin Endpoints (Basic Auth Required)
- `GET /api/stats` - Overview statistics
- `GET /api/stats/downloads` - Download analytics
- `GET /api/stats/users` - User activity analytics
- `GET /api/stats/features` - Feature usage analytics
- `GET /api/stats/crashes` - Crash reports
- `GET /api/stats/geo` - Geographic distribution
- `GET /api/stats/versions` - Version adoption
- `PATCH /api/stats/crashes/:id` - Mark crash as resolved
- `GET /api/export/csv` - Export data to CSV

## Database Schema

The analytics dashboard uses SQLite with the following tables:

- **events**: All analytics events
- **downloads**: Download/installation records
- **active_users**: User activity tracking
- **feature_usage**: Feature interaction logs
- **crashes**: Error reports
- **geographic_data**: User location data
- **version_stats**: Version-specific statistics

## Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository

### Deploy

1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard:
   - `ADMIN_USERNAME` - Admin login username
   - `ADMIN_PASSWORD` - Admin login password (change from default!)
   - `PORT` - Server port (default: 3001)
   - `NODE_ENV` - Set to `production`

3. Railway will automatically:
   - Install dependencies
   - Build Docker image
   - Deploy application
   - Create persistent storage for database

### Environment Variables on Railway

```
PORT=3001
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_very_secure_password
DB_PATH=/app/data/analytics.db
NODE_ENV=production
```

## Docker Deployment

Build and run locally:

```bash
docker build -t openpdf-analytics .
docker run -p 3001:3001 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=secure_password \
  -v analytics-data:/app/data \
  openpdf-analytics
```

## Performance Considerations

- **Batching**: Events are batched and sent in groups (default: 10 events)
- **Offline Support**: Failed requests are queued and retried
- **Compression**: All responses use gzip compression
- **Indexes**: Database queries are optimized with indexes
- **Retention**: Old analytics data should be archived/cleaned periodically

### Recommended Cleanup Job

```javascript
// Run monthly
db.exec(`
  DELETE FROM events WHERE timestamp < datetime('now', '-90 days');
  DELETE FROM feature_usage WHERE timestamp < datetime('now', '-90 days');
  VACUUM;
`);
```

## Monitoring

- Health check: `GET /health`
- Monitor database size: `du -sh analytics.db`
- Monitor event queue: Watch batch timeout in logs
- Set up alerts for crash spikes

## Security

- Basic HTTP authentication on admin endpoints
- Change default credentials immediately
- Use HTTPS in production
- Never expose admin credentials in client-side code
- Rotate credentials regularly

## Troubleshooting

### Events not appearing in dashboard
1. Check network tab - is POST request succeeding?
2. Verify analytics server is running: `curl http://localhost:3001/health`
3. Check admin credentials in browser console
4. Enable debug mode: `initAnalytics({ debug: true })`

### Database locked error
- Close other connections to the database
- Restart the server
- Consider using Railway's persistent volumes

### Slow dashboard loading
- Check database size: `ls -lh analytics.db`
- Consider archiving old data
- Verify network latency to analytics server

## License

MIT - Same as OpenPDF Studio
