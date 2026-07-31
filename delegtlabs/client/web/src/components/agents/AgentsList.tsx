"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AgentRow } from "@/components/agents/AgentRow";
import { AgentsPagination } from "@/components/agents/AgentsPagination";
import { useAgentsReveal } from "@/components/agents/useAgentsReveal";
import { fetchAgentsPage } from "@/lib/agents/api";
import type { PaginatedAgents } from "@/lib/agents/types";

type AgentsListProps = {
  initialData: PaginatedAgents;
};

export function AgentsList({ initialData }: AgentsListProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<AbortController | null>(null);

  useAgentsReveal(listRef, data.page);

  const load = useCallback(
    async (page: number, { updateUrl = true } = {}) => {
      requestRef.current?.abort();
      const controller = new AbortController();
      requestRef.current = controller;

      setLoading(true);
      setError(null);
      try {
        const next = await fetchAgentsPage(
          { page, pageSize: initialData.pageSize },
          controller.signal,
        );
        setData(next);
        if (updateUrl) {
          const url = next.page === 1 ? "/agents" : `/agents?page=${next.page}`;
          window.history.pushState({ page: next.page }, "", url);
        }
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("Could not load agents. Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [initialData.pageSize],
  );

  useEffect(() => {
    const onPop = () => {
      const page = Number(new URLSearchParams(window.location.search).get("page") ?? 1);
      load(Number.isFinite(page) && page > 0 ? page : 1, { updateUrl: false });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [load]);

  useEffect(() => () => requestRef.current?.abort(), []);

  const firstIndex = (data.page - 1) * data.pageSize;

  return (
    <section className="bg-white py-8">
      <div className="container mx-auto max-w-6xl px-4 md:px-8">
        <div ref={listRef} className="scroll-mt-24">
          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="text-rose-700">{error}</p>
              <button
                type="button"
                onClick={() => load(data.page)}
                className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
                data-cursor-exclude
              >
                Retry
              </button>
            </div>
          ) : null}

          {!error && data.items.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center text-slate-500">
              No agents to show yet.
            </p>
          ) : null}

          <div
            className={`transition-opacity duration-300 ${loading ? "opacity-40" : "opacity-100"}`}
            aria-busy={loading}
          >
            {data.items.map((agent, i) => (
              <div key={agent.id}>
                <AgentRow
                  agent={agent}
                  index={firstIndex + i + 1}
                  flipped={(firstIndex + i) % 2 === 1}
                />
                {i < data.items.length - 1 ? (
                  <div className="ag-divider h-px origin-left bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-10">
          <p className="mb-5 text-center text-sm text-slate-500">
            Showing {data.items.length ? firstIndex + 1 : 0}–
            {firstIndex + data.items.length} of {data.total}
          </p>
          <AgentsPagination
            page={data.page}
            totalPages={data.totalPages}
            disabled={loading}
            onChange={load}
          />
        </div>
      </div>
    </section>
  );
}
