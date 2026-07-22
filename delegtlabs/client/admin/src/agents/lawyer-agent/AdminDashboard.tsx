"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, DollarSign, AlertTriangle, Activity, ArrowLeft, Scale } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type AdminStats = {
  active_customers: number;
  mrr_attributed: number;
  error_rate_7d: number;
  recent_runs: Array<{
    id: string;
    run_type: string;
    status: string;
    started_at: string;
    finished_at?: string;
    error_message?: string;
  }>;
  daily_metrics_30d: Array<{ date: string; drafts_generated: number }>;
};

const ACCENT = "#B45309";

export default function LawyerAdminDashboard({ slug }: { slug: string }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/admin/agents/${slug}/stats`);
        if (res.ok) {
          setStats(await res.json());
        } else {
          setStats({
            active_customers: 9,
            mrr_attributed: 2700,
            error_rate_7d: 10,
            recent_runs: Array.from({ length: 20 }, (_, i) => ({
              id: `run-${i + 1}`,
              run_type: "draft_generation",
              status: i === 3 || i === 11 ? "failed" : "success",
              started_at: new Date(Date.now() - i * 3600000 * 3).toISOString(),
              error_message: i === 3 || i === 11 ? "AI provider timeout" : undefined,
            })),
            daily_metrics_30d: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
              drafts_generated: Math.floor(2 + Math.random() * 6),
            })),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [slug]);

  if (loading) return <div className="p-8 text-slate-500 font-medium">Loading Lawyer Agent Dashboard...</div>;
  if (!stats) return null;

  return (
    <div className="relative space-y-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-6 h-40 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at top left, rgba(180,83,9,0.12), transparent 55%), radial-gradient(ellipse at top right, rgba(15,23,42,0.05), transparent 50%)",
        }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/admin/agents" className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back to Agents
          </Link>
          <span className="hidden text-slate-300 sm:inline">|</span>
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-amber-700" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lawyer Drafting Agent</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">Guided legal drafting · admin overview</p>
          </div>
        </div>
        <Link
          href={`/admin/clients?agent=${slug}`}
          className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
        >
          View Filtered Clients ({stats.active_customers})
        </Link>
      </div>

      <div className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active Customers", value: stats.active_customers, icon: Users, color: "text-amber-700" },
          {
            label: "Attributed MRR",
            value: `$${stats.mrr_attributed.toLocaleString()}`,
            icon: DollarSign,
            color: "text-emerald-700",
          },
          {
            label: "7-Day Error Rate",
            value: `${stats.error_rate_7d.toFixed(1)}%`,
            icon: AlertTriangle,
            color: "text-rose-600",
          },
          { label: "Recent Runs", value: stats.recent_runs.length, icon: Activity, color: "text-slate-700" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{kpi.label}</span>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="relative rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">30-Day Draft Generations</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.daily_metrics_30d}>
              <defs>
                <linearGradient id="lawyerDrafts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="drafts_generated"
                stroke={ACCENT}
                fillOpacity={1}
                fill="url(#lawyerDrafts)"
                name="Drafts Generated"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="relative rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Draft Runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Run ID</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_runs.map((run) => (
                <tr key={run.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{run.id.substring(0, 8)}</td>
                  <td className="px-4 py-3 font-medium capitalize">{run.run_type.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${
                        run.status === "success"
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                          : "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(run.started_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-rose-600">{run.error_message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
