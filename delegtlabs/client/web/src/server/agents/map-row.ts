import "server-only";

import type {
  AdminAgent,
  AdminAgentCreditPack,
  AdminAgentSubscriptionPlan,
} from "@prisma/client";

import type { Accent, Agent, BillingInterval, Plan } from "@/lib/agents/types";

type AgentRow = AdminAgent & {
  subscriptionPlans?: AdminAgentSubscriptionPlan[];
  creditPacks?: AdminAgentCreditPack[];
};

const ACCENTS: Accent[] = ["blue", "yellow", "green", "red"];

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function accentFor(slug: string): Accent {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % ACCENTS.length;
  }
  return ACCENTS[hash] ?? "blue";
}

function asInterval(value: string): BillingInterval {
  if (value === "yearly" || value === "one-time") return value;
  return "monthly";
}

function imageForSlug(slug: string): string {
  if (slug.includes("linkedin")) return "/agents/linkedin-growth-agent.svg";
  if (slug.includes("content") || slug.includes("writer")) {
    return "/agents/content-writer-agent.svg";
  }
  if (slug.includes("lead")) return "/agents/lead-gen-agent.svg";
  if (slug.includes("support") || slug.includes("lawyer")) {
    return "/agents/support-reply-agent.svg";
  }
  return "/agents/linkedin-growth-agent.svg";
}

function iconFor(name: string): string {
  const source = name.trim();
  if (!source) return "◎";
  return source.charAt(0).toUpperCase();
}

function planNote(features: string[], fallback: string): string {
  if (features.length) return features.join(" · ");
  return fallback;
}

function mapSubscription(row: AdminAgentSubscriptionPlan): Plan {
  const features = asStringArray(row.features);
  return {
    id: row.id,
    name: row.name,
    note: planNote(features, row.name),
    price: Number(row.price),
    currency: row.currency || "USD",
    interval: asInterval(row.billingInterval),
  };
}

function mapCredit(row: AdminAgentCreditPack): Plan {
  const features = asStringArray(row.features);
  const creditNote =
    row.credits > 0 ? `${row.credits} credits` : row.name;
  return {
    id: row.id,
    name: row.name,
    note: planNote(features, creditNote),
    price: Number(row.price),
    currency: row.currency || "USD",
    interval: "one-time",
  };
}

/** Maps an admin_agents row (+ plans/packs) into the public marketplace Agent shape. */
export function rowToAgent(row: AgentRow): Agent {
  const tags = asStringArray(row.tags);
  const features = asStringArray(row.features);
  const short = row.shortDescription.trim() || row.description.trim();
  const details =
    row.detailedDescription.trim() || row.description.trim() || short;

  const subscription = (row.subscriptionPlans ?? [])
    .filter((plan) => plan.active)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapSubscription);

  const credit = (row.creditPacks ?? [])
    .filter((pack) => pack.active)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(mapCredit);

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    accent: accentFor(row.slug),
    icon: iconFor(row.name),
    imageUrl: imageForSlug(row.slug),
    category: row.category || "General",
    tag: tags.length ? tags.join(" · ") : row.category || "Agent",
    desc: short || "Specialist AI agent.",
    details: details || short || "Specialist AI agent.",
    caps: features,
    featured: row.featured,
    plans: { subscription, credit },
  };
}
