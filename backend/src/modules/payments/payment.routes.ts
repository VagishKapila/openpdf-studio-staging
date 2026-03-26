import { Hono } from 'hono';
import { authMiddleware } from '../../shared/middleware/auth';
import { env } from '../../config/env';
import {
  createCheckoutSession,
  getPaymentStatus,
  getPaymentByDocument,
  handleStripeWebhook,
} from './payment.service';
import Stripe from 'stripe';

const paymentRoutes = new Hono();

// ===== CREATE CHECKOUT SESSION =====
// POST /payments/create-checkout
// Requires auth — the document owner creates a payment request
paymentRoutes.post('/create-checkout', authMiddleware, async (c) => {
  try {
    const userId = c.get('userId') as string;
    const body = await c.req.json();

    if (!body.documentId || !body.amount) {
      return c.json({ error: 'documentId and amount are required' }, 400);
    }

    if (body.amount < 50) {
      return c.json({ error: 'Minimum amount is $0.50 (50 cents)' }, 400);
    }

    const result = await createCheckoutSession({
      documentId: body.documentId,
      creatorId: userId,
      amount: body.amount,
      currency: body.currency || 'usd',
      description: body.description || 'Document signing payment',
      successUrl: body.successUrl || `${env.FRONTEND_URL}/openpdf-studio/src/?payment=success&doc=${body.documentId}`,
      cancelUrl: body.cancelUrl || `${env.FRONTEND_URL}/openpdf-studio/src/?payment=cancelled&doc=${body.documentId}`,
      payerEmail: body.payerEmail,
    });

    return c.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      paymentId: result.payment.id,
      sessionId: result.sessionId,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    return c.json({ error: error.message || 'Failed to create checkout' }, 500);
  }
});

// ===== GET PAYMENT STATUS =====
// GET /payments/:paymentId
paymentRoutes.get('/:paymentId', authMiddleware, async (c) => {
  try {
    const paymentId = c.req.param('paymentId');
    const payment = await getPaymentStatus(paymentId);

    if (!payment) {
      return c.json({ error: 'Payment not found' }, 404);
    }

    return c.json(payment);
  } catch (error: any) {
    console.error('Get payment error:', error);
    return c.json({ error: error.message || 'Failed to get payment' }, 500);
  }
});

// ===== GET PAYMENT BY DOCUMENT =====
// GET /payments/document/:documentId
paymentRoutes.get('/document/:documentId', authMiddleware, async (c) => {
  try {
    const documentId = c.req.param('documentId');
    const payment = await getPaymentByDocument(documentId);

    return c.json(payment || { status: 'none' });
  } catch (error: any) {
    console.error('Get payment by doc error:', error);
    return c.json({ error: error.message || 'Failed to get payment' }, 500);
  }
});

// ===== STRIPE WEBHOOK =====
// POST /payments/webhook
// No auth — Stripe sends webhooks directly. Verify with webhook secret.
paymentRoutes.post('/webhook', async (c) => {
  try {
    const sig = c.req.header('stripe-signature');
    const rawBody = await c.req.text();

    if (env.STRIPE_WEBHOOK_SECRET && sig) {
      const stripe = new Stripe(env.STRIPE_SECRET_KEY!, { apiVersion: '2025-04-30.basil' });
      const event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
      await handleStripeWebhook(event);
    } else {
      // In development without webhook secret, parse as JSON
      const event = JSON.parse(rawBody) as Stripe.Event;
      await handleStripeWebhook(event);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return c.json({ error: 'Webhook processing failed' }, 400);
  }
});

// ===== GET STRIPE PUBLISHABLE KEY =====
// GET /payments/config
paymentRoutes.get('/config', async (c) => {
  return c.json({
    publishableKey: env.STRIPE_PUBLISHABLE_KEY || null,
    testMode: env.STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') || false,
  });
});

export { paymentRoutes };
