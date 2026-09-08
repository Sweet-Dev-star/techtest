import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Each test file gets a fresh in-memory database via a beforeEach hook, so
    // suites are isolated and can run in parallel without touching disk.
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
  },
});
