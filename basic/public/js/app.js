import { api } from "./api.js";
import { el, render } from "./dom.js";
import { createStore } from "./store.js";

/**
 * The whole UI: a store, a render function, and a handful of actions.
 *
 * It re-renders everything on every change. That is fine at this size and will
 * not stay fine as a list grows — left honest rather than half-optimised, since
 * Problem 2 gives this file a lot more to hold.
 */

const root = document.getElementById("root");

const PRIORITIES = { 1: "low", 2: "normal", 3: "high" };

const store = createStore({
  user: null,
  authMode: "login",
  lists: [],
  activeListId: null,
  tasks: [],
  nextCursor: null,
  filters: { status: "", sort: "created", q: "", due_before: "" },
  editingTaskId: null,
  editingListId: null,
  error: null,
  busy: false,
});

/* ------------------------------- actions -------------------------------- */

async function run(action) {
  store.set({ busy: true, error: null });
  try {
    await action();
  } catch (error) {
    store.set({ error: error.message });
  } finally {
    store.set({ busy: false });
  }
}

async function loadLists({ select } = {}) {
  const { lists } = await api.lists();
  const activeListId = select ?? store.get().activeListId ?? lists[0]?.id ?? null;
  store.set({ lists, activeListId });
  if (activeListId) await loadTasks();
  else store.set({ tasks: [], nextCursor: null });
}

async function loadTasks({ append = false } = {}) {
  const { activeListId, filters, nextCursor, tasks } = store.get();
  if (!activeListId) return;

  const page = await api.tasks(activeListId, {
    ...filters,
    cursor: append ? nextCursor : null,
  });

  store.set({
    tasks: append ? [...tasks, ...page.tasks] : page.tasks,
    nextCursor: page.next_cursor,
  });
}

function selectList(id) {
  store.set({ activeListId: id, nextCursor: null, editingTaskId: null });
  run(loadTasks);
}

function setFilters(patch) {
  store.set({ filters: { ...store.get().filters, ...patch }, nextCursor: null });
  run(loadTasks);
}

/** A date input gives a local calendar day; the API stores an instant. */
function toTimestamp(dateValue) {
  return dateValue ? new Date(`${dateValue}T00:00:00`).toISOString() : null;
}

function formatDue(value) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* -------------------------------- views --------------------------------- */

function authView(state) {
  const registering = state.authMode === "register";

  return el(
    "div",
    { class: "auth" },
    el("h1", {}, registering ? "Create an account" : "Sign in"),
    el("p", { class: "sub" }, "Task manager — baseline build."),
    state.error && el("p", { class: "error" }, state.error),
    el(
      "form",
      {
        onsubmit: (event) => {
          event.preventDefault();
          const form = new FormData(event.target);
          const payload = {
            email: form.get("email"),
            password: form.get("password"),
          };
          run(async () => {
            const result = registering ? await api.register(payload) : await api.login(payload);
            store.set({ user: result.user });
            await loadLists();
          });
        },
      },
      el("input", { type: "email", name: "email", placeholder: "you@example.com", required: true, autocomplete: "email" }),
      el("input", {
        type: "password",
        name: "password",
        placeholder: "Password (10+ characters)",
        required: true,
        minlength: 10,
        autocomplete: registering ? "new-password" : "current-password",
      }),
      el("button", { class: "primary", type: "submit", disabled: state.busy }, registering ? "Create account" : "Sign in"),
    ),
    el(
      "div",
      { class: "row" },
      el("span", { class: "sub" }, registering ? "Already registered?" : "No account yet?"),
      el(
        "button",
        { class: "link", onclick: () => store.set({ authMode: registering ? "login" : "register", error: null }) },
        registering ? "Sign in" : "Create one",
      ),
    ),
  );
}

function listsPanel(state) {
  return el(
    "aside",
    {},
    el("h2", {}, "Lists"),
    el(
      "ul",
      { class: "lists" },
      state.lists.map((list) =>
        el(
          "li",
          {},
          state.editingListId === list.id
            ? el("input", {
                type: "text",
                value: list.name,
                "data-autofocus": true,
                onkeydown: (event) => {
                  if (event.key === "Escape") store.set({ editingListId: null });
                  if (event.key !== "Enter") return;
                  const name = event.target.value.trim();
                  store.set({ editingListId: null });
                  if (name && name !== list.name) run(async () => {
                    await api.renameList(list.id, name);
                    await loadLists();
                  });
                },
                onblur: () => store.set({ editingListId: null }),
              })
            : el(
                "button",
                {
                  class: "name",
                  "aria-current": String(list.id === state.activeListId),
                  onclick: () => selectList(list.id),
                  ondblclick: () => store.set({ editingListId: list.id }),
                  title: "Double-click to rename",
                },
                el("span", {}, list.name),
                el("span", { class: "count" }, String(list.open_count)),
              ),
          el(
            "button",
            {
              class: "link",
              title: "Delete list",
              onclick: () => {
                if (!confirm(`Delete "${list.name}" and its tasks?`)) return;
                run(async () => {
                  await api.deleteList(list.id);
                  store.set({ activeListId: null });
                  await loadLists();
                });
              },
            },
            "×",
          ),
        ),
      ),
    ),
    el(
      "form",
      {
        class: "inline",
        onsubmit: (event) => {
          event.preventDefault();
          const input = event.target.elements.name;
          const name = input.value.trim();
          if (!name) return;
          input.value = "";
          run(async () => {
            const { list } = await api.createList(name);
            await loadLists({ select: list.id });
          });
        },
      },
      el("input", { type: "text", name: "name", placeholder: "New list", maxlength: 120 }),
      el("button", { type: "submit" }, "Add"),
    ),
  );
}

function taskRow(state, task) {
  const overdue = task.status === "open" && task.due_at && new Date(task.due_at) < new Date();

  return el(
    "li",
    { class: task.status === "done" ? "done" : "" },
    el("input", {
      type: "checkbox",
      checked: task.status === "done",
      "aria-label": `Mark "${task.title}" ${task.status === "done" ? "open" : "done"}`,
      onchange: (event) =>
        run(async () => {
          await api.updateTask(task.id, { status: event.target.checked ? "done" : "open" });
          await loadTasks();
          await refreshCounts();
        }),
    }),

    state.editingTaskId === task.id
      ? el("input", {
          type: "text",
          class: "title",
          value: task.title,
          "data-autofocus": true,
          onkeydown: (event) => {
            if (event.key === "Escape") store.set({ editingTaskId: null });
            if (event.key !== "Enter") return;
            const title = event.target.value.trim();
            store.set({ editingTaskId: null });
            if (title && title !== task.title) {
              run(async () => {
                await api.updateTask(task.id, { title });
                await loadTasks();
              });
            }
          },
          onblur: () => store.set({ editingTaskId: null }),
        })
      : el(
          "button",
          {
            class: "title",
            title: "Click to rename",
            onclick: () => store.set({ editingTaskId: task.id }),
          },
          task.title,
        ),

    task.priority !== 2 && el("span", { class: `flag ${PRIORITIES[task.priority]}` }, PRIORITIES[task.priority]),
    task.due_at && el("span", { class: `due ${overdue ? "overdue" : ""}` }, formatDue(task.due_at)),
    el(
      "button",
      {
        class: "link",
        title: "Delete task",
        onclick: () =>
          run(async () => {
            await api.deleteTask(task.id);
            await loadTasks();
            await refreshCounts();
          }),
      },
      "×",
    ),
  );
}

async function refreshCounts() {
  const { lists } = await api.lists();
  store.set({ lists });
}

function tasksPanel(state) {
  const activeList = state.lists.find((list) => list.id === state.activeListId);

  if (!activeList) {
    return el("main", {}, el("p", { class: "empty" }, "Create a list to get started."));
  }

  return el(
    "main",
    {},
    el("h2", {}, activeList.name),

    el(
      "form",
      {
        class: "composer",
        onsubmit: (event) => {
          event.preventDefault();
          const form = event.target;
          const title = form.elements.title.value.trim();
          if (!title) return;

          const payload = {
            list_id: activeList.id,
            title,
            priority: Number(form.elements.priority.value),
            due_at: toTimestamp(form.elements.due.value),
          };

          form.reset();
          run(async () => {
            await api.createTask(payload);
            await loadTasks();
            await refreshCounts();
          });
        },
      },
      el("input", { type: "text", name: "title", placeholder: "Add a task", maxlength: 200 }),
      el("input", { type: "date", name: "due", "aria-label": "Due date" }),
      el(
        "select",
        { name: "priority", "aria-label": "Priority" },
        el("option", { value: "1" }, "Low"),
        el("option", { value: "2", selected: true }, "Normal"),
        el("option", { value: "3" }, "High"),
      ),
      el("button", { class: "primary", type: "submit" }, "Add"),
    ),

    el(
      "form",
      {
        class: "filters",
        onsubmit: (event) => {
          event.preventDefault();
          setFilters({ q: event.target.elements.q.value.trim() });
        },
      },
      el("input", { type: "text", name: "q", placeholder: "Search titles", value: state.filters.q }),
      el(
        "select",
        { "aria-label": "Status", onchange: (event) => setFilters({ status: event.target.value }) },
        el("option", { value: "", selected: state.filters.status === "" }, "All"),
        el("option", { value: "open", selected: state.filters.status === "open" }, "Open"),
        el("option", { value: "done", selected: state.filters.status === "done" }, "Done"),
      ),
      el(
        "select",
        { "aria-label": "Sort", onchange: (event) => setFilters({ sort: event.target.value }) },
        el("option", { value: "created", selected: state.filters.sort === "created" }, "Newest"),
        el("option", { value: "due", selected: state.filters.sort === "due" }, "Due date"),
        el("option", { value: "priority", selected: state.filters.sort === "priority" }, "Priority"),
      ),
      el("button", { type: "submit" }, "Apply"),
    ),

    state.error && el("p", { class: "error" }, state.error),

    state.tasks.length === 0
      ? el("p", { class: "empty" }, "Nothing here yet.")
      : el("ul", { class: "tasks" }, state.tasks.map((task) => taskRow(state, task))),

    state.nextCursor &&
      el(
        "button",
        { class: "more", onclick: () => run(() => loadTasks({ append: true })) },
        "Load more",
      ),

    el("p", { class: "hint" }, "Click a task title to rename it. Double-click a list to rename it."),
  );
}

function appView(state) {
  return [
    el(
      "header",
      { class: "bar" },
      el("strong", {}, "Task manager"),
      el(
        "span",
        {},
        el("span", { class: "who" }, state.user.email, " "),
        el(
          "button",
          {
            class: "link",
            onclick: () =>
              run(async () => {
                await api.logout();
                store.set({ user: null, lists: [], tasks: [], activeListId: null });
              }),
          },
          "Sign out",
        ),
      ),
    ),
    el("div", { class: "layout" }, listsPanel(state), tasksPanel(state)),
  ];
}

/* -------------------------------- boot ---------------------------------- */

store.subscribe((state) => {
  render(root, state.user ? appView(state) : authView(state));

  const focusTarget = root.querySelector("[data-autofocus]");
  if (focusTarget) {
    focusTarget.focus();
    focusTarget.select?.();
  }
});

run(async () => {
  const { user } = await api.me();
  store.set({ user });
  if (user) await loadLists();
});
