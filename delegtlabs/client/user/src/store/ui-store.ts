import { create } from "zustand";

type UIState = {
  theme: "light" | "dark";
  commandOpen: boolean;
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
  setCommandOpen: (open: boolean) => void;
};

export const useUIStore = create<UIState>((set) => ({
  theme: "light",
  commandOpen: false,
  setTheme: (theme) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      return { theme: next };
    }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
}));