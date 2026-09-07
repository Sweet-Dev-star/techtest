import { randomUUID } from "node:crypto";
import { getDb } from "../connection.js";

export function createList({ ownerId, name }) {
  const db = getDb();

  const nextPosition =
    db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM lists WHERE owner_id = ?").get(ownerId)
      ?.next ?? 0;

  const list = {
    id: randomUUID(),
    owner_id: ownerId,
    name,
    position: nextPosition,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO lists (id, owner_id, name, position, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(list.id, list.owner_id, list.name, list.position, list.created_at);

  return list;
}

/**
 * Lists the caller can see, with a live count of unfinished tasks.
 *
 * The count is a correlated subquery rather than a per-list query in the route,
 * so rendering the sidebar stays one round trip however many lists there are.
 */
export function listsForUser(userId) {
  return getDb()
    .prepare(
      `SELECT l.*,
              (SELECT COUNT(*) FROM tasks t WHERE t.list_id = l.id AND t.status = 'open') AS open_count
         FROM lists l
        WHERE l.owner_id = ?
        ORDER BY l.position ASC, l.created_at ASC`,
    )
    .all(userId);
}

export function updateList(listId, { name }) {
  const db = getDb();
  db.prepare("UPDATE lists SET name = ? WHERE id = ?").run(name, listId);
  return db.prepare("SELECT * FROM lists WHERE id = ?").get(listId);
}

/** Tasks go with it — see the ON DELETE CASCADE in 001_initial.sql. */
export function deleteList(listId) {
  getDb().prepare("DELETE FROM lists WHERE id = ?").run(listId);
}

export function serialiseList(row) {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    position: row.position,
    created_at: row.created_at,
    open_count: row.open_count ?? 0,
  };
}
