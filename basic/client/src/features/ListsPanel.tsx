import { useState, type FormEvent } from "react";
import type { List } from "../api/client.ts";
import { actions } from "../state/app.ts";

/**
 * The lists sidebar. Renaming is a click that swaps in an input — there is no
 * keyboard path to it and focus is not managed. Deleting uses confirm(). Both
 * are places the accessibility work will rework.
 */
export function ListsPanel({ lists, activeListId }: { lists: List[]; activeListId: string | null }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("name") as HTMLInputElement;
    const name = input.value.trim();
    if (!name) return;
    input.value = "";
    actions.createList(name);
  }

  return (
    <aside>
      <h2>Lists</h2>
      <ul className="lists">
        {lists.map((list) => (
          <li key={list.id}>
            {editingId === list.id ? (
              <input
                autoFocus
                defaultValue={list.name}
                onBlur={() => setEditingId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setEditingId(null);
                  if (event.key !== "Enter") return;
                  const name = event.currentTarget.value.trim();
                  setEditingId(null);
                  if (name && name !== list.name) actions.renameList(list.id, name);
                }}
              />
            ) : (
              <button
                className="name"
                aria-current={list.id === activeListId}
                onClick={() => actions.selectList(list.id)}
                onDoubleClick={() => setEditingId(list.id)}
                title="Double-click to rename"
              >
                <span>{list.name}</span>
                <span className="count">{list.open_count}</span>
              </button>
            )}
            <button
              className="link"
              title="Delete list"
              onClick={() => {
                if (confirm(`Delete "${list.name}" and its tasks?`)) actions.deleteList(list.id);
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      <form className="inline" onSubmit={onCreate}>
        <input name="name" placeholder="New list" maxLength={120} />
        <button type="submit">Add</button>
      </form>
    </aside>
  );
}
