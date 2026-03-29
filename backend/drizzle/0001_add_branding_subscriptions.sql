-- Branding configs for white-label support
CREATE TABLE IF NOT EXISTS "branding_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE UNIQUE,
  "company_name" varchar(255) NOT NULL,
  "logo_url" text,
  "primary_color" varchar(7) DEFAULT '#6366f1' NOT NULL,
  "secondary_color" varchar(7) DEFAULT '#8b5cf6' NOT NULL,
  "accent_color" varchar(7) DEFAULT '#a78bfa',
  "custom_domain" varchar(255),
  "email_from_name" varchar(255),
  "email_footer_text" text,
  "signing_page_title" varchar(255),
  "signing_page_subtitle" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Subscriptions for $17/mo account fee tracking
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_customer_id" varchar(255),
  "stripe_subscription_id" varchar(255),
  "plan" varchar(50) DEFAULT 'free' NOT NULL,
  "status" varchar(50) DEFAULT 'active' NOT NULL,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "canceled_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_id" ON "subscriptions" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_stripe_customer" ON "subscriptions" ("stripe_customer_id");
