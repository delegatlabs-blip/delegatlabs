"use client";

import { useEffect, useState } from "react";
import { Check, BriefcaseBusiness, Scale } from "lucide-react";
import { fetchCheckoutCatalog, fetchRegisteredAgents, type RegisteredAgent } from "@/lib/api";
import { capabilityLabel } from "@/lib/cron";
import { CardSkeleton, StatusPill } from "@/components/agents/shared";
import { CheckoutDrawer } from "@/components/marketplace/CheckoutDrawer";

const BADGES: Record<string, string[]> = {
  "linkedin-agent": ["LinkedIn", "Lead Gen + PR"],
  "lawyer-agent": ["Legal Tech", "Guided Drafting"],
};

export default function MarketplacePage() {
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RegisteredAgent | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [registered, catalog] = await Promise.all([
          fetchRegisteredAgents(),
          fetchCheckoutCatalog(),
        ]);
        const priceBySlug = Object.fromEntries(
          (catalog.agents || []).map((a) => [a.slug, a]),
        );
        setAgents(
          registered.map((a) => ({
            ...a,
            ...priceBySlug[a.slug],
            capabilities: a.capabilities?.length
              ? a.capabilities
              : priceBySlug[a.slug]?.capabilities || [],
          })),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load marketplace");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <CardSkeleton className="h-80" />
        <CardSkeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Marketplace</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Agent catalog</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sourced from <code className="text-indigo-300">GET /agents/registered</code> — LinkedIn and Lawyer only.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {agents.map((agent) => {
          const Icon = agent.slug === "lawyer-agent" ? Scale : BriefcaseBusiness;
          const badges = BADGES[agent.slug] || [agent.category];
          return (
            <article
              key={agent.slug}
              className="flex flex-col rounded-xl border border-white/10 bg-[#111827] p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{agent.name}</h2>
                    <p className="text-xs text-slate-500">v{agent.version}</p>
                  </div>
                </div>
                <StatusPill label={agent.status || "active"} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-200"
                  >
                    {b}
                  </span>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-400">
                {agent.description || "Production-ready agent package from the plugin registry."}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {(agent.capabilities || []).map((cap) => (
                  <li key={cap} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="h-4 w-4 text-emerald-400" />
                    {capabilityLabel(cap)}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <p className="text-xl font-semibold text-white">
                  ${agent.price_usd ?? agent.base_price_usd ?? 199}
                  <span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelected(agent)}
                  className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
                >
                  Configure & Subscribe
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <CheckoutDrawer agent={selected} open={!!selected} onClose={() => setSelected(null)} />
    </div>
  );
}
