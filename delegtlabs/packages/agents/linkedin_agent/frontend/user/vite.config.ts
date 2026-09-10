import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function resolvePkg(name: string) {
  const candidates = [
    path.resolve(__dirname, `./node_modules/${name}`),
    path.resolve(__dirname, `../node_modules/${name}`),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(`Could not resolve ${name} from ${candidates.join(" or ")}`);
  }
  return found;
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevent duplicate React copies when bundling ../shared (hooks crash otherwise)
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
      react: resolvePkg("react"),
      "react-dom": resolvePkg("react-dom"),
    },
  },
  server: {
    port: 3005,
    host: true,
    fs: { allow: [".."] },
  },
  preview: { port: 3005 },
});
