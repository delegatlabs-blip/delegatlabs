"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { fetchRegisteredAgents, type RegisteredAgent } from "@/lib/api";
import { CardSkeleton, StatusPill } from "@/components/agents/shared";

export default function AdminConsolePage() {
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegisteredAgents()
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-violet-500/15 p-2 text-violet-300">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin Console</p>
          <h1 className="text-2xl font-semibold text-white">Per-agent sub-dashboards</h1>
        </div>
      </div>

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
              href={agent.admin_route || `/admin/agents/${agent.slug}/dashboard`}
              className="rounded-xl border border-white/10 bg-[#111827] p-5 hover:border-violet-500/40"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">{agent.name}</h2>
                <StatusPill label={agent.status || "active"} />
              </div>
              <p className="mt-2 text-xs text-slate-500">v{agent.version} · {agent.category}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-sm text-violet-300">
                Open admin dashboard <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
