import type { Agent } from "../types";
import type { ApiAgent } from "./api";

const PLACEHOLDER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC5ccGFdn3AhQC-cxybNBFhc_fVSx9XZ6n0-TZijPwJ0Xxbf63fgYZSEK-7XxGc4o7nbchNdQaIcuc_uY17McK5MsniOgKBYTeZLJm_Yy3UVK1O62zVYnEeUuG7rJmdWGwQ34qcgogzBdsLCVL5Ci3L8Qn8zrMzZitbW0VpN-dINWOmf7RsUBBHQWTxXtx0ndRTgY3xSdiJIgA6iRkyZZmUdRUNfphbHA_qAffjb0fCakfnAMZeEnRnavsHOhOLgTWTd5cBkii12PFX";

export function mapApiAgentToUi(api: ApiAgent): Agent {
  const listing = api.listing;
  const monthly =
    listing.paymentType === "subscription"
      ? listing.price
      : listing.subscriptionPlans.find((p) => p.active)?.price || listing.price;
  const oneTime =
    listing.paymentType === "credit"
      ? listing.price
      : listing.creditPacks.find((p) => p.active)?.price || listing.price * 30;

  return {
    id: api.slug || api.id,
    name: api.name,
    version: `v${api.version}`,
    subtitle: listing.shortDescription || api.description,
    description: listing.detailedDescription || api.description,
    monthlyPrice: Number(monthly) || 0,
    oneTimePrice: Number(oneTime) || 0,
    category: api.category || "General",
    latency: "—",
    compliance: "SOC2 Ready",
    contextWindow: "—",
    accuracy: "—",
    firstTokenTime: "—",
    imageUrl: PLACEHOLDER_IMAGE,
    specs: {
      neuralEngine: listing.detailedDescription || api.description,
      security: listing.features?.length ? listing.features : ["Encrypted transport", "Role-based access"],
    },
    useCases: (listing.tags || []).slice(0, 3).map((tag) => ({
      title: tag,
      description: listing.shortDescription || api.description,
      icon: "bolt",
    })),
    activeInstances: listing.featured ? "Featured" : "Available",
    uptime: listing.listedOnWebsite ? "Listed" : "Private",
    rating: 4.8,
    reviewCount: listing.features?.length || 0,
  };
}
