import "server-only";

import type { Agent } from "@/lib/agents/types";

/**
 * Source of truth for the public agent catalog.
 * Swap this for a database or S3-backed read without touching callers —
 * everything goes through `src/server/agents/repository.ts`.
 */
export const agentCatalog: Agent[] = [
  {
    id: "linkedin",
    slug: "linkedin-growth-agent",
    name: "LinkedIn Growth Agent",
    accent: "blue",
    icon: "in",
    imageUrl: "/agents/linkedin-growth-agent.svg",
    category: "Social",
    tag: "Social · Content",
    desc: "Writes and schedules LinkedIn posts, learns your voice, and tracks engagement automatically.",
    details:
      "Connects to your LinkedIn profile via OAuth, drafts posts from trending React/Next.js news and your own notes, and posts on a schedule you set. Flags drafts for review before anything goes live.",
    caps: [
      "OAuth 2.0 posting",
      "Auto-scheduling",
      "Voice matching",
      "Engagement tracking",
    ],
    featured: true,
    plans: {
      subscription: [
        {
          id: "linkedin-starter",
          name: "Starter",
          note: "1 LinkedIn account, 3 posts/wk",
          price: 999,
          currency: "INR",
          interval: "monthly",
        },
        {
          id: "linkedin-pro",
          name: "Pro",
          note: "3 accounts, daily posting",
          price: 2499,
          currency: "INR",
          interval: "monthly",
        },
      ],
      credit: [
        {
          id: "linkedin-payg",
          name: "Pay-as-you-go",
          note: "Per generated + scheduled post",
          price: 15,
          currency: "INR",
          interval: "one-time",
        },
        {
          id: "linkedin-pack-100",
          name: "Credit pack — 100",
          note: "Never expires",
          price: 1199,
          currency: "INR",
          interval: "one-time",
        },
      ],
    },
  },
  {
    id: "content",
    slug: "content-writer-agent",
    name: "Content Writer Agent",
    accent: "yellow",
    icon: "✎",
    imageUrl: "/agents/content-writer-agent.svg",
    category: "Writing",
    tag: "Writing · SEO",
    desc: "Drafts blog posts, product copy, and landing pages tuned to your brand tone.",
    details:
      "Takes a brief or outline and produces publish-ready drafts with on-page SEO structure. Learns from edits over time so later drafts need less rework.",
    caps: [
      "SEO structuring",
      "Tone matching",
      "Outline to draft",
      "Revision memory",
    ],
    featured: true,
    plans: {
      subscription: [
        {
          id: "content-starter",
          name: "Starter",
          note: "8 drafts / month",
          price: 799,
          currency: "INR",
          interval: "monthly",
        },
        {
          id: "content-studio",
          name: "Studio",
          note: "Unlimited drafts, 2 brand voices",
          price: 2199,
          currency: "INR",
          interval: "monthly",
        },
      ],
      credit: [
        {
          id: "content-payg",
          name: "Pay-as-you-go",
          note: "Per finished draft",
          price: 40,
          currency: "INR",
          interval: "one-time",
        },
        {
          id: "content-pack-50",
          name: "Credit pack — 50",
          note: "Never expires",
          price: 1599,
          currency: "INR",
          interval: "one-time",
        },
      ],
    },
  },
  {
    id: "leadgen",
    slug: "lead-gen-agent",
    name: "Lead Gen Agent",
    accent: "green",
    icon: "◎",
    imageUrl: "/agents/lead-gen-agent.svg",
    category: "Sales",
    tag: "Sales · Outreach",
    desc: "Finds and qualifies leads matching your ideal customer profile, then drafts outreach.",
    details:
      "Searches public sources for companies matching your ICP, scores fit, and drafts a first-touch email or LinkedIn message per lead for your approval.",
    caps: ["ICP matching", "Lead scoring", "Outreach drafts", "CRM export"],
    featured: true,
    plans: {
      subscription: [
        {
          id: "leadgen-starter",
          name: "Starter",
          note: "100 qualified leads/mo",
          price: 1499,
          currency: "INR",
          interval: "monthly",
        },
        {
          id: "leadgen-growth",
          name: "Growth",
          note: "500 leads/mo + outreach drafts",
          price: 3999,
          currency: "INR",
          interval: "monthly",
        },
      ],
      credit: [
        {
          id: "leadgen-payg",
          name: "Pay-as-you-go",
          note: "Per qualified lead",
          price: 12,
          currency: "INR",
          interval: "one-time",
        },
        {
          id: "leadgen-pack-200",
          name: "Credit pack — 200",
          note: "Never expires",
          price: 1999,
          currency: "INR",
          interval: "one-time",
        },
      ],
    },
  },
  {
    id: "support",
    slug: "support-reply-agent",
    name: "Support Reply Agent",
    accent: "red",
    icon: "◆",
    imageUrl: "/agents/support-reply-agent.svg",
    category: "Support",
    tag: "Support · Ops",
    desc: "Drafts responses to incoming customer tickets using your docs and past replies.",
    details:
      "Reads your help center and prior resolved tickets, then drafts a reply for each new ticket in your queue. A human reviews and sends — nothing goes out unsupervised.",
    caps: [
      "Doc-grounded replies",
      "Ticket triage",
      "Draft-for-review",
      "Tone consistency",
    ],
    featured: true,
    plans: {
      subscription: [
        {
          id: "support-starter",
          name: "Starter",
          note: "Up to 300 tickets/mo",
          price: 1299,
          currency: "INR",
          interval: "monthly",
        },
        {
          id: "support-team",
          name: "Team",
          note: "Up to 1,500 tickets/mo",
          price: 3499,
          currency: "INR",
          interval: "monthly",
        },
      ],
      credit: [
        {
          id: "support-payg",
          name: "Pay-as-you-go",
          note: "Per drafted reply",
          price: 8,
          currency: "INR",
          interval: "one-time",
        },
        {
          id: "support-pack-300",
          name: "Credit pack — 300",
          note: "Never expires",
          price: 1899,
          currency: "INR",
          interval: "one-time",
        },
      ],
    },
  },
];
