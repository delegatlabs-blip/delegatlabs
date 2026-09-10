import { NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  Bot,
  CreditCard,
  Ellipsis,
  Link2,
  LogOut,
  PenSquare,
  Settings,
  Sliders,
} from "lucide-react";
import { useState } from "react";

import { sessionApi } from "@shared/api";
import { Button } from "@shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@shared/components/ui/sheet";
import { cn } from "@shared/lib/utils";

const POST_GEN = "/dashboard/agents/post-gen";

function isPostGenTab(pathname: string, search: string, tab: string) {
  if (pathname !== POST_GEN && !pathname.startsWith(`${POST_GEN}/`)) return false;
  const current = new URLSearchParams(search).get("tab") || "posts";
  return current === tab;
}

export function MobileNav() {
  const location = useLocation();
  const [params] = useSearchParams();
  const [moreOpen, setMoreOpen] = useState(false);
  const tab = params.get("tab") || "posts";

  const items = [
    {
      to: `${POST_GEN}?tab=posts`,
      label: "Posts",
      icon: Bot,
      active: isPostGenTab(location.pathname, location.search, "posts"),
      emphasized: false,
    },
    {
      to: "/topics",
      label: "Topics",
      icon: Sliders,
      active: location.pathname.startsWith("/topics"),
      emphasized: false,
    },
    {
      to: `${POST_GEN}?tab=generation`,
      label: "Create",
      icon: PenSquare,
      active: isPostGenTab(location.pathname, location.search, "generation"),
      emphasized: true,
    },
    {
      to: "/dashboard/connections",
      label: "Connections",
      icon: Link2,
      active: location.pathname.startsWith("/dashboard/connections"),
      emphasized: false,
    },
  ] as const;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] backdrop-blur lg:hidden"
        style={{ height: "calc(var(--mobile-nav-height) + env(safe-area-inset-bottom))" }}
        aria-label="Primary"
      >
        <ul className="grid h-[var(--mobile-nav-height)] grid-cols-5">
          {items.map((item) => (
            <li key={item.label}>
              <NavLink
                to={item.to}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  item.active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full",
                    item.emphasized && "bg-primary text-primary-foreground",
                    item.emphasized && !item.active && "opacity-90",
                    !item.emphasized && item.active && "bg-primary-subtle",
                  )}
                >
                  <item.icon className="size-[18px]" />
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                moreOpen ||
                  location.pathname.startsWith("/settings") ||
                  location.pathname.startsWith("/dashboard/billing")
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
              aria-label="More"
              onClick={() => setMoreOpen(true)}
            >
              <span className="grid size-8 place-items-center">
                <Ellipsis className="size-[18px]" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="mt-4 divide-y overflow-hidden rounded-xl border bg-card">
            <MoreLink to="/dashboard/billing" icon={CreditCard} label="Manage Subscription" onClick={() => setMoreOpen(false)} />
            <MoreLink to="/settings" icon={Settings} label="Settings" onClick={() => setMoreOpen(false)} />
          </div>
          <Button
            variant="ghost"
            className="mt-3 h-12 w-full justify-start text-muted-foreground"
            onClick={async () => {
              await sessionApi.signOut();
              window.location.href = "/signin";
            }}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}

function MoreLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof Settings;
  label: string;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-surface-hover"
    >
      <Icon className="size-4 text-muted-foreground" />
      {label}
    </NavLink>
  );
}
