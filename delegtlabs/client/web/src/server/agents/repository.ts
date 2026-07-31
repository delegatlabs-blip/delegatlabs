import "server-only";

import type { Prisma } from "@prisma/client";

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type Agent,
  type AgentQuery,
  type PaginatedAgents,
} from "@/lib/agents/types";
import { prisma } from "@/lib/db";
import { rowToAgent } from "@/server/agents/map-row";

const publicWhere: Prisma.AdminAgentWhereInput = {
  listedOnWebsite: true,
  status: "active",
};

const withPlans = {
  subscriptionPlans: { orderBy: { sortOrder: "asc" as const } },
  creditPacks: { orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.AdminAgentInclude;

function clampInt(
  value: number | undefined,
  min: number,
  max: number,
  fallback: number,
) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function buildWhere(query: AgentQuery): Prisma.AdminAgentWhereInput {
  const term = query.q?.trim();
  const where: Prisma.AdminAgentWhereInput = { ...publicWhere };

  if (query.featured !== undefined) {
    where.featured = query.featured;
  }

  if (term) {
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { shortDescription: { contains: term, mode: "insensitive" } },
      { category: { contains: term, mode: "insensitive" } },
    ];
  }

  return where;
}

/**
 * Paginated read of listed, active agents from the database.
 * Callers never receive more than `pageSize` rows (capped by MAX_PAGE_SIZE).
 */
export async function listAgents(
  query: AgentQuery = {},
): Promise<PaginatedAgents> {
  const pageSize = clampInt(query.pageSize, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const where = buildWhere(query);

  const total = await prisma.adminAgent.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const page = clampInt(query.page, 1, Math.max(totalPages, 1), 1);
  const skip = total === 0 ? 0 : (page - 1) * pageSize;

  const rows = await prisma.adminAgent.findMany({
    where,
    include: withPlans,
    orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
    skip,
    take: pageSize,
  });

  return {
    items: rows.map(rowToAgent),
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 1 : totalPages,
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getAgentBySlug(slug: string): Promise<Agent | null> {
  const needle = slug.trim().toLowerCase();
  if (!needle) return null;

  const where: Prisma.AdminAgentWhereInput = {
    ...publicWhere,
    ...(UUID_RE.test(needle)
      ? { OR: [{ slug: needle }, { id: needle }] }
      : { slug: needle }),
  };

  const row = await prisma.adminAgent.findFirst({
    where,
    include: withPlans,
  });

  return row ? rowToAgent(row) : null;
}

/** Slugs for sitemap / static params — listed active agents only. */
export async function listAgentSlugs(): Promise<string[]> {
  const rows = await prisma.adminAgent.findMany({
    where: publicWhere,
    select: { slug: true },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((row) => row.slug);
}
