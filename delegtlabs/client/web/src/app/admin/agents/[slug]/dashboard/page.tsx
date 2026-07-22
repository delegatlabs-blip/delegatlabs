"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { agentDashboardMap } from "../../agent-dashboard-map";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function AdminAgentDashboardPage({ params }: PageProps) {
  const { slug } = use(params);
  const DashboardComponent = agentDashboardMap[slug];

  if (!DashboardComponent) {
    return (
      <div className="space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Admin Console
        </Link>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
          <h2 className="text-lg font-semibold">Sub-dashboard not configured</h2>
          <p className="mt-2 text-sm text-amber-200/80">
            No admin map entry for <code className="rounded bg-black/20 px-1">{slug}</code>.
          </p>
        </div>
      </div>
    );
  }

  return <DashboardComponent slug={slug} />;
}
