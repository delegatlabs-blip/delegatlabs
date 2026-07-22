"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Scale, Sparkles, type LucideIcon } from "lucide-react";
import { FilterField, PageHeader } from "@/components/admin/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Agent, Plan, adminApi } from "@/lib/api";

function formatPrice(value: string, currency: "INR" | "USD") {
  const amount = Number(value);
  if (amount === 0) return "Custom";

  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

type AgentTheme = {
  label: string;
  icon: LucideIcon;
  headerClass: string;
  chipClass: string;
  accentText: string;
  buttonHover: string;
  quotaLabel: string;
};

const agentThemes: Record<string, AgentTheme> = {
  linkedin: {
    label: "LinkedIn",
    icon: BriefcaseBusiness,
    headerClass: "bg-gradient-to-br from-teal-700 to-teal-600",
    chipClass: "bg-teal-50 text-teal-800 ring-teal-200/70",
    accentText: "text-teal-700",
    buttonHover: "hover:bg-teal-50",
    quotaLabel: "Posts / Month",
  },
  legal: {
    label: "Legal",
    icon: Scale,
    headerClass: "bg-gradient-to-br from-amber-700 to-amber-600",
    chipClass: "bg-amber-50 text-amber-800 ring-amber-200/70",
    accentText: "text-amber-800",
    buttonHover: "hover:bg-amber-50",
    quotaLabel: "Drafts / Month",
  },
};

const defaultTheme: AgentTheme = {
  label: "Agent",
  icon: Sparkles,
  headerClass: "bg-gradient-to-br from-violet-700 to-violet-600",
  chipClass: "bg-violet-50 text-violet-700 ring-violet-200/70",
  accentText: "text-violet-700",
  buttonHover: "hover:bg-violet-50",
  quotaLabel: "Quota / Month",
};

function primaryAgentId(plan: Plan): string | null {
  return plan.included_agents[0]?.agent_id ?? null;
}

function planBlurb(plan: Plan, agent: Agent | undefined) {
  if (plan.is_custom) {
    return "Custom quotas, dedicated onboarding, and enterprise support.";
  }
  const quota = plan.included_agents[0]?.included_quota;
  const unit =
    agent?.category === "legal"
      ? "drafts"
      : agent?.category === "linkedin"
        ? "posts"
        : "runs";
  if (quota != null) {
    return `Includes ${quota} ${unit}/month for ${agent?.name ?? "this agent"}.`;
  }
  return `Single-agent subscription for ${agent?.name ?? "this agent"}.`;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agentFilter, setAgentFilter] = useState("");

  useEffect(() => {
    Promise.all([adminApi.listPlans(), adminApi.listAgents()])
      .then(([planRows, agentRows]) => {
        setPlans(planRows);
        setAgents(agentRows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  const agentsById = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach((agent) => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const grouped = useMemo(() => {
    const groups = new Map<
      string,
      { agent: Agent | null; agentId: string; plans: Plan[] }
    >();

    for (const plan of plans) {
      const agentId = primaryAgentId(plan) ?? "unassigned";
      if (agentFilter && agentId !== agentFilter) continue;

      const existing = groups.get(agentId);
      if (existing) {
        existing.plans.push(plan);
      } else {
        groups.set(agentId, {
          agentId,
          agent: agentsById.get(agentId) ?? null,
          plans: [plan],
        });
      }
    }

    // Prefer known catalog agents order, then leftovers
    const orderedIds = [
      ...agents.map((a) => a.id),
      ...[...groups.keys()].filter((id) => !agents.some((a) => a.id === id)),
    ];

    return orderedIds
      .filter((id) => groups.has(id))
      .map((id) => groups.get(id)!)
      .map((group) => ({
        ...group,
        plans: [...group.plans].sort((a, b) => Number(a.price_inr) - Number(b.price_inr)),
      }));
  }, [plans, agents, agentsById, agentFilter]);

  return (
    <>
      <PageHeader
        title="Subscription Plans"
        subtitle="Agent-wise tiers — each plan is scoped to a single agent product."
      >
        <FilterField label="Agent">
          <select
            className="azia-input w-52"
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
          >
            <option value="">All Agents</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </FilterField>
        <button type="button" className="azia-btn-primary mt-auto">
          + Create Plan
        </button>
      </PageHeader>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">Loading plans...</p>
          </CardBody>
        </Card>
      ) : grouped.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-azia-muted">No plans configured</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ agentId, agent, plans: agentPlans }) => {
            const theme = agentThemes[agent?.category ?? ""] ?? defaultTheme;
            const Icon = theme.icon;

            return (
              <section key={agentId} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${theme.chipClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {theme.label}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-slate-900">
                        {agent?.name ?? "Unassigned plans"}
                      </h2>
                      <p className="text-xs text-azia-muted">
                        {agent?.slug ?? agentId} · {agentPlans.length} tier
                        {agentPlans.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {agentPlans.map((plan) => {
                    const quota = plan.included_agents[0]?.included_quota;
                    return (
                      <Card key={plan.id} className="flex h-full flex-col overflow-hidden">
                        <div className={`px-5 py-4 text-white ${theme.headerClass}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-lg font-semibold">{plan.name}</h3>
                              <p className="mt-1 text-xs capitalize opacity-80">
                                {plan.billing_cycle} billing
                              </p>
                            </div>
                            <span className="rounded border border-white/30 px-2 py-0.5 text-[11px] font-medium">
                              {plan.is_custom ? "Enterprise" : "Standard"}
                            </span>
                          </div>
                          <p className="mt-4 text-2xl font-bold">
                            {formatPrice(plan.price_inr, "INR")}
                            <span className="text-sm font-normal opacity-80">
                              /{plan.billing_cycle}
                            </span>
                          </p>
                        </div>
                        <CardBody className="flex h-full flex-col space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-azia-muted">USD Price</span>
                            <span className="font-medium text-azia-text">
                              {formatPrice(plan.price_usd, "USD")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-azia-muted">Agent</span>
                            <span className={`font-medium ${theme.accentText}`}>
                              {agent?.name ?? "—"}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-azia-muted">{theme.quotaLabel}</span>
                            <span className="font-medium text-azia-text">
                              {quota == null ? "Unlimited" : quota.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-azia-muted">Scope</span>
                            <span className="font-medium text-azia-text">Single agent</span>
                          </div>
                          <div className="rounded border border-azia-border bg-azia-bg px-3 py-2 text-xs leading-5 text-azia-muted">
                            {planBlurb(plan, agent ?? undefined)}
                          </div>
                          <button
                            type="button"
                            className={`mt-auto w-full rounded border border-azia-border py-2 text-xs font-medium ${theme.accentText} ${theme.buttonHover}`}
                          >
                            Edit Plan
                          </button>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
