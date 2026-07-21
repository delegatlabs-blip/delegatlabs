"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AgentCard, AgentCardSkeleton } from "@/components/admin/AgentCard";
import { FilterField, PageHeader } from "@/components/admin/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Agent, adminApi } from "@/lib/api";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    adminApi
      .listAgents({ category: category || undefined, status: status || undefined })
      .then(setAgents)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [category, status]);

  async function deactivateAgent(id: string) {
    const previous = agents;
    setAgents((curr) => curr.map((a) => (a.id === id ? { ...a, status: "deprecated" } : a)));
    try {
      await adminApi.deleteAgent(id);
    } catch (e) {
      setAgents(previous);
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <>
      <PageHeader title="Agents" subtitle="Manage your agentic AI product catalog.">
        <FilterField label="Category">
          <select className="azia-input w-40" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            <option value="linkedin">LinkedIn</option>
            <option value="legal">Legal</option>
          </select>
        </FilterField>
        <FilterField label="Status">
          <select className="azia-input w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </FilterField>
        <button
          type="button"
          className="mt-auto inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-violet-500 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-violet-500/30"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Add Agent
        </button>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">No agents found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onDeactivate={deactivateAgent} />
          ))}
        </div>
      )}
    </>
  );
}
