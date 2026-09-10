/** Shared agent config schemas — imported by dashboard pages (do not redefine). */

export type AgentKind = "post_gen" | "lead_gen" | "analytics";

export type PostGenConfig = {
  pillars: string[];
  tone: string;
  format: string[];
  voiceSource: "profile" | "onboarding" | "custom";
  cadence: string;
  cta: string;
  hashtags: string[];
  approvalFlow: "auto" | "manual" | "hybrid";
};

export type LeadGenConfig = {
  icp: {
    titles: string[];
    industries: string[];
    companySizes: string[];
    geographies: string[];
  };
  leadSources: string[];
  enrichmentProvider: string | null;
  scoringRules: { field: string; weight: number }[];
  outreachTemplates: { id: string; name: string; body: string }[];
  crmDestination: string | null;
};

export type AnalyticsConfig = {
  kpis: string[];
  cadence: "daily" | "weekly" | "monthly";
  comparisonMode: "wow" | "mom" | "yoy";
  alertThresholds: { metric: string; op: ">" | "<"; value: number }[];
  deliveryChannels: ("email" | "slack" | "in_app")[];
};

export const defaultPostGenConfig: PostGenConfig = {
  pillars: [],
  tone: "professional",
  format: ["short_take"],
  voiceSource: "onboarding",
  cadence: "3-4x per week",
  cta: "question",
  hashtags: [],
  approvalFlow: "manual",
};

export const defaultLeadGenConfig: LeadGenConfig = {
  icp: { titles: [], industries: [], companySizes: [], geographies: [] },
  leadSources: ["linkedin_search"],
  enrichmentProvider: null,
  scoringRules: [],
  outreachTemplates: [],
  crmDestination: null,
};

export const defaultAnalyticsConfig: AnalyticsConfig = {
  kpis: ["impressions", "engagement_rate", "comments"],
  cadence: "weekly",
  comparisonMode: "wow",
  alertThresholds: [],
  deliveryChannels: ["in_app"],
};
