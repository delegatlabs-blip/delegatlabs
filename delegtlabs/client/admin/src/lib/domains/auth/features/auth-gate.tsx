"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuthStore } from "../session-store";

const PUBLIC_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
]);
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_ADMIN_AUTH === "true";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAdminAuthStore((s) => s.hydrated);
  const session = useAdminAuthStore((s) => s.session);
  const hydrate = useAdminAuthStore((s) => s.hydrate);
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
    const authed = Boolean(session?.token);
    if (!authed && !isPublic) {
      router.replace("/login");
      return;
    }
    if (authed && session?.mustReset && pathname !== "/reset-password") {
      router.replace("/reset-password");
      return;
    }
    if (authed && isPublic && !session?.mustReset) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [hydrated, session, pathname, router]);

  if (!ready && !AUTH_DISABLED) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
