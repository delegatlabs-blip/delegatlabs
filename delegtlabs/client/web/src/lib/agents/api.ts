import type { AgentQuery, PaginatedAgents } from "@/lib/agents/types";

/**
 * Browser-side reader for the agents API. Server components read the same data
 * through `src/server/agents/repository.ts` instead of calling themselves over HTTP.
 */
export async function fetchAgentsPage(
  query: AgentQuery,
  signal?: AbortSignal,
): Promise<PaginatedAgents> {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.pageSize !== undefined) params.set("pageSize", String(query.pageSize));
  if (query.q) params.set("q", query.q);
  if (query.featured !== undefined) params.set("featured", String(query.featured));

  const response = await fetch(`/api/agents?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load agents (${response.status})`);
  }
  return (await response.json()) as PaginatedAgents;
}
