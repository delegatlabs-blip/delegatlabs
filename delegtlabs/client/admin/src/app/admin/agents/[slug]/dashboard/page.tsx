"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { agentDashboardMap } from "../../agent-dashboard-map";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function AgentDashboardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { slug } = resolvedParams;

  const DashboardComponent = agentDashboardMap[slug];

  if (!DashboardComponent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/agents"
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Agents
          </Link>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-lg">Sub-Dashboard Not Configured</h3>
            <p className="text-sm mt-1 text-amber-800">
              No custom admin sub-dashboard plugin was registered for slug: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{slug}</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <DashboardComponent slug={slug} />;
}
