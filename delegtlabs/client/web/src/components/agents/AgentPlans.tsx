"use client";

import { useState } from "react";

import { accentColors, formatPrice, type Agent, type Plan } from "@/lib/agents/types";

type PlanMode = "subscription" | "credit";

function PlanCard({ plan, accent }: { plan: Plan; accent: string }) {
  return (
    <div className="flex items-center justify-between gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{plan.name}</p>
        <p className="mt-1 text-sm text-slate-500">{plan.note}</p>
      </div>
      <p className="shrink-0 text-lg font-bold" style={{ color: accent }}>
        {formatPrice(plan)}
      </p>
    </div>
  );
}

export function AgentPlans({ agent }: { agent: Agent }) {
  const [mode, setMode] = useState<PlanMode>("subscription");
  const plans = agent.plans[mode];
  const accent = accentColors[agent.accent];

  return (
    <section className="site-section py-16 md:py-20">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
        Plans
      </h2>

      <div
        className="mt-6 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1"
        role="tablist"
        aria-label="Plan type"
      >
        {(["subscription", "credit"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              mode === value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            data-cursor-exclude
          >
            {value === "subscription" ? "Subscription" : "Credit-based"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2" role="tabpanel">
        {plans.length ? (
          plans.map((plan) => <PlanCard key={plan.id} plan={plan} accent={accent} />)
        ) : (
          <p className="text-slate-500">No plans configured for this option yet.</p>
        )}
      </div>
    </section>
  );
}
