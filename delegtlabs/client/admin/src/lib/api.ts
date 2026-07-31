const API_BASE =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8000/api/admin";

import {
  getAdminAccessToken,
  useAdminAuthStore,
} from "@/lib/domains/auth/session-store";

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) return false;
        const body = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
          email: string;
          role: string;
          name: string;
          subjectId: string;
          mustReset: boolean;
        };
        useAdminAuthStore.getState().setSession({
          token: body.accessToken,
          refreshToken: body.refreshToken,
          email: body.email,
          role: body.role,
          name: body.name,
          subjectId: body.subjectId,
          mustReset: body.mustReset,
        });
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

function redirectToLogin() {
  useAdminAuthStore.getState().clear();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = async () => {
    const token = getAdminAccessToken();
    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });
  };

  let res = await doFetch();
  if (res.status === 401) {
    const ok = await tryRefresh();
    if (!ok) {
      redirectToLogin();
      throw new Error("Session expired");
    }
    res = await doFetch();
    if (res.status === 401) {
      redirectToLogin();
      throw new Error("Session expired");
    }
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export { API_BASE };
