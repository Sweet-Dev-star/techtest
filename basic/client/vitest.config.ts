import { defineConfig } from "vitest/config";

// Kept separate from vite.config.ts: Vitest bundles its own Vite, and mixing
// its defineConfig with @vitejs/plugin-react's Vite types clashes. The unit
// tests here need no React plugin — jsdom is enough.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
