export type PortfolioItem = {
  id: string;
  title: string;
  tags: string[];
  slug: string;
  image: string;
  description?: string;
  bgColor?: string;
};

export const portfolioIntro = {
  title: "Types of Projects",
  sectionTitle: "Portfolio",
  ctaLabel: "View All",
  ctaHref: "/portfolio",
};

export const portfolioItems: PortfolioItem[] = [
  {
    id: "web-apps",
    title: "Web Applications",
    tags: ["Full-stack", "React", "Next.js", "Node.js"],
    slug: "web-apps",
    image: "/portfolio/Tabsquare_ai.svg",
    bgColor: "bg-emerald-200",
  },
  {
    id: "mobile-apps",
    title: "Mobile Apps",
    tags: ["iOS", "Android", "React Native", "Cross-platform"],
    slug: "mobile-apps",
    image: "/portfolio/Aisera.svg",
    bgColor: "bg-indigo-200",
  },
  {
    id: "ai-ml",
    title: "AI & Machine Learning",
    tags: ["AI", "ML", "Agents", "Automation"],
    slug: "ai-ml",
    image: "/portfolio/Alcyon.svg",
    bgColor: "bg-sky-200",
  },
  {
    id: "ecommerce",
    title: "E-commerce & Marketplaces",
    tags: ["E-commerce", "Payments", "Inventory", "Checkout"],
    slug: "ecommerce",
    image: "/portfolio/Avify.svg",
    bgColor: "bg-rose-200",
  },
  {
    id: "enterprise",
    title: "Enterprise Software",
    tags: ["SaaS", "B2B", "Integrations", "APIs"],
    slug: "enterprise",
    image: "/portfolio/Giate.svg",
    bgColor: "bg-orange-200",
  },
  {
    id: "healthcare-fintech",
    title: "Healthcare & Fintech",
    tags: ["Healthcare", "Fintech", "Compliance", "Security"],
    slug: "healthcare-fintech",
    image: "/portfolio/curePharma.png",
    bgColor: "bg-purple-200",
  },
];
