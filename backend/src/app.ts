import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { env } from './config/env';

// Module imports — each module is self-contained
import { authRoutes } from './modules/auth';
import { convertRoutes } from './modules/convert';

const app = new Hono();

// ===== GLOBAL MIDDLEWARE =====
app.use('*', logger());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: env.CORS_ORIGINS.split(',').map(o => o.trim()),
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}));

// ===== HEALTH CHECK =====
app.get('/', (c) => {
  return c.json({
    name: 'DocPix Studio API',
    version: '1.0.0',
    status: 'healthy',
    environment: env.NODE_ENV,
    modules: ['auth', 'convert'],
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== MODULE ROUTES =====
// Each module registers its own routes under its prefix
// This keeps modules completely independent
app.route('/auth', authRoutes);
app.route('/convert', convertRoutes);

// Future modules will be added here:
// app.route('/esign', esignRoutes);
// app.route('/payments', paymentRoutes);
// app.route('/dashboard', dashboardRoutes);

// ===== 404 HANDLER =====
app.notFound((c) => {
  return c.json({ error: 'Not found', path: c.req.path }, 404);
});

// ===== ERROR HANDLER =====
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  }, 500);
});

export default app;
