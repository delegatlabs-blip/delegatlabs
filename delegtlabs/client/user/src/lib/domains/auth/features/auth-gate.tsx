"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AUTH_DISABLED } from "@/lib/api";
import { useAuthStore } from "@/lib/domains/auth";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);

export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const claims = useAuthStore((s) => s.claims);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (AUTH_DISABLED) {
      setReady(true);
      return;
    }
    const isPublic = PUBLIC_PATHS.has(pathname);
    const authed = Boolean(token && claims?.tenant_id);
    if (!authed && !isPublic) {
      router.replace("/login");
      return;
    }
    if (authed && claims?.must_reset && pathname !== "/reset-password") {
      router.replace("/reset-password");
      return;
    }
    if (authed && isPublic && !claims?.must_reset) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [hydrated, token, claims, pathname, router]);

  if (!ready && !AUTH_DISABLED) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading workspace…
      </div>
    );
  }

  return <>{children}</>;
}
