"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentUserDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@agents/linkedin-agent/frontend/UserDashboard"), {
    loading: () => (
      <div className="p-8 text-sm font-medium text-slate-400">Loading LinkedIn User Dashboard…</div>
    ),
  }),
  "lawyer-agent": dynamic(() => import("@agents/lawyer-agent/frontend/UserDashboard"), {
    loading: () => (
      <div className="p-8 text-sm font-medium text-slate-400">Loading Lawyer User Dashboard…</div>
    ),
  }),
};
