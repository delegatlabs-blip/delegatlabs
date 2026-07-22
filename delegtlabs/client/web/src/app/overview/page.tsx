"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, FileText, Users } from "lucide-react";
import { fetchUserDashboard } from "@/lib/api";
import { MetricCard, MetricCardSkeleton, StatusPill, CardSkeleton } from "@/components/agents/shared";

export default function OverviewPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchUserDashboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDashboard()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"));
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overview</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">{data.client_name}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {data.plan_name} · renews {new Date(data.renewal_date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Monthly spend" value={`$${data.total_monthly_spend}`} icon={Bot} />
        <MetricCard label="Leads" value={data.aggregate_metrics.total_leads} icon={Users} />
        <MetricCard label="Posts" value={data.aggregate_metrics.total_posts} icon={FileText} />
        <MetricCard label="Drafts" value={data.aggregate_metrics.total_drafts} icon={FileText} />
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Installed agents</h2>
          <Link href="/marketplace" className="text-sm text-indigo-300 hover:text-indigo-200">
            Browse marketplace
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {data.purchased_agents.map((agent) => (
            <Link
              key={agent.slug}
              href={agent.user_route || `/dashboard/agents/${agent.slug}`}
              className="group rounded-xl border border-white/10 bg-[#111827] p-5 transition hover:border-indigo-500/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-indigo-200">{agent.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{agent.category}</p>
                </div>
                <StatusPill label={agent.status} />
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                <span>${agent.monthly_price}/mo</span>
                <span className="inline-flex items-center gap-1 text-indigo-300">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
