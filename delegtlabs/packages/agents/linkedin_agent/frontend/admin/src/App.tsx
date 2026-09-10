import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

import { Toaster } from "@shared/components/ui/sonner";
import { adminAuthApi } from "@shared/api";
import {
  AppSidebarProvider,
  AppSidebar,
} from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import LoginPage from "@/pages/Login";
import UsersPage from "@/pages/Users";
import TenantsPage from "@/pages/Tenants";
import TenantDetailPage from "@/pages/TenantDetail";
import CompliancePage from "@/pages/Compliance";
import ApprovalsPage from "@/pages/Approvals";
import StaffPage from "@/pages/Staff";
import AuditLogPage from "@/pages/AuditLog";
import ApiKeysPage from "@/pages/ApiKeys";
import AgentsPage from "@/pages/Agents";
import OverviewPage from "@/pages/Overview";
import BillingPage from "@/pages/Billing";
import PostsPage from "@/pages/Posts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function Layout({ children }: { children: ReactNode }) {
  return (
    <AppSidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar />
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-3 sm:p-5 lg:p-6 animate-fade-in">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </AppSidebarProvider>
  );
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-me"],
    queryFn: adminAuthApi.me,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  }

  if (!data?.ok) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <RequireAdmin>
                <Routes>
                  <Route path="/" element={<Navigate to="/overview" replace />} />
                  <Route path="/overview" element={<Layout><OverviewPage /></Layout>} />
                  <Route path="/users" element={<Layout><UsersPage /></Layout>} />
                  <Route path="/tenants" element={<Layout><TenantsPage /></Layout>} />
                  <Route path="/tenants/:id" element={<Layout><TenantDetailPage /></Layout>} />
                  <Route path="/agents" element={<Layout><AgentsPage /></Layout>} />
                  <Route path="/api-keys" element={<Layout><ApiKeysPage /></Layout>} />
                  <Route path="/compliance" element={<Layout><CompliancePage /></Layout>} />
                  <Route path="/approvals" element={<Layout><ApprovalsPage /></Layout>} />
                  <Route path="/billing" element={<Layout><BillingPage /></Layout>} />
                  <Route path="/staff" element={<Layout><StaffPage /></Layout>} />
                  <Route path="/audit-log" element={<Layout><AuditLogPage /></Layout>} />
                  <Route path="/posts" element={<Layout><PostsPage /></Layout>} />
                  <Route path="*" element={<Navigate to="/overview" replace />} />
                </Routes>
              </RequireAdmin>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
