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
  isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  // plan: free | starter | professional | enterprise
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
  orgId: uuid('org_id'), // nullable — personal docs have no org
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
  orgId: uuid('org_id'), // nullable — personal payments have no org
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

// ===== ORGANIZATIONS (White-Label Tenants) =====
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  ownerId: uuid('owner_id').notNull().references(() => users.id),
  plan: varchar('plan', { length: 50 }).default('free').notNull(),
  // plan: free | starter | professional | enterprise
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 20 }).default('#6366F1').notNull(),
  secondaryColor: varchar('secondary_color', { length: 20 }).default('#8B5CF6').notNull(),
  customDomain: varchar('custom_domain', { length: 255 }),
  emailFromName: varchar('email_from_name', { length: 255 }),
  footerText: varchar('footer_text', { length: 500 }).default('Powered by DocPix Studio').notNull(),
  settings: jsonb('settings').default({}).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_org_slug').on(table.slug),
  index('idx_org_owner_id').on(table.ownerId),
]);

// ===== ORG MEMBERS (RBAC) =====
export const orgMembers = pgTable('org_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 }).default('member').notNull(),
  // role: owner | admin | member | viewer
  invitedBy: uuid('invited_by').references(() => users.id),
  joinedAt: timestamp('joined_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_org_members_org_id').on(table.orgId),
  index('idx_org_members_user_id').on(table.userId),
]);

// ===== FEEDBACK (AI-Triaged) =====
export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  category: varchar('category', { length: 50 }).default('general').notNull(),
  // category: bug | feature_request | general | security
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  // priority: critical | high | medium | low
  message: text('message').notNull(),
  aiSummary: text('ai_summary'),
  status: varchar('status', { length: 20 }).default('new').notNull(),
  // status: new | acknowledged | in_progress | resolved | closed
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_feedback_org_id').on(table.orgId),
  index('idx_feedback_priority').on(table.priority),
  index('idx_feedback_status').on(table.status),
]);

// ===== DAILY REPORTS (Pre-Computed Summaries per Org) =====
export const dailyReports = pgTable('daily_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  reportDate: timestamp('report_date').notNull(),
  docsSent: integer('docs_sent').default(0).notNull(),
  docsSigned: integer('docs_signed').default(0).notNull(),
  docsPending: integer('docs_pending').default(0).notNull(),
  docsExpired: integer('docs_expired').default(0).notNull(),
  revenue: integer('revenue').default(0).notNull(), // cents
  newClients: integer('new_clients').default(0).notNull(),
  avgTimeToSign: integer('avg_time_to_sign').default(0).notNull(), // seconds
  errors: jsonb('errors').default([]).notNull(),
  aiSuggestions: integer('ai_suggestions').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_daily_reports_org_id').on(table.orgId),
  index('idx_daily_reports_date').on(table.reportDate),
]);

// ===== DOCUMENT PATTERNS (AI Learning) =====
export const documentPatterns = pgTable('document_patterns', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  fingerprint: text('fingerprint').notNull(), // text hash of document structure
  fieldPositions: jsonb('field_positions').default([]).notNull(),
  commonEdits: jsonb('common_edits').default([]).notNull(),
  frequency: integer('frequency').default(1).notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  confidence: real('confidence').default(0).notNull(), // 0.0 – 1.0
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_doc_patterns_org_id').on(table.orgId),
  index('idx_doc_patterns_fingerprint').on(table.fingerprint),
]);

// ===== SIGNING REMINDERS =====
export const signingReminders = pgTable('signing_reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  requestId: uuid('request_id').notNull().references(() => signatureRequests.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).default('auto').notNull(),
  // type: auto | manual | escalation
  channel: varchar('channel', { length: 20 }).default('email').notNull(),
  // channel: email | sms | in_app
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  recipientEmail: varchar('recipient_email', { length: 255 }).notNull(),
  message: text('message'),
  attempt: integer('attempt').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_reminders_request_id').on(table.requestId),
  index('idx_reminders_scheduled_at').on(table.scheduledAt),
]);

// ===== NOTIFICATION INBOX =====
export const notificationInbox = pgTable('notification_inbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  // type: document.signed | payment.received | reminder.sent | system.alert | feedback.new
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data'), // flexible payload (links, IDs, etc.)
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_notifications_user_id').on(table.userId),
  index('idx_notifications_read').on(table.read),
]);

// ===== VERIFICATION TOKENS =====
export const verificationTokens = pgTable('verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  type: varchar('type', { length: 30 }).notNull(),
  // type: email_verify | password_reset
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('idx_verification_token').on(table.token),
  index('idx_verification_user_id').on(table.userId),
]);

// ===== DOCUMENT PROTECTION =====
export const documentProtection = pgTable('document_protection', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),

  // Password protection
  userPassword: text('user_password'),        // password to OPEN the PDF (hashed)
  ownerPassword: text('owner_password'),      // password to EDIT the PDF (hashed)
  rawUserPassword: text('raw_user_password'), // encrypted for recovery/display (AES)
  rawOwnerPassword: text('raw_owner_password'),

  // Permission flags (what the user CAN'T do)
  disablePrinting: boolean('disable_printing').default(true).notNull(),
  disableCopying: boolean('disable_copying').default(true).notNull(),
  disableEditing: boolean('disable_editing').default(true).notNull(),
  disableAnnotations: boolean('disable_annotations').default(true).notNull(),
  disableFormFilling: boolean('disable_form_filling').default(true).notNull(),
  disableExtraction: boolean('disable_extraction').default(true).notNull(),

  // Watermark
  watermarkEnabled: boolean('watermark_enabled').default(false).notNull(),
  watermarkText: varchar('watermark_text', { length: 500 }),
  watermarkOpacity: real('watermark_opacity').default(0.15).notNull(),
  watermarkFontSize: integer('watermark_font_size').default(48).notNull(),
  watermarkColor: varchar('watermark_color', { length: 20 }).default('#888888').notNull(),
  watermarkAngle: real('watermark_angle').default(-45).notNull(),

  // Protection metadata
  protectedS3Key: text('protected_s3_key'),  // S3 key for protected version
  protectionAppliedAt: timestamp('protection_applied_at'),
  protectionMethod: varchar('protection_method', { length: 50 }).default('aes-256').notNull(),
  // method: aes-128 | aes-256 | rc4-128

  // Auto-protection settings
  autoProtected: boolean('auto_protected').default(false).notNull(), // was this auto-applied after signing?

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_doc_protection_document_id').on(table.documentId),
  index('idx_doc_protection_user_id').on(table.userId),
  index('idx_doc_protection_org_id').on(table.orgId),
]);

// ===== PROTECTION PRESETS (Org-Level Defaults) =====
export const protectionPresets = pgTable('protection_presets', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  isGlobal: boolean('is_global').default(false).notNull(), // super-admin global default

  // Auto-protect settings
  autoProtectAfterSigning: boolean('auto_protect_after_signing').default(true).notNull(),
  autoProtectEnabled: boolean('auto_protect_enabled').default(true).notNull(),

  // Default password behavior
  generateRandomPasswords: boolean('generate_random_passwords').default(true).notNull(),
  requireUserPassword: boolean('require_user_password').default(false).notNull(),
  requireOwnerPassword: boolean('require_owner_password').default(true).notNull(),

  // Default permissions
  disablePrinting: boolean('disable_printing').default(true).notNull(),
  disableCopying: boolean('disable_copying').default(true).notNull(),
  disableEditing: boolean('disable_editing').default(true).notNull(),
  disableAnnotations: boolean('disable_annotations').default(true).notNull(),
  disableFormFilling: boolean('disable_form_filling').default(true).notNull(),
  disableExtraction: boolean('disable_extraction').default(true).notNull(),

  // Default watermark
  watermarkEnabled: boolean('watermark_enabled').default(false).notNull(),
  watermarkText: varchar('watermark_text', { length: 500 }),
  watermarkOpacity: real('watermark_opacity').default(0.15).notNull(),

  // Encryption method
  protectionMethod: varchar('protection_method', { length: 50 }).default('aes-256').notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_protection_presets_org_id').on(table.orgId),
  index('idx_protection_presets_user_id').on(table.userId),
]);

// ===== PLATFORM SETTINGS =====
export const platformSettings = pgTable('platform_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('idx_platform_settings_key').on(table.key),
]);

// ===== TYPE EXPORTS =====
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type SignatureRequest = typeof signatureRequests.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type AuditEntry = typeof auditLog.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrgMember = typeof orgMembers.$inferSelect;
export type FeedbackEntry = typeof feedback.$inferSelect;
export type DailyReport = typeof dailyReports.$inferSelect;
export type DocumentPattern = typeof documentPatterns.$inferSelect;
export type SigningReminder = typeof signingReminders.$inferSelect;
export type Notification = typeof notificationInbox.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type DocumentProtection = typeof documentProtection.$inferSelect;
export type NewDocumentProtection = typeof documentProtection.$inferInsert;
export type ProtectionPreset = typeof protectionPresets.$inferSelect;
export type NewProtectionPreset = typeof protectionPresets.$inferInsert;
