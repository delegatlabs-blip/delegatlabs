import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@/../../packages/agents/linkedin-agent/frontend/AdminDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading LinkedIn Dashboard...</div>,
  }),
  "facebook-ads-agent": dynamic(() => import("@/../../packages/agents/facebook-ads-agent/frontend/AdminDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Facebook Ads Dashboard...</div>,
  }),
  "instagram-agent": dynamic(() => import("@/../../packages/agents/instagram-agent/frontend/AdminDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Instagram Dashboard...</div>,
  }),
  "email-agent": dynamic(() => import("@/../../packages/agents/email-agent/frontend/AdminDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Email Agent Dashboard...</div>,
  }),
  "seo-agent": dynamic(() => import("@/../../packages/agents/seo-agent/frontend/AdminDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading SEO Agent Dashboard...</div>,
  }),
};
