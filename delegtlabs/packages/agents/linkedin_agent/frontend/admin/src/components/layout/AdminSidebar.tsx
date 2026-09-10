import { createContext, useContext, useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  PanelLeft,
  LogOut,
  Users,
  Building2,
  Shield,
  ClipboardCheck,
  ScrollText,
  Bot,
  UserPlus,
  KeyRound,
  FileText,
} from "lucide-react";

import { cn } from "@shared/lib/utils";
import { Button } from "@shared/components/ui/button";
import { authApi } from "@shared/api";

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
    <Button variant="ghost" size="icon" className={className} onClick={toggle} aria-label="Toggle navigation">
      <PanelLeft className="size-4" />
    </Button>
  );
}

const platformNav = [
  { to: "/overview", icon: LayoutDashboard, label: "Overview", exact: true },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/tenants", icon: Building2, label: "Workspaces" },
  { to: "/posts", icon: FileText, label: "All posts" },
  { to: "/agents", icon: Bot, label: "All agents" },
  { to: "/api-keys", icon: KeyRound, label: "API keys" },
  { to: "/billing", icon: Zap, label: "Billing" },
] as const;

const opsNav = [
  { to: "/approvals", icon: ClipboardCheck, label: "Approvals" },
  { to: "/compliance", icon: Shield, label: "Compliance" },
  { to: "/staff", icon: UserPlus, label: "Staff" },
  { to: "/audit-log", icon: ScrollText, label: "Audit log" },
] as const;

function NavItem({
  to,
  icon: Icon,
  label,
  exact,
  collapsed,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  exact?: boolean;
  collapsed: boolean;
}) {
  const location = useLocation();
  const active = exact
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function NavSection({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: readonly { to: string; icon: typeof LayoutDashboard; label: string; exact?: boolean }[];
  collapsed: boolean;
}) {
  return (
    <div>
      {!collapsed && (
        <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className="flex items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
          <Zap className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">AntGrav Admin</p>
            <p className="truncate text-xs text-muted-foreground">You · full platform control</p>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
        <NavSection title="Control" items={platformNav} collapsed={collapsed} />
        <NavSection title="Operations" items={opsNav} collapsed={collapsed} />
      </div>

      <div className="space-y-2 border-t border-sidebar-border px-2 py-3">
        {!collapsed && (
          <p className="px-2 text-[11px] text-muted-foreground">
            Users manage LinkedIn &amp; posts in the user panel (:3005).
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={async () => {
            await authApi.logout();
            window.location.href = "/login";
          }}
        >
          <LogOut className="size-3.5" />
          {!collapsed && "Sign out"}
        </Button>
      </div>
    </aside>
  );
}
