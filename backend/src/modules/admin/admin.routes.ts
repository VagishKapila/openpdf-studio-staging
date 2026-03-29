import { Hono } from 'hono';
import { requireAuth, getUser } from '../../shared/middleware/auth';
import { db } from '../../shared/db';
import { brandingConfigs, subscriptions } from '../../shared/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env';
import Stripe from 'stripe';

const adminRoutes = new Hono();

// ===== GET BRANDING CONFIG =====
// GET /admin/branding
adminRoutes.get('/branding', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;
    const [config] = await db.select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, userId));

    return c.json(config || {
      companyName: 'DocuFlow',
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6',
      accentColor: '#a78bfa',
    });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to load branding' }, 500);
  }
});

// ===== UPDATE BRANDING CONFIG =====
// PUT /admin/branding
adminRoutes.put('/branding', requireAuth, async (c) => {
  try {
    const userId = getUser(c).id;
    const body = await c.req.json();

    const values = {
      userId,
      companyName: body.companyName || 'DocuFlow',
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || '#6366f1',
      secondaryColor: body.secondaryColor || '#8b5cf6',
      accentColor: body.accentColor || '#a78bfa',
      customDomain: body.customDomain || null,
      emailFromName: body.emailFromName || null,
      emailFooterText: body.emailFooterText || null,
      signingPageTitle: body.signingPageTitle || null,
      signingPageSubtitle: body.signingPageSubtitle || null,
      updatedAt: new Date(),
    };

    const [existing] = await db.select()
      .from(brandingConfigs)
      .where(eq(brandingConfigs.userId, userId));

    let config;
    if (existing) {
      [config] = await db.update(brandingConfigs)
        .set(values)
        .where(eq(brandingConfigs.userId, userId))
        .returning();
    } else {
      [config] = await db.insert(brandingConfigs)
        .values(values)
        .returning();
    }

    return c.json({ success: true, branding: config });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update branding' }, 500);
  }
});

// ===== STRIPE CUSTOMER PORTAL =====
// POST /admin/billing-portal
adminRoutes.post('/billing-portal', requireAuth, async (c) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const userId = getUser(c).id;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    // Find subscription for this user
    const [sub] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));

    if (!sub?.stripeCustomerId) {
      return c.json({ error: 'No billing account found. Subscribe first.' }, 404);
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/openpdf-studio/dashboard.html`,
    });

    return c.json({ url: session.url });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create billing portal' }, 500);
  }
});

// ===== CREATE SUBSCRIPTION CHECKOUT ($17/mo) =====
// POST /admin/subscribe
adminRoutes.post('/subscribe', requireAuth, async (c) => {
  try {
    if (!env.STRIPE_SECRET_KEY) {
      return c.json({ error: 'Stripe not configured' }, 503);
    }

    const user = getUser(c);
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);
    const body = await c.req.json();

    const origin = c.req.header('origin') || env.FRONTEND_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DocuFlow Pro',
            description: 'Monthly account fee — unlimited transactions, branded pages, document signing',
          },
          unit_amount: 1700, // $17.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${origin}/openpdf-studio/dashboard.html?subscription=success`,
      cancel_url: `${origin}/openpdf-studio/pricing.html?subscription=cancelled`,
      metadata: { userId: user.id },
    });

    return c.json({ checkoutUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create subscription' }, 500);
  }
});

export { adminRoutes };
