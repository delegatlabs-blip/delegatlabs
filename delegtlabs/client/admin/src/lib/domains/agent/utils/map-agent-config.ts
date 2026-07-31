import type { Prisma, AdminAgentLinkedInConfig, AdminAgentLawyerConfig } from "@prisma/client";
import type { LawyerAgentConfig, LinkedInAgentConfig } from "../types";
import { defaultLawyerConfig, defaultLinkedInConfig } from "./config";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asTopicWeights(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultLinkedInConfig().post_gen.topic_weights;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(v);
    if (!Number.isNaN(n)) out[k] = n;
  }
  return out;
}

export function linkedInRowToConfig(row: AdminAgentLinkedInConfig): LinkedInAgentConfig {
  return {
    lead_gen: {
      target_job_titles: row.targetJobTitles,
      industries: row.industries,
      company_size: row.companySize,
      geography: row.geography,
      target_audience: row.targetAudience,
      score_threshold: row.scoreThreshold,
      connection_message_template: row.connectionMessageTemplate,
      daily_connection_cap: row.dailyConnectionCap,
    },
    post_gen: {
      content_pillars: row.contentPillars,
      post_types: row.postTypes,
      topic_weights: asTopicWeights(row.topicWeights),
      news_sources: row.newsSources,
      tone: row.tone,
      posting_frequency: row.postingFrequency,
      approval_mode: row.approvalMode as LinkedInAgentConfig["post_gen"]["approval_mode"],
      image_quality: row.imageQuality as LinkedInAgentConfig["post_gen"]["image_quality"],
      image_style: row.imageStyle,
      ai_model: row.aiModel as LinkedInAgentConfig["post_gen"]["ai_model"],
      user_instructions: row.userInstructions,
    },
  };
}

export function lawyerRowToConfig(row: AdminAgentLawyerConfig): LawyerAgentConfig {
  return {
    jurisdiction: row.jurisdiction,
    ui_language: row.uiLanguage as LawyerAgentConfig["ui_language"],
    draft_language: row.draftLanguage as LawyerAgentConfig["draft_language"],
    ai_provider: row.aiProvider as LawyerAgentConfig["ai_provider"],
    firm_name: row.firmName,
    practice_areas: row.practiceAreas,
    user_instructions: row.userInstructions,
  };
}

export function linkedInConfigToCreateData(agentId: string, config: LinkedInAgentConfig) {
  const base = defaultLinkedInConfig();
  const lead = config.lead_gen ?? base.lead_gen;
  const post = config.post_gen ?? base.post_gen;
  return {
    agentId,
    targetJobTitles: lead.target_job_titles ?? [],
    industries: lead.industries ?? [],
    companySize: lead.company_size ?? [],
    geography: lead.geography ?? [],
    targetAudience: lead.target_audience ?? "",
    scoreThreshold: lead.score_threshold ?? 70,
    connectionMessageTemplate: lead.connection_message_template ?? "",
    dailyConnectionCap: lead.daily_connection_cap ?? 25,
    contentPillars: post.content_pillars ?? [],
    postTypes: post.post_types ?? [],
    topicWeights: (post.topic_weights ?? {}) as Prisma.InputJsonValue,
    newsSources: post.news_sources ?? [],
    tone: post.tone ?? "",
    postingFrequency: post.posting_frequency ?? "3x_per_week",
    approvalMode: post.approval_mode ?? "review_first",
    imageQuality: post.image_quality ?? "high",
    imageStyle: post.image_style ?? "",
    aiModel: post.ai_model ?? "gpt-4o",
    userInstructions: post.user_instructions ?? "",
  };
}

export function lawyerConfigToCreateData(agentId: string, config: LawyerAgentConfig) {
  const base = defaultLawyerConfig();
  return {
    agentId,
    jurisdiction: config.jurisdiction ?? base.jurisdiction,
    uiLanguage: config.ui_language ?? base.ui_language,
    draftLanguage: config.draft_language ?? base.draft_language,
    aiProvider: config.ai_provider ?? base.ai_provider,
    firmName: config.firm_name ?? base.firm_name,
    practiceAreas: config.practice_areas ?? [],
    userInstructions: config.user_instructions ?? "",
  };
}

/** Parse legacy JSON blob during migration helpers / fallbacks. */
export function parseLegacyLinkedInConfig(raw: unknown): LinkedInAgentConfig {
  const base = defaultLinkedInConfig();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  const lead = (obj.lead_gen as Record<string, unknown>) || {};
  const post = (obj.post_gen as Record<string, unknown>) || {};
  return {
    lead_gen: {
      target_job_titles: asStringArray(lead.target_job_titles) || base.lead_gen.target_job_titles,
      industries: asStringArray(lead.industries) || base.lead_gen.industries,
      company_size: asStringArray(lead.company_size) || base.lead_gen.company_size,
      geography: asStringArray(lead.geography) || base.lead_gen.geography,
      target_audience: String(lead.target_audience ?? base.lead_gen.target_audience),
      score_threshold: Number(lead.score_threshold ?? base.lead_gen.score_threshold),
      connection_message_template: String(
        lead.connection_message_template ?? base.lead_gen.connection_message_template,
      ),
      daily_connection_cap: Number(lead.daily_connection_cap ?? base.lead_gen.daily_connection_cap),
    },
    post_gen: {
      content_pillars: asStringArray(post.content_pillars) || base.post_gen.content_pillars,
      post_types: asStringArray(post.post_types) || base.post_gen.post_types,
      topic_weights: asTopicWeights(post.topic_weights),
      news_sources: asStringArray(post.news_sources) || base.post_gen.news_sources,
      tone: String(post.tone ?? base.post_gen.tone),
      posting_frequency: String(post.posting_frequency ?? base.post_gen.posting_frequency),
      approval_mode: (post.approval_mode as LinkedInAgentConfig["post_gen"]["approval_mode"]) ||
        base.post_gen.approval_mode,
      image_quality: (post.image_quality as LinkedInAgentConfig["post_gen"]["image_quality"]) ||
        base.post_gen.image_quality,
      image_style: String(post.image_style ?? base.post_gen.image_style),
      ai_model: (post.ai_model as LinkedInAgentConfig["post_gen"]["ai_model"]) || base.post_gen.ai_model,
      user_instructions: String(post.user_instructions ?? base.post_gen.user_instructions),
    },
  };
}

export function parseLegacyLawyerConfig(raw: unknown): LawyerAgentConfig {
  const base = defaultLawyerConfig();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  return {
    jurisdiction: String(obj.jurisdiction ?? base.jurisdiction),
    ui_language: (obj.ui_language as LawyerAgentConfig["ui_language"]) || base.ui_language,
    draft_language: (obj.draft_language as LawyerAgentConfig["draft_language"]) || base.draft_language,
    ai_provider: (obj.ai_provider as LawyerAgentConfig["ai_provider"]) || base.ai_provider,
    firm_name: String(obj.firm_name ?? base.firm_name),
    practice_areas: asStringArray(obj.practice_areas).length
      ? asStringArray(obj.practice_areas)
      : base.practice_areas,
    user_instructions: String(obj.user_instructions ?? base.user_instructions),
  };
}
