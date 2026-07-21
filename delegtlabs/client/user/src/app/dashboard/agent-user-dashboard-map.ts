import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentUserDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@/../../packages/agents/linkedin-agent/frontend/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading LinkedIn User Dashboard...</div>,
  }),
  "facebook-ads-agent": dynamic(() => import("@/../../packages/agents/facebook-ads-agent/frontend/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Facebook Ads User Dashboard...</div>,
  }),
  "instagram-agent": dynamic(() => import("@/../../packages/agents/instagram-agent/frontend/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Instagram User Dashboard...</div>,
  }),
};
