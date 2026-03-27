import { serve } from '@hono/node-server';
import app from './app';
import { env } from './config/env';

const port = env.PORT;

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
