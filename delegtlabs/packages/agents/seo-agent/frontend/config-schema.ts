export interface SEOConfig {
  target_keywords: string[];
  website_url: string;
  target_search_engine: string;
  target_article_length: number;
  auto_publish_wordpress: boolean;
}

export const defaultConfig: SEOConfig = {
  target_keywords: ["AI agents platform", "B2B SaaS automation", "multi agent delegation"],
  website_url: "https://acmesaas.com",
  target_search_engine: "Google US",
  target_article_length: 2000,
  auto_publish_wordpress: false,
};
