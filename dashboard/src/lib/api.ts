/**
 * API client for the DocPix Studio Admin Dashboard.
 * Handles JWT auth, token refresh, and typed requests.
 */

import type {
  ApiResponse,
  ApiError,
  Organization,
  OrgDashboardData,
  OrgMemberDetail,
  OrgNotification,
  OrgMembership,
  DocumentRecord,
  DailyReport,
  Feedback,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  private accessToken: string | null = null;

  constructor() {
    this.accessToken = localStorage.getItem('admin_access_token');
  }

  setToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('admin_access_token', token);
  }

  clearToken() {
    this.accessToken = null;
    localStorage.removeItem('admin_access_token');
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const error: ApiError = {
        message: 'Request failed',
        status: res.status,
      };
      try {
        const body = await res.json();
        error.message = body.message || body.error || error.message;
        error.code = body.code;
      } catch {
        // ignore parse error
      }

      if (res.status === 401) {
        this.clearToken();
        window.location.href = '/login';
      }

      throw error;
    }

    return res.json();
  }

  // ── Auth ──
  async login(email: string, password: string) {
    const data = await this.request<{ accessToken: string; user: unknown }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.accessToken);
    return data;
  }

  // ── Admin Dashboard ──
  async getDashboardStats() {
    return this.request<ApiResponse<import('@/types').DashboardStats>>('/admin/dashboard/stats');
  }

  // ── Users ──
  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.search) query.set('search', params.search);
    return this.request<ApiResponse<import('@/types').User[]>>(`/admin/users?${query}`);
  }

  async getUser(id: string) {
    return this.request<ApiResponse<import('@/types').User>>(`/admin/users/${id}`);
  }

  async updateUser(id: string, data: { isActive?: boolean; plan?: string; isSuperAdmin?: boolean }) {
    return this.request<ApiResponse<import('@/types').User>>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Documents ──
  async getDocuments(params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return this.request<ApiResponse<import('@/types').DocumentRecord[]>>(`/admin/documents?${query}`);
  }

  // ── Revenue ──
  async getRevenue(params?: { period?: 'daily' | 'weekly' | 'monthly' | 'yearly' }) {
    const query = new URLSearchParams();
    if (params?.period) query.set('period', params.period);
    return this.request<ApiResponse<import('@/types').ChartSeries[]>>(`/admin/revenue?${query}`);
  }

  // ── Audit Log ──
  async getAuditLog(params?: { page?: number; limit?: number; action?: string; userId?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.action) query.set('action', params.action);
    if (params?.userId) query.set('userId', params.userId);
    return this.request<ApiResponse<import('@/types').AuditLogEntry[]>>(`/admin/audit-log?${query}`);
  }

  // ── Organizations ──
  async getOrganizations(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request<ApiResponse<import('@/types').Organization[]>>(`/admin/organizations?${query}`);
  }

  async createOrganization(data: { name: string; slug: string }) {
    return this.request<ApiResponse<import('@/types').Organization>>('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id: string, data: Partial<import('@/types').Organization>) {
    return this.request<ApiResponse<import('@/types').Organization>>(`/admin/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Feedback ──
  async getFeedback(params?: { page?: number; limit?: number; category?: string; priority?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    return this.request<ApiResponse<import('@/types').Feedback[]>>(`/admin/feedback?${query}`);
  }

  async updateFeedback(id: string, data: { status?: string; priority?: string }) {
    return this.request<ApiResponse<import('@/types').Feedback>>(`/admin/feedback/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ── Settings ──
  async updateSettings(data: Record<string, unknown>) {
    return this.request<ApiResponse<Record<string, unknown>>>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ── System Health ──
  async getSystemHealth() {
    return this.request<ApiResponse<{
      uptime: number;
      memoryUsage: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
      };
      nodeVersion: string;
      timestamp: string;
    }>>('/admin/system/health');
  }

  // ── Org Portal ──
  async getMyOrgs() {
    return this.request<ApiResponse<OrgMembership[]>>('/org/');
  }

  async getOrgDetails(slug: string) {
    return this.request<ApiResponse<Organization & { currentUserRole: string }>>(`/org/${slug}`);
  }

  async getOrgDashboard(slug: string) {
    return this.request<ApiResponse<OrgDashboardData>>(`/org/${slug}/dashboard`);
  }

  async getOrgDocuments(slug: string, params?: { page?: number; limit?: number; status?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return this.request<ApiResponse<DocumentRecord[]>>(`/org/${slug}/documents?${query}`);
  }

  async getOrgMembers(slug: string) {
    return this.request<ApiResponse<OrgMemberDetail[]>>(`/org/${slug}/members`);
  }

  async inviteOrgMember(slug: string, data: { email: string; name?: string; role?: string }) {
    return this.request<ApiResponse<unknown>>(`/org/${slug}/members/invite`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrgMemberRole(slug: string, userId: string, role: string) {
    return this.request<ApiResponse<unknown>>(`/org/${slug}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async removeOrgMember(slug: string, userId: string) {
    return this.request<ApiResponse<unknown>>(`/org/${slug}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async updateOrgBranding(slug: string, data: Partial<Organization>) {
    return this.request<ApiResponse<Organization>>(`/org/${slug}/branding`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateOrgSettings(slug: string, data: Record<string, unknown>) {
    return this.request<ApiResponse<Organization>>(`/org/${slug}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getOrgNotifications(slug: string, unread?: boolean) {
    const query = unread ? '?unread=true' : '';
    return this.request<ApiResponse<OrgNotification[]>>(`/org/${slug}/notifications${query}`);
  }

  async markNotificationRead(slug: string, notifId: string) {
    return this.request<ApiResponse<unknown>>(`/org/${slug}/notifications/${notifId}/read`, {
      method: 'PATCH',
    });
  }

  async submitFeedback(slug: string, data: { message: string; category?: string }) {
    return this.request<ApiResponse<Feedback>>(`/org/${slug}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createOrg(data: { name: string; slug: string }) {
    return this.request<ApiResponse<Organization>>('/org/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrgAnalytics(slug: string) {
    return this.request<ApiResponse<DailyReport[]>>(`/org/${slug}/analytics`);
  }
}

export const api = new ApiClient();
