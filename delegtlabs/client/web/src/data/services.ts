export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  slug: string;
};

export const servicesIntro = {
  title: "The DelegtLabs Advantage",
  subtitle:
    "Specialist AI agents for growth, content, leads, and support—delivered with clear plans, reliable activations, and measurable outcomes.",
};

const defaultDescription =
  "Practical, product-first delivery—built for performance, security, and maintainability.";

export const homePageServiceItems: ServiceItem[] = [
  {
    id: "agent-orchestration",
    title: "AGENT ORCHESTRATION",
    description: defaultDescription,
    slug: "agent-orchestration",
  },
  {
    id: "content-automation",
    title: "CONTENT AUTOMATION",
    description: defaultDescription,
    slug: "content-automation",
  },
  {
    id: "lead-growth",
    title: "LEAD & GROWTH AGENTS",
    description: defaultDescription,
    slug: "lead-growth",
  },
  {
    id: "support-ai",
    title: "SUPPORT & AI WORKFLOWS",
    description: defaultDescription,
    slug: "support-ai",
  },
];
