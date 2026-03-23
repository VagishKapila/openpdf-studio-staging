/**
 * Seed data generator for analytics dashboard development
 * Populates the database with sample analytics data for testing
 *
 * Usage: node scripts/seed-data.js
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../analytics.db');

const db = new Database(DB_PATH);

// Platforms
const PLATFORMS = ['Windows', 'macOS', 'Linux', 'iOS', 'Android', 'Web'];

// Versions
const VERSIONS = ['1.0.0', '1.1.0', '1.1.5', '1.2.0', '2.0.0-beta'];

// Features
const FEATURES = [
  'pdf_to_image',
  'pdf_to_word',
  'pdf_compression',
  'pdf_merge',
  'pdf_split',
  'pdf_rotation',
  'pdf_watermark',
  'pdf_extraction',
  'batch_convert',
  'ocr_processing'
];

// Countries
const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'CN', name: 'China' }
];

// Error messages
const ERROR_MESSAGES = [
  'File too large',
  'Invalid PDF format',
  'Memory allocation failed',
  'Timeout during conversion',
  'Unsupported file format',
  'PDF is password protected',
  'Corrupted file data',
  'Insufficient permissions'
];

function seedData() {
  console.log('Seeding analytics database...');

  // Clear existing data
  console.log('Clearing existing data...');
  db.exec(`
    DELETE FROM events;
    DELETE FROM downloads;
    DELETE FROM active_users;
    DELETE FROM feature_usage;
    DELETE FROM crashes;
    DELETE FROM geographic_data;
    DELETE FROM version_stats;
  `);

  const today = new Date();
  let recordsAdded = 0;

  // 1. Seed Downloads (last 30 days)
  console.log('Creating download records...');
  for (let i = 0; i < 500; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const version = VERSIONS[Math.floor(Math.random() * VERSIONS.length)];
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

    const stmt = db.prepare(`
      INSERT INTO downloads (id, platform, version, timestamp, geo_country, geo_region, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      platform,
      version,
      date.toISOString(),
      country.name,
      `Region-${Math.floor(Math.random() * 10)}`,
      `Mozilla/5.0 (${platform}; rv:${Math.random()})`
    );

    recordsAdded++;
  }

  // 2. Seed Active Users
  console.log('Creating active user records...');
  const users = [];
  for (let i = 0; i < 150; i++) {
    const userId = uuidv4();
    users.push(userId);

    const daysAgo = Math.floor(Math.random() * 30);
    const lastSeen = new Date(today);
    lastSeen.setDate(lastSeen.getDate() - daysAgo);
    lastSeen.setHours(Math.floor(Math.random() * 24));

    const firstSeen = new Date(lastSeen);
    firstSeen.setDate(firstSeen.getDate() - Math.floor(Math.random() * 60));

    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const version = VERSIONS[Math.floor(Math.random() * VERSIONS.length)];

    const stmt = db.prepare(`
      INSERT INTO active_users (id, user_id, platform, version, last_seen, first_seen, session_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      userId,
      platform,
      version,
      lastSeen.toISOString(),
      firstSeen.toISOString(),
      Math.floor(Math.random() * 50) + 1
    );

    recordsAdded++;
  }

  // 3. Seed Feature Usage
  console.log('Creating feature usage records...');
  for (let i = 0; i < 1000; i++) {
    const userId = users[Math.floor(Math.random() * users.length)];
    const feature = FEATURES[Math.floor(Math.random() * FEATURES.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    const stmt = db.prepare(`
      INSERT INTO feature_usage (id, user_id, feature_name, feature_action, timestamp, duration_ms, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      userId,
      feature,
      'use',
      date.toISOString(),
      Math.floor(Math.random() * 5000) + 100,
      Math.random() > 0.05 ? 1 : 0 // 95% success rate
    );

    recordsAdded++;
  }

  // 4. Seed Crashes
  console.log('Creating crash records...');
  for (let i = 0; i < 30; i++) {
    const userId = Math.random() > 0.3 ? users[Math.floor(Math.random() * users.length)] : null;
    const version = VERSIONS[Math.floor(Math.random() * VERSIONS.length)];
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const error = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));

    const stmt = db.prepare(`
      INSERT INTO crashes (id, user_id, version, platform, error_message, stack_trace, timestamp, resolved)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      userId,
      version,
      platform,
      error,
      `at convertPDF (app.js:123)\nat processFile (app.js:456)\nat main (app.js:789)`,
      date.toISOString(),
      Math.random() > 0.6 ? 1 : 0 // 40% resolved
    );

    recordsAdded++;
  }

  // 5. Seed Geographic Data
  console.log('Creating geographic data records...');
  for (let i = 0; i < 200; i++) {
    const userId = Math.random() > 0.5 ? users[Math.floor(Math.random() * users.length)] : null;
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));

    const stmt = db.prepare(`
      INSERT INTO geographic_data (id, user_id, country_code, country_name, region, city, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      userId,
      country.code,
      country.name,
      `Region-${Math.floor(Math.random() * 5)}`,
      `City-${Math.floor(Math.random() * 20)}`,
      date.toISOString()
    );

    recordsAdded++;
  }

  // 6. Seed General Events
  console.log('Creating general event records...');
  for (let i = 0; i < 500; i++) {
    const types = ['app_open', 'app_active', 'page_view'];
    const type = types[Math.floor(Math.random() * types.length)];
    const userId = users[Math.floor(Math.random() * users.length)];
    const platform = PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)];
    const version = VERSIONS[Math.floor(Math.random() * VERSIONS.length)];

    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(Math.floor(Math.random() * 24));
    date.setMinutes(Math.floor(Math.random() * 60));

    const stmt = db.prepare(`
      INSERT INTO events (id, type, platform, version, user_id, session_id, timestamp, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      type,
      platform,
      version,
      userId,
      uuidv4(),
      date.toISOString(),
      JSON.stringify({
        action: type === 'page_view' ? 'navigation' : 'interaction',
        timestamp: date.toISOString()
      })
    );

    recordsAdded++;
  }

  console.log(`✓ Successfully seeded ${recordsAdded} records`);

  // Print summary
  const downloadCount = db.prepare('SELECT COUNT(*) as count FROM downloads').get().count;
  const userCount = db.prepare('SELECT COUNT(*) as count FROM active_users').get().count;
  const featureCount = db.prepare('SELECT COUNT(*) as count FROM feature_usage').get().count;
  const crashCount = db.prepare('SELECT COUNT(*) as count FROM crashes').get().count;
  const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;

  console.log('\nDatabase Summary:');
  console.log(`- Downloads: ${downloadCount}`);
  console.log(`- Active Users: ${userCount}`);
  console.log(`- Feature Usage: ${featureCount}`);
  console.log(`- Crashes: ${crashCount}`);
  console.log(`- Events: ${eventCount}`);
  console.log('\nSeeding complete!');
}

try {
  seedData();
  process.exit(0);
} catch (error) {
  console.error('Error seeding data:', error);
  process.exit(1);
}
