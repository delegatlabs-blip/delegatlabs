import { AGENT_CATALOG, type AgentRecord, type AgentSlug } from "./agent-types";

const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_ADMIN_API_URL?: string } }).env?.VITE_ADMIN_API_URL) ||
  "http://localhost:8000/api/admin";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function listAgents(): Promise<AgentRecord[]> {
  return request<AgentRecord[]>("/agents");
}

export async function getAgent(id: string): Promise<AgentRecord | undefined> {
  try {
    return await request<AgentRecord>(`/agents/${id}`);
  } catch {
    return undefined;
  }
}

export async function createAgent(input: {
  name: string;
  slug: AgentSlug;
  description?: string;
  category?: string;
  status?: AgentRecord["status"];
  listing?: AgentRecord["listing"];
}): Promise<AgentRecord> {
  const catalog = AGENT_CATALOG[input.slug];
  return request<AgentRecord>("/agents", {
    method: "POST",
    body: JSON.stringify({
      name: input.name.trim() || catalog.label,
      slug: input.slug,
      description: input.description?.trim() || catalog.description,
      category: input.category?.trim() || catalog.category,
      version: catalog.version,
      status: input.status ?? "draft",
      listing: input.listing,
    }),
  });
}

export async function updateAgent(
  id: string,
  patch: Partial<Pick<AgentRecord, "name" | "description" | "category" | "status" | "listing" | "config">>,
): Promise<AgentRecord | undefined> {
  try {
    return await request<AgentRecord>(`/agents/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    });
  } catch {
    return undefined;
  }
}

export async function deleteAgent(id: string): Promise<boolean> {
  try {
    await request<void>(`/agents/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}
