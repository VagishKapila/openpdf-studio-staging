// ═══════════════════════════════════════════════
// Core types for the DocPix Studio Admin Dashboard
// ═══════════════════════════════════════════════

// ── User ──
export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  googleId: string | null;
  avatar: string | null;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Organization (White-Label Tenant) ──
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string | null;
  emailFromName: string | null;
  footerText: string;
  settings: Record<string, unknown>;
  stripeCustomerId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  orgId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitedBy: string | null;
  joinedAt: string | null;
  createdAt: string;
  user?: User;
}

// ── Document & Signing ──
export interface DocumentRecord {
  id: string;
  userId: string;
  orgId: string | null;
  name: string;
  fileName?: string;
  originalFileName?: string;
  type: string;
  s3Key: string | null;
  size: number;
  fileSize?: number;
  pageCount?: number;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'paid' | 'completed' | 'archived';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  senderId: string;
  status: 'pending' | 'completed' | 'declined' | 'expired';
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Payment ──
export interface Payment {
  id: string;
  userId: string;
  orgId: string | null;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  plan: string | null;
  createdAt: string;
}

// ── AI: Document Patterns ──
export interface DocumentPattern {
  id: string;
  orgId: string;
  name: string;
  fingerprint: string;
  fieldPositions: Record<string, unknown>[];
  commonEdits: Record<string, unknown>[];
  frequency: number;
  lastSeenAt: string;
  confidence: number;
  createdAt: string;
}

// ── Signing Reminders ──
export interface SigningReminder {
  id: string;
  requestId: string;
  orgId: string;
  type: 'auto' | 'manual' | 'escalation';
  channel: 'email' | 'sms' | 'in_app';
  scheduledAt: string;
  sentAt: string | null;
  recipientEmail: string;
  message: string;
  attempt: number;
  createdAt: string;
}

// ── Daily Reports ──
export interface DailyReport {
  id: string;
  orgId: string;
  reportDate: string;
  docsSent: number;
  docsSigned: number;
  docsPending: number;
  docsExpired: number;
  revenue: number;
  newClients: number;
  avgTimeToSign: number;
  errors: Record<string, unknown>[];
  aiSuggestions: number;
  createdAt: string;
}

// ── Feedback ──
export interface Feedback {
  id: string;
  orgId: string;
  userId: string;
  category: 'bug' | 'feature_request' | 'general' | 'security';
  priority: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  aiSummary: string | null;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

// ── Audit Log ──
export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
  user?: User;
}

// ── Dashboard Stats ──
export interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  totalDocuments: number;
  documentsSigned: number;
  documentsPending: number;
  signatureCompletionRate: number;
  avgTurnaroundTime: number;
  totalRevenue: number;
  revenueThisMonth: number;
  paymentSuccessRate: number;
  monthlyChurnRate: number;
  totalOrganizations: number;
  activeOrganizations: number;
  errorRate: number;
  apiLatencyP95: number;
}

// ── KPI Card ──
export interface KPICard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
  drillDownPath?: string;
}

// ── Chart Data ──
export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: TimeSeriesPoint[];
  color?: string;
}

// ── API Response ──
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// ── Org Portal Types ──
export interface OrgDashboardData {
  organization: Organization;
  currentUserRole: 'owner' | 'admin' | 'member' | 'viewer';
  documents: {
    total: number;
    signed: number;
    pending: number;
    draft: number;
  };
  memberCount: number;
  revenue?: {
    total: number;
    thisMonth: number;
  };
}

export interface OrgMemberDetail {
  id: string;
  userId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string;
  userAvatar: string | null;
}

export interface OrgNotification {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}

export interface OrgMembership {
  org: Organization;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string | null;
}
