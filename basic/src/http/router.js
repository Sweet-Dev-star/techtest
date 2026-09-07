/**
 * A ~60-line router: enough for this API, small enough to read in one sitting.
 *
 * Patterns are literal segments plus `:name` placeholders, e.g.
 * "/lists/:listId/tasks". Matching a path but not the method returns 405 rather
 * than 404, which is the honest answer and makes a typo in a fetch obvious.
 */
export function createRouter() {
  const routes = [];

  function add(method, pattern, handler) {
    routes.push({
      method,
      pattern,
      segments: pattern.split("/").filter(Boolean),
      handler,
    });
  }

  function matchSegments(route, segments) {
    if (route.segments.length !== segments.length) return null;

    const params = {};
    for (let i = 0; i < segments.length; i += 1) {
      const expected = route.segments[i];
      if (expected.startsWith(":")) {
        params[expected.slice(1)] = decodeURIComponent(segments[i]);
      } else if (expected !== segments[i]) {
        return null;
      }
    }
    return params;
  }

  return {
    get: (pattern, handler) => add("GET", pattern, handler),
    post: (pattern, handler) => add("POST", pattern, handler),
    patch: (pattern, handler) => add("PATCH", pattern, handler),
    delete: (pattern, handler) => add("DELETE", pattern, handler),

    /**
     * Returns { handler, params }, or { allowed: [...] } when the path exists
     * under other methods, or null when nothing matches.
     */
    match(method, pathname) {
      const segments = pathname.split("/").filter(Boolean);
      const allowed = new Set();

      for (const route of routes) {
        const params = matchSegments(route, segments);
        if (!params) continue;
        if (route.method === method) return { handler: route.handler, params };
        allowed.add(route.method);
      }

      return allowed.size > 0 ? { allowed: [...allowed] } : null;
    },
  };
}
