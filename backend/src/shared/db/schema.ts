import { pgTable, text, timestamp, boolean, integer, real, jsonb, uuid, varchar, index } from 'drizzle-orm/pg-core';

// ===== USERS =====
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'), // null for Google OAuth users
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  companyName: varchar('company_name', { length: 255 }),
  companyLogo: text('company_logo_url'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_users_email').on(table.email),
  index('idx_users_google_id').on(table.googleId),
]);

// ===== SESSIONS (for refresh tokens) =====
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull().unique(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_sessions_user_id').on(table.userId),
  index('idx_sessions_refresh_token').on(table.refreshToken),
]);

// ===== DOCUMENTS =====
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 500 }).notNull(),
  originalFileName: varchar('original_file_name', { length: 500 }),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: integer('file_size'), // bytes
  s3Key: text('s3_key').notNull(),
  s3KeyOriginal: text('s3_key_original'), // original before conversion
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  // status: draft | sent | viewed | signed | paid | completed | archived
  pageCount: integer('page_count'),
  metadata: jsonb('metadata'), // flexible storage for doc-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_documents_user_id').on(table.userId),
  index('idx_documents_status').on(table.status),
]);

// ===== SIGNATURE REQUESTS =====
export const signatureRequests = pgTable('signature_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }),
  message: text('message'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  // status: pending | viewed | signed | declined | expired
  accessToken: text('access_token').notNull().unique(), // unique link for recipient
  deadline: timestamp('deadline'),
  signedAt: timestamp('signed_at'),
  viewedAt: timestamp('viewed_at'),
  signedDocumentS3Key: text('signed_document_s3_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_sig_requests_document_id').on(table.documentId),
  index('idx_sig_requests_sender_id').on(table.senderId),
  index('idx_sig_requests_access_token').on(table.accessToken),
  index('idx_sig_requests_status').on(table.status),
]);

// ===== SIGNATURE FIELDS (where to sign on the document) =====
export const signatureFields = pgTable('signature_fields', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull().references(() => signatureRequests.id, { onDelete: 'cascade' }),
  fieldType: varchar('field_type', { length: 50 }).notNull(),
  // fieldType: signature | initials | date | text | checkbox
  pageNumber: integer('page_number').notNull(),
  x: real('x').notNull(),
  y: real('y').notNull(),
  width: real('width').notNull(),
  height: real('height').notNull(),
  required: boolean('required').default(true).notNull(),
  label: varchar('label', { length: 255 }),
  aiDetected: boolean('ai_detected').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===== SIGNATURES (actual signature data) =====
export const signatures = pgTable('signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  fieldId: uuid('field_id').notNull().references(() => signatureFields.id, { onDelete: 'cascade' }),
  signerEmail: varchar('signer_email', { length: 255 }).notNull(),
  signerName: varchar('signer_name', { length: 255 }),
  signatureDataUrl: text('signature_data_url'), // base64 signature image
  signatureType: varchar('signature_type', { length: 20 }), // draw | type | upload
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  signedAt: timestamp('signed_at').defaultNow().notNull(),
});

// ===== PAYMENTS =====
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  creatorId: uuid('creator_id').notNull().references(() => users.id),
  amount: integer('amount').notNull(), // in cents
  currency: varchar('currency', { length: 3 }).default('usd').notNull(),
  description: text('description'),
  provider: varchar('provider', { length: 50 }).notNull(), // stripe | square
  providerPaymentId: text('provider_payment_id'),
  paymentLink: text('payment_link'),
  qrCodeUrl: text('qr_code_url'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  // status: pending | paid | failed | refunded | expired
  platformFee: integer('platform_fee'), // in cents
  payerEmail: varchar('payer_email', { length: 255 }),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_payments_document_id').on(table.documentId),
  index('idx_payments_status').on(table.status),
]);

// ===== AUDIT LOG =====
export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'set null' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 100 }).notNull(),
  // actions: document.created, document.converted, signature.requested, signature.signed,
  //          payment.created, payment.completed, document.viewed, document.downloaded
  actorEmail: varchar('actor_email', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_audit_document_id').on(table.documentId),
  index('idx_audit_user_id').on(table.userId),
  index('idx_audit_action').on(table.action),
]);

// ===== TEMPLATES =====
export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  s3Key: text('s3_key').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  signatureFields: jsonb('signature_fields'), // pre-defined field positions
  paymentConfig: jsonb('payment_config'), // pre-defined payment settings
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===== VERIFICATION TOKENS (email verify + password reset) =====
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // 'email_verify' | 'password_reset'
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_verification_token').on(table.token),
  index('idx_verification_user_id').on(table.userId),
]);

// ===== WHITE-LABEL BRANDING =====
export const brandingConfigs = pgTable('branding_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#6366f1').notNull(),
  secondaryColor: varchar('secondary_color', { length: 7 }).default('#8b5cf6').notNull(),
  accentColor: varchar('accent_color', { length: 7 }).default('#a78bfa'),
  customDomain: varchar('custom_domain', { length: 255 }),
  emailFromName: varchar('email_from_name', { length: 255 }),
  emailFooterText: text('email_footer_text'),
  signingPageTitle: varchar('signing_page_title', { length: 255 }),
  signingPageSubtitle: text('signing_page_subtitle'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===== SUBSCRIPTIONS (for $17/mo account fee tracking) =====
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  // plan: free | pro ($17/mo)
  status: varchar('status', { length: 50 }).default('active').notNull(),
  // status: active | past_due | canceled | trialing
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_subscriptions_user_id').on(table.userId),
  index('idx_subscriptions_stripe_customer').on(table.stripeCustomerId),
]);

// ===== TYPE EXPORTS =====
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type SignatureRequest = typeof signatureRequests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type BrandingConfig = typeof brandingConfigs.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
