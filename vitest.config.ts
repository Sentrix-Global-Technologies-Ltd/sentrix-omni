import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Test runner config — separate from vite.config.ts (build). jsdom + RTL.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
