/**
 * The only module that talks to the server.
 *
 * Every call throws an Error carrying `status` and `code` on failure, so the UI
 * can branch on the kind of failure rather than parsing messages.
 */

async function request(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = new Error(data?.error?.message ?? "Request failed.");
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }

  return data;
}

function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, value);
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

export const api = {
  me: () => request("/auth/me"),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),

  lists: () => request("/lists"),
  createList: (name) => request("/lists", { method: "POST", body: { name } }),
  renameList: (id, name) => request(`/lists/${id}`, { method: "PATCH", body: { name } }),
  deleteList: (id) => request(`/lists/${id}`, { method: "DELETE" }),

  tasks: (listId, params = {}) => request(`/lists/${listId}/tasks${queryString(params)}`),
  createTask: (payload) => request("/tasks", { method: "POST", body: payload }),
  updateTask: (id, patch) => request(`/tasks/${id}`, { method: "PATCH", body: patch }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
