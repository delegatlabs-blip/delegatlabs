import { Search, ChevronDown, LogOut } from "lucide-react";

import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Avatar, AvatarFallback } from "@shared/components/ui/avatar";
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
import { SidebarTrigger } from "@/components/layout/AdminSidebar";
import { authApi } from "@shared/api";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="hidden h-6 sm:block" />
          <span className="hidden text-sm font-semibold sm:inline">Platform Admin</span>
        </div>

        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tenants, agents…"
            aria-label="Search"
            className="h-9 w-full rounded-full bg-muted pl-9 text-sm"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-primary-soft text-xs font-semibold text-accent-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">Admin</span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:inline" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span>Platform owner</span>
              <Badge variant="secondary" className="mt-1 w-fit">Full access</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await authApi.logout();
                window.location.href = "/login";
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
