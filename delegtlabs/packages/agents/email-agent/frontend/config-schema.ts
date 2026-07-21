export interface EmailConfig {
  sending_domain: string;
  daily_sending_limit: number;
  warmup_enabled: boolean;
  reply_to_email: string;
}

export const defaultConfig: EmailConfig = {
  sending_domain: "outbound.acmesaas.com",
  daily_sending_limit: 250,
  warmup_enabled: true,
  reply_to_email: "growth@acmesaas.com",
};
