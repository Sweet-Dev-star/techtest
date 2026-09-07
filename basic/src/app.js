import { AppError } from "./domain/errors.js";
import { createRouter } from "./http/router.js";
import { registerAuthRoutes } from "./http/routes/auth.js";
import { registerListRoutes } from "./http/routes/lists.js";
import { registerTaskRoutes } from "./http/routes/tasks.js";
import { sendError } from "./http/respond.js";
import { serveStatic } from "./http/static.js";

/**
 * Builds the request handler: routes first, then the static client, then 404.
 *
 * Returning a plain (req, res) function keeps this decoupled from the server —
 * tests mount it on an ephemeral port without touching src/server.js.
 */
export function createApp() {
  const router = createRouter();

  registerAuthRoutes(router);
  registerListRoutes(router);
  registerTaskRoutes(router);

  return async function handle(req, res) {
    try {
      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
      const match = router.match(req.method, url.pathname);

      if (match?.handler) {
        await match.handler({ req, res, url, params: match.params, query: url.searchParams });
        return;
      }

      if (match?.allowed) {
        res.setHeader("allow", match.allowed.join(", "));
        throw new AppError(405, "method_not_allowed", `${req.method} is not allowed here.`);
      }

      if ((req.method === "GET" || req.method === "HEAD") && (await serveStatic(req, res, url.pathname))) {
        return;
      }

      throw AppError.notFound("No route matches that path.");
    } catch (error) {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      sendError(res, error);
    }
  };
}
