import { api, ApiError, type List, type Task, type User } from "../api/client.ts";
import { createStore } from "./store.ts";

export type Filters = { status: string; q: string; sort: string };

export type AppState = {
  ready: boolean;
  user: User | null;
  lists: List[];
  activeListId: string | null;
  tasks: Task[];
  nextCursor: string | null;
  filters: Filters;
  error: string | null;
  busy: boolean;
};

export const store = createStore<AppState>({
  ready: false,
  user: null,
  lists: [],
  activeListId: null,
  tasks: [],
  nextCursor: null,
  filters: { status: "", q: "", sort: "created" },
  error: null,
  busy: false,
});

/** Runs an async action with a busy flag and turns ApiErrors into a message. */
async function run(action: () => Promise<void>): Promise<void> {
  store.set({ busy: true, error: null });
  try {
    await action();
  } catch (error) {
    store.set({ error: error instanceof ApiError ? error.message : "Something went wrong." });
  } finally {
    store.set({ busy: false });
  }
}

export async function bootstrap(): Promise<void> {
  try {
    const { user } = await api.me();
    store.set({ user });
    if (user) await loadLists();
  } finally {
    store.set({ ready: true });
  }
}

export function authenticate(user: User): void {
  store.set({ user });
  void run(loadLists);
}

async function loadLists(select?: string): Promise<void> {
  const { lists } = await api.lists();
  const activeListId = select ?? store.get().activeListId ?? lists[0]?.id ?? null;
  store.set({ lists, activeListId });
  if (activeListId) await loadTasks();
  else store.set({ tasks: [], nextCursor: null });
}

async function loadTasks(append = false): Promise<void> {
  const { activeListId, filters, nextCursor, tasks } = store.get();
  if (!activeListId) return;
  const page = await api.tasks(activeListId, { ...filters, cursor: append ? nextCursor : null });
  store.set({
    tasks: append ? [...tasks, ...page.tasks] : page.tasks,
    nextCursor: page.next_cursor,
  });
}

async function refreshCounts(): Promise<void> {
  const { lists } = await api.lists();
  store.set({ lists });
}

export const actions = {
  selectList(id: string) {
    store.set({ activeListId: id, nextCursor: null });
    void run(() => loadTasks());
  },
  setFilters(patch: Partial<Filters>) {
    store.set({ filters: { ...store.get().filters, ...patch }, nextCursor: null });
    void run(() => loadTasks());
  },
  loadMore() {
    void run(() => loadTasks(true));
  },
  createList(name: string) {
    void run(async () => {
      const { list } = await api.createList(name);
      await loadLists(list.id);
    });
  },
  renameList(id: string, name: string) {
    void run(async () => {
      await api.renameList(id, name);
      await loadLists();
    });
  },
  deleteList(id: string) {
    void run(async () => {
      await api.deleteList(id);
      store.set({ activeListId: null });
      await loadLists();
    });
  },
  createTask(input: { title: string; priority: number; due_at: string | null }) {
    const listId = store.get().activeListId;
    if (!listId) return;
    void run(async () => {
      await api.createTask({ list_id: listId, ...input });
      await loadTasks();
      await refreshCounts();
    });
  },
  toggleTask(task: Task) {
    void run(async () => {
      await api.updateTask(task.id, { status: task.status === "done" ? "open" : "done" });
      await loadTasks();
      await refreshCounts();
    });
  },
  renameTask(id: string, title: string) {
    void run(async () => {
      await api.updateTask(id, { title });
      await loadTasks();
    });
  },
  deleteTask(id: string) {
    void run(async () => {
      await api.deleteTask(id);
      await loadTasks();
      await refreshCounts();
    });
  },
  async signOut() {
    await run(async () => {
      await api.logout();
      store.set({ user: null, lists: [], tasks: [], activeListId: null, nextCursor: null });
    });
  },
};
