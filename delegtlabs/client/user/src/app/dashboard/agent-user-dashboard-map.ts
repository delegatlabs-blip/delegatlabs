import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentUserDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@/../../packages/agents/linkedin-agent/frontend/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading LinkedIn User Dashboard...</div>,
  }),
  "lawyer-agent": dynamic(() => import("@/../../packages/agents/lawyer-agent/frontend/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Lawyer User Dashboard...</div>,
  }),
};
