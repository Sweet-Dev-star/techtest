/**
 * The only module that talks to the server. Every call throws an ApiError
 * carrying `status` and `code` on failure, so the UI can branch on the kind of
 * failure rather than parsing messages.
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: options.method ?? "GET",
    credentials: "same-origin",
    headers: options.body ? { "content-type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error = data?.error ?? {};
    throw new ApiError(response.status, error.code ?? "error", error.message ?? "Request failed.", error.details);
  }

  return data as T;
}

function queryString(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== "") search.set(key, String(value));
  }
  const rendered = search.toString();
  return rendered ? `?${rendered}` : "";
}

export type User = { id: string; username: string; email: string; created_at: string };
export type List = { id: string; name: string; position: number; created_at: string; open_count: number };
export type Task = {
  id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  notes: string | null;
  priority: number;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskFilters = {
  status?: string;
  q?: string;
  sort?: string;
  due_before?: string;
  cursor?: string | null;
  limit?: number;
};

export const api = {
  me: () => request<{ user: User | null }>("/auth/me"),
  register: (body: { username: string; email: string; password: string }) =>
    request<{ user: User }>("/auth/register", { method: "POST", body }),
  login: (body: { identifier: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),

  lists: () => request<{ lists: List[] }>("/lists"),
  createList: (name: string) => request<{ list: List }>("/lists", { method: "POST", body: { name } }),
  renameList: (id: string, name: string) => request<{ list: List }>(`/lists/${id}`, { method: "PATCH", body: { name } }),
  deleteList: (id: string) => request<void>(`/lists/${id}`, { method: "DELETE" }),

  tasks: (listId: string, filters: TaskFilters = {}) =>
    request<{ tasks: Task[]; next_cursor: string | null }>(`/lists/${listId}/tasks${queryString(filters)}`),
  createTask: (body: { list_id: string; title: string; priority?: number; due_at?: string | null }) =>
    request<{ task: Task }>("/tasks", { method: "POST", body }),
  updateTask: (id: string, patch: Partial<Pick<Task, "title" | "notes" | "priority" | "status" | "due_at">>) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: "PATCH", body: patch }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
