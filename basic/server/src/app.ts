import path from "node:path";
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { config, isProduction } from "./config.js";
import { attachContext } from "./middleware/context.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.js";
import { listsRouter } from "./routes/lists.js";
import { listTasksRouter, tasksRouter } from "./routes/tasks.js";

/**
 * Builds the Express app. Returning it rather than listening keeps this
 * decoupled from the server, so tests mount it with supertest and never open a
 * port.
 */
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");

  // Small dev-only CORS allowance so the Vite dev server can call the API with
  // credentials. In production the client is served from the same origin, so
  // none of this applies.
  if (!isProduction) {
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", config.clientOrigin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  app.use(express.json({ limit: config.maxBodyBytes }));
  app.use(cookieParser());
  app.use(attachContext);

  // A trivial liveness probe. It does not check the database — making /health
  // and a separate /ready mean the right things is part of the operability work.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/lists", listsRouter);
  app.use("/api/lists/:listId/tasks", listTasksRouter);
  app.use("/api/tasks", tasksRouter);

  // Unknown /api routes are a 404 JSON error, never the SPA fallback.
  app.use("/api", notFoundHandler);

  // In production the server also serves the built client, and hands any
  // non-API route to index.html so client-side routing works on refresh.
  if (isProduction) {
    app.use(express.static(config.clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(config.clientDist, "index.html"));
    });
  }

  app.use(errorHandler);
  return app;
}
