const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const ADMIN_API_PREFIX = "/api/admin";

export type VersionInfo = {
  app_name: string;
  app_version: string;
  api_version: string;
  api_prefix: string;
  environment: string;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type Agent = {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_price_inr: string;
  base_price_usd: string;
  billing_unit: string;
  status: string;
  version: number;
  description?: string | null;
};

export type Plan = {
  id: string;
  name: string;
  price_inr: string;
  price_usd: string;
  billing_cycle: string;
  max_agents: number;
  max_posts_per_month: number;
  is_custom: boolean;
  included_agents: Array<{ id: string; agent_id: string; included_quota?: number | null; override_price?: string | null }>;
};

export type Client = {
  id: string;
  org_name: string;
  owner_email: string;
  status: string;
  region?: string | null;
  plan_name?: string | null;
  active_agents?: number;
  monthly_spend_inr?: string;
  last_activity?: string;
};

export type Subscription = {
  id: string;
  client_id: string;
  plan_id: string;
  started_at: string;
  renews_at: string;
  status: string;
  stripe_subscription_id?: string | null;
};

export type AuditRow = {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const dummyAgents: Agent[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "LinkedIn Growth Agent",
    slug: "linkedin-agent",
    category: "linkedin",
    description: "PR posting, founder content, and B2B lead generation.",
    base_price_inr: "19999.00",
    base_price_usd: "250.00",
    billing_unit: "flat_monthly",
    status: "active",
    version: 2,
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Lawyer Drafting Agent",
    slug: "lawyer-agent",
    category: "legal",
    description: "Guided AI legal drafting for Indian advocates — catalog, intake, generate, preview.",
    base_price_inr: "24999.00",
    base_price_usd: "299.00",
    billing_unit: "flat_monthly",
    status: "active",
    version: 1,
  },
];

const dummyPlans: Plan[] = [
  {
    id: "aaaa1111-1111-4111-8111-111111111111",
    name: "Starter",
    price_inr: "29999.00",
    price_usd: "359.00",
    billing_cycle: "monthly",
    max_agents: 2,
    max_posts_per_month: 40,
    is_custom: false,
    included_agents: [
      { id: "pa111111-1111-4111-8111-111111111111", agent_id: dummyAgents[0].id, included_quota: 20 },
      { id: "pa222222-2222-4222-8222-222222222222", agent_id: dummyAgents[3].id, included_quota: 20 },
    ],
  },
  {
    id: "bbbb2222-2222-4222-8222-222222222222",
    name: "Growth",
    price_inr: "89999.00",
    price_usd: "1099.00",
    billing_cycle: "monthly",
    max_agents: 5,
    max_posts_per_month: 160,
    is_custom: false,
    included_agents: [
      { id: "pa333333-3333-4333-8333-333333333333", agent_id: dummyAgents[0].id, included_quota: 60 },
      { id: "pa444444-4444-4444-8444-444444444444", agent_id: dummyAgents[1].id, included_quota: 40 },
      { id: "pa555555-5555-4555-8555-555555555555", agent_id: dummyAgents[3].id, included_quota: 60 },
    ],
  },
  {
    id: "cccc3333-3333-4333-8333-333333333333",
    name: "Scale",
    price_inr: "199999.00",
    price_usd: "2399.00",
    billing_cycle: "monthly",
    max_agents: 12,
    max_posts_per_month: 500,
    is_custom: false,
    included_agents: dummyAgents
      .filter((agent) => agent.status !== "deprecated")
      .map((agent, index) => ({
        id: `pa-scale-${index}`,
        agent_id: agent.id,
        included_quota: 100,
      })),
  },
  {
    id: "dddd4444-4444-4444-8444-444444444444",
    name: "Enterprise",
    price_inr: "0.00",
    price_usd: "0.00",
    billing_cycle: "annual",
    max_agents: 25,
    max_posts_per_month: 2000,
    is_custom: true,
    included_agents: dummyAgents.map((agent, index) => ({
      id: `pa-enterprise-${index}`,
      agent_id: agent.id,
      included_quota: null,
    })),
  },
];

const dummyClients: Client[] = [
  {
    id: "c1111111-1111-4111-8111-111111111111",
    org_name: "Nova Retail Co.",
    owner_email: "maya@novaretail.example",
    status: "active",
    region: "India",
    plan_name: "Growth",
    active_agents: 4,
    monthly_spend_inr: "89999.00",
    last_activity: "2026-07-07",
  },
  {
    id: "c2222222-2222-4222-8222-222222222222",
    org_name: "BlueOrbit SaaS",
    owner_email: "arjun@blueorbit.example",
    status: "trial",
    region: "United States",
    plan_name: "Starter",
    active_agents: 2,
    monthly_spend_inr: "0.00",
    last_activity: "2026-07-06",
  },
  {
    id: "c3333333-3333-4333-8333-333333333333",
    org_name: "Kosha Wellness",
    owner_email: "nisha@koshawellness.example",
    status: "active",
    region: "India",
    plan_name: "Scale",
    active_agents: 7,
    monthly_spend_inr: "199999.00",
    last_activity: "2026-07-08",
  },
  {
    id: "c4444444-4444-4444-8444-444444444444",
    org_name: "BrightJob Hub",
    owner_email: "ops@brightjobhub.example",
    status: "suspended",
    region: "United Kingdom",
    plan_name: "Growth",
    active_agents: 0,
    monthly_spend_inr: "89999.00",
    last_activity: "2026-06-28",
  },
  {
    id: "c5555555-5555-4555-8555-555555555555",
    org_name: "Delegt Labs Demo",
    owner_email: "admin@delegtlabs.example",
    status: "active",
    region: "Singapore",
    plan_name: "Enterprise",
    active_agents: 5,
    monthly_spend_inr: "0.00",
    last_activity: "2026-07-08",
  },
];

const dummyPriceHistory: Record<string, Array<{ changed_at: string; old_price: string; new_price: string }>> = {
  [dummyAgents[0].id]: [
    { changed_at: "2026-05-01T10:00:00.000Z", old_price: "9999.00", new_price: "12999.00" },
    { changed_at: "2026-06-15T10:00:00.000Z", old_price: "12999.00", new_price: "14999.00" },
  ],
  [dummyAgents[1].id]: [
    { changed_at: "2026-04-20T10:00:00.000Z", old_price: "7999.00", new_price: "9999.00" },
  ],
};

function withListFallback<T>(requestPromise: Promise<T[]>, fallbackRows: T[]) {
  return requestPromise.then((rows) => (rows.length > 0 ? rows : fallbackRows)).catch(() => fallbackRows);
}

function filterDummyAgents(params?: { category?: string; status?: string }) {
  return dummyAgents.filter((agent) => {
    const matchesCategory = params?.category ? agent.category === params.category : true;
    const matchesStatus = params?.status ? agent.status === params.status : true;
    return matchesCategory && matchesStatus;
  });
}

function filterDummyClients(params?: { search?: string; status?: string }) {
  const search = params?.search?.toLowerCase().trim();
  return dummyClients.filter((client) => {
    const matchesSearch = search
      ? client.org_name.toLowerCase().includes(search) || client.owner_email.toLowerCase().includes(search)
      : true;
    const matchesStatus = params?.status ? client.status === params.status : true;
    return matchesSearch && matchesStatus;
  });
}

function getDummyClientDetail(id: string) {
  const client = dummyClients.find((item) => item.id === id);
  if (!client) return null;

  const plan = dummyPlans.find((item) => item.name === client.plan_name) ?? dummyPlans[0];
  const activeAgentCount = client.active_agents ?? 0;

  return {
    client,
    active_subscription:
      client.status === "suspended"
        ? null
        : {
            plan_id: plan.id,
            status: client.status === "trial" ? "trial" : "active",
            renews_at: "2026-08-08T00:00:00.000Z",
          },
    active_agents: dummyAgents.slice(0, activeAgentCount).map((agent, index) => ({
      id: `client-agent-${id}-${index}`,
      agent_id: agent.id,
      status: "active",
    })),
    usage_summary: {
      active_agents: activeAgentCount,
      active_subscription: client.status === "suspended" ? 0 : 1,
    },
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }

  return response.json() as Promise<T>;
}

export const adminApi = {
  getVersion: () => request<VersionInfo>("/version"),
  health: () =>
    request<{ status: string; surface: string }>(`${ADMIN_API_PREFIX}/health`),
  listTenants: () => request<Tenant[]>(`${ADMIN_API_PREFIX}/tenants`),
  listAgents: (params?: { category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set("category", params.category);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return withListFallback(
      request<Agent[]>(`${ADMIN_API_PREFIX}/agents${query ? `?${query}` : ""}`),
      filterDummyAgents(params)
    );
  },
  getAgent: (id: string) =>
    request<Agent>(`${ADMIN_API_PREFIX}/agents/${id}`).catch((error) => {
      const agent = dummyAgents.find((item) => item.id === id);
      if (agent) return agent;
      throw error;
    }),
  createAgent: (payload: Partial<Agent>) =>
    request<Agent>(`${ADMIN_API_PREFIX}/agents`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAgent: (id: string, payload: Partial<Agent>) =>
    request<Agent>(`${ADMIN_API_PREFIX}/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAgent: (id: string) =>
    request<void>(`${ADMIN_API_PREFIX}/agents/${id}`, { method: "DELETE" }).catch((error) => {
      if (dummyAgents.some((agent) => agent.id === id)) return;
      throw error;
    }),
  getAgentPriceHistory: (id: string) =>
    request<Array<{ changed_at: string; old_price: string; new_price: string }>>(
      `${ADMIN_API_PREFIX}/agents/${id}/price-history`
    ).catch((error) => {
      if (dummyAgents.some((agent) => agent.id === id)) return dummyPriceHistory[id] ?? [];
      throw error;
    }),
  listPlans: () => withListFallback(request<Plan[]>(`${ADMIN_API_PREFIX}/plans`), dummyPlans),
  createPlan: (payload: Record<string, unknown>) =>
    request<Plan>(`${ADMIN_API_PREFIX}/plans`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updatePlan: (id: string, payload: Record<string, unknown>) =>
    request<Plan>(`${ADMIN_API_PREFIX}/plans/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deletePlan: (id: string) =>
    request<void>(`${ADMIN_API_PREFIX}/plans/${id}`, { method: "DELETE" }),
  listClients: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return withListFallback(
      request<Client[]>(`${ADMIN_API_PREFIX}/clients${query ? `?${query}` : ""}`),
      filterDummyClients(params)
    );
  },
  getClient: (id: string) =>
    request<Record<string, unknown>>(`${ADMIN_API_PREFIX}/clients/${id}`).catch((error) => {
      const detail = getDummyClientDetail(id);
      if (detail) return detail;
      throw error;
    }),
  setClientStatus: (id: string, status: string) =>
    request<Client>(`${ADMIN_API_PREFIX}/clients/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  impersonateClient: (id: string) =>
    request<{ token: string; expires_in_seconds: number }>(`${ADMIN_API_PREFIX}/clients/${id}/impersonate`, {
      method: "POST",
    }).catch((error) => {
      if (dummyClients.some((client) => client.id === id)) {
        return { token: `dummy-impersonation-token-${id}`, expires_in_seconds: 600 };
      }
      throw error;
    }),
  getClientSubscription: (id: string) =>
    request<Subscription | null>(`${ADMIN_API_PREFIX}/clients/${id}/subscription`),
  assignClientSubscription: (id: string, payload: Record<string, unknown>) =>
    request<Subscription>(`${ADMIN_API_PREFIX}/clients/${id}/subscription`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClientSubscription: (id: string, payload: Record<string, unknown>) =>
    request<Subscription>(`${ADMIN_API_PREFIX}/clients/${id}/subscription`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  cancelClientSubscription: (id: string) =>
    request<{ cancelled: boolean }>(`${ADMIN_API_PREFIX}/clients/${id}/subscription`, {
      method: "DELETE",
    }),
  addClientAgent: (id: string, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(`${ADMIN_API_PREFIX}/clients/${id}/agents`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateClientAgent: (id: string, agentId: string, payload: Record<string, unknown>) =>
    request<Record<string, unknown>>(`${ADMIN_API_PREFIX}/clients/${id}/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteClientAgent: (id: string, agentId: string) =>
    request<{ deleted: boolean }>(`${ADMIN_API_PREFIX}/clients/${id}/agents/${agentId}`, {
      method: "DELETE",
    }),
  listAuditLog: (params?: { admin_user_id?: string; target_type?: string; start_date?: string; end_date?: string }) => {
    const q = new URLSearchParams();
    if (params?.admin_user_id) q.set("admin_user_id", params.admin_user_id);
    if (params?.target_type) q.set("target_type", params.target_type);
    if (params?.start_date) q.set("start_date", params.start_date);
    if (params?.end_date) q.set("end_date", params.end_date);
    const query = q.toString();
    return request<AuditRow[]>(`${ADMIN_API_PREFIX}/audit-log${query ? `?${query}` : ""}`);
  },
};
