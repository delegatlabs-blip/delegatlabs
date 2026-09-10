import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { sessionApi } from "@shared/api";

/**
 * Gate every dashboard route on a real session.
 *
 * /auth/me answers `authenticated: false` rather than 401, so an anonymous visitor is
 * a normal render path, not a query error to retry.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["session"],
    queryFn: sessionApi.me,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isError || !data?.authenticated) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
