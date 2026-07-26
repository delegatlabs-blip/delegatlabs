export type AgentSlug = "linkedin-agent" | "lawyer-agent";
export type AgentStatus = "active" | "paused" | "draft";
export type BillingInterval = "monthly" | "yearly" | "one-time";
export type PaymentType = "subscription" | "credit";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingInterval: BillingInterval;
  features: string[];
  active: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  currency: string;
  credits: number;
  features: string[];
  active: boolean;
}

/** Website / marketplace listing fields visible to customers */
export interface AgentListing {
  paymentType: PaymentType;
  subscriptionPlans: SubscriptionPlan[];
  creditPacks: CreditPack[];
  /** Derived display helpers from the first active plan/pack */
  price: number;
  currency: string;
  billingInterval: BillingInterval;
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
}

function planId() {
  return `plan_${Math.random().toString(36).slice(2, 9)}`;
}

export function defaultSubscriptionPlans(slug: AgentSlug): SubscriptionPlan[] {
  if (slug === "linkedin-agent") {
    return [
      {
        id: planId(),
        name: "Starter",
        price: 49,
        currency: "USD",
        billingInterval: "monthly",
        features: ["AI post generation", "Lead scoring"],
        active: true,
      },
      {
        id: planId(),
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
      id: planId(),
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
        id: planId(),
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
      id: planId(),
      name: "50 drafts",
      price: 39,
      currency: "USD",
      credits: 50,
      features: ["Draft generation credits", "Export included"],
      active: true,
    },
  ];
}

export function deriveListingPrice(listing: Pick<
  AgentListing,
  "paymentType" | "subscriptionPlans" | "creditPacks" | "price" | "currency" | "billingInterval" | "planName"
>): Pick<AgentListing, "price" | "currency" | "billingInterval" | "planName"> {
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

export const defaultListing = (slug: AgentSlug): AgentListing => {
  const subscriptionPlans = defaultSubscriptionPlans(slug);
  const creditPacks = defaultCreditPacks(slug);
  const base =
    slug === "linkedin-agent"
      ? {
          redirectUrl: "https://app.delegatelabs.com/agents/linkedin",
          shortDescription: "PR posting, lead generation, and content automation for LinkedIn.",
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
};

export interface LinkedInAgentConfig {
  lead_gen: {
    target_job_titles: string[];
    industries: string[];
    company_size: string[];
    geography: string[];
    target_audience: string;
    score_threshold: number;
    connection_message_template: string;
    daily_connection_cap: number;
  };
  post_gen: {
    content_pillars: string[];
    post_types: string[];
    topic_weights: Record<string, number>;
    news_sources: string[];
    tone: string;
    posting_frequency: string;
    approval_mode: "auto_publish" | "review_first";
    image_quality: "standard" | "high" | "ultra";
    image_style: string;
    ai_model: "gpt-4o" | "gpt-4.1" | "claude-sonnet" | "gemini-pro" | "mock";
    user_instructions: string;
  };
}

export interface LawyerAgentConfig {
  jurisdiction: string;
  ui_language: "en" | "hi";
  draft_language: "en" | "hi";
  ai_provider: "mock" | "openai" | "gemini" | "claude";
  firm_name: string;
  practice_areas: string[];
  user_instructions: string;
}

export type AgentConfigMap = {
  "linkedin-agent": LinkedInAgentConfig;
  "lawyer-agent": LawyerAgentConfig;
};

export interface AgentRecord {
  id: string;
  name: string;
  slug: AgentSlug;
  description: string;
  category: string;
  version: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
  listing: AgentListing;
  config: LinkedInAgentConfig | LawyerAgentConfig;
}

export const AGENT_CATALOG: Record<
  AgentSlug,
  { label: string; category: string; description: string; version: string }
> = {
  "linkedin-agent": {
    label: "LinkedIn Growth Agent",
    category: "linkedin",
    description: "PR posting, lead generation, and content automation for LinkedIn.",
    version: "2.0.0",
  },
  "lawyer-agent": {
    label: "Lawyer Drafting Agent",
    category: "legal",
    description: "Guided legal drafting with jurisdiction-aware templates.",
    version: "1.0.0",
  },
};

export const defaultLinkedInConfig = (): LinkedInAgentConfig => ({
  lead_gen: {
    target_job_titles: ["VP Marketing", "Chief Marketing Officer", "Head of Growth"],
    industries: ["Software", "Information Technology", "Internet"],
    company_size: ["51-200 employees", "201-500 employees"],
    geography: ["United States", "India"],
    target_audience: "B2B SaaS decision makers and growth leaders",
    score_threshold: 70,
    connection_message_template:
      "Hi {{first_name}}, I noticed your work in {{industry}} at {{company}}. Would love to connect!",
    daily_connection_cap: 25,
  },
  post_gen: {
    content_pillars: ["B2B SaaS Growth", "AI Automation", "Leadership & Scaling"],
    post_types: ["thought_leadership", "product_update", "carousel", "news_commentary"],
    topic_weights: {
      product_updates: 0.3,
      industry_news: 0.35,
      thought_leadership: 0.35,
    },
    news_sources: [
      "https://techcrunch.com/feed/",
      "https://www.theverge.com/rss/index.xml",
    ],
    tone: "Professional & Authoritative",
    posting_frequency: "3x_per_week",
    approval_mode: "review_first",
    image_quality: "high",
    image_style: "Clean product photography with soft gradients",
    ai_model: "gpt-4o",
    user_instructions:
      "Focus on practical growth tactics. Keep posts under 180 words. Always include a soft CTA.",
  },
});

export const defaultLawyerConfig = (): LawyerAgentConfig => ({
  jurisdiction: "Uttar Pradesh",
  ui_language: "en",
  draft_language: "en",
  ai_provider: "mock",
  firm_name: "DelegatLabs Legal Desk",
  practice_areas: ["Contracts", "Notices", "Agreements"],
  user_instructions:
    "Prefer plain-language drafting. Flag missing party details before generating final output.",
});

export function defaultConfigForSlug(slug: AgentSlug): LinkedInAgentConfig | LawyerAgentConfig {
  return slug === "linkedin-agent" ? defaultLinkedInConfig() : defaultLawyerConfig();
}

export function isLinkedInConfig(
  slug: AgentSlug,
  config: LinkedInAgentConfig | LawyerAgentConfig,
): config is LinkedInAgentConfig {
  return slug === "linkedin-agent";
}

export function isLawyerConfig(
  slug: AgentSlug,
  config: LinkedInAgentConfig | LawyerAgentConfig,
): config is LawyerAgentConfig {
  return slug === "lawyer-agent";
}
