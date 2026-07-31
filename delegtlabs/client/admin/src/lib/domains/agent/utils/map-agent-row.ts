import { Prisma, type AdminAgent, type AdminAgentCreditPack, type AdminAgentSubscriptionPlan } from "@prisma/client";
import type {
  AdminAgentLinkedInConfig,
  AdminAgentLawyerConfig,
} from "@prisma/client";
import type {
  AgentListing,
  AgentRecord,
  AgentSlug,
  BillingInterval,
  CreditPack,
  PaymentType,
  SubscriptionPlan,
} from "../types";
import { defaultConfigForSlug } from "./config";
import { defaultListing } from "./listing";
import {
  linkedInRowToConfig,
  lawyerRowToConfig,
} from "./map-agent-config";

type AgentRow = AdminAgent & {
  subscriptionPlans?: AdminAgentSubscriptionPlan[];
  creditPacks?: AdminAgentCreditPack[];
  linkedInConfig?: AdminAgentLinkedInConfig | null;
  lawyerConfig?: AdminAgentLawyerConfig | null;
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function planRowToPlan(row: AdminAgentSubscriptionPlan): SubscriptionPlan {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    currency: row.currency || "USD",
    billingInterval: (row.billingInterval as BillingInterval) || "monthly",
    features: asStringArray(row.features),
    active: row.active,
  };
}

function packRowToPack(row: AdminAgentCreditPack): CreditPack {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    currency: row.currency || "USD",
    credits: row.credits,
    features: asStringArray(row.features),
    active: row.active,
  };
}

export function rowToAgent(row: AgentRow): AgentRecord {
  const slug = row.slug as AgentSlug;
  const plans = (row.subscriptionPlans ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(planRowToPlan);
  const packs = (row.creditPacks ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(packRowToPack);

  let config: AgentRecord["config"] = defaultConfigForSlug(slug);
  if (slug === "linkedin-agent" && row.linkedInConfig) {
    config = linkedInRowToConfig(row.linkedInConfig);
  } else if (slug === "lawyer-agent" && row.lawyerConfig) {
    config = lawyerRowToConfig(row.lawyerConfig);
  }

  const listing: AgentListing = {
    paymentType: (row.paymentType as PaymentType) || "subscription",
    subscriptionPlans: plans,
    creditPacks: packs,
    price: Number(row.price),
    currency: row.currency || "USD",
    billingInterval: (row.billingInterval as BillingInterval) || "monthly",
    planName: row.planName || "",
    redirectUrl: row.redirectUrl || "",
    demoUrl: row.demoUrl || "",
    documentationUrl: row.documentationUrl || "",
    shortDescription: row.shortDescription || "",
    detailedDescription: row.detailedDescription || "",
    tags: asStringArray(row.tags),
    features: asStringArray(row.features),
    featured: row.featured,
    listedOnWebsite: row.listedOnWebsite,
  };

  return {
    id: row.id,
    name: row.name,
    slug,
    description: row.description || listing.shortDescription,
    category: row.category || "",
    version: row.version || "1.0.0",
    status: (row.status as AgentRecord["status"]) || "draft",
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    listing,
    config,
  };
}

/** Agent scalar fields only — plans/packs/config written via relations. */
export function agentToCreateData(agent: AgentRecord) {
  const listing = agent.listing ?? defaultListing(agent.slug);
  return {
    id: agent.id,
    name: agent.name,
    slug: agent.slug,
    category: agent.category,
    status: agent.status,
    version: agent.version,
    description: agent.description,
    shortDescription: listing.shortDescription,
    detailedDescription: listing.detailedDescription,
    tags: listing.tags as Prisma.InputJsonValue,
    features: listing.features as Prisma.InputJsonValue,
    redirectUrl: listing.redirectUrl,
    demoUrl: listing.demoUrl,
    documentationUrl: listing.documentationUrl,
    paymentType: listing.paymentType,
    price: listing.price,
    currency: listing.currency,
    billingInterval: listing.billingInterval,
    planName: listing.planName,
    listedOnWebsite: listing.listedOnWebsite,
    featured: listing.featured,
  };
}

function asUuid(id: string | undefined): string {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  return crypto.randomUUID();
}

export function plansToCreateMany(agentId: string, plans: SubscriptionPlan[]) {
  return plans.map((p, index) => ({
    id: asUuid(p.id),
    agentId,
    name: p.name,
    price: p.price,
    currency: p.currency || "USD",
    billingInterval: p.billingInterval,
    features: p.features as Prisma.InputJsonValue,
    active: p.active,
    sortOrder: index,
  }));
}

export function packsToCreateMany(agentId: string, packs: CreditPack[]) {
  return packs.map((p, index) => ({
    id: asUuid(p.id),
    agentId,
    name: p.name,
    price: p.price,
    currency: p.currency || "USD",
    credits: p.credits,
    features: p.features as Prisma.InputJsonValue,
    active: p.active,
    sortOrder: index,
  }));
}
