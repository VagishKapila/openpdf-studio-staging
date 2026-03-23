import express from 'express';
import cors from 'cors';
import compression from 'compression';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'analytics.db');

let db;

function initializeDatabase() {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      platform TEXT,
      version TEXT,
      user_id TEXT,
      session_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      version TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      geo_country TEXT,
      geo_region TEXT,
      user_agent TEXT
    );

    CREATE TABLE IF NOT EXISTS active_users (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      platform TEXT,
      version TEXT,
      session_count INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS feature_usage (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      feature_action TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_ms INTEGER,
      success INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS crashes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      version TEXT NOT NULL,
      platform TEXT NOT NULL,
      error_message TEXT,
      stack_trace TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS geographic_data (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      country_code TEXT,
      country_name TEXT,
      region TEXT,
      city TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS version_stats (
      version TEXT PRIMARY KEY,
      download_count INTEGER DEFAULT 0,
      active_users INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_downloads_timestamp ON downloads(timestamp);
    CREATE INDEX IF NOT EXISTS idx_downloads_platform ON downloads(platform);
    CREATE INDEX IF NOT EXISTS idx_feature_timestamp ON feature_usage(timestamp);
    CREATE INDEX IF NOT EXISTS idx_crashes_timestamp ON crashes(timestamp);
    CREATE INDEX IF NOT EXISTS idx_active_users_timestamp ON active_users(last_seen);
  `);
}

function basicAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const [scheme, credentials] = auth.split(' ');
  if (scheme !== 'Basic') {
    return res.status(401).json({ error: 'Invalid auth scheme' });
  }

  const [username, password] = Buffer.from(credentials, 'base64').toString().split(':');

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return next();
  }

  return res.status(403).json({ error: 'Invalid credentials' });
}

app.use(compression());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Track analytics events
app.post('/api/track', (req, res) => {
  try {
    const { type, platform, version, userId, sessionId, data } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Event type required' });
    }

    const eventId = uuidv4();
    const eventData = JSON.stringify(data || {});

    const stmt = db.prepare(`
      INSERT INTO events (id, type, platform, version, user_id, session_id, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(eventId, type, platform, version, userId, sessionId, eventData);

    // Handle specific event types
    if (type === 'download') {
      const downloadId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO downloads (id, platform, version, geo_country, geo_region, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(downloadId, platform, version, data?.geo_country, data?.geo_region, data?.user_agent);
    }

    if (type === 'app_open' || type === 'app_active') {
      const updateStmt = db.prepare(`
        INSERT INTO active_users (id, user_id, platform, version)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          last_seen = CURRENT_TIMESTAMP,
          session_count = session_count + 1
      `);
      updateStmt.run(uuidv4(), userId, platform, version);
    }

    if (type === 'feature_use') {
      const featureId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO feature_usage (id, user_id, feature_name, feature_action, duration_ms, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        featureId,
        userId,
        data?.feature_name,
        data?.feature_action,
        data?.duration_ms,
        data?.success !== false ? 1 : 0
      );
    }

    if (type === 'crash') {
      const crashId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO crashes (id, user_id, version, platform, error_message, stack_trace)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        crashId,
        userId,
        version,
        platform,
        data?.error_message,
        data?.stack_trace
      );
    }

    if (type === 'geo_update') {
      const geoId = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO geographic_data (id, user_id, country_code, country_name, region, city)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        geoId,
        userId,
        data?.country_code,
        data?.country_name,
        data?.region,
        data?.city
      );
    }

    res.json({ success: true, eventId });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// Admin endpoints
app.get('/api/stats', basicAuth, (req, res) => {
  try {
    const totalDownloads = db.prepare('SELECT COUNT(*) as count FROM downloads').get().count;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM active_users').get().count;
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
    const crashCount = db.prepare('SELECT COUNT(*) as count FROM crashes WHERE resolved = 0').get().count;

    const lastUpdated = db.prepare('SELECT MAX(timestamp) as last FROM events').get().last || new Date().toISOString();

    res.json({
      totalDownloads,
      activeUsers,
      totalEvents,
      crashCount,
      lastUpdated
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/stats/downloads', basicAuth, (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Downloads by platform
    const byPlatform = db.prepare(`
      SELECT platform, COUNT(*) as count FROM downloads
      WHERE timestamp > ?
      GROUP BY platform
      ORDER BY count DESC
    `).all(daysAgo);

    // Downloads by version
    const byVersion = db.prepare(`
      SELECT version, COUNT(*) as count FROM downloads
      WHERE timestamp > ?
      GROUP BY version
      ORDER BY count DESC
      LIMIT 10
    `).all(daysAgo);

    // Downloads over time (daily)
    const overTime = db.prepare(`
      SELECT DATE(timestamp) as date, COUNT(*) as count FROM downloads
      WHERE timestamp > ?
      GROUP BY DATE(timestamp)
      ORDER BY date
    `).all(daysAgo);

    res.json({
      byPlatform,
      byVersion,
      overTime,
      period: { days: parseInt(days) }
    });
  } catch (error) {
    console.error('Error fetching download stats:', error);
    res.status(500).json({ error: 'Failed to fetch download stats' });
  }
});

app.get('/api/stats/users', basicAuth, (req, res) => {
  try {
    // Daily active users (last 30 days)
    const dailyActive = db.prepare(`
      SELECT DATE(last_seen) as date, COUNT(*) as count FROM active_users
      WHERE last_seen > datetime('now', '-30 days')
      GROUP BY DATE(last_seen)
      ORDER BY date
    `).all();

    // Weekly active users
    const weeklyActive = db.prepare(`
      SELECT
        strftime('%Y-W%W', last_seen) as week,
        COUNT(*) as count
      FROM active_users
      WHERE last_seen > datetime('now', '-90 days')
      GROUP BY strftime('%Y-W%W', last_seen)
      ORDER BY week
    `).all();

    // Monthly active users
    const monthlyActive = db.prepare(`
      SELECT
        strftime('%Y-%m', last_seen) as month,
        COUNT(*) as count
      FROM active_users
      WHERE last_seen > datetime('now', '-12 months')
      GROUP BY strftime('%Y-%m', last_seen)
      ORDER BY month
    `).all();

    // Current active users
    const currentActive = db.prepare(`
      SELECT COUNT(*) as count FROM active_users
      WHERE last_seen > datetime('now', '-24 hours')
    `).get().count;

    res.json({
      currentActive,
      dailyActive,
      weeklyActive,
      monthlyActive
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

app.get('/api/stats/features', basicAuth, (req, res) => {
  try {
    const features = db.prepare(`
      SELECT
        feature_name,
        COUNT(*) as usage_count,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        AVG(duration_ms) as avg_duration_ms
      FROM feature_usage
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY feature_name
      ORDER BY usage_count DESC
    `).all();

    const featureActions = db.prepare(`
      SELECT
        feature_name,
        feature_action,
        COUNT(*) as count
      FROM feature_usage
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY feature_name, feature_action
      ORDER BY count DESC
      LIMIT 20
    `).all();

    res.json({
      features,
      featureActions
    });
  } catch (error) {
    console.error('Error fetching feature stats:', error);
    res.status(500).json({ error: 'Failed to fetch feature stats' });
  }
});

app.get('/api/stats/crashes', basicAuth, (req, res) => {
  try {
    const recentCrashes = db.prepare(`
      SELECT id, version, platform, error_message, timestamp, resolved
      FROM crashes
      ORDER BY timestamp DESC
      LIMIT 50
    `).all();

    const crashesByVersion = db.prepare(`
      SELECT version, COUNT(*) as count
      FROM crashes
      WHERE resolved = 0
      GROUP BY version
      ORDER BY count DESC
    `).all();

    const crashesByPlatform = db.prepare(`
      SELECT platform, COUNT(*) as count
      FROM crashes
      WHERE resolved = 0
      GROUP BY platform
      ORDER BY count DESC
    `).all();

    const totalCrashes = db.prepare('SELECT COUNT(*) as count FROM crashes WHERE resolved = 0').get().count;
    const resolvedCrashes = db.prepare('SELECT COUNT(*) as count FROM crashes WHERE resolved = 1').get().count;

    res.json({
      recentCrashes,
      crashesByVersion,
      crashesByPlatform,
      totalCrashes,
      resolvedCrashes
    });
  } catch (error) {
    console.error('Error fetching crash stats:', error);
    res.status(500).json({ error: 'Failed to fetch crash stats' });
  }
});

app.get('/api/stats/geo', basicAuth, (req, res) => {
  try {
    const byCountry = db.prepare(`
      SELECT
        country_name,
        country_code,
        COUNT(*) as count
      FROM geographic_data
      WHERE timestamp > datetime('now', '-30 days')
      GROUP BY country_code, country_name
      ORDER BY count DESC
      LIMIT 50
    `).all();

    const topCountries = db.prepare(`
      SELECT
        d.geo_country as country,
        COUNT(*) as download_count
      FROM downloads d
      WHERE d.timestamp > datetime('now', '-30 days')
        AND d.geo_country IS NOT NULL
      GROUP BY d.geo_country
      ORDER BY download_count DESC
      LIMIT 20
    `).all();

    res.json({
      byCountry,
      topCountries
    });
  } catch (error) {
    console.error('Error fetching geographic stats:', error);
    res.status(500).json({ error: 'Failed to fetch geographic stats' });
  }
});

app.get('/api/stats/versions', basicAuth, (req, res) => {
  try {
    const versionAdoption = db.prepare(`
      SELECT
        version,
        COUNT(*) as user_count,
        ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
      FROM active_users
      WHERE version IS NOT NULL
      GROUP BY version
      ORDER BY user_count DESC
    `).all();

    const latestVersion = db.prepare(`
      SELECT version FROM downloads
      ORDER BY timestamp DESC
      LIMIT 1
    `).get();

    const versionDetails = db.prepare(`
      SELECT
        version,
        COUNT(*) as download_count,
        COUNT(DISTINCT DATE(timestamp)) as active_days
      FROM downloads
      GROUP BY version
      ORDER BY download_count DESC
      LIMIT 15
    `).all();

    res.json({
      versionAdoption,
      latestVersion: latestVersion?.version || 'unknown',
      versionDetails
    });
  } catch (error) {
    console.error('Error fetching version stats:', error);
    res.status(500).json({ error: 'Failed to fetch version stats' });
  }
});

// Crash resolution endpoint
app.patch('/api/stats/crashes/:id', basicAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { resolved } = req.body;

    const stmt = db.prepare('UPDATE crashes SET resolved = ? WHERE id = ?');
    stmt.run(resolved ? 1 : 0, id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating crash:', error);
    res.status(500).json({ error: 'Failed to update crash' });
  }
});

// Export data to CSV
app.get('/api/export/csv', basicAuth, (req, res) => {
  try {
    const { type = 'all' } = req.query;
    let data = [];
    let filename = 'analytics.csv';

    if (type === 'downloads' || type === 'all') {
      const downloads = db.prepare('SELECT * FROM downloads ORDER BY timestamp DESC').all();
      const headers = 'ID,Platform,Version,Timestamp,Country,Region,User Agent\n';
      const rows = downloads.map(d =>
        `${d.id},"${d.platform}","${d.version}","${d.timestamp}","${d.geo_country}","${d.geo_region}","${d.user_agent}"`
      ).join('\n');
      data.push(headers + rows);
      filename = `downloads-${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (type === 'crashes' || type === 'all') {
      const crashes = db.prepare('SELECT * FROM crashes ORDER BY timestamp DESC').all();
      const headers = 'ID,User ID,Version,Platform,Error,Timestamp,Resolved\n';
      const rows = crashes.map(c =>
        `${c.id},"${c.user_id}","${c.version}","${c.platform}","${c.error_message}","${c.timestamp}",${c.resolved}`
      ).join('\n');
      data.push(headers + rows);
      filename = `crashes-${new Date().toISOString().split('T')[0]}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data.join('\n\n'));
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
initializeDatabase();

app.listen(PORT, () => {
  console.log(`Analytics server running on http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/`);
  console.log(`Database: ${DB_PATH}`);
});

export default app;
