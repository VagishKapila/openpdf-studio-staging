# DocPix Studio — Project Knowledge Base

> Last updated: March 26, 2026
> Owner: Vagish Kapila (VagishKapila on GitHub, vaakapila@gmail.com)
> Repo: https://github.com/VagishKapila/openpdf-studio

## Project Overview

DocPix Studio is a full-featured document platform for editing PDFs, collecting e-signatures, processing payments, and managing document workflows — all in one place. Available as a SaaS with free trial, paid plans (Starter $29/mo, Pro $99/mo, Enterprise custom), and white-label options for businesses. Open-source core with premium features.

- **Frontend (Editor)**: Vanilla HTML/CSS/JS served via GitHub Pages from `main` branch — single-file SPA in `src/index.html`
- **Frontend (Dashboard)**: React 19 + TypeScript + Vite + Tailwind in `dashboard/` — separate app
- **Backend**: Hono.js + TypeScript on Railway (auto-deploys from `main` branch)
- **Database**: PostgreSQL on Railway (Drizzle ORM)
- **Staging branch**: `staging` — all new features go here first, `main` stays clean

## Branch Strategy

- `main` = production (GitHub Pages frontend + Railway backend deploy from here)
- `staging` = development for editor/signing/payment work (Netlify frontend deploy)
- `feature/dashboard` = admin dashboard + white-label client portal + AI intelligence (branched off staging)
- **DO NOT merge staging to main** until full testing is complete
- **DO NOT merge feature/dashboard to staging** until dashboard is functional

## Staging Infrastructure (lotuspuffs.com)

- **Netlify**: Deploys frontend from `staging` branch, publish dir = `src/`
- **Netlify site**: `incandescent-druid-a238c2.netlify.app`
- **Custom domain**: `lotuspuffs.com` (IONOS) — DNS pending (needs A record → 75.2.60.5)
- **DNS records needed**: A record `@` → 75.2.60.5, CNAME `www` → incandescent-druid-a238c2.netlify.app
- **Purpose**: Testing/staging URL for testers. Production stays at vagishkapila.github.io/openpdf-studio

## Infrastructure & Credentials

### Railway (Backend Hosting)
- Project: `dpstudio-backend`
- Service: `openpdf-studio` (openpdf-studio-production)
- URL: https://dpstudio-backend-production.up.railway.app
- Deploys from: `main` branch (currently set to `staging` for testing)
- 18 environment variables configured

### Railway Environment Variables
1. PORT="3001"
2. NODE_ENV="production"
3. DATABASE_URL (internal Railway Postgres URL)
4. JWT_SECRET
5. JWT_REFRESH_SECRET
6. FRONTEND_URL="https://incandescent-druid-a238c2.netlify.app"
7. CORS_ORIGINS="https://vagishkapila.github.io,http://localhost:5173,https://incandescent-druid-a238c2.netlify.app"
8. API_BASE_URL="https://dpstudio-backend-production.up.railway.app"
9. AWS_REGION="us-east-1"
10. AWS_S3_BUCKET="dpstudio-documents"
11. EMAIL_FROM="noreply@varshyl.com" (CORRECTED — was barshyrvirtual.com, now uses verified Resend domain)
12. GOOGLE_CLIENT_ID (Google OAuth - project: unified-ion-430015-e8)
13. GOOGLE_CLIENT_SECRET
14. STRIPE_PUBLISHABLE_KEY (test mode: pk_test_...)
15. STRIPE_SECRET_KEY (test mode: sk_test_...)
16. AWS_ACCESS_KEY_ID (IAM user: dpstudio-s3-service)
17. AWS_SECRET_ACCESS_KEY
18. RESEND_API_KEY (from Resend account, "DocPix Studio" key)

### AWS
- Account: 1045-3097-4574 (Vagish Kapila)
- S3 Bucket: `dpstudio-documents` (us-east-1, block all public access, SSE-S3)
- IAM User: `dpstudio-s3-service` with inline policy `dpstudio-s3-bucket-access`
- Policy: PutObject, GetObject, DeleteObject, ListBucket scoped to dpstudio-documents

### Google OAuth
- Google Cloud project: unified-ion-430015-e8 ("My First Project")
- OAuth client type: Web application
- Authorized redirect URIs include the backend callback

### Stripe
- Account: Varshyltech (from ConstructINV project, reused)
- Mode: TEST (pk_test_ / sk_test_ keys)
- Test card: 4242 4242 4242 4242, any future expiry, any CVC
- Declined test card: 4000 0000 0000 9995

### Resend (Email)
- Account: Shared with ConstructINV project
- API Key name: "DocPix Studio" (Sending access permission)
- Verified domain: `varshyl.com` (from ConstructINV project)
- From address: noreply@varshyl.com

### GitHub
- Repo: VagishKapila/openpdf-studio
- GitHub Pages: serves frontend from `main` branch
- Fine-grained PAT: "DocPix Studio" token (expires Jun 23 2026, all repos)
- PAT for git push: stored locally, use `git remote set-url origin https://x-access-token:<PAT>@github.com/VagishKapila/openpdf-studio.git`
- Note: GitHub push protection blocks PATs in committed files — never commit the actual token value

## Database Schema (PostgreSQL via Drizzle ORM)

### Existing Tables (10):
1. **users** — id, email, passwordHash, name, avatarUrl, companyName, companyLogo, googleId, emailVerified, isSuperAdmin, isActive, createdAt, updatedAt
2. **sessions** — id, userId, refreshToken, userAgent, ipAddress, expiresAt, createdAt
3. **documents** — id, userId, orgId, fileName, originalFileName, mimeType, fileSize, s3Key, s3KeyOriginal, status, pageCount, metadata, createdAt, updatedAt
4. **signature_requests** — id, documentId, senderId, recipientEmail, recipientName, message, status, accessToken, deadline, signedAt, viewedAt, signedDocumentS3Key, createdAt
5. **signature_fields** — id, requestId, fieldType, pageNumber, x, y, width, height, required, label, aiDetected, createdAt
6. **signatures** — id, fieldId, signerEmail, signerName, signatureDataUrl, signatureType, ipAddress, userAgent, signedAt
7. **payments** — id, documentId, creatorId, amount, currency, description, provider, providerPaymentId, paymentLink, qrCodeUrl, status, platformFee, payerEmail, paidAt, createdAt
8. **audit_log** — id, documentId, userId, action, actorEmail, ipAddress, metadata, createdAt
9. **templates** — id, userId, name, description, category, s3Key, isPublic, usageCount, signatureFields, paymentConfig, createdAt
10. **verification_tokens** — id, userId, token, type, expiresAt, usedAt, createdAt

### New Tables (feature/dashboard branch, 7):
11. **organizations** — id, name, slug, ownerId, plan, logoUrl, primaryColor, secondaryColor, customDomain, emailFromName, footerText, settings (JSONB), stripeCustomerId, isActive, createdAt, updatedAt
12. **org_members** — id, orgId, userId, role (owner/admin/member/viewer), invitedBy, joinedAt, createdAt
13. **document_patterns** — id, orgId, name, fingerprint, fieldPositions (JSONB), commonEdits (JSONB), frequency, lastSeenAt, confidence, createdAt
14. **signing_reminders** — id, requestId, orgId, type, channel, scheduledAt, sentAt, recipientEmail, message, attempt, createdAt
15. **daily_reports** — id, orgId, reportDate, docsSent, docsSigned, docsPending, docsExpired, revenue, newClients, avgTimeToSign, errors (JSONB), aiSuggestions, createdAt
16. **notification_inbox** — id, userId, orgId, type, title, message, data (JSONB), read, createdAt
17. **feedback** — id, orgId, userId, category, priority, message, aiSummary, status, createdAt

## Backend Architecture

```
backend/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment variable validation with Zod
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts        # POST /auth/register, /auth/login, /auth/refresh,
│   │   │   │                         #   /auth/logout, /auth/google, /auth/verify-email,
│   │   │   │                         #   /auth/resend-verification, /auth/forgot-password,
│   │   │   │                         #   /auth/reset-password
│   │   │   ├── auth.service.ts       # Auth business logic (with detailed logging)
│   │   │   └── auth.validators.ts    # Zod schemas
│   │   ├── esign/
│   │   │   ├── esign.routes.ts       # E-sign endpoints
│   │   │   ├── esign.service.ts      # Signing business logic
│   │   │   └── index.ts
│   │   ├── payments/
│   │   │   ├── payment.routes.ts     # Stripe payment endpoints
│   │   │   ├── payment.service.ts    # Payment business logic
│   │   │   └── index.ts
│   │   ├── convert/
│   │   │   └── convert.routes.ts     # Document conversion
│   │   ├── admin/                    # NEW (feature/dashboard)
│   │   │   ├── admin.routes.ts       # GET /admin/dashboard/stats, /admin/users,
│   │   │   │                         #   /admin/users/:id, /admin/audit-log,
│   │   │   │                         #   /admin/revenue, /admin/organizations,
│   │   │   │                         #   /admin/feedback, /admin/system/health
│   │   │   │                         #   PATCH /admin/users/:id
│   │   │   └── index.ts
│   │   └── org/                      # NEW (feature/dashboard)
│   │       ├── org.routes.ts         # POST /orgs, /orgs/:slug/members/invite,
│   │       │                         #   /orgs/:slug/feedback
│   │       │                         #   GET /orgs/:slug/dashboard, /orgs/:slug/members,
│   │       │                         #   /orgs/:slug/analytics
│   │       │                         #   PATCH /orgs/:slug/branding
│   │       └── index.ts
│   ├── shared/
│   │   ├── db/
│   │   │   ├── schema.ts             # Drizzle schema (17 tables total)
│   │   │   ├── index.ts              # DB connection
│   │   │   └── migrate.ts            # Migration runner (auto-runs on startup)
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification middleware
│   │   │   ├── admin.middleware.ts    # NEW: requireSuperAdmin middleware
│   │   │   └── validate.middleware.ts # Zod validation middleware
│   │   └── services/
│   │       └── email.service.ts      # Resend SDK, branded HTML email templates
│   └── index.ts                      # Hono app entry point
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

## Dashboard Architecture (NEW — feature/dashboard)

```
dashboard/
├── index.html
├── package.json                      # React 19, Vite, Tailwind, Recharts, TanStack Query/Table,
│                                     #   shadcn/ui, Zustand, lucide-react, date-fns
├── vite.config.ts                    # Dev server port 5174, proxy /api to localhost:3001
├── tailwind.config.js                # Brand colors (#6366F1 purple), Inter font
├── tsconfig.json
├── postcss.config.js
└── src/
    ├── main.tsx                      # Entry point: React + QueryClient + BrowserRouter
    ├── App.tsx                       # Routes: /overview, /users, /documents, /revenue,
    │                                 #   /audit-log, /organizations, /feedback, /settings
    ├── styles/globals.css            # Tailwind + CSS variables for white-label theming
    ├── types/index.ts                # TypeScript types for all entities
    ├── lib/api.ts                    # API client with JWT auth, typed requests
    ├── components/
    │   ├── layout/DashboardLayout.tsx # Sidebar nav + top bar + content outlet
    │   └── dashboard/KPICard.tsx     # Reusable KPI metric card with trend indicator
    └── pages/                        # Page stubs (OverviewPage, UsersPage, etc.)
```

## Frontend Architecture (Editor — src/index.html)

Single-file SPA (~6800 lines) with inline HTML, CSS, and JS:
- PDF.js for rendering, pdf-lib for editing/saving, Fabric.js for annotations
- Auth modal (login, register, forgot password, reset password)
- Signing flow overlay (4-step: upload → setup → review → finalize)
- Payment integration (Stripe Checkout redirect)
- API client in `src/api-client.js`
- PWA: manifest.json + sw.js

## Key Design Decisions

- **Token-based email verification**: Crypto random tokens in verification_tokens table, 24hr expiry
- **Email enumeration prevention**: forgotPassword always returns same message
- **Session invalidation on password reset**: All sessions deleted
- **Branded emails**: Purple gradient header (#6366f1 → #8b5cf6) with SVG logo
- **Single-file frontend**: Everything in index.html (no build step)
- **Multi-tenant architecture**: Shared DB, row-level isolation via orgId columns
- **White-label theming**: CSS variables loaded dynamically per organization
- **isSuperAdmin flag**: Boolean on users table, checked by requireSuperAdmin middleware
- **Dashboard as separate app**: React app in dashboard/ with its own build, deploys independently

## Git History (feature/dashboard branch, newest first)

- `6f9c179` — Scaffold admin dashboard app and add multi-tenant database schema
- `0472c9e` — Fix 6 frontend bugs: zoom sync, signature tabs, undo panel, font size, text rendering, panel layout
- `31e6315` — Add detailed logging for auth and email debugging
- `9296de3` — Fix migration to handle existing tables gracefully
- `b5298e0` — Add auto-migration on server startup
- (earlier commits from staging)

## What's Being Built (Dashboard Phases)

### Phase 1: Super Admin Dashboard (CURRENT)
- 78 KPIs across 10 categories (Power BI-grade analytics)
- User management, audit log viewer, revenue breakdown
- Natural language querying (Wren AI / Chat2DB)
- Anomaly detection and smart alerting

### Phase 2: Multi-Tenant Foundation
- Organizations table + CRUD
- Member management with RBAC (owner/admin/member/viewer)
- Row-level data isolation middleware

### Phase 3: White-Label Client Dashboard
- Document pipeline (Kanban: Draft → Sent → Signed → Paid → Completed)
- Client analytics and team management
- CSS variable theming (logo, colors, domain)
- "Powered by DocPix Studio" footer

### Phase 4: Communication Layer
- SMS via Telnyx ($0.004/msg)
- Auto-push reports (morning brief, end-of-day, weekly digest, monthly PDF)
- SSE real-time notifications, browser push
- Smart notification batching for high-volume clients

### Phase 5: AI Intelligence
- Document pattern fingerprinting and auto-fill
- Smart signing reminders with escalation
- Contract risk detection (red/yellow/green)
- AI feedback agent (triage bugs/features → super admin)

### Phase 6-8: Leapfrog Features
- Document diff/version comparison
- Signing heat maps and behavioral analytics
- Real-time collaborative editing (Yjs/Automerge CRDT)
- Multi-language auto-translation
- Offline-first PWA signing
- Voice dictation
- Template marketplace with 70/30 revenue share

## Parallel Development

Two Cowork sessions run simultaneously:
1. **Session A (staging branch)**: Finishing editor bug fixes, signing flow, Stripe payments, testing
2. **Session B (feature/dashboard branch)**: Building the admin dashboard and white-label platform

They share the same backend and database. Dashboard adds new tables and API routes without touching existing ones. Merge path: feature/dashboard → staging → main.

## Pending / Future Work

- Finish lotuspuffs.com DNS setup (IONOS A record → 75.2.60.5)
- S3 document storage integration
- Admin dashboard Netlify deploy (separate site, e.g., admin.lotuspuffs.com)
- Build admin dashboard module — super admin page for users, accounting, revenue, customer data
- White-label client portals
- AI intelligence layer
- Merge staging → main after full testing
