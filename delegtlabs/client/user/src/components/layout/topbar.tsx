"use client";

import { usePathname } from "next/navigation";
import { Bell, Moon, Search, Sun, MessageSquare, LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/store/ui-store";
import { AUTH_DISABLED } from "@/lib/api";
import { logoutUseCase, useAuthStore } from "@/lib/domains/auth";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function useCrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: "Dashboard", href: "/" }];
  return [
    { label: "Home", href: "/" },
    ...parts.map((p, i) => ({
      label: p.charAt(0).toUpperCase() + p.slice(1),
      href: "/" + parts.slice(0, i + 1).join("/"),
    })),
  ];
}

export function Topbar() {
  const { theme, toggleTheme, setCommandOpen } = useUIStore();
  const crumbs = useCrumbs();
  const router = useRouter();
  const name = useAuthStore((s) => s.name);
  const claims = useAuthStore((s) => s.claims);
  const initials = (name || claims?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="size-8" />
      <Separator orientation="vertical" className="h-6" />
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <BreadcrumbItem>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage className="text-sm font-medium">{c.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={c.href} className="text-sm text-muted-foreground">
                    {c.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {i < crumbs.length - 1 && <BreadcrumbSeparator />}
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden h-9 items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3.5 text-sm text-muted-foreground shadow-[var(--shadow-soft)] transition-all hover:bg-muted hover:text-foreground md:flex md:w-72"
          aria-label="Open command palette"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        <Button variant="ghost" size="icon" className="relative size-9 rounded-full" aria-label="Messages">
          <MessageSquare className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" className="relative size-9 rounded-full" aria-label="Notifications">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[image:var(--gradient-primary)] ring-2 ring-background" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-full"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
        <Avatar className="size-8 ring-2 ring-border/60">
          <AvatarFallback className="bg-[image:var(--gradient-primary)] text-xs font-semibold text-white">
            {initials || "U"}
          </AvatarFallback>
        </Avatar>
        {!AUTH_DISABLED && (
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label="Sign out"
            onClick={() => {
              logoutUseCase();
              router.replace("/login");
            }}
          >
            <LogOut className="size-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
