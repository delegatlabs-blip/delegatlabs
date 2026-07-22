"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Shield,
  Sparkles,
} from "lucide-react";
import { fetchRegisteredAgents, type RegisteredAgent } from "@/lib/api";
import { cn } from "@/lib/cn";
import { StatusPill } from "@/components/agents/shared";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/agents", label: "My Agents", icon: Bot },
  { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/activity", label: "Activity Logs", icon: Activity },
  { href: "/admin", label: "Admin Console", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const [agents, setAgents] = useState<RegisteredAgent[]>([]);
  const [org, setOrg] = useState("Acme SaaS Inc.");

  useEffect(() => {
    fetchRegisteredAgents()
      .then(setAgents)
      .catch(() => setAgents([]));
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-white/10 bg-[#0B0F17] transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-4">
        <div className={cn("flex items-center gap-2 overflow-hidden", collapsed && "justify-center w-full")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">Delegatlabs</p>
              <p className="truncate text-[11px] text-slate-500">Multi-Agent Platform</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "rounded-md border border-white/10 p-1 text-slate-400 hover:bg-white/5 hover:text-white",
            collapsed && "absolute right-2 top-4",
          )}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed ? (
        <div className="border-b border-white/10 px-3 py-3">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Organization
          </label>
          <select
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111827] px-2.5 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
          >
            <option>Acme SaaS Inc.</option>
            <option>Northwind Labs</option>
            <option>Beacon AI</option>
          </select>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-500/15 text-indigo-200"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                collapsed && "justify-center",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed ? item.label : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        {!collapsed ? (
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Installed agents
          </p>
        ) : null}
        <div className="space-y-1.5">
          {agents.map((agent) => (
            <Link
              key={agent.slug}
              href={agent.user_route || `/dashboard/agents/${agent.slug}`}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-white/10 bg-[#111827]/60 px-2 py-1.5 hover:bg-white/5",
                collapsed && "justify-center",
              )}
              title={agent.name}
            >
              <StatusPill label={agent.status || "active"} tone="success" className="!px-1.5 !py-0" />
              {!collapsed ? (
                <span className="truncate text-xs text-slate-300">{agent.name}</span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
