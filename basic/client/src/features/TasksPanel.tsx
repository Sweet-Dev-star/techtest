import { useState, type FormEvent } from "react";
import type { List, Task } from "../api/client.ts";
import { actions, type Filters } from "../state/app.ts";

const PRIORITY_LABEL: Record<number, string> = { 1: "low", 2: "normal", 3: "high" };

function formatDue(value: string | null): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A date input gives a local calendar day; the API stores an instant. */
function toTimestamp(dateValue: string): string | null {
  return dateValue ? new Date(`${dateValue}T00:00:00`).toISOString() : null;
}

function TaskRow({ task, editing, onEdit, onStopEditing }: {
  task: Task;
  editing: boolean;
  onEdit: () => void;
  onStopEditing: () => void;
}) {
  const overdue = task.status === "open" && task.due_at !== null && new Date(task.due_at) < new Date();

  return (
    <li className={task.status === "done" ? "done" : ""}>
      <input
        type="checkbox"
        checked={task.status === "done"}
        aria-label={`Mark "${task.title}" ${task.status === "done" ? "open" : "done"}`}
        onChange={() => actions.toggleTask(task)}
      />
      {editing ? (
        <input
          className="title"
          autoFocus
          defaultValue={task.title}
          onBlur={onStopEditing}
          onKeyDown={(event) => {
            if (event.key === "Escape") onStopEditing();
            if (event.key !== "Enter") return;
            const title = event.currentTarget.value.trim();
            onStopEditing();
            if (title && title !== task.title) actions.renameTask(task.id, title);
          }}
        />
      ) : (
        <button className="title" title="Click to rename" onClick={onEdit}>
          {task.title}
        </button>
      )}
      {task.priority !== 2 ? <span className={`flag ${PRIORITY_LABEL[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span> : null}
      {task.due_at ? <span className={`due${overdue ? " overdue" : ""}`}>{formatDue(task.due_at)}</span> : null}
      <button className="link" title="Delete task" onClick={() => actions.deleteTask(task.id)}>×</button>
    </li>
  );
}

export function TasksPanel({
  list,
  tasks,
  nextCursor,
  filters,
  error,
}: {
  list: List | undefined;
  tasks: Task[];
  nextCursor: string | null;
  filters: Filters;
  error: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!list) return <main><p className="empty">Create a list to get started.</p></main>;

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value.trim();
    if (!title) return;
    const due = (form.elements.namedItem("due") as HTMLInputElement).value;
    const priority = Number((form.elements.namedItem("priority") as HTMLSelectElement).value);
    form.reset();
    actions.createTask({ title, priority, due_at: toTimestamp(due) });
  }

  return (
    <main>
      <h2>{list.name}</h2>

      <form className="composer" onSubmit={onAdd}>
        <input name="title" placeholder="Add a task" maxLength={200} />
        <input name="due" type="date" aria-label="Due date" />
        <select name="priority" aria-label="Priority" defaultValue="2">
          <option value="1">Low</option>
          <option value="2">Normal</option>
          <option value="3">High</option>
        </select>
        <button className="primary" type="submit">Add</button>
      </form>

      <div className="filters">
        <input
          placeholder="Search titles"
          defaultValue={filters.q}
          onChange={(event) => actions.setFilters({ q: event.currentTarget.value.trim() })}
        />
        <select value={filters.status} onChange={(event) => actions.setFilters({ status: event.currentTarget.value })} aria-label="Status">
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.sort} onChange={(event) => actions.setFilters({ sort: event.currentTarget.value })} aria-label="Sort">
          <option value="created">Newest</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {error ? <p className="error">{error}</p> : null}

      {tasks.length === 0 ? (
        <p className="empty">Nothing here yet.</p>
      ) : (
        <ul className="tasks">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              editing={editingId === task.id}
              onEdit={() => setEditingId(task.id)}
              onStopEditing={() => setEditingId(null)}
            />
          ))}
        </ul>
      )}

      {nextCursor ? <button className="more" onClick={() => actions.loadMore()}>Load more</button> : null}

      <p className="hint">Click a task title to rename it. Double-click a list to rename it.</p>
    </main>
  );
}
