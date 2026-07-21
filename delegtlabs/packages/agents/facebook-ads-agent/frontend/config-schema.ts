export interface FacebookAdsConfig {
  monthly_budget_usd: number;
  target_roas: number;
  target_countries: string[];
  ad_copy_tone: string;
  retargeting_enabled: boolean;
}

export const defaultConfig: FacebookAdsConfig = {
  monthly_budget_usd: 2500,
  target_roas: 3.5,
  target_countries: ["US", "CA", "UK"],
  ad_copy_tone: "Urgent & Benefit Driven",
  retargeting_enabled: true,
};
