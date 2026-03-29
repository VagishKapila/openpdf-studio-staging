/**
 * DocPix Studio â API Client
 * Handles all backend communication: auth, convert, documents, esign, payments, org.
 * Modular design â each backend route group has a corresponding client module.
 */

const DPStudioAPI = (() => {
  // ===== CONFIG =====
  const API_BASE = window.DPSTUDIO_API_BASE || 'https://dpstudio-backend-production.up.railway.app';
  const TOKEN_KEY = 'dpstudio_access_token';
  const REFRESH_KEY = 'dpstudio_refresh_token';
  const USER_KEY = 'dpstudio_user';

  // ===== TOKEN MANAGEMENT =====
  function getAccessToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getRefreshToken() {
    return localStorage.getItem(REFRESH_KEY);
  }

  function setTokens(accessToken, refreshToken) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  }

  function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getStoredUser() {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  }

  function setStoredUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // ===== CORE FETCH WRAPPER =====
  async function request(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { ...options.headers };

    // Auto-attach auth header unless explicitly skipped
    if (options.auth !== false) {
      const token = getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    // Auto-set Content-Type for JSON bodies
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try token refresh once
    if (res.status === 401 && options.auth !== false && !options._retried) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return request(path, { ...options, _retried: true });
      }
      // Refresh failed â user is logged out
      clearTokens();
      _dispatchAuthChange(null);
      throw new APIError('Session expired. Please log in again.', 401);
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new APIError(data.error || data.message || `Request failed (${res.status})`, res.status, data);
    }

    return data;
  }

  async function tryRefreshToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  // ===== CUSTOM ERROR =====
  class APIError extends Error {
    constructor(message, status, data) {
      super(message);
      this.name = 'APIError';
      this.status = status;
      this.data = data;
    }
  }

  // ===== AUTH EVENT SYSTEM =====
  const _authListeners = [];

  function onAuthChange(fn) {
    _authListeners.push(fn);
    return () => {
      const idx = _authListeners.indexOf(fn);
      if (idx > -1) _authListeners.splice(idx, 1);
    };
  }

  function _dispatchAuthChange(user) {
    _authListeners.forEach(fn => fn(user));
  }

  // ===== AUTH MODULE =====
  const auth = {
    async register(email, password, name) {
      const data = await request('/auth/register', {
        method: 'POST',
        body: { email, password, name },
        auth: false,
      });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setStoredUser(data.user);
      _dispatchAuthChange(data.user);
      return data;
    },

    async login(email, password) {
      const data = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
        auth: false,
      });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setStoredUser(data.user);
      _dispatchAuthChange(data.user);
      return data;
    },

    async loginWithGoogle(idToken) {
      const data = await request('/auth/google', {
        method: 'POST',
        body: { idToken },
        auth: false,
      });
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setStoredUser(data.user);
      _dispatchAuthChange(data.user);
      return data;
    },

    async getProfile() {
      const data = await request('/auth/me');
      setStoredUser(data.user);
      return data.user;
    },

    async updateProfile(updates) {
      const data = await request('/auth/me', {
        method: 'PATCH',
        body: updates,
      });
      setStoredUser(data.user);
      _dispatchAuthChange(data.user);
      return data.user;
    },

    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch { /* ignore */ }
      clearTokens();
      _dispatchAuthChange(null);
    },

    getUser() {
      return getStoredUser();
    },

    isLoggedIn() {
      return !!getAccessToken();
    },

    async verifyEmail(token) {
      return request('/auth/verify-email', {
        method: 'POST',
        body: { token },
        auth: false,
      });
    },

    async resendVerification(email) {
      return request('/auth/resend-verification', {
        method: 'POST',
        body: { email },
        auth: false,
      });
    },

    async forgotPassword(email) {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: { email },
        auth: false,
      });
    },

    async resetPassword(token, password) {
      return request('/auth/reset-password', {
        method: 'POST',
        body: { token, password },
        auth: false,
      });
    },
  };

  // ===== CONVERT MODULE =====
  const convert = {
    async getFormats() {
      return request('/convert/formats', { auth: false });
    },

    async uploadAndConvert(file, targetFormat) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetFormat', targetFormat);
      return request('/convert/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async getDocument(docId) {
      return request(`/convert/documents/${docId}`);
    },

    async getDocuments() {
      return request('/convert/documents');
    },

    async downloadConverted(docId) {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/convert/documents/${docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new APIError('Download failed', res.status);
      return res.blob();
    },
  };

  // ===== DOCUMENTS MODULE (for future cloud save / marketplace) =====
  const documents = {
    async list(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return request(`/documents${qs ? '?' + qs : ''}`);
    },

    async get(id) {
      return request(`/documents/${id}`);
    },

    async upload(file, metadata = {}) {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(metadata).forEach(([k, v]) => formData.append(k, v));
      return request('/documents', {
        method: 'POST',
        body: formData,
      });
    },

    async update(id, updates) {
      return request(`/documents/${id}`, {
        method: 'PATCH',
        body: updates,
      });
    },

    async delete(id) {
      return request(`/documents/${id}`, { method: 'DELETE' });
    },

    async getDownloadUrl(id) {
      return request(`/documents/${id}/download-url`);
    },
  };

  // ===== MARKETPLACE MODULE (future - scaffolded now) =====
  const marketplace = {
    async listListings(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return request(`/marketplace/listings${qs ? '?' + qs : ''}`);
    },

    async getListing(id) {
      return request(`/marketplace/listings/${id}`);
    },

    async createListing(data) {
      return request('/marketplace/listings', {
        method: 'POST',
        body: data,
      });
    },

    async updateListing(id, data) {
      return request(`/marketplace/listings/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },

    async getSellerDashboard() {
      return request('/marketplace/dashboard');
    },

    async getEarnings(period = '30d') {
      return request(`/marketplace/earnings?period=${period}`);
    },

    async getSalesHistory(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return request(`/marketplace/sales${qs ? '?' + qs : ''}`);
    },
  };

  // ===== ESIGN MODULE =====
  const esign = {
    async prepare(file, options = {}) {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(options).forEach(([k, v]) => formData.append(k, String(v)));
      return request('/esign/prepare', {
        method: 'POST',
        body: formData,
      });
    },

    async detectFields(documentId) {
      return request(`/esign/detect-fields`, {
        method: 'POST',
        body: { documentId },
      });
    },

    async getRequest(id) {
      return request(`/esign/${id}`);
    },

    async saveFields(id, fields) {
      return request(`/esign/${id}/fields`, {
        method: 'POST',
        body: { fields },
      });
    },

    async sign(id, signatureData) {
      return request(`/esign/${id}/sign`, {
        method: 'POST',
        body: signatureData,
      });
    },

    async finalize(id, options = {}) {
      return request(`/esign/${id}/finalize`, {
        method: 'POST',
        body: options,
      });
    },
  };

  // ===== PAYMENTS MODULE =====
  const payments = {
    async getConfig() {
      return request('/payments/config');
    },

    async createCheckout(documentId, amount, description, currency = 'usd') {
      return request('/payments/create-checkout', {
        method: 'POST',
        body: { documentId, amount, description, currency },
      });
    },

    async getStatus(paymentId) {
      return request(`/payments/${paymentId}`);
    },

    async getByDocument(documentId) {
      return request(`/payments/document/${documentId}`);
    },
  };

  // ===== ORG MODULE =====
  const org = {
    async create(name, slug) {
      return request('/org', {
        method: 'POST',
        body: { name, slug },
      });
    },

    async getDashboard(slug) {
      return request(`/org/${slug}/dashboard`);
    },

    async updateBranding(slug, branding) {
      return request(`/org/${slug}/branding`, {
        method: 'PATCH',
        body: branding,
      });
    },

    async getMembers(slug) {
      return request(`/org/${slug}/members`);
    },

    async inviteMember(slug, email, role = 'member') {
      return request(`/org/${slug}/members/invite`, {
        method: 'POST',
        body: { email, role },
      });
    },

    async getAnalytics(slug) {
      return request(`/org/${slug}/analytics`);
    },

    async submitFeedback(slug, message, category = 'general') {
      return request(`/org/${slug}/feedback`, {
        method: 'POST',
        body: { message, category },
      });
    },
  };

  // ===== DASHBOARD MODULE =====
  const dashboard = {
    async getStats() {
      return request('/dashboard/stats');
    },

    async getDocuments(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return request(`/dashboard/documents${qs ? '?' + qs : ''}`);
    },

    async getPayments(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return request(`/dashboard/payments${qs ? '?' + qs : ''}`);
    },

    async getContacts() {
      return request('/dashboard/contacts');
    },

    async getActivity(limit = 20) {
      return request(`/dashboard/activity?limit=${limit}`);
    },
  };

  // ===== ADMIN MODULE =====
  const admin = {
    async getBranding() {
      return request('/admin/branding');
    },

    async updateBranding(config) {
      return request('/admin/branding', {
        method: 'PUT',
        body: config,
      });
    },

    async createBillingPortal() {
      return request('/admin/billing-portal', { method: 'POST' });
    },

    async subscribe() {
      return request('/admin/subscribe', { method: 'POST', body: {} });
    },
  };

  // ===== PUBLIC API =====
  return {
    auth,
    convert,
    documents,
    marketplace,
    esign,
    payments,
    org,
    dashboard,
    admin,
    onAuthChange,
    APIError,
    // Expose for debugging
    _getApiBase: () => API_BASE,
  };
})();
