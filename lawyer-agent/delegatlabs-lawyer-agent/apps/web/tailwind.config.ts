import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#0f172a",
          foreground: "#f8fafc",
        },
        accent: {
          DEFAULT: "#d97706",
          foreground: "#fef3c7",
        },
      },
    },
  },
  plugins: [],
};

export default config;
