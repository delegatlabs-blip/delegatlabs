import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  AgentCreateInput,
  AgentRecord,
  AgentUpdateInput,
  LawyerAgentConfig,
  LinkedInAgentConfig,
} from "../types";
import { AGENT_CATALOG } from "../utils/catalog";
import { defaultConfigForSlug } from "../utils/config";
import { defaultListing } from "../utils/listing";
import {
  linkedInConfigToCreateData,
  lawyerConfigToCreateData,
} from "../utils/map-agent-config";
import {
  agentToCreateData,
  packsToCreateMany,
  plansToCreateMany,
  rowToAgent,
} from "../utils/map-agent-row";

type Tx = Prisma.TransactionClient;

const withRelations = {
  subscriptionPlans: { orderBy: { sortOrder: "asc" as const } },
  creditPacks: { orderBy: { sortOrder: "asc" as const } },
  linkedInConfig: true,
  lawyerConfig: true,
};

async function replacePlansAndPacks(tx: Tx, agentId: string, agent: AgentRecord) {
  const listing = agent.listing ?? defaultListing(agent.slug);
  await tx.adminAgentSubscriptionPlan.deleteMany({ where: { agentId } });
  await tx.adminAgentCreditPack.deleteMany({ where: { agentId } });
  const plans = plansToCreateMany(agentId, listing.subscriptionPlans ?? []);
  const packs = packsToCreateMany(agentId, listing.creditPacks ?? []);
  if (plans.length) await tx.adminAgentSubscriptionPlan.createMany({ data: plans });
  if (packs.length) await tx.adminAgentCreditPack.createMany({ data: packs });
}

async function upsertAgentConfig(tx: Tx, agent: AgentRecord) {
  if (agent.slug === "linkedin-agent") {
    await tx.adminAgentLawyerConfig.deleteMany({ where: { agentId: agent.id } });
    const data = linkedInConfigToCreateData(
      agent.id,
      agent.config as LinkedInAgentConfig,
    );
    await tx.adminAgentLinkedInConfig.upsert({
      where: { agentId: agent.id },
      create: data,
      update: data,
    });
    return;
  }

  await tx.adminAgentLinkedInConfig.deleteMany({ where: { agentId: agent.id } });
  const data = lawyerConfigToCreateData(agent.id, agent.config as LawyerAgentConfig);
  await tx.adminAgentLawyerConfig.upsert({
    where: { agentId: agent.id },
    create: data,
    update: data,
  });
}

export async function fetchAgents(): Promise<AgentRecord[]> {
  const rows = await prisma.adminAgent.findMany({
    orderBy: { updatedAt: "desc" },
    include: withRelations,
  });
  return rows.map(rowToAgent);
}

export async function fetchAgent(id: string): Promise<AgentRecord> {
  const row = await prisma.adminAgent.findUniqueOrThrow({
    where: { id },
    include: withRelations,
  });
  return rowToAgent(row);
}

export async function postAgent(input: AgentCreateInput): Promise<AgentRecord> {
  const catalog = AGENT_CATALOG[input.slug];
  const listing = input.listing ?? defaultListing(input.slug);
  const draft: AgentRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim() || catalog.label,
    slug: input.slug,
    description: input.description?.trim() || catalog.description,
    category: input.category?.trim() || catalog.category,
    version: catalog.version,
    status: input.status ?? "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    listing,
    config: defaultConfigForSlug(input.slug),
  };

  await prisma.$transaction(async (tx) => {
    await tx.adminAgent.create({ data: agentToCreateData(draft) });
    await replacePlansAndPacks(tx, draft.id, draft);
    await upsertAgentConfig(tx, draft);
  });

  return fetchAgent(draft.id);
}

export async function putAgent(id: string, patch: AgentUpdateInput): Promise<AgentRecord> {
  const current = await fetchAgent(id);
  const next: AgentRecord = {
    ...current,
    ...patch,
    listing: patch.listing ?? current.listing,
    config: patch.config ?? current.config,
    updatedAt: new Date().toISOString(),
  };
  const data = agentToCreateData(next);
  const { id: _id, ...updateData } = data;

  await prisma.$transaction(async (tx) => {
    await tx.adminAgent.update({ where: { id }, data: updateData });
    await replacePlansAndPacks(tx, id, next);
    await upsertAgentConfig(tx, next);
  });

  return fetchAgent(id);
}

export async function removeAgent(id: string): Promise<void> {
  await prisma.adminAgent.delete({ where: { id } });
}
