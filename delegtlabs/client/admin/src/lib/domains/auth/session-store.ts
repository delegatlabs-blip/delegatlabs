"use client";

import { create } from "zustand";

const STORAGE_KEY = "delegtlabs.admin.session";

export type AdminSession = {
  token: string;
  refreshToken: string;
  email: string;
  role: string;
  name: string;
  subjectId: string;
  mustReset: boolean;
};

type AuthState = {
  hydrated: boolean;
  session: AdminSession | null;
  hydrate: () => void;
  setSession: (s: AdminSession | null) => void;
  clear: () => void;
};

export const useAdminAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  session: null,
  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      set({ session: raw ? (JSON.parse(raw) as AdminSession) : null, hydrated: true });
    } catch {
      set({ session: null, hydrated: true });
    }
  },
  setSession: (session) => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
    set({ session });
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ session: null });
  },
}));

export function getAdminAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as AdminSession).token || null;
  } catch {
    return null;
  }
}

export function getAdminRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return (JSON.parse(raw) as AdminSession).refreshToken || null;
  } catch {
    return null;
  }
}
