export type Accent = "red" | "yellow" | "green" | "blue";

export type BillingInterval = "monthly" | "yearly" | "one-time";

export type Plan = {
  id: string;
  name: string;
  note: string;
  price: number;
  currency: string;
  interval: BillingInterval;
};

export type Agent = {
  id: string;
  slug: string;
  name: string;
  accent: Accent;
  icon: string;
  imageUrl: string;
  category: string;
  tag: string;
  desc: string;
  details: string;
  caps: string[];
  featured: boolean;
  plans: {
    subscription: Plan[];
    credit: Plan[];
  };
};

export type PaginatedAgents = {
  items: Agent[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AgentQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  featured?: boolean;
};

export const DEFAULT_PAGE_SIZE = 9;
export const MAX_PAGE_SIZE = 50;

export const accentColors: Record<Accent, string> = {
  blue: "#3b82f6",
  yellow: "#eab308",
  green: "#10b981",
  red: "#ef4444",
};

/** Soft gradient used behind agent artwork and on icon tiles. */
export const accentGradients: Record<Accent, string> = {
  blue: "from-blue-100 via-blue-50 to-indigo-100",
  yellow: "from-amber-100 via-yellow-50 to-orange-100",
  green: "from-emerald-100 via-green-50 to-teal-100",
  red: "from-rose-100 via-red-50 to-pink-100",
};

/**
 * The image optimizer refuses SVG unless `dangerouslyAllowSVG` is on, which we
 * avoid because agent image URLs will eventually come from the database.
 * Placeholder SVGs are served as-is; real raster uploads stay optimized.
 */
export function isSvg(url: string): boolean {
  return url.split("?")[0].toLowerCase().endsWith(".svg");
}

const intervalSuffix: Record<BillingInterval, string> = {
  monthly: "/mo",
  yearly: "/yr",
  "one-time": "",
};

export function formatPrice(plan: Plan): string {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: plan.currency,
    maximumFractionDigits: 0,
  }).format(plan.price);
  return `${amount}${intervalSuffix[plan.interval]}`;
}

/** Cheapest active subscription plan, used for the "from" price on cards. */
export function startingPrice(agent: Agent): string | null {
  const plans = agent.plans.subscription.length
    ? agent.plans.subscription
    : agent.plans.credit;
  if (!plans.length) return null;
  const cheapest = plans.reduce((a, b) => (b.price < a.price ? b : a));
  return formatPrice(cheapest);
}
