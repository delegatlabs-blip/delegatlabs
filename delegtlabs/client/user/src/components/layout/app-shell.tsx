"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";

const BARE_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (BARE_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[image:var(--gradient-subtle)]">
        <Topbar />
        <main className="flex-1">{children}</main>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
}
