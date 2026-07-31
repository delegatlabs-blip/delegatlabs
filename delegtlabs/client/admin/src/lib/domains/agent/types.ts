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

export type AgentCreateInput = {
  name: string;
  slug: AgentSlug;
  description?: string;
  category?: string;
  status?: AgentRecord["status"];
  listing?: AgentRecord["listing"];
};

export type AgentUpdateInput = Partial<
  Pick<AgentRecord, "name" | "description" | "category" | "status" | "listing" | "config">
>;
