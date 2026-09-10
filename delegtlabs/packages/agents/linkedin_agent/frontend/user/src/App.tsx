import type { ReactNode } from "react";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { authApi, onboardingApi } from "@shared/api";
import { isOnboardingComplete } from "@shared/components/onboarding/onboarding-status";
import { Alert, AlertDescription } from "@shared/components/ui/alert";
import { Toaster } from "@shared/components/ui/sonner";
import { TooltipProvider } from "@shared/components/ui/tooltip";
import {
  AppSidebarProvider,
  AppSidebar,
} from "@/components/layout/UserSidebar";
import { UserTopbar } from "@/components/layout/UserTopbar";
import { MobileNav } from "@/components/layout/MobileNav";
import OnboardingGatePage from "@/pages/Onboarding";
import Topics from "@/pages/Topics";
import SettingsPage from "@/pages/Settings";
import PostGenAgentPage from "@/pages/agents/PostGen";
import LeadGenAgentPage from "@/pages/agents/LeadGen";
import AnalyticsAgentPage from "@/pages/agents/Analytics";
import TenantConnectionsPage from "@/pages/TenantConnections";
import ManageSubscriptionPage from "@/pages/billing/ManageSubscription";
import InvoicePage from "@/pages/billing/InvoicePage";
import SignInPage from "@/pages/auth/SignIn";
import { RequireAuth } from "@/components/auth/RequireAuth";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/** Surface LinkedIn OAuth redirect outcomes (?auth=success | ?auth_error=…). */
function AuthRedirectToast() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const err = params.get("auth_error");
    const ok = params.get("auth");
    if (!err && ok !== "success") return;

    if (err) {
      const decoded = decodeURIComponent(err.replace(/\+/g, " "));
      toast.error("LinkedIn connection failed", {
        description: decoded,
        duration: 12_000,
      });
    } else if (ok === "success") {
      toast.success("LinkedIn connected");
      void queryClient.invalidateQueries({ queryKey: ["auth-status"] });
      void queryClient.invalidateQueries({ queryKey: ["tenant-connections"] });
    }

    params.delete("auth_error");
    params.delete("auth");
    const next = params.toString();
    navigate(
      { pathname: location.pathname, search: next ? `?${next}` : "" },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate]);

  return null;
}

function TokenBanner() {
  const { data } = useQuery({
    queryKey: ["auth-status"],
    queryFn: authApi.status,
    refetchInterval: 60_000,
  });
  if (!data || (!data.connected && !data.expired)) return null;
  if (data.expired) {
    return (
      <Alert variant="destructive" className="safe-x rounded-none border-x-0 border-t-0">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          LinkedIn token expired — reconnect in Settings.
        </AlertDescription>
      </Alert>
    );
  }
  if (data.expiry_warning) {
    return (
      <Alert className="safe-x rounded-none border-x-0 border-t-0 border-warning/35 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="size-4" />
        <AlertDescription>
          LinkedIn token expires in <strong>{data.days_to_expiry} days</strong>.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <AppSidebarProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <UserTopbar />
          <TokenBanner />
          <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="app-page app-page-scroll app-page-pad animate-fade-in py-5 pb-mobile-nav lg:py-6">
              {children}
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    </AppSidebarProvider>
  );
}

/** Block dashboard until persona onboarding is complete. */
function RequireOnboarding({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: onboardingApi.get,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!isOnboardingComplete((data as Record<string, unknown> | undefined) ?? null)) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

function OnboardingRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ["onboarding"],
    queryFn: onboardingApi.get,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Allow /onboarding only when incomplete. Adaptive-complete users pick topics first.
  // Legacy complete without adaptive completed still goes to dashboard.
  if (isOnboardingComplete((data as Record<string, unknown> | undefined) ?? null)) {
    const adaptive = data?.adaptive;
    if (adaptive?.status === "completed" || adaptive?.complete === true) {
      return <Navigate to="/topics?tab=weights" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <OnboardingGatePage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>
        <BrowserRouter>
          <AuthRedirectToast />
          <Toaster />
          <Routes>
          {/* Public: the only routes reachable without a session. */}
          <Route path="/signin" element={<SignInPage />} />
          {/* Same component; it opens in sign-up mode based on the path. */}
          <Route path="/signup" element={<SignInPage />} />
          <Route path="/signed-out" element={<Navigate to="/signin" replace />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/*"
            element={
              <RequireAuth>
              <RequireOnboarding>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Navigate to="/dashboard/agents/post-gen" replace />} />
                  <Route path="/dashboard/onboarding" element={<Navigate to="/onboarding" replace />} />
                  <Route path="/dashboard/agents/post-gen" element={<Layout><PostGenAgentPage /></Layout>} />
                  <Route path="/dashboard/agents/lead-gen" element={<Layout><LeadGenAgentPage /></Layout>} />
                  <Route path="/dashboard/agents/analytics" element={<Layout><AnalyticsAgentPage /></Layout>} />
                  <Route path="/dashboard/billing" element={<Layout><ManageSubscriptionPage /></Layout>} />
                  <Route path="/dashboard/billing/invoices/:id" element={<InvoicePage />} />
                  <Route path="/dashboard/connections" element={<Layout><TenantConnectionsPage /></Layout>} />
                  <Route path="/dashboard/team" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/posts" element={<Navigate to="/dashboard/agents/post-gen" replace />} />
                  <Route path="/editor" element={<Navigate to="/dashboard/agents/post-gen" replace />} />
                  <Route path="/editor/:id" element={<Navigate to="/dashboard/agents/post-gen" replace />} />
                  <Route path="/topics" element={<Layout><Topics /></Layout>} />
                  <Route path="/performance" element={<Navigate to="/dashboard/agents/analytics" replace />} />
                  <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </RequireOnboarding>
              </RequireAuth>
            }
          />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
