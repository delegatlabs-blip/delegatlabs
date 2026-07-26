import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <TopNav />
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-mesh opacity-70" />
          <main className="relative mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
