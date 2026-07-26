import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  BarChart3,
  Settings,
  FolderKanban,
  CreditCard,
  Bell,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const platform = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Orders", url: "/orders", icon: ShoppingBag },
];

const management = [
  { title: "Users", url: "/users", icon: Users },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const system = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <div className="flex items-center gap-2.5 px-2 py-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-glow)]">
            <Sparkles className="size-4 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
                Vertex OS
              </span>
              <span className="truncate text-[10px] font-medium text-sidebar-foreground/50">
                Enterprise
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        {[
          { label: "Platform", items: platform },
          { label: "Management", items: management },
          { label: "System", items: system },
        ].map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className="group/menu-btn h-9 rounded-lg data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm"
                      >
                        <Link to={item.url as never}>
                          <item.icon className="size-4 shrink-0 transition-transform group-hover/menu-btn:scale-110" />
                          <span className="text-[13px] font-medium">{item.title}</span>
                          {active && (
                            <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/60">
          <Avatar className="size-8 shrink-0 ring-2 ring-sidebar-border/50">
            <AvatarFallback className="bg-[image:var(--gradient-primary)] text-xs font-semibold text-white">
              MC
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-sidebar-foreground">
                Marcus Chen
              </span>
              <span className="truncate text-[11px] text-sidebar-foreground/50">
                marcus@vertex.io
              </span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}