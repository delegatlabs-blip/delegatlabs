export type RegisteredAgent = {
  slug: string;
  name: string;
  category: string;
  version: string;
  admin_route?: string;
  user_route?: string;
  worker_schedule?: string;
  capabilities: string[];
  status?: string;
  description?: string;
  base_price_usd?: number;
  base_price_inr?: number;
  price_usd?: number;
  price_inr?: number;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRegisteredAgents(): Promise<RegisteredAgent[]> {
  const res = await fetch("/api/web/agents/registered");
  return parseJson<RegisteredAgent[]>(res);
}

export async function fetchCheckoutCatalog() {
  const res = await fetch("/api/web/public/checkout/catalog");
  return parseJson<{
    plans: Array<{
      id: string;
      name: string;
      price_usd: number;
      price_inr: number;
      max_agents: number;
      features: string[];
    }>;
    agents: RegisteredAgent[];
  }>(res);
}

export async function createCheckoutSession(payload: {
  plan_id?: string;
  agent_slugs: string[];
  email: string;
  currency?: string;
}) {
  const res = await fetch("/api/web/public/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ session_id: string; checkout_url: string }>(res);
}

export async function fetchUserDashboard() {
  const res = await fetch("/api/user/dashboard");
  return parseJson<{
    client_name: string;
    plan_name: string;
    renewal_date: string;
    total_monthly_spend: number;
    purchased_agents: Array<{
      slug: string;
      name: string;
      category: string;
      status: string;
      monthly_price: number;
      connected: boolean;
      user_route?: string;
      capabilities?: string[];
      worker_schedule?: string;
    }>;
    aggregate_metrics: Record<string, number>;
  }>(res);
}

export async function userAgentFetch<T>(slug: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/user/agents/${slug}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return parseJson<T>(res);
}

export async function adminAgentFetch<T>(slug: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin/agents/${slug}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  return parseJson<T>(res);
}
