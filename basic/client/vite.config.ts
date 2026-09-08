import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The client is a single-page app. In development it runs on :5173 and proxies
// /api to the Express server on :4000, so cookies are same-origin. In
// production the server serves the built client from client/dist.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:4000", changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
