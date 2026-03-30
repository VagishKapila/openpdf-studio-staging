-- Fix: Add all potentially missing columns to users table
-- The initial CREATE TABLE IF NOT EXISTS was skipped because the table already existed
-- from an earlier version that didn't have these columns.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_name" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "company_logo_url" text;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "google_id" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_super_admin" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" varchar(50) DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint

-- Add unique constraint on google_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_google_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");
  END IF;
END $$;
--> statement-breakpoint

-- Add org_id to documents if missing
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "org_id" uuid;
--> statement-breakpoint

-- Add org_id to payments if missing
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "org_id" uuid;
--> statement-breakpoint

-- Also add missing columns to sessions table
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "user_agent" text;
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ip_address" varchar(45);
