export interface LawyerConfig {
  jurisdiction: string;
  ui_language: "en" | "hi";
  draft_language: "en" | "hi";
  ai_provider: "mock" | "openai" | "gemini" | "claude";
  firm_name: string;
}

export const defaultConfig: LawyerConfig = {
  jurisdiction: "Uttar Pradesh",
  ui_language: "en",
  draft_language: "en",
  ai_provider: "mock",
  firm_name: "DelegatLabs Legal Desk",
};
