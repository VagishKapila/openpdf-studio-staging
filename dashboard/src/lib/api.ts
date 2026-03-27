/**
 * API client for the DocPix Studio Admin Dashboard.
 * Handles JWT auth, token refresh, and typed requests.
 */

import type { ApiResponse, ApiError } from '@/types';

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

  // ── Feedback ──
  async getFeedback(params?: { page?: number; limit?: number; category?: string; priority?: string }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    return this.request<ApiResponse<import('@/types').Feedback[]>>(`/admin/feedback?${query}`);
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
}

export const api = new ApiClient();
