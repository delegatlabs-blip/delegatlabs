import axios from 'axios';

/** Empty string in Docker (same-origin via nginx); localhost:8005 in local Vite dev. */
export const API_BASE =
  import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== null
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:8005';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 30000,
});

// =============================================
// Auth
// =============================================
export interface AuthStatus {
  connected: boolean;
  member_urn: string | null;
  display_name: string | null;
  email: string | null;
  expires_at: string | null;
  days_to_expiry: number | null;
  expiry_warning: boolean;
  expired: boolean;
  tenant_id?: string;
  destination_count?: number;
  enabled_publishable_count?: number;
}

export interface DisconnectResponse {
  ok: boolean;
  tenant_id: string;
  archived_destinations: number;
}

export const authApi = {
  status: () => api.get<AuthStatus>('/auth/status').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  /**
   * LinkedIn authorize URL. The backend decides intent from the session cookie:
   * signed out -> sign-in, signed in -> connect to the current workspace. The tenant
   * is never taken from the URL, so no tenant_id parameter is passed.
   */
  loginUrl: () => `${API_BASE}/auth/linkedin/login`,
  disconnect: () =>
    api.post<DisconnectResponse>('/auth/linkedin/disconnect').then((r) => r.data),
};

// =============================================
// Session — email OTP sign-in / sign-up
// =============================================
export interface SessionUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  needs_profile: boolean;
  providers: string[];
}

export interface TenantSummary {
  tenant_id: string;
  name: string;
  role: string;
}

export interface MeResponse {
  authenticated: boolean;
  user?: SessionUser | null;
  tenant?: TenantSummary | null;
  tenants: TenantSummary[];
}

export interface EmailStartResponse {
  ok: boolean;
  /** True when this address has no account yet — the UI then asks for a full name. */
  is_new: boolean;
  resend_in_seconds: number;
  dev_mode: boolean;
}

export interface SessionResponse {
  ok: boolean;
  user: SessionUser;
  tenant: TenantSummary;
  is_new_user: boolean;
}

export interface PasswordStatus {
  has_password: boolean;
}

export interface PasswordForgotResponse {
  ok: boolean;
  resend_in_seconds: number;
  dev_mode: boolean;
}

export const sessionApi = {
  me: () => api.get<MeResponse>('/auth/me').then((r) => r.data),
  startEmail: (email: string) =>
    api.post<EmailStartResponse>('/auth/email/start', { email }).then((r) => r.data),
  verifyEmail: (payload: { email: string; code: string; full_name?: string }) =>
    api.post<SessionResponse>('/auth/email/verify', payload).then((r) => r.data),
  completeProfile: (fullName: string) =>
    api.post<SessionResponse>('/auth/profile', { full_name: fullName }).then((r) => r.data),
  signOut: () => api.post<{ ok: boolean }>('/auth/signout').then((r) => r.data),

  // --- Password ---
  /** Everyday sign-in. Rejects with one message for every failure, by design. */
  loginPassword: (payload: { email: string; password: string }) =>
    api.post<SessionResponse>('/auth/password/login', payload).then((r) => r.data),
  /** Whether the signed-in user has a password yet; false for anonymous callers. */
  passwordStatus: () =>
    api.get<PasswordStatus>('/auth/password/status').then((r) => r.data),
  /** Last step of signup, and the change-password flow. current_password is required
   *  only when one is already set. */
  setPassword: (payload: { password: string; current_password?: string }) =>
    api.post<PasswordStatus>('/auth/password/set', payload).then((r) => r.data),
  /** Always resolves the same way whether or not the address exists. */
  forgotPassword: (email: string) =>
    api.post<PasswordForgotResponse>('/auth/password/forgot', { email }).then((r) => r.data),
  /** Redeems the reset code, sets the password, and signs the user in. */
  resetPassword: (payload: { email: string; code: string; password: string }) =>
    api.post<SessionResponse>('/auth/password/reset', payload).then((r) => r.data),
};

// =============================================
// Posts
// =============================================
export type PostStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'published'
  | 'partial'
  | 'failed'
  | 'rejected';

export interface Post {
  id: number;
  topic_id: number | null;
  topic_name: string | null;
  topic_slug: string | null;
  source_url: string | null;
  prompt_text: string | null;
  generated_text: string;
  image_prompt: string | null;
  image_url: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  linkedin_post_urn: string | null;
  rejection_reason: string | null;
  latest_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  limit: number;
  offset: number;
}

export const postsApi = {
  list: (params?: { status?: string; topicId?: number; from?: string; to?: string; limit?: number; offset?: number }) =>
    api.get<PostsResponse>('/posts', { params }).then((r) => r.data),

  get: (id: number) => api.get<Post>(`/posts/${id}`).then((r) => r.data),

  generate: (params?: { topicId?: number; sourceUrl?: string; skipImage?: boolean }) =>
    api.post<Post>('/posts/generate', params).then((r) => r.data),

  patch: (id: number, data: Partial<Pick<Post, 'generated_text' | 'image_url' | 'source_url' | 'scheduled_at'>>) =>
    api.patch<Post>(`/posts/${id}`, data).then((r) => r.data),

  approve: (id: number) => api.post<Post>(`/posts/${id}/approve`).then((r) => r.data),

  reject: (id: number, reason?: string) =>
    api.post<Post>(`/posts/${id}/reject`, { reason }).then((r) => r.data),

  publish: (id: number) =>
    api.post<PublishFanoutResponse>(`/posts/${id}/publish`).then((r) => r.data),

  regenerateImage: (id: number) => api.post<Post>(`/posts/${id}/regenerate-image`).then((r) => r.data),

  delete: (id: number) => api.delete(`/posts/${id}`).then((r) => r.data),

  manualPublish: (formData: FormData) =>
    api
      .post<PublishFanoutResponse>('/posts/manual', formData, {
        timeout: 120000,
      })
      .then((r) => r.data),

  repost: (id: number) =>
    api
      .post<PublishFanoutResponse>(`/posts/${id}/repost`, null, {
        timeout: 120000,
      })
      .then((r) => r.data),
};

export interface PublishDestinationResult {
  destination_id: string;
  destination_kind: 'personal' | 'organization';
  author_urn: string;
  display_name: string;
  post_id: number;
  status: string;
  linkedin_post_urn: string | null;
  error: string | null;
}

export interface PublishFanoutResponse {
  ok: boolean;
  source_post_id?: number;
  source_status?: PostStatus | string;
  results?: PublishDestinationResult[];
  post?: Post;
  linkedin_post_urn?: string;
}

/** Brief human summary of multi-destination publish outcomes. */
export function summarizePublishResults(data: PublishFanoutResponse): string {
  if (data.results?.length) {
    return data.results
      .map((r) => {
        if (r.status === 'published' || r.status === 'skipped_already_published') {
          return `${r.display_name || r.destination_kind}: ok`;
        }
        return `${r.display_name || r.destination_kind}: ${r.error || r.status}`;
      })
      .join(' · ');
  }
  if (data.source_status) return `Status: ${data.source_status}`;
  return 'Published';
}

// =============================================
// Topics
// =============================================

export interface Topic {
  id: number;
  name: string;
  slug: string;
  weight: number;
  is_active: boolean;
  published_count: number;
  avg_score: number | null;
  created_at: string;
  updated_at: string;
}

export const topicsApi = {
  list: () =>
    api.get<Topic[] | { detail?: string }>("/topics").then((r) => {
      const data = r.data;
      return Array.isArray(data) ? data : [];
    }),
  patch: (id: number, data: Partial<Pick<Topic, "weight" | "is_active" | "name">>) =>
    api.patch<Topic>(`/topics/${id}`, data).then((r) => r.data),
};

// =============================================
// Performance
// =============================================

export interface PerformanceSummary {
  topicSummary: {
    id: number;
    name: string;
    slug: string;
    weight: number;
    published_count: number;
    avg_score: number | null;
    max_score: number | null;
    total_likes: number;
    total_comments: number;
    total_shares: number;
  }[];
  timeSeries: {
    topic_slug: string;
    topic_name: string;
    week: string;
    avg_score: number;
    data_points: number;
  }[];
  recentPosts: {
    id: number;
    generated_text: string;
    published_at: string;
    linkedin_post_urn: string | null;
    topic_name: string;
    topic_slug: string;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    score: number | null;
    data_source: 'api' | 'manual' | null;
    score_recorded_at: string | null;
  }[];
}

export const performanceApi = {
  summary: () => api.get<PerformanceSummary>('/performance/summary').then((r) => r.data),
  submitManual: (data: { postId: number; likes: number; comments: number; shares: number; impressions?: number }) =>
    api.post('/performance/manual', data).then((r) => r.data),
};

// =============================================
// Settings
// =============================================

export type Settings = Record<string, { value: string; description: string }>;

export const settingsApi = {
  get: () => api.get<Settings>('/settings').then((r) => r.data),
  patch: (updates: Record<string, string>) => api.patch('/settings', updates).then((r) => r.data),
};

// =============================================
// Onboarding
// =============================================

export interface OnboardingAnswers {
  industries: string[];
  targetAudience: string;
  contentGoal: string;
  tone: string;
  contentFormats: string[];
  /** Set by subscription module, not onboarding UI */
  postingFrequency?: string;
  topicsOfInterest: string[];
  opinionStyle: string;
  trendingNews: string;
  postLength: string;
  ctaUsage: string;
  emojiUsage: string;
  styleReference?: string;
}

export interface AdaptiveQuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface AdaptiveQuestion {
  id: string;
  category: string;
  profileFieldsTargeted: string[];
  title: string;
  description?: string;
  type: "single_select" | "multi_select" | "short_text" | "long_text" | "scale" | "ranking";
  options?: AdaptiveQuestionOption[];
  allowOther?: boolean;
  otherPlaceholder?: string;
  required?: boolean;
  importance?: number;
  estimatedEffort?: number;
  generatedBy?: "system" | "ai";
}

export interface AdaptiveState {
  status: "in_progress" | "completed";
  coverage: number;
  questionsAnswered: number;
  currentQuestion: AdaptiveQuestion | null;
  canGoBack: boolean;
  complete: boolean;
  aiUsed?: boolean;
  latencyMs?: number | null;
}

export interface OnboardingGetResponse {
  answers: OnboardingAnswers | Record<string, unknown> | null;
  answered_ids?: string[];
  resume_from_index?: number | null;
  adaptive?: AdaptiveState;
  profile?: {
    profession?: string | null;
    primaryDomain?: string | null;
    specialty?: string | null;
    coverage?: number;
  };
}

export const onboardingApi = {
  get: () => api.get<OnboardingGetResponse>("/onboarding").then((r) => r.data),

  submit: (answers: OnboardingAnswers) =>
    api
      .post<{ ok: boolean; post?: Post; answers: OnboardingAnswers }>("/onboarding", answers)
      .then((r) => r.data),

  saveAnswer: (questionId: string, value: string | string[] | unknown) =>
    api.put("/onboarding/answer", { questionId, value }).then((r) => r.data),

  adaptiveAnswer: (questionId: string, value: unknown) =>
    api
      .post<OnboardingGetResponse>("/onboarding/adaptive/answer", { questionId, value })
      .then((r) => r.data),

  adaptiveBack: () =>
    api.post<OnboardingGetResponse>("/onboarding/adaptive/back").then((r) => r.data),

  adaptiveReset: () =>
    api.post<OnboardingGetResponse>("/onboarding/adaptive/reset").then((r) => r.data),

  adaptiveComplete: () =>
    api
      .post<{ ok: boolean; post?: Post; postError?: string | null } & OnboardingGetResponse>(
        "/onboarding/adaptive/complete",
      )
      .then((r) => r.data),
};

// =============================================
// Admin Auth
// =============================================

export const adminAuthApi = {
  me: () =>
    api
      .get<{ ok: boolean; user_id: string; role: string; dev_mode?: boolean }>('/auth/admin-me')
      .then((r) => r.data)
      .catch(() => null),
  login: (password: string) =>
    api.post<{ ok: boolean; role: string }>('/auth/admin-login', { password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
};

// =============================================
// Admin (platform)
// =============================================

export interface CatalogPlan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  agent_kind: string;
  tier: string;
  price_inr_minor: number;
  price_usd_minor: number;
  billing_period: string;
  monthly_credits: number;
  daily_text: number;
  daily_image: number;
  weekly_image: number;
  rollover_months: number;
  seats: number;
  linkedin_accounts: number;
  features: string[];
  badge: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogPack {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_inr_minor: number;
  price_usd_minor: number;
  credits: number;
  bonus_credits: number;
  total_credits: number;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CatalogActionCost {
  id: string;
  action_key: string;
  label: string;
  description: string | null;
  agent_kind: string;
  credits: number;
  is_active: boolean;
  sort_order: number;
  updated_at: string;
}

export interface CatalogEnvelope {
  plans: CatalogPlan[];
  packs: CatalogPack[];
  action_costs: CatalogActionCost[];
}

export interface AdminUserWorkspace {
  tenant_id: string;
  name: string;
  role: string;
  credits_remaining: number;
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: "pending" | "active" | "suspended";
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  providers: string[];
  workspaces: AdminUserWorkspace[];
}

export type CatalogPlanWrite = Partial<
  Omit<CatalogPlan, "id" | "created_at" | "updated_at" | "price_inr_minor" | "price_usd_minor">
> & {
  code?: string;
  name?: string;
  price_inr_minor?: number;
  price_usd_minor?: number;
};

export type CatalogPackWrite = Partial<
  Omit<CatalogPack, "id" | "created_at" | "updated_at" | "total_credits" | "price_inr_minor" | "price_usd_minor">
> & {
  code?: string;
  name?: string;
  credits?: number;
  price_inr_minor?: number;
  price_usd_minor?: number;
};

export type CatalogActionCostWrite = Partial<
  Omit<CatalogActionCost, "id" | "updated_at">
> & {
  action_key?: string;
  label?: string;
  credits?: number;
};

export const adminApi = {
  users: (params?: { q?: string }) =>
    api.get<{ users: AdminUser[] }>("/admin/users", { params }).then((r) => r.data),
  updateUserStatus: (userId: string, status: "active" | "suspended") =>
    api.patch<AdminUser>(`/admin/users/${userId}`, { status }).then((r) => r.data),
  tenants: (params?: { q?: string; industry?: string; status?: string }) =>
    api.get("/admin/tenants", { params }).then((r) => r.data),
  tenant: (id: string) => api.get(`/admin/tenants/${id}`).then((r) => r.data),
  updateSubscription: (tenantId: string, agentKind: string, data: { tier?: string; status?: string }) =>
    api.patch(`/admin/tenants/${tenantId}/subscriptions/${agentKind}`, data).then((r) => r.data),
  adjustCredits: (tenantId: string, data: { amount: number; reason: string }) =>
    api.post(`/admin/tenants/${tenantId}/credits`, data).then((r) => r.data),
  rollbackConfig: (tenantId: string, agentKind: string, version: number) =>
    api.post(`/admin/tenants/${tenantId}/configs/${agentKind}/rollback`, { version }).then((r) => r.data),
  compliance: () => api.get("/admin/compliance").then((r) => r.data),
  upsertCompliance: (body: Record<string, unknown>) =>
    api.post("/admin/compliance", body).then((r) => r.data),
  approvals: (params?: { tenant_id?: string; agent_kind?: string; status?: string }) =>
    api.get("/admin/approvals", { params }).then((r) => r.data),
  decideApproval: (id: string, data: { status: string; reason?: string }) =>
    api.post(`/admin/approvals/${id}/decide`, data).then((r) => r.data),
  staff: () => api.get("/admin/staff").then((r) => r.data),
  upsertStaff: (body: Record<string, unknown>) => api.post("/admin/staff", body).then((r) => r.data),
  auditLog: (params?: { limit?: number; tenant_id?: string }) =>
    api.get("/admin/audit-log", { params }).then((r) => r.data),
  platformKeys: () =>
    api.get<{ keys: Record<string, { configured: boolean }> }>("/admin/platform-keys").then((r) => r.data),
  catalog: () => api.get<CatalogEnvelope>("/admin/catalog").then((r) => r.data),
  createPlan: (body: CatalogPlanWrite) =>
    api.post<CatalogPlan>("/admin/catalog/plans", body).then((r) => r.data),
  updatePlan: (planId: string, body: CatalogPlanWrite) =>
    api.patch<CatalogPlan>(`/admin/catalog/plans/${planId}`, body).then((r) => r.data),
  createPack: (body: CatalogPackWrite) =>
    api.post<CatalogPack>("/admin/catalog/packs", body).then((r) => r.data),
  updatePack: (packId: string, body: CatalogPackWrite) =>
    api.patch<CatalogPack>(`/admin/catalog/packs/${packId}`, body).then((r) => r.data),
  createActionCost: (body: CatalogActionCostWrite) =>
    api.post<CatalogActionCost>("/admin/catalog/action_costs", body).then((r) => r.data),
  updateActionCost: (actionCostId: string, body: CatalogActionCostWrite) =>
    api
      .patch<CatalogActionCost>(`/admin/catalog/action_costs/${actionCostId}`, body)
      .then((r) => r.data),
};

// =============================================
// Admin Posts (cross-tenant)
// =============================================

export const adminPostsApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api
      .get<{ posts: Post[]; total: number }>('/admin/posts', { params })
      .then((r) => r.data),
};

// =============================================
// Tenant dashboard
// =============================================

export type DestinationKind = 'personal' | 'organization';
export type ConnectionHealth = 'green' | 'yellow' | 'red' | 'pending';

export interface LinkedInConnection {
  connected: boolean;
  member_urn: string | null;
  display_name: string | null;
  email: string | null;
  expires_at: string | null;
  health: ConnectionHealth | string;
  last_synced_at: string | null;
}

export interface LinkedInDestination {
  id: string;
  destination_kind: DestinationKind;
  author_urn: string;
  display_name: string;
  is_enabled: boolean;
  can_publish: boolean;
  role: string | null;
  health: ConnectionHealth | string;
  last_synced_at: string | null;
  archived_at: string | null;
}

export interface LinkedInConnectionsSection {
  connection: LinkedInConnection;
  destinations: LinkedInDestination[];
  synced_at?: string;
  /** Present after sync when LinkedIn denied organization ACL (e.g. missing product/scope). */
  acl_error?: string | null;
  organization_count?: number;
}

export interface TenantConnectionsResponse {
  linkedin: LinkedInConnectionsSection;
  integrations: Record<string, unknown>[];
}

export interface TenantCredits {
  balance: number;
  usage: unknown[];
}

export const tenantApi = {
  catalog: () => api.get<CatalogEnvelope>("/tenant/catalog").then((r) => r.data),
  credits: () => api.get<TenantCredits>("/tenant/credits").then((r) => r.data),
  agentConfig: (kind: string) => api.get(`/tenant/agents/${kind}/config`).then((r) => r.data),
  saveConfig: (kind: string, config: unknown) =>
    api.post(`/tenant/agents/${kind}/config`, { config }).then((r) => r.data),
  safeLimits: () => api.get("/tenant/agents/lead-gen/safe-limits").then((r) => r.data),
  connections: () =>
    api.get<TenantConnectionsResponse>("/tenant/connections").then((r) => r.data),
  syncLinkedIn: () =>
    api
      .post<LinkedInConnectionsSection>("/tenant/connections/linkedin/sync")
      .then((r) => r.data),
  patchDestination: (id: string, body: { is_enabled: boolean }) =>
    api
      .patch<LinkedInDestination>(
        `/tenant/connections/linkedin/destinations/${encodeURIComponent(id)}`,
        body,
      )
      .then((r) => r.data),
  testIntegration: (provider: string) =>
    api.post(`/tenant/connections/integrations/${provider}/test`).then((r) => r.data),
};
