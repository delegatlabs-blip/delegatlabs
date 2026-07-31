import "server-only";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Agent,
  type AgentQuery,
  type PaginatedAgents,
} from "@/lib/agents/types";
import { agentCatalog } from "@/server/agents/data";

function clampInt(value: number | undefined, min: number, max: number, fallback: number) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function matchesSearch(agent: Agent, term: string) {
  const haystack = [agent.name, agent.desc, agent.category, agent.tag, ...agent.caps]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

/**
 * Paginated read of the public catalog. Callers never receive the full list,
 * so the payload stays flat no matter how large the catalog grows.
 */
export function listAgents(query: AgentQuery = {}): PaginatedAgents {
  const pageSize = clampInt(query.pageSize, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const term = query.q?.trim().toLowerCase() ?? "";

  let matched = agentCatalog;
  if (term) matched = matched.filter((agent) => matchesSearch(agent, term));
  if (query.featured !== undefined) {
    matched = matched.filter((agent) => agent.featured === query.featured);
  }

  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = clampInt(query.page, 1, totalPages, 1);
  const start = (page - 1) * pageSize;

  return {
    items: matched.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}

export function getAgentBySlug(slug: string): Agent | null {
  const needle = slug.trim().toLowerCase();
  return (
    agentCatalog.find((agent) => agent.slug === needle || agent.id === needle) ?? null
  );
}

/** Slugs for static generation and the sitemap. */
export function listAgentSlugs(): string[] {
  return agentCatalog.map((agent) => agent.slug);
}
