export interface LinkedInConfig {
  lead_gen: {
    target_job_titles: string[];
    industries: string[];
    company_size: string[];
    connection_message_template: string;
    daily_connection_cap: number;
  };
  post_gen: {
    content_pillars: string[];
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
    connection_message_template: "Hi {{first_name}}, I noticed your work in {{industry}} at {{company}}. Would love to connect!",
    daily_connection_cap: 25,
  },
  post_gen: {
    content_pillars: ["B2B SaaS Growth", "AI Automation", "Leadership & Scaling"],
    tone: "Professional & Authoritative",
    posting_frequency: "3x_per_week",
    approval_mode: "review_first",
  },
};
