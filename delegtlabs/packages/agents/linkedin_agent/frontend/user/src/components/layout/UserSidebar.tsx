import { createContext, useContext, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Sliders,
  BarChart3,
  Settings,
  Zap,
  PanelLeft,
  LogOut,
  Link2,
  Users,
  Bot,
  CreditCard,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { authApi, sessionApi } from "@shared/api";

type SidebarCtx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarCtx | null>(null);

export function useAppSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useAppSidebar must be used within AppSidebarProvider");
  return ctx;
}

export function AppSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, toggle: () => setCollapsed((c) => !c) }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useAppSidebar();
  return (
    <Button variant="ghost" size="icon" className={cn("size-11 lg:size-9", className)} onClick={toggle} aria-label="Toggle navigation">
      <PanelLeft className="size-4" />
    </Button>
  );
}

const AGENT_NAV: Record<
  string,
  { to: string; icon: typeof Bot; label: string; disabled?: boolean }
> = {
  post_gen: { to: "/dashboard/agents/post-gen", icon: Bot, label: "Post Gen" },
  lead_gen: {
    to: "/dashboard/agents/lead-gen",
    icon: Users,
    label: "Lead Gen",
    disabled: true,
  },
  analytics: {
    to: "/dashboard/agents/analytics",
    icon: BarChart3,
    label: "Analytics",
    disabled: true,
  },
};

function NavItem({
  to,
  icon: Icon,
  label,
  exact,
  collapsed,
  disabled,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  collapsed: boolean;
  disabled?: boolean;
}) {
  const location = useLocation();
  const active =
    !disabled &&
    (exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`));

  const body = disabled ? (
    <span
      title={collapsed ? `${label} (coming soon)` : undefined}
      aria-disabled="true"
      className={cn(
        "flex cursor-not-allowed items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground/50",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-[18px] shrink-0 opacity-50" />
      {!collapsed && (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2 truncate">
          <span className="truncate">{label}</span>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide opacity-70">
            Soon
          </span>
        </span>
      )}
    </span>
  ) : (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-fast",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-surface-hover",
      )}
    >
      {active ? (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      ) : null}
      <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );

  if (!collapsed) return body;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{body}</TooltipTrigger>
      <TooltipContent side="right">{disabled ? `${label} (coming soon)` : label}</TooltipContent>
    </Tooltip>
  );
}

function NavSection({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: readonly {
    to: string;
    icon: typeof LayoutDashboard;
    label: string;
    exact?: boolean;
    disabled?: boolean;
  }[];
  collapsed: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      {!collapsed && (
        <p className="mb-1.5 px-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          {title}
        </p>
      )}
      <nav className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const { collapsed } = useAppSidebar();
  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const linkedinLoginUrl = authApi.loginUrl();

  const workspaceNav = [
    AGENT_NAV.post_gen,
    AGENT_NAV.lead_gen,
    AGENT_NAV.analytics,
    { to: "/dashboard/connections", icon: Link2, label: "Connections" },
    { to: "/dashboard/billing", icon: CreditCard, label: "Manage Subscription" },
  ] as const;

  const contentNav = [
    { to: "/topics", icon: Sliders, label: "Topics" },
  ] as const;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex",
        collapsed ? "w-[4.25rem]" : "w-60",
      )}
    >
      <div className={cn("flex items-center gap-2.5 border-b border-sidebar-border px-3 py-3", collapsed && "justify-center px-2")}>
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
          <Zap className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">AntGrav</p>
            <p className="truncate text-xs text-muted-foreground">Your agents</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
        <NavSection title="Workspace" items={workspaceNav} collapsed={collapsed} />
        <NavSection title="Content" items={contentNav} collapsed={collapsed} />
      </div>

      <div className="space-y-2 border-t border-sidebar-border px-2 py-3">
        <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
        {!collapsed && (
          <>
            {authStatus?.connected ? (
              <div className="rounded-lg border border-border-subtle bg-surface-secondary px-2.5 py-2">
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-success" />
                  <span className="truncate text-xs font-medium">
                    {authStatus.display_name ?? "Connected"}
                  </span>
                </div>
              </div>
            ) : (
              <a
                href={linkedinLoginUrl}
                className="flex items-center gap-2 rounded-lg border border-primary/25 bg-primary-soft px-2.5 py-2 text-xs font-medium text-accent-foreground hover:bg-primary/10"
              >
                <Link2 className="size-3.5" />
                Connect LinkedIn
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={async () => {
                await sessionApi.signOut();
                // Full reload so no cached tenant data survives the sign-out.
                window.location.href = "/signin";
              }}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
