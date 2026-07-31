export const siteConfig = {
  name: "DelegtLabs",
  tagline: "Agent Marketplace",
  title: "DelegtLabs — AI Agent Marketplace",
  description:
    "Browse specialist AI agents for LinkedIn growth, content writing, lead generation, and customer support. Activate by subscription or credits — built for how your team actually works.",
  shortDescription:
    "Specialist AI agents for growth, content, leads, and support — activate by subscription or credits.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001",
  /** E.164 digits preferred — powers floating WhatsApp CTA */
  whatsappPhone:
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ??
    process.env.NEXT_PUBLIC_PHONE_DISPLAY?.replace(/\D/g, "") ??
    "919307509511",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@delegtlabs.com",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY ?? "+91 9307509511",
  locale: "en_US",
  twitterHandle: "@delegtlabs",
  social: {
    twitter: "https://twitter.com/delegtlabs",
    linkedin: "https://www.linkedin.com/company/delegtlabs",
    github: "https://github.com/delegtlabs",
  },
  keywords: [
    "DelegtLabs",
    "AI agent marketplace",
    "multi-agent platform",
    "LinkedIn growth agent",
    "content writer AI",
    "lead generation agent",
    "customer support AI",
    "AI agents for business",
    "subscription AI agents",
    "credit-based AI agents",
  ],
} as const;
