/**
 * Shared HTTP client for the user API.
 * Always attaches the JWT so the server can extract tenant_id.
 * On 401, tries refresh token once; if refresh fails, redirects to login.
 */

import {
  getAccessToken,
  requireSessionTenantId,
  useAuthStore,
} from "@/lib/domains/auth/session-store";
import type { AuthSession } from "@/lib/domains/auth/types";

const API_BASE = process.env.NEXT_PUBLIC_USER_API_URL || "http://localhost:8000/user/api/v1";
const AUTH_DISABLED = process.env.NEXT_PUBLIC_DISABLE_USER_AUTH === "true";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  requireTenant?: boolean;
};

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok) return false;
        const session = (await res.json()) as AuthSession;
        useAuthStore.getState().setSession(session);
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
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

export async function userRequest<T>(path: string, init?: RequestOptions): Promise<T> {
  const mustRequireTenant = init?.requireTenant !== false && !AUTH_DISABLED;
  if (mustRequireTenant) {
    requireSessionTenantId();
  }

  const doFetch = async () => {
    const token = getAccessToken();
    const headers: HeadersInit = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    };
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
    const rest = { ...(init || {}) };
    delete (rest as { requireTenant?: boolean }).requireTenant;
    return fetch(`${API_BASE}${path}`, { ...rest, headers });
  };

  let res = await doFetch();
  if (res.status === 401 && !AUTH_DISABLED) {
    const ok = await tryRefresh();
    if (!ok) {
      redirectToLogin();
      throw new ApiError("Session expired", 401);
    }
    res = await doFetch();
    if (res.status === 401) {
      redirectToLogin();
      throw new ApiError("Session expired", 401);
    }
  }

  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let message = `API ${res.status}: ${path}`;
    try {
      const body = (await res.json()) as { error?: { message?: string }; detail?: string };
      message = body.error?.message || body.detail || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export { API_BASE, AUTH_DISABLED };
