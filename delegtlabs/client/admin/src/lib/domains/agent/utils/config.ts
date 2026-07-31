import type { AgentSlug, LawyerAgentConfig, LinkedInAgentConfig } from "../types";

export function defaultLinkedInConfig(): LinkedInAgentConfig {
  return {
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
  };
}

export function defaultLawyerConfig(): LawyerAgentConfig {
  return {
    jurisdiction: "Uttar Pradesh",
    ui_language: "en",
    draft_language: "en",
    ai_provider: "mock",
    firm_name: "DelegatLabs Legal Desk",
    practice_areas: ["Contracts", "Notices", "Agreements"],
    user_instructions:
      "Prefer plain-language drafting. Flag missing party details before generating final output.",
  };
}

export function defaultConfigForSlug(
  slug: AgentSlug,
): LinkedInAgentConfig | LawyerAgentConfig {
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
