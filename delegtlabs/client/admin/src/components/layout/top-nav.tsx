"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Moon, Sun, Command as CommandIcon, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logoutOwnerAction } from "@/lib/domains/auth/controllers/auth.controller";
import { useAdminAuthStore } from "@/lib/domains/auth/session-store";
import { useTheme } from "./theme-provider";
import { CommandPalette } from "./command-palette";

const labelFromPath = (segment: string) =>
  segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function TopNav() {
  const [openCmd, setOpenCmd] = useState(false);
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const session = useAdminAuthStore((s) => s.session);
  const clearSession = useAdminAuthStore((s) => s.clear);

  const onSignOut = async () => {
    try {
      await logoutOwnerAction();
    } catch {
      /* still clear local session */
    }
    clearSession();
    toast.success("Signed out");
    router.replace("/login");
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCmd((v) => !v);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />
      <nav className="hidden items-center gap-1.5 text-sm md:flex">
        <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
          Delegate Labs
        </Link>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-muted-foreground/50">/</span>
            <span className={i === segments.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
              {labelFromPath(seg)}
            </span>
          </span>
        ))}
        {segments.length === 0 && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-medium">Dashboard</span>
          </>
        )}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setOpenCmd(true)}
          className="group hidden h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:text-foreground md:flex md:w-72"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Search anything…</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <CommandIcon className="h-3 w-3" />K
          </kbd>
        </button>

        <Button size="sm" className="hidden shadow-elegant sm:inline-flex">
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Button>

        <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications <Badge variant="secondary">3 new</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {[
              { title: "New signup", desc: "Jordan Miles just joined your workspace.", time: "2m" },
              { title: "Payment received", desc: "$1,240 from Acme Inc.", time: "1h" },
              { title: "Deployment succeeded", desc: "main → production", time: "3h" },
            ].map((n) => (
              <DropdownMenuItem key={n.title} className="flex flex-col items-start gap-0.5 py-2.5">
                <div className="flex w-full items-center justify-between">
                  <p className="text-sm font-medium">{n.title}</p>
                  <span className="text-[11px] text-muted-foreground">{n.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{n.desc}</p>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                <AvatarImage src="https://i.pravatar.cc/64?img=13" alt={session?.name || "Admin"} />
                <AvatarFallback>
                  {(session?.name || "AD")
                    .split(" ")
                    .map((s) => s[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.name || "Admin"}</p>
              <p className="text-xs text-muted-foreground">
                {session?.email || "admin@delegtlabs.com"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Team</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Sparkles className="h-4 w-4" /> Upgrade to Pro
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                void onSignOut();
              }}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette open={openCmd} onOpenChange={setOpenCmd} />
    </header>
  );
}
