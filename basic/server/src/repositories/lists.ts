import { randomUUID } from "node:crypto";
import { getDb } from "../db/connection.js";
import type { ListRow } from "./access.js";

export type ListWithCount = ListRow & { open_count: number };

export function createList(input: { ownerId: string; name: string }): ListRow {
  const db = getDb();
  const nextPosition =
    (
      db
        .prepare("SELECT COALESCE(MAX(position), -1) + 1 AS next FROM lists WHERE owner_id = ?")
        .get(input.ownerId) as { next: number }
    ).next ?? 0;

  const list: ListRow = {
    id: randomUUID(),
    owner_id: input.ownerId,
    name: input.name,
    position: nextPosition,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    "INSERT INTO lists (id, owner_id, name, position, created_at) VALUES (@id, @owner_id, @name, @position, @created_at)",
  ).run(list);

  return list;
}

/**
 * Lists the caller can see, each with a live count of unfinished tasks.
 *
 * The count is a correlated subquery rather than a query per list in the route,
 * so rendering the sidebar stays one round trip however many lists there are.
 */
export function listsForUser(userId: string): ListWithCount[] {
  return getDb()
    .prepare(
      `SELECT l.*,
              (SELECT COUNT(*) FROM tasks t WHERE t.list_id = l.id AND t.status = 'open') AS open_count
         FROM lists l
        WHERE l.owner_id = ?
        ORDER BY l.position ASC, l.created_at ASC`,
    )
    .all(userId) as ListWithCount[];
}

export function updateListName(listId: string, name: string): ListRow {
  const db = getDb();
  db.prepare("UPDATE lists SET name = ? WHERE id = ?").run(name, listId);
  return db.prepare("SELECT * FROM lists WHERE id = ?").get(listId) as ListRow;
}

/** Tasks go with it — see the ON DELETE CASCADE in 001_initial.sql. */
export function deleteList(listId: string): void {
  getDb().prepare("DELETE FROM lists WHERE id = ?").run(listId);
}

export function serialiseList(row: ListRow | ListWithCount) {
  return {
    id: row.id,
    owner_id: row.owner_id,
    name: row.name,
    position: row.position,
    created_at: row.created_at,
    open_count: "open_count" in row ? row.open_count : 0,
  };
}
