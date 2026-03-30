import { serve } from '@hono/node-server';
import app from './app';
import { env } from './config/env';
import { db } from './shared/db';
import { sql } from 'drizzle-orm';
import { readFileSync } from 'fs';

const port = env.PORT;

async function ensureDatabase() {
  console.log('ð Checking database connectivity...');
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    console.log('â Database connected');
    return true;
  } catch (error) {
    console.error('â Database connection failed:', error);
    return false;
  }
}

async function runMigrations() {
  try {
    const migrationFiles = ['./drizzle/0000_lovely_leech.sql', './drizzle/0001_add_orgs_feedback_and_admin.sql', './drizzle/0001_add_branding_subscriptions.sql'];
    const allStatements: string[] = [];
    for (const file of migrationFiles) {
      try {
        const migrationSql = readFileSync(file, 'utf-8');
        allStatements.push(...migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean));
      } catch { /* file may not exist yet */ }
    }
    let applied = 0;
    let skipped = 0;
    for (const stmt of allStatements) {
      try {
        await db.execute(sql.raw(stmt));
        applied++;
      } catch (e: any) {
        if (['42P07', '42710', '42P16'].includes(e.code)) {
          skipped++;
        } else {
          console.error('â ï¸  Migration statement error:', e.message);
        }
      }
    }
    console.log(`â Database migrations: ${applied} applied, ${skipped} already existed`);
  } catch (error) {
    console.error('â ï¸  Migration warning:', error);
  }
}

async function startServer() {
  console.log(`
ââââââââââââââââââââââââââââââââââââââââââââââââ
â          DocPix Studio API Server            â
â âââââââââââââââââââââââââââââââââââââââââââââââ£
â  Environment : ${env.NODE_ENV.padEnd(28)}â
â  Port        : ${String(port).padEnd(28)}â
â  URL         : ${`http://localhost:${port}`.padEnd(28)}â
ââââââââââââââââââââââââââââââââââââââââââââââââ
  `);

  await ensureDatabase();
  await runMigrations();

  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`ð Server running on http://localhost:${info.port}`);
    console.log(`ð Health check: http://localhost:${info.port}/health`);
    console.log(`ð Auth module:  http://localhost:${info.port}/auth`);
    console.log(`ð Modules: auth, convert, esign, payments, dashboard, admin, org, notifications, reminders, ai, reports, protection`);
  });
}

startServer();

// Graceful shutdown
const shutdown = () => {
  console.log('\nð Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
