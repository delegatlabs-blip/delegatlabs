"use client";

import { useEffect, useState } from "react";
import { adminAgentFetch } from "@/lib/api";
import { DataTable, JsonInspector, TableSkeleton, StatusPill, type Column } from "@/components/agents/shared";

type RunRow = {
  id: string;
  client_agent_id?: string;
  run_type: string;
  status: string;
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  output_summary?: Record<string, unknown>;
  error_message?: string;
};

export default function ActivityLogsPage() {
  const [rows, setRows] = useState<RunRow[]>([]);
  const [expanded, setExpanded] = useState<RunRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [li, law] = await Promise.all([
          adminAgentFetch<{ recent_runs: RunRow[] }>("linkedin-agent", "/stats"),
          adminAgentFetch<{ recent_runs: RunRow[] }>("lawyer-agent", "/stats"),
        ]);
        const merged = [
          ...(li.recent_runs || []).map((r) => ({ ...r, run_type: `linkedin:${r.run_type}` })),
          ...(law.recent_runs || []).map((r) => ({ ...r, run_type: `lawyer:${r.run_type}` })),
        ].sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at));
        setRows(merged);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load runs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns: Column<RunRow>[] = [
    {
      key: "id",
      header: "Job ID",
      sortable: true,
      sortValue: (r) => r.id,
      render: (r) => <span className="font-mono text-xs text-slate-400">{r.id.slice(0, 8)}</span>,
    },
    {
      key: "client",
      header: "Client FK",
      render: (r) => <span className="font-mono text-xs">{r.client_agent_id || "—"}</span>,
    },
    {
      key: "type",
      header: "Run type",
      sortable: true,
      sortValue: (r) => r.run_type,
      render: (r) => r.run_type,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill label={r.status} />,
    },
    {
      key: "duration",
      header: "Duration",
      render: (r) => (r.duration_ms != null ? `${Math.round(r.duration_ms / 1000)}s` : "—"),
    },
    {
      key: "started",
      header: "Started",
      sortable: true,
      sortValue: (r) => +new Date(r.started_at),
      render: (r) => new Date(r.started_at).toLocaleString(),
    },
    {
      key: "out",
      header: "Output",
      render: (r) => (
        <button
          type="button"
          onClick={() => setExpanded(r)}
          className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
        >
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Activity Logs</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">agent_runs stream</h1>
        <p className="mt-1 text-sm text-slate-400">Aggregated from LinkedIn and Lawyer admin stats endpoints.</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <DataTable
          rows={rows}
          columns={columns}
          searchKeys={[(r) => r.id, (r) => r.run_type, (r) => r.status, (r) => r.client_agent_id || ""]}
        />
      )}

      {expanded ? (
        <JsonInspector
          title={`output_summary · ${expanded.id.slice(0, 8)}`}
          data={expanded.output_summary || { error_message: expanded.error_message }}
        />
      ) : null}
    </div>
  );
}
