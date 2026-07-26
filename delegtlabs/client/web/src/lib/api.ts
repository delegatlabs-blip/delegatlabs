/** Marketplace agent payload from `/web/api/v1/agents` */
export type ApiAgentListing = {
  paymentType: "subscription" | "credit";
  price: number;
  currency: string;
  billingInterval: string;
  planName: string;
  redirectUrl: string;
  demoUrl: string;
  documentationUrl: string;
  shortDescription: string;
  detailedDescription: string;
  tags: string[];
  features: string[];
  featured: boolean;
  listedOnWebsite: boolean;
  subscriptionPlans: Array<{ name: string; price: number; currency: string; active: boolean }>;
  creditPacks: Array<{ name: string; price: number; credits: number; currency: string; active: boolean }>;
};

export type ApiAgent = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  listing: ApiAgentListing;
};

const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_WEB_API_URL?: string } }).env?.VITE_WEB_API_URL) ||
  "http://localhost:8000/web/api/v1";

export async function fetchPublicAgents(): Promise<ApiAgent[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error(`Failed to load agents (${res.status})`);
  return res.json();
}

export async function fetchPublicAgent(ref: string): Promise<ApiAgent> {
  const res = await fetch(`${API_BASE}/agents/${encodeURIComponent(ref)}`);
  if (!res.ok) throw new Error(`Failed to load agent (${res.status})`);
  return res.json();
}
