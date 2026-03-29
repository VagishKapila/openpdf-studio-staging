import { serve } from '@hono/node-server';
import { sql } from 'drizzle-orm';
import app from './app';
import { env } from './config/env';
import { db } from './shared/db';
import { readFileSync } from 'fs';

const port = env.PORT;

// Run database migrations before starting server
try {
  // Run all migration files in order
  const migrationFiles = ['./drizzle/0000_lovely_leech.sql', './drizzle/0001_add_branding_subscriptions.sql'];
  const allStatements: string[] = [];
  for (const file of migrationFiles) {
    try {
      const sql = readFileSync(file, 'utf-8');
      allStatements.push(...sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean));
    } catch { /* file may not exist yet */ }
  }
  const statements = allStatements;
  let applied = 0;
  let skipped = 0;
  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
      applied++;
    } catch (e: any) {
      // 42P07 = duplicate table, 42710 = duplicate constraint, 42P16 = duplicate index
      if (['42P07', '42710', '42P16'].includes(e.code)) {
        skipped++;
      } else {
        console.error('⚠️  Migration statement error:', e.message);
      }
    }
  }
  console.log(`✅ Database migrations: ${applied} applied, ${skipped} already existed`);
} catch (error) {
  console.error('⚠️  Migration warning:', error);
}

console.log(`
╔══════════════════════════════════════════════╗
║          DocPix Studio API Server            ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(port).padEnd(28)}║
║  URL         : ${`http://localhost:${port}`.padEnd(28)}║
╚══════════════════════════════════════════════╝
`);

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`);
  console.log(`📋 Health check: http://localhost:${info.port}/health`);
  console.log(`🔐 Auth module:  http://localhost:${info.port}/auth`);
  console.log(`📄 Convert module: http://localhost:${info.port}/convert`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
