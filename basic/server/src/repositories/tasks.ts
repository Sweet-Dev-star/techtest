import { randomUUID } from "node:crypto";
import { config } from "../config.js";
import { AppError } from "../domain/errors.js";
import { completionTimestamp, type TaskRow } from "../domain/tasks.js";
import type { TaskStatus } from "../domain/schemas.js";
import { getDb } from "../db/connection.js";
import { decodeCursor, encodeCursor } from "../lib/cursor.js";

/**
 * Tasks with keyset ("cursor") pagination.
 *
 * Each sort declares its ORDER BY, the value the cursor carries, and the
 * comparison that resumes after it. Adding a sort means adding one entry here
 * plus a matching index in a migration — not another branch in the route.
 */

const NO_DUE_DATE = "9999-12-31T00:00:00.000Z";

type SortConfig = {
  orderBy: string;
  keyExpression: string;
  operator: "<" | ">";
  cursorValue: (row: TaskRow) => string | number;
};

const SORTS: Record<string, SortConfig> = {
  created: {
    orderBy: "created_at DESC, id DESC",
    keyExpression: "(created_at, id)",
    operator: "<",
    cursorValue: (row) => row.created_at,
  },
  due: {
    orderBy: `COALESCE(due_at, '${NO_DUE_DATE}') ASC, id ASC`,
    keyExpression: `(COALESCE(due_at, '${NO_DUE_DATE}'), id)`,
    operator: ">",
    cursorValue: (row) => row.due_at ?? NO_DUE_DATE,
  },
  priority: {
    orderBy: "priority DESC, id DESC",
    keyExpression: "(priority, id)",
    operator: "<",
    cursorValue: (row) => row.priority,
  },
};

export const SORT_KEYS = Object.keys(SORTS);

/** Escapes the wildcards so a search for "50%" does not match everything. */
function likePattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function createTask(input: {
  listId: string;
  title: string;
  notes?: string | null;
  priority?: number;
  status?: TaskStatus;
  dueAt?: string | null;
}): TaskRow {
  const now = new Date();
  const status = input.status ?? "open";
  const task: TaskRow = {
    id: randomUUID(),
    list_id: input.listId,
    parent_id: null,
    title: input.title,
    notes: input.notes ?? null,
    priority: input.priority ?? 2,
    status,
    due_at: input.dueAt ?? null,
    completed_at: completionTimestamp(status, now),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  getDb()
    .prepare(
      `INSERT INTO tasks
         (id, list_id, parent_id, title, notes, priority, status, due_at, completed_at, created_at, updated_at)
       VALUES
         (@id, @list_id, @parent_id, @title, @notes, @priority, @status, @due_at, @completed_at, @created_at, @updated_at)`,
    )
    .run(task);

  return task;
}

const PATCH_COLUMNS: Record<string, string> = {
  title: "title",
  notes: "notes",
  priority: "priority",
  status: "status",
  due_at: "due_at",
};

/**
 * Applies a partial update. Only the keys present in `patch` change.
 *
 * This is last-write-wins: it does not check that the caller's copy is current,
 * so two clients editing the same task silently lose one edit. There is no
 * version column to check against yet — that is where the concurrency and
 * offline work begins.
 */
export function updateTask(existing: TaskRow, patch: Record<string, unknown>): TaskRow {
  const db = getDb();
  const now = new Date();

  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(PATCH_COLUMNS)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    assignments.push(`${column} = ?`);
    values.push(patch[key]);
  }

  // completed_at follows status; it is never accepted from the client.
  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    assignments.push("completed_at = ?");
    values.push(completionTimestamp(patch.status as TaskStatus, now));
  }

  assignments.push("updated_at = ?");
  values.push(now.toISOString());

  db.prepare(`UPDATE tasks SET ${assignments.join(", ")} WHERE id = ?`).run(...values, existing.id);
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id) as TaskRow;
}

export function deleteTask(taskId: string): void {
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
}

export type TaskQuery = {
  listId: string;
  status?: string | null;
  dueBefore?: string | null;
  search?: string | null;
  sort?: string;
  cursor?: string | null;
  limit?: number;
};

export type TaskPage = { items: TaskRow[]; nextCursor: string | null };

/**
 * One page of a list's tasks. Asks for one row more than requested: its
 * existence is what tells us there is a next page, without a second COUNT.
 *
 * The title search is a leading-wildcard LIKE, which cannot use an index —
 * fine at a few hundred rows, a problem at a million.
 */
export function queryTasks(query: TaskQuery): TaskPage {
  const sort = SORTS[query.sort ?? "created"];
  if (!sort) throw AppError.badRequest(`sort must be one of: ${SORT_KEYS.join(", ")}.`);

  const pageSize = Math.min(query.limit ?? config.defaultPageSize, config.maxPageSize);

  const where: string[] = ["list_id = ?"];
  const params: unknown[] = [query.listId];

  if (query.status) {
    where.push("status = ?");
    params.push(query.status);
  }
  if (query.dueBefore) {
    where.push("due_at IS NOT NULL AND due_at < ?");
    params.push(query.dueBefore);
  }
  if (query.search) {
    where.push("title LIKE ? ESCAPE '\\'");
    params.push(likePattern(query.search));
  }
  if (query.cursor) {
    const [value, id] = decodeCursor(query.cursor);
    where.push(`${sort.keyExpression} ${sort.operator} (?, ?)`);
    params.push(value, id);
  }

  const rows = getDb()
    .prepare(
      `SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY ${sort.orderBy} LIMIT ?`,
    )
    .all(...params, pageSize + 1) as TaskRow[];

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: hasMore && last ? encodeCursor(sort.cursorValue(last), last.id) : null,
  };
}
