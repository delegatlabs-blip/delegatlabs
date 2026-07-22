export interface LinkedInConfig {
  lead_gen: {
    target_job_titles: string[];
    industries: string[];
    company_size: string[];
    geography: string[];
    score_threshold: number;
    connection_message_template: string;
    daily_connection_cap: number;
  };
  post_gen: {
    content_pillars: string[];
    topic_weights: Record<string, number>;
    news_sources: string[];
    tone: string;
    posting_frequency: string;
    approval_mode: "auto_publish" | "review_first";
  };
}

export const defaultConfig: LinkedInConfig = {
  lead_gen: {
    target_job_titles: ["VP Marketing", "Chief Marketing Officer", "Head of Growth"],
    industries: ["Software", "Information Technology", "Internet"],
    company_size: ["51-200 employees", "201-500 employees"],
    geography: ["United States", "India"],
    score_threshold: 70,
    connection_message_template:
      "Hi {{first_name}}, I noticed your work in {{industry}} at {{company}}. Would love to connect!",
    daily_connection_cap: 25,
  },
  post_gen: {
    content_pillars: ["B2B SaaS Growth", "AI Automation", "Leadership & Scaling"],
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
  },
};
