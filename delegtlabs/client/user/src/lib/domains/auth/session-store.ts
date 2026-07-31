import { create } from "zustand";
import type { AuthSession, SessionClaims } from "./types";
import { decodeJwtPayload, requireTenantId } from "./utils/jwt";

const TOKEN_KEY = "delegtlabs_user_access_token";
const REFRESH_KEY = "delegtlabs_user_refresh_token";
const NAME_KEY = "delegtlabs_user_name";

type AuthState = {
  token: string | null;
  refreshToken: string | null;
  claims: SessionClaims | null;
  name: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  getTenantId: () => string;
};

function loadToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  claims: null,
  name: null,
  hydrated: false,

  hydrate: () => {
    const token = loadToken();
    const refreshToken =
      typeof window !== "undefined" ? window.localStorage.getItem(REFRESH_KEY) : null;
    const name =
      typeof window !== "undefined" ? window.localStorage.getItem(NAME_KEY) : null;
    const claims = token ? decodeJwtPayload(token) : null;
    set({ token, refreshToken, claims, name, hydrated: true });
  },

  setSession: (session) => {
    window.localStorage.setItem(TOKEN_KEY, session.accessToken);
    window.localStorage.setItem(REFRESH_KEY, session.refreshToken);
    window.localStorage.setItem(NAME_KEY, session.name);
    const claims = decodeJwtPayload(session.accessToken);
    set({
      token: session.accessToken,
      refreshToken: session.refreshToken,
      claims,
      name: session.name,
      hydrated: true,
    });
  },

  clearSession: () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(NAME_KEY);
    set({ token: null, refreshToken: null, claims: null, name: null, hydrated: true });
  },

  getTenantId: () => requireTenantId(get().claims),
}));

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getSessionClaims(): SessionClaims | null {
  const token = getAccessToken();
  return token ? decodeJwtPayload(token) : null;
}

export function requireSessionTenantId(): string {
  return requireTenantId(getSessionClaims());
}
