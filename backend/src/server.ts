import { serve } from '@hono/node-server';
import app from './app';
import { env } from './config/env';
import { db } from './shared/db';
import { sql } from 'drizzle-orm';

const port = env.PORT;

async function ensureDatabase() {
  console.log('🔄 Checking database connectivity...');
  try {
    const result = await db.execute(sql`SELECT 1 as ok`);
    console.log('✅ Database connected');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

async function startServer() {
  console.log(`
╔══════════════════════════════════════════════╗
║          DocPix Studio API Server            ║
╠══════════════════════════════════════════════╣
║  Environment : ${env.NODE_ENV.padEnd(28)}║
║  Port        : ${String(port).padEnd(28)}║
║  URL         : ${`http://localhost:${port}`.padEnd(28)}║
╚══════════════════════════════════════════════╝
  `);

  await ensureDatabase();

  serve({
    fetch: app.fetch,
    port,
    hostname: '0.0.0.0',
  }, (info) => {
    console.log(`🚀 Server running on http://localhost:${info.port}`);
    console.log(`📋 Health check: http://localhost:${info.port}/health`);
    console.log(`🔐 Auth module:  http://localhost:${info.port}/auth`);
    console.log(`📄 Modules: auth, convert, esign, payments, admin, org`);
  });
}

startServer();

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
