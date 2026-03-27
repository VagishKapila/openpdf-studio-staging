/**
 * React Query hooks for the DocPix Studio Admin Dashboard.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  DashboardStats, User, DocumentRecord, AuditLogEntry,
  Organization, Feedback, ChartSeries, ApiResponse,
  OrgDashboardData, OrgMemberDetail, OrgNotification, OrgMembership, DailyReport,
} from '@/types';

// ── Dashboard ──
export function useDashboardStats() {
  return useQuery<ApiResponse<DashboardStats>>({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => api.getDashboardStats(),
    refetchInterval: 60_000,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => api.getSystemHealth(),
    refetchInterval: 30_000,
  });
}

// ── Users ──
export function useUsers(params: { page: number; limit: number; search: string }) {
  return useQuery<ApiResponse<User[]>>({
    queryKey: ['users', params],
    queryFn: () => api.getUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string | null) {
  return useQuery<ApiResponse<User>>({
    queryKey: ['users', id],
    queryFn: () => api.getUser(id!),
    enabled: !!id,
  });
}

// ── Documents ──
export function useDocuments(params: { page: number; limit: number; status: string }) {
  return useQuery<ApiResponse<DocumentRecord[]>>({
    queryKey: ['documents', params],
    queryFn: () => api.getDocuments(params),
    placeholderData: (prev) => prev,
  });
}

// ── Revenue ──
export function useRevenue(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
  return useQuery<ApiResponse<ChartSeries[]>>({
    queryKey: ['revenue', period],
    queryFn: () => api.getRevenue({ period }),
  });
}

// ── Audit Log ──
export function useAuditLog(params: { page: number; limit: number; action: string; userId: string }) {
  return useQuery<ApiResponse<AuditLogEntry[]>>({
    queryKey: ['audit-log', params],
    queryFn: () => api.getAuditLog(params),
    placeholderData: (prev) => prev,
  });
}

// ── Organizations ──
export function useOrganizations(params: { page: number; limit: number }) {
  return useQuery<ApiResponse<Organization[]>>({
    queryKey: ['organizations', params],
    queryFn: () => api.getOrganizations(params),
    placeholderData: (prev) => prev,
  });
}

// ── Feedback ──
export function useFeedback(params: { page: number; limit: number; category: string; priority: string }) {
  return useQuery<ApiResponse<Feedback[]>>({
    queryKey: ['feedback', params],
    queryFn: () => api.getFeedback(params),
    placeholderData: (prev) => prev,
  });
}

// ── Mutations ──

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { isActive?: boolean; plan?: string; isSuperAdmin?: boolean } }) =>
      api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status?: string; priority?: string } }) =>
      api.updateFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Organization> }) =>
      api.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    },
  });
}

// ── Portal Hooks ──

export function useMyOrgs() {
  return useQuery<ApiResponse<OrgMembership[]>>({
    queryKey: ['my-orgs'],
    queryFn: () => api.getMyOrgs(),
  });
}

export function useOrgDashboard(slug: string) {
  return useQuery<ApiResponse<OrgDashboardData>>({
    queryKey: ['org', slug, 'dashboard'],
    queryFn: () => api.getOrgDashboard(slug),
    enabled: !!slug,
    refetchInterval: 60_000,
  });
}

export function useOrgDocuments(slug: string, params: { page: number; limit: number; status: string }) {
  return useQuery<ApiResponse<DocumentRecord[]>>({
    queryKey: ['org', slug, 'documents', params],
    queryFn: () => api.getOrgDocuments(slug, params),
    enabled: !!slug,
    placeholderData: (prev) => prev,
  });
}

export function useOrgMembers(slug: string) {
  return useQuery<ApiResponse<OrgMemberDetail[]>>({
    queryKey: ['org', slug, 'members'],
    queryFn: () => api.getOrgMembers(slug),
    enabled: !!slug,
  });
}

export function useOrgNotifications(slug: string) {
  return useQuery<ApiResponse<OrgNotification[]>>({
    queryKey: ['org', slug, 'notifications'],
    queryFn: () => api.getOrgNotifications(slug),
    enabled: !!slug,
    refetchInterval: 30_000,
  });
}

export function useOrgAnalytics(slug: string) {
  return useQuery<ApiResponse<DailyReport[]>>({
    queryKey: ['org', slug, 'analytics'],
    queryFn: () => api.getOrgAnalytics(slug),
    enabled: !!slug,
  });
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { email: string; name?: string; role?: string } }) =>
      api.inviteOrgMember(slug, data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org', vars.slug, 'members'] });
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, userId, role }: { slug: string; userId: string; role: string }) =>
      api.updateOrgMemberRole(slug, userId, role),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org', vars.slug, 'members'] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, userId }: { slug: string; userId: string }) =>
      api.removeOrgMember(slug, userId),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org', vars.slug, 'members'] });
    },
  });
}

export function useUpdateOrgBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<Organization> }) =>
      api.updateOrgBranding(slug, data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org', vars.slug] });
    },
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string }) =>
      api.createOrg(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orgs'] });
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: { message: string; category?: string } }) =>
      api.submitFeedback(slug, data),
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['org', vars.slug] });
    },
  });
}
