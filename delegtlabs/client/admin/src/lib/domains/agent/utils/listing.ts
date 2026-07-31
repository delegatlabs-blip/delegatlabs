import type {
  AgentListing,
  AgentSlug,
  CreditPack,
  SubscriptionPlan,
} from "../types";
import { newPlanId } from "./catalog";

export function defaultSubscriptionPlans(slug: AgentSlug): SubscriptionPlan[] {
  if (slug === "linkedin-agent") {
    return [
      {
        id: newPlanId(),
        name: "Starter",
        price: 49,
        currency: "USD",
        billingInterval: "monthly",
        features: ["AI post generation", "Lead scoring"],
        active: true,
      },
      {
        id: newPlanId(),
        name: "Growth",
        price: 99,
        currency: "USD",
        billingInterval: "monthly",
        features: ["Everything in Starter", "Auto-publish", "Priority queue"],
        active: true,
      },
    ];
  }
  return [
    {
      id: newPlanId(),
      name: "Legal Desk",
      price: 79,
      currency: "USD",
      billingInterval: "monthly",
      features: ["Guided intake", "Jurisdiction defaults"],
      active: true,
    },
  ];
}

export function defaultCreditPacks(slug: AgentSlug): CreditPack[] {
  if (slug === "linkedin-agent") {
    return [
      {
        id: newPlanId(),
        name: "100 credits",
        price: 29,
        currency: "USD",
        credits: 100,
        features: ["Post generation credits", "Lead enrichment credits"],
        active: true,
      },
    ];
  }
  return [
    {
      id: newPlanId(),
      name: "50 drafts",
      price: 39,
      currency: "USD",
      credits: 50,
      features: ["Draft generation credits", "Export included"],
      active: true,
    },
  ];
}

export function deriveListingPrice(
  listing: Pick<
    AgentListing,
    | "paymentType"
    | "subscriptionPlans"
    | "creditPacks"
    | "price"
    | "currency"
    | "billingInterval"
    | "planName"
  >,
): Pick<AgentListing, "price" | "currency" | "billingInterval" | "planName"> {
  if (listing.paymentType === "subscription") {
    const plan =
      listing.subscriptionPlans.find((p) => p.active) || listing.subscriptionPlans[0];
    if (plan) {
      return {
        price: plan.price,
        currency: plan.currency,
        billingInterval: plan.billingInterval,
        planName: plan.name,
      };
    }
  } else {
    const pack = listing.creditPacks.find((p) => p.active) || listing.creditPacks[0];
    if (pack) {
      return {
        price: pack.price,
        currency: pack.currency,
        billingInterval: "one-time",
        planName: pack.name,
      };
    }
  }
  return {
    price: listing.price,
    currency: listing.currency,
    billingInterval: listing.billingInterval,
    planName: listing.planName,
  };
}

export function defaultListing(slug: AgentSlug): AgentListing {
  const subscriptionPlans = defaultSubscriptionPlans(slug);
  const creditPacks = defaultCreditPacks(slug);
  const base =
    slug === "linkedin-agent"
      ? {
          redirectUrl: "https://app.delegatelabs.com/agents/linkedin",
          shortDescription:
            "PR posting, lead generation, and content automation for LinkedIn.",
          detailedDescription:
            "Automate LinkedIn growth with AI-written posts, lead scoring, and configurable publishing workflows. Ideal for B2B SaaS and agencies.",
          tags: ["LinkedIn", "Lead Gen", "Content", "Automation"],
          features: [
            "AI post generation",
            "Lead scoring & outreach",
            "News-driven content",
            "Approval or auto-publish",
          ],
        }
      : {
          redirectUrl: "https://app.delegatelabs.com/agents/lawyer",
          shortDescription: "Guided legal drafting with jurisdiction-aware templates.",
          detailedDescription:
            "Draft notices, agreements, and contracts with completeness checks, bilingual support, and firm-ready defaults.",
          tags: ["Legal", "Drafting", "Contracts", "Compliance"],
          features: [
            "Guided intake wizard",
            "Jurisdiction defaults",
            "Completeness checks",
            "Multi-language drafts",
          ],
        };

  const derived = deriveListingPrice({
    paymentType: "subscription",
    subscriptionPlans,
    creditPacks,
    price: 0,
    currency: "USD",
    billingInterval: "monthly",
    planName: "",
  });

  return {
    paymentType: "subscription",
    subscriptionPlans,
    creditPacks,
    ...derived,
    demoUrl: "",
    documentationUrl: "",
    featured: true,
    listedOnWebsite: true,
    ...base,
  };
}
