"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchUserDashboard } from "@/lib/api";
import { CardSkeleton, StatusPill } from "@/components/agents/shared";

export default function MyAgentsPage() {
  const [agents, setAgents] = useState<
    Awaited<ReturnType<typeof fetchUserDashboard>>["purchased_agents"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserDashboard()
      .then((d) => setAgents(d.purchased_agents))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load agents"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">My Agents</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Installed workforce</h1>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Link
              key={agent.slug}
              href={agent.user_route || `/dashboard/agents/${agent.slug}`}
              className="rounded-xl border border-white/10 bg-[#111827] p-5 hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">{agent.name}</h2>
                <StatusPill label={agent.status} />
              </div>
              <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">{agent.category}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-300">
                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
