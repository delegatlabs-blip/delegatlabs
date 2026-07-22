"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentUserDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@/agents/linkedin-agent/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading LinkedIn User Dashboard...</div>,
  }),
  "lawyer-agent": dynamic(() => import("@/agents/lawyer-agent/UserDashboard"), {
    loading: () => <div className="p-8 text-slate-500 font-medium">Loading Lawyer User Dashboard...</div>,
  }),
};
