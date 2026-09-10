import { useState } from "react";
import { Search, ChevronDown, LogOut, Link2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@shared/components/ui/avatar";
import { Separator } from "@shared/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu";
import { Badge } from "@shared/components/ui/badge";
import { SidebarTrigger } from "@/components/layout/UserSidebar";
import { authApi, sessionApi } from "@shared/api";

function initialsFrom(name: string | null | undefined, email?: string | null): string {
  const source = (name || "").trim() || (email || "").split("@")[0] || "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserTopbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useQuery({ queryKey: ["session"], queryFn: sessionApi.me });
  const { data: authStatus } = useQuery({ queryKey: ["auth-status"], queryFn: authApi.status });
  const user = session?.user;
  const displayName = user?.full_name || authStatus?.display_name || user?.email || "Account";
  const initials = initialsFrom(user?.full_name || authStatus?.display_name, user?.email);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="safe-x flex h-14 items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="hidden lg:inline-flex" />
          <Separator orientation="vertical" className="hidden h-6 lg:block" />
          <span className="truncate text-sm font-semibold">My workspace</span>
        </div>

        <div className="ml-auto hidden min-w-0 max-w-sm flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts…"
              aria-label="Search"
              className="h-9 rounded-lg bg-surface-secondary pl-9"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:hidden"
            aria-label={searchOpen ? "Close search" : "Open search"}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 shrink-0 gap-2 px-1.5 focus-visible:ring-offset-0 sm:h-9 sm:px-2"
              >
                <Avatar className="size-8 overflow-hidden">
                  {user?.avatar_url ? (
                    <AvatarImage
                      src={user.avatar_url}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback
                    delayMs={0}
                    className="bg-primary-soft text-[11px] font-semibold tracking-wide text-accent-foreground"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
                  {displayName}
                </span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span>{displayName}</span>
                {authStatus?.connected ? (
                  <Badge variant="success" className="mt-1 w-fit">LinkedIn connected</Badge>
                ) : (
                  <Badge variant="outline" className="mt-1 w-fit">Not connected</Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
              {!authStatus?.connected && (
                <DropdownMenuItem asChild>
                  <a href={authApi.loginUrl()}><Link2 className="size-4" />Connect LinkedIn</a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await sessionApi.signOut();
                  // Full reload so no cached tenant data survives the sign-out.
                  window.location.href = "/signin";
                }}
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {searchOpen ? (
        <div className="safe-x border-t border-border-subtle py-2 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts…"
              aria-label="Search"
              autoFocus
              className="h-11 rounded-lg bg-surface-secondary pl-9"
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
