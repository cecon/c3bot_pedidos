import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const devHost = process.env.VITE_DEV_HOST ?? process.env.TAURI_DEV_HOST;
const hmrHost = process.env.VITE_HMR_HOST ?? process.env.TAURI_DEV_HOST;
const devPort = Number(process.env.VITE_DEV_PORT ?? 3920);
const hmrPort = Number(process.env.VITE_HMR_PORT ?? 3921);

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: devPort,
    strictPort: true,
    host: devHost || false,
    hmr: hmrHost
      ? {
          protocol: "ws",
          host: hmrHost,
          port: hmrPort,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/dist/**", "**/.stryker-tmp/**", "**/e2e/**"],
    setupFiles: "./src/setupTests.ts",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/**/*.test.{ts,tsx}"],
    },
  },
}));
