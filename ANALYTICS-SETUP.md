# Analytics Setup for OpenPDF Studio

Complete guide to integrating the analytics dashboard into the OpenPDF Studio application.

## Overview

The analytics system consists of two parts:

1. **Admin Dashboard** (`admin/`) - Web interface for viewing analytics
2. **Analytics Client** (`src/analytics.js`) - Lightweight JS module integrated into your app

## Quick Integration

### Step 1: Copy Analytics Module

The `src/analytics.js` file is already in your repository. This is the client-side analytics tracker.

### Step 2: Initialize at App Startup

Add this to your main application entry point:

**For Web Apps:**
```javascript
import { initAnalytics } from './analytics.js';

// Initialize at app startup (e.g., in App.js or main.js)
const analytics = initAnalytics({
  analyticsUrl: process.env.ANALYTICS_SERVER_URL || 'http://localhost:3001/api/track',
  enabled: true,
  debug: process.env.NODE_ENV === 'development'
});

// Make analytics globally available
window.__analytics = analytics;
```

**For Electron Apps:**
```javascript
import { initAnalytics } from './analytics.js';

const ipcRenderer = require('electron').ipcRenderer;

const analytics = initAnalytics({
  analyticsUrl: 'http://localhost:3001/api/track', // or your server URL
  enabled: !process.env.DISABLE_ANALYTICS,
  debug: process.env.NODE_ENV === 'development'
});

// Send analytics from main process
ipcRenderer.on('app-ready', () => {
  analytics.trackEvent('app_open', {
    platform: process.platform,
    version: '1.0.0'
  });
});
```

**For React Apps:**
```javascript
import React, { useEffect } from 'react';
import { initAnalytics } from './analytics.js';

function App() {
  useEffect(() => {
    // Initialize analytics once at app startup
    const analytics = initAnalytics({
      analyticsUrl: process.env.REACT_APP_ANALYTICS_URL || 'http://localhost:3001/api/track',
      enabled: true,
      debug: process.env.NODE_ENV === 'development'
    });

    // Make available globally
    window.__analytics = analytics;

    // Track app open
    analytics.trackActivity();

    return () => {
      // Flush events on unload
      analytics.sendBeforeUnload();
    };
  }, []);

  return (
    // Your app content
  );
}

export default App;
```

### Step 3: Track User Features

Throughout your app, use the analytics client to track user interactions:

```javascript
import { getAnalytics } from './analytics.js';

// In your feature implementations
async function convertPDFToImage(pdfFile, options) {
  const analytics = getAnalytics();

  // Track with timing
  const tracker = analytics.trackFeature('pdf_to_image', 'convert', {
    format: options.format,
    quality: options.quality,
    pages: options.pages || 'all'
  });

  try {
    const startTime = performance.now();

    // Your conversion logic here
    const result = await performConversion(pdfFile, options);

    const duration = performance.now() - startTime;
    tracker.complete(true, duration);

    return result;
  } catch (error) {
    tracker.complete(false);
    analytics.trackCrash(error);
    throw error;
  }
}
```

### Step 4: Handle Errors

Set up global error tracking:

```javascript
import { getAnalytics } from './analytics.js';

function setupErrorHandling() {
  const analytics = getAnalytics();

  // Uncaught errors
  window.addEventListener('error', (event) => {
    analytics.trackCrash(event.error);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackCrash(event.reason);
  });

  // In try-catch blocks
  try {
    // risky operation
  } catch (error) {
    analytics.trackCrash(error);
  }
}
```

### Step 5: Provide Privacy Controls

Add a privacy setting to your app's preferences:

```javascript
import { getAnalytics } from './analytics.js';

function setupPrivacyControls() {
  const analytics = getAnalytics();

  // Get user's privacy preference
  const optOut = localStorage.getItem('user_analytics_optout') === 'true';
  analytics.setOptOut(optOut);

  // Update when user changes setting
  document.getElementById('analytics-toggle').addEventListener('change', (e) => {
    const optOut = !e.target.checked;
    analytics.setOptOut(optOut);
    localStorage.setItem('user_analytics_optout', optOut.toString());
  });
}
```

## Deployment Configuration

### Environment Variables

Add to your `.env` or `.env.production`:

```env
# Analytics server URL (your deployed admin dashboard)
REACT_APP_ANALYTICS_URL=https://your-analytics-server.com/api/track
ANALYTICS_SERVER_URL=https://your-analytics-server.com/api/track
VITE_ANALYTICS_URL=https://your-analytics-server.com/api/track

# Enable/disable analytics
DISABLE_ANALYTICS=false
```

### Different Environments

**Development:**
```env
ANALYTICS_SERVER_URL=http://localhost:3001/api/track
```

**Staging:**
```env
ANALYTICS_SERVER_URL=https://staging-analytics.openpdfstudio.com/api/track
```

**Production:**
```env
ANALYTICS_SERVER_URL=https://analytics.openpdfstudio.com/api/track
```

## Tracked Events

### Automatic Events
- `app_open` - App launched
- `app_active` - User is active (periodic)
- `geo_update` - User's geographic location (one-time)

### Feature Events
Track these in your feature implementations:

```javascript
// PDF to Image conversion
analytics.trackFeature('pdf_to_image', 'convert', {
  format: 'jpg', // or png, tiff, webp
  quality: 85,
  pages_count: 10
});

// PDF to Word conversion
analytics.trackFeature('pdf_to_word', 'convert', {
  preserve_formatting: true
});

// PDF compression
analytics.trackFeature('pdf_compression', 'compress', {
  original_size_mb: 50,
  compressed_size_mb: 25,
  compression_ratio: 0.5
});

// PDF merging
analytics.trackFeature('pdf_merge', 'merge', {
  files_count: 5,
  total_pages: 100
});

// PDF splitting
analytics.trackFeature('pdf_split', 'split', {
  original_pages: 50,
  split_count: 5
});

// PDF text extraction
analytics.trackFeature('pdf_extraction', 'extract', {
  text_length: 5000,
  with_formatting: true
});

// Settings changes
analytics.trackFeature('settings', 'change', {
  setting_name: 'theme',
  new_value: 'dark'
});
```

### Error Events
Automatically tracked when using `tracker.complete(false)` or `analytics.trackCrash(error)`.

## Dashboard Access

Once integrated:

1. **Start the admin dashboard:**
   ```bash
   cd admin
   npm install
   npm start
   ```

2. **Access at:** http://localhost:3001

3. **Login with:** admin / admin123 (change password!)

4. **View analytics:**
   - Download statistics
   - Active users
   - Feature usage
   - Crash reports
   - Geographic distribution
   - Version adoption

## Privacy & Compliance

### What's NOT Tracked
- User names, emails, or IDs
- Sensitive document content
- Personal data
- IP addresses (converted to country only)
- Passwords or authentication tokens

### What IS Tracked
- App usage frequency
- Feature popularity
- Errors and crashes
- General platform/version info
- Approximate geographic region

### GDPR Compliance
- Users can opt out at any time
- No PII is collected
- Data is anonymized
- Can export and delete data

Add privacy notice to your app:
```
"This app collects anonymous usage analytics to help us improve your experience.
You can disable analytics in Settings → Privacy. No personal data is collected."
```

## Performance Considerations

### Batching
Events are batched and sent together:
- Sends when 10 events queue up, or
- Every 30 seconds (whichever comes first)

### Offline Support
Events are queued if offline and synced when connection restored.

### No Performance Impact
- Lightweight (minimal CPU usage)
- Non-blocking (async)
- Doesn't interfere with app functionality

## Testing

### Load Sample Data

```bash
cd admin
npm run seed
# Creates 500+ analytics records
```

Then view in dashboard to verify integration.

### Test Tracking

```javascript
// In browser console
const analytics = window.__analytics || getAnalytics();

// Send test event
analytics.trackEvent('test_event', { message: 'Hello' });

// Check queue
console.log('Queue size:', analytics.queue.length);
console.log('Session ID:', analytics.sessionId);
console.log('User ID:', analytics.userId);
```

### Debug Mode

```javascript
initAnalytics({
  debug: true  // Logs all events to console
});
```

## Troubleshooting

### Events Not Appearing

1. Check network tab in DevTools
   - Look for POST requests to `/api/track`
   - Verify they're succeeding (200 status)

2. Verify server is running
   ```bash
   curl http://localhost:3001/health
   ```

3. Check analytics initialization
   ```javascript
   const analytics = getAnalytics();
   console.log('Analytics enabled:', !analytics.config.optOut);
   console.log('Analytics URL:', analytics.config.analyticsUrl);
   ```

4. Enable debug mode
   ```javascript
   initAnalytics({ debug: true });
   ```

### CORS Errors

If you see CORS errors:

1. Update `CORS_ORIGIN` in admin server `.env`:
   ```env
   CORS_ORIGIN=http://localhost:3000
   CORS_ORIGIN=https://your-app-domain.com
   ```

2. Restart admin server
   ```bash
   cd admin
   npm start
   ```

### Events Lost on Offline

The analytics client automatically queues offline events. To prevent losing too many:

```javascript
initAnalytics({
  batchSize: 5,         // Send more frequently
  batchTimeout: 10000   // Send every 10 seconds
});
```

## Advanced Integration

### React Hooks

```javascript
import { useEffect, useRef } from 'react';
import { getAnalytics } from './analytics';

export function useAnalytics() {
  const analyticsRef = useRef(null);

  useEffect(() => {
    analyticsRef.current = getAnalytics();
  }, []);

  return {
    trackEvent: (type, data) => analyticsRef.current?.trackEvent(type, data),
    trackFeature: (name, action, data) => analyticsRef.current?.trackFeature(name, action, data),
    trackCrash: (error) => analyticsRef.current?.trackCrash(error)
  };
}

// Usage in component
function MyComponent() {
  const { trackEvent, trackFeature } = useAnalytics();

  const handleConvert = async () => {
    const tracker = trackFeature('conversion', 'start');
    try {
      await doConversion();
      tracker.complete(true);
    } catch (e) {
      tracker.complete(false);
    }
  };

  return <button onClick={handleConvert}>Convert</button>;
}
```

### Vue 3 Composable

```javascript
import { getAnalytics } from './analytics';

export function useAnalytics() {
  const analytics = getAnalytics();

  return {
    trackEvent: (type, data) => analytics.trackEvent(type, data),
    trackFeature: (name, action, data) => analytics.trackFeature(name, action, data),
    trackCrash: (error) => analytics.trackCrash(error)
  };
}

// Usage in component
<script setup>
import { useAnalytics } from '@/composables/useAnalytics';

const { trackFeature } = useAnalytics();

async function convert() {
  const tracker = trackFeature('conversion', 'start');
  try {
    await doConversion();
    tracker.complete(true);
  } catch (e) {
    tracker.complete(false);
  }
}
</script>
```

### Performance Monitoring

```javascript
import { getAnalytics } from './analytics';

// Wrap async operations
async function withAnalytics(operationName, asyncFn) {
  const analytics = getAnalytics();
  const tracker = analytics.trackFeature(operationName, 'execute');

  try {
    const result = await asyncFn();
    tracker.complete(true);
    return result;
  } catch (error) {
    tracker.complete(false);
    analytics.trackCrash(error);
    throw error;
  }
}

// Usage
const pdfBuffer = await withAnalytics('file_load', async () => {
  const response = await fetch(url);
  return response.arrayBuffer();
});
```

## Deployment Checklist

Before deploying to production:

- [ ] Copy `src/analytics.js` to your app
- [ ] Initialize analytics in app startup
- [ ] Set `ANALYTICS_SERVER_URL` to production server
- [ ] Set `DISABLE_ANALYTICS=false` in production
- [ ] Add privacy notice to your app
- [ ] Add privacy controls to settings
- [ ] Test event tracking locally
- [ ] Verify admin dashboard is deployed
- [ ] Change admin password from default
- [ ] Monitor first week of data
- [ ] Set up error alerts
- [ ] Back up analytics database regularly

## Monitoring

Monitor these metrics:

- **Event volume**: Sudden drops = issue
- **Error rate**: Should be < 5%
- **Feature usage**: Which features are popular
- **Crashes**: Which versions/platforms have issues
- **User retention**: Are users coming back
- **Geography**: Where are users from

## Support

For issues:

1. Check `admin/README.md` for admin dashboard docs
2. Check `admin/DEPLOYMENT.md` for deployment help
3. Enable debug mode and check console logs
4. Review `src/analytics-integration-example.js` for patterns
5. Check server logs: `curl http://localhost:3001/health`

## Summary

You now have:
- ✅ Analytics tracking in your app
- ✅ Beautiful admin dashboard
- ✅ Real-time usage monitoring
- ✅ Privacy-respecting implementation
- ✅ Offline support
- ✅ Error tracking
- ✅ Geographic insights

Start tracking! 🚀
