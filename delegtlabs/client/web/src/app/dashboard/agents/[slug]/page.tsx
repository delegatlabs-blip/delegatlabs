"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { agentUserDashboardMap } from "../../agent-user-dashboard-map";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function UserAgentDashboardPage({ params }: PageProps) {
  const { slug } = use(params);
  const DashboardComponent = agentUserDashboardMap[slug];

  if (!DashboardComponent) {
    return (
      <div className="space-y-4">
        <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> My Agents
        </Link>
        <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
          <h2 className="text-lg font-semibold text-white">Agent surface not registered</h2>
          <p className="mt-2 text-sm text-slate-400">
            No entry in <code className="text-indigo-300">agent-user-dashboard-map</code> for{" "}
            <code className="text-indigo-300">{slug}</code>.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardComponent slug={slug} />;
}
