"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BriefcaseBusiness, Scale, Sparkles } from "lucide-react";
import type { Agent } from "@/lib/api";

type AgentCardProps = {
  agent: Agent;
  onDeactivate: (id: string) => void;
};

type CategoryTheme = {
  label: string;
  icon: LucideIcon;
  chipClassName: string;
  iconClassName: string;
};

const categoryThemes: Record<string, CategoryTheme> = {
  linkedin: {
    label: "LinkedIn",
    icon: BriefcaseBusiness,
    chipClassName: "bg-teal-50 text-teal-800 ring-teal-200/70",
    iconClassName: "text-teal-700",
  },
  legal: {
    label: "Legal",
    icon: Scale,
    chipClassName: "bg-amber-50 text-amber-800 ring-amber-200/70",
    iconClassName: "text-amber-700",
  },
};

const statusClasses: Record<string, string> = {
  active: "border-green-200 bg-green-50 text-green-700 before:bg-green-500",
  draft: "border-amber-200 bg-amber-50 text-amber-700 before:bg-amber-500",
  deprecated: "border-slate-200 bg-slate-100 text-slate-500 before:bg-slate-400",
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function formatPrice(value: string, currency: "INR" | "USD") {
  const amount = Number(value);
  if (Number.isNaN(amount)) return currency === "INR" ? `₹${value}` : `$${value}`;

  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    currency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}

function AgentStatusBadge({ status }: { status: string }) {
  const cls = statusClasses[status] ?? "border-violet-200 bg-violet-50 text-violet-700 before:bg-violet-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] ${cls}`}
    >
      {status}
    </span>
  );
}

export function AgentCard({ agent, onDeactivate }: AgentCardProps) {
  const router = useRouter();
  const category = categoryThemes[agent.category] ?? {
    label: formatLabel(agent.category),
    icon: Sparkles,
    chipClassName: "bg-violet-50 text-violet-700 ring-violet-200/70",
    iconClassName: "text-violet-600",
  };
  const CategoryIcon = category.icon;

  const handleCardClick = () => {
    router.push(`/admin/agents/${agent.slug}/dashboard`);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group flex h-full flex-col cursor-pointer rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#7C3AED]/20 hover:shadow-lg hover:shadow-violet-950/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${category.chipClassName}`}
            >
              <CategoryIcon className={`h-3.5 w-3.5 ${category.iconClassName}`} strokeWidth={2.2} />
              {category.label}
            </span>
            <span className="text-lg font-semibold tracking-tight text-slate-950 transition-colors group-hover:text-[#7C3AED]">
              {agent.name}
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[11px] text-slate-400">{agent.slug}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-[10px] font-semibold text-slate-500">
            v{agent.version}
          </span>
          <AgentStatusBadge status={agent.status} />
        </div>
      </div>

      <p className="mt-5 min-h-12 text-sm leading-6 text-slate-500">
        {agent.description ?? "No description added yet."}
      </p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        Billing: <span className="text-slate-500">{formatLabel(agent.billing_unit)}</span>
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
        <p className="text-2xl font-bold tracking-tight text-slate-950">{formatPrice(agent.base_price_inr, "INR")}</p>
        <p className="pb-1 text-sm font-medium text-slate-400">{formatPrice(agent.base_price_usd, "USD")}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <Link
          href={`/admin/agents/detail/${agent.id}`}
          onClick={(e) => e.stopPropagation()}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-[#7C3AED] hover:bg-[#7C3AED] hover:text-white"
        >
          Edit
        </Link>
        {agent.status !== "deprecated" && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate(agent.id);
            }}
            className="text-xs font-semibold text-red-500 transition-colors hover:text-red-600 hover:underline"
          >
            Deactivate
          </button>
        )}
      </div>
    </article>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-24 rounded-full bg-slate-100" />
              <div className="h-5 w-36 rounded bg-slate-100" />
            </div>
            <div className="mt-3 h-3 w-28 rounded bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-10 rounded-full bg-slate-100" />
            <div className="h-7 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="mt-6 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
        <div className="mt-6 h-3 w-36 rounded bg-slate-100" />
        <div className="mt-7 flex items-end gap-3">
          <div className="h-8 w-28 rounded bg-slate-100" />
          <div className="h-4 w-16 rounded bg-slate-100" />
        </div>
        <div className="mt-8 flex items-center justify-between">
          <div className="h-9 w-20 rounded-full bg-slate-100" />
          <div className="h-4 w-20 rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
