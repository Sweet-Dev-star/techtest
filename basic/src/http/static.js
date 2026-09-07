import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

/**
 * Serves the web client out of public/.
 *
 * The resolved path is checked against publicDir before anything is read, so
 * "/../../etc/passwd" cannot escape the directory.
 */
export async function serveStatic(req, res, pathname) {
  const relative = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = path.resolve(config.publicDir, relative);

  if (target !== config.publicDir && !target.startsWith(config.publicDir + path.sep)) {
    return false;
  }

  let file;
  try {
    file = await fs.readFile(target);
  } catch {
    return false;
  }

  res.writeHead(200, {
    "content-type": CONTENT_TYPES[path.extname(target)] ?? "application/octet-stream",
    "content-length": file.length,
    "cache-control": "no-cache",
  });

  res.end(req.method === "HEAD" ? undefined : file);
  return true;
}
