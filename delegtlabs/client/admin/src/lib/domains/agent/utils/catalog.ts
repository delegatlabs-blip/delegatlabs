import type { AgentSlug } from "../types";

export const AGENT_CATALOG: Record<
  AgentSlug,
  { label: string; category: string; description: string; version: string }
> = {
  "linkedin-agent": {
    label: "LinkedIn Growth Agent",
    category: "linkedin",
    description: "PR posting, lead generation, and content automation for LinkedIn.",
    version: "2.0.0",
  },
  "lawyer-agent": {
    label: "Lawyer Drafting Agent",
    category: "legal",
    description: "Guided legal drafting with jurisdiction-aware templates.",
    version: "1.0.0",
  },
};

export function newPlanId(): string {
  return crypto.randomUUID();
}
