"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const agentDashboardMap: Record<string, ComponentType<{ slug: string }>> = {
  "linkedin-agent": dynamic(() => import("@agents/linkedin-agent/frontend/AdminDashboard"), {
    loading: () => (
      <div className="p-8 text-sm font-medium text-slate-400">Loading LinkedIn Admin Dashboard…</div>
    ),
  }),
  "lawyer-agent": dynamic(() => import("@agents/lawyer-agent/frontend/AdminDashboard"), {
    loading: () => (
      <div className="p-8 text-sm font-medium text-slate-400">Loading Lawyer Admin Dashboard…</div>
    ),
  }),
};
