import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";

export function AppShell({ children }: { children: ReactNode }) {
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