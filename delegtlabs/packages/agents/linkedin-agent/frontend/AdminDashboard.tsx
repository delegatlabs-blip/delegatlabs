"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  DollarSign,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AdminStats = {
  active_customers: number;
  mrr_attributed: number;
  runs_24h: number;
  runs_30d: number;
  error_rate_7d: number;
  subscribers: Array<{ client_id: string; name: string; plan: string; status: string; mrr: number }>;
  lead_pipeline: { discovered: number; scored_hot: number; connected: number; converted: number };
  credential_health: Array<{ provider: string; status: string; expires_at?: string | null }>;
  recent_runs: Array<{
    id: string;
    client_agent_id?: string;
    run_type: string;
    status: string;
    started_at: string;
    finished_at?: string;
    duration_ms?: number;
    output_summary?: Record<string, unknown>;
    error_message?: string;
  }>;
  daily_metrics_30d: Array<{ date: string; leads_generated: number; posts_published: number }>;
};

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  if (data === null || typeof data !== "object") {
    return <span className="font-mono text-xs text-emerald-300">{JSON.stringify(data)}</span>;
  }
  const entries = Array.isArray(data)
    ? data.map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);
  return (
    <div className={depth === 0 ? "" : "ml-3 border-l border-white/10 pl-3"}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="font-mono text-xs text-indigo-300">
        {open ? "▾" : "▸"} {Array.isArray(data) ? `Array(${entries.length})` : `Object(${entries.length})`}
      </button>
      {open
        ? entries.map(([k, v]) => (
            <div key={k} className="mt-1">
              <span className="font-mono text-xs text-slate-400">{k}: </span>
              <JsonTree data={v} depth={depth + 1} />
            </div>
          ))
        : null}
    </div>
  );
}

export default function LinkedInAdminDashboard({ slug }: { slug: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/admin/agents/${slug}/stats`);
        if (!res.ok) throw new Error("Failed to load admin stats");
        setStats(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Load failed");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [slug]);

  if (loading) return <div className="p-8 text-sm text-slate-400">Loading LinkedIn admin dashboard…</div>;
  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error || "No stats"}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Admin Console
          </Link>
          <h1 className="text-2xl font-semibold text-white">LinkedIn Growth Agent — Admin</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active clients</span>
            <Users className="h-4 w-4 text-indigo-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.active_customers}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">MRR</span>
            <DollarSign className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">${stats.mrr_attributed.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Runs 24h</span>
            <Activity className="h-4 w-4 text-violet-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.runs_24h}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Runs 30d</span>
            <Activity className="h-4 w-4 text-violet-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.runs_30d}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Error rate</span>
            <AlertTriangle className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-white">{stats.error_rate_7d.toFixed(1)}%</p>
          <span
            className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] ${
              stats.error_rate_7d > 15
                ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            7d badge
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Subscribers</h2>
          <ul className="divide-y divide-white/5">
            {stats.subscribers.map((s) => (
              <li key={s.client_id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="font-medium text-slate-200">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.plan}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-300">${s.mrr}</p>
                  <p className="text-xs capitalize text-emerald-400">{s.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">Lead pipeline</h2>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(stats.lead_pipeline).map(([k, v]) => (
              <div key={k} className="rounded-lg border border-white/10 bg-[#0B0F17] p-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">{k.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xl font-semibold text-white">{v}</p>
              </div>
            ))}
          </div>
          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Credential health
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.credential_health.map((c) => (
              <span
                key={c.provider}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs capitalize text-emerald-300"
              >
                {c.provider}: {c.status}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Posting volume (30d)</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.daily_metrics_30d}>
              <defs>
                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
              />
              <Area
                type="monotone"
                dataKey="posts_published"
                stroke="#818cf8"
                fill="url(#colorPosts)"
                name="Posts published"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Run log (agent_runs)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.recent_runs.map((run) => (
                <Fragment key={run.id}>
                  <tr className="hover:bg-white/[0.03]">
                    <td className="px-3 py-2 font-mono text-xs text-slate-500">{run.id.slice(0, 8)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{run.client_agent_id || "—"}</td>
                    <td className="px-3 py-2 capitalize text-slate-300">{run.run_type.replaceAll("_", " ")}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${
                          run.status === "success" || run.status === "SUCCESS"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : run.status === "failed" || run.status === "FAILED"
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {run.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-400">
                      {run.duration_ms != null ? `${Math.round(run.duration_ms / 1000)}s` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setExpanded(expanded === run.id ? null : run.id)}
                        className="text-xs text-indigo-300 hover:text-indigo-200"
                      >
                        {expanded === run.id ? "Hide" : "Expand"}
                      </button>
                    </td>
                  </tr>
                  {expanded === run.id ? (
                    <tr>
                      <td colSpan={6} className="bg-[#0B0F17] px-4 py-3">
                        <JsonTree data={run.output_summary || { error: run.error_message }} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
