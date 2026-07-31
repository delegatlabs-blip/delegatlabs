import { create } from "zustand";

type Theme = "light" | "dark";

type UIState = {
  theme: Theme;
  commandOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setCommandOpen: (open: boolean) => void;
  initTheme: () => void;
};

const STORAGE_KEY = "vertex-theme";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  commandOpen: false,
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const next: Theme = s.theme === "light" ? "dark" : "light";
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return { theme: next };
    }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  initTheme: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      const prefersDark =
        typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
      applyTheme(initial);
      set({ theme: initial });
    } catch {}
  },
}));
