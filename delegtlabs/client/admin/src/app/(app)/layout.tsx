import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopNav } from "@/components/layout/top-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-background">
        <TopNav />
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-mesh opacity-70" />
          <main className="relative mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
