import { randomUUID } from "node:crypto";
import { config } from "../../config.js";
import { AppError } from "../../domain/errors.js";
import { completionTimestamp } from "../../domain/tasks.js";
import { getDb } from "../connection.js";

/**
 * Tasks with keyset ("cursor") pagination.
 *
 * Each sort declares the ORDER BY, the tuple the cursor is built from, and the
 * comparison that resumes after it. Adding a sort means adding one entry here
 * plus a matching index in a migration — not another branch in the route.
 */

const NO_DUE_DATE = "9999-12-31T00:00:00.000Z";

const SORTS = {
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

export const SORT_KEYS = Object.freeze(Object.keys(SORTS));

function encodeCursor(sort, row) {
  const payload = JSON.stringify([SORTS[sort].cursorValue(row), row.id]);
  return Buffer.from(payload, "utf8").toString("base64url");
}

function decodeCursor(cursor) {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
  } catch {
    throw AppError.badRequest("Invalid cursor.");
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) throw AppError.badRequest("Invalid cursor.");
  return parsed;
}

/** Escapes the wildcards so a search for "50%" does not match everything. */
function likePattern(term) {
  return `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export function createTask({ listId, title, notes, priority, status, dueAt }) {
  const now = new Date();
  const task = {
    id: randomUUID(),
    list_id: listId,
    parent_id: null,
    title,
    notes,
    priority,
    status,
    due_at: dueAt,
    completed_at: completionTimestamp(status, now),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  getDb()
    .prepare(
      `INSERT INTO tasks
         (id, list_id, parent_id, title, notes, priority, status, due_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      task.id,
      task.list_id,
      task.parent_id,
      task.title,
      task.notes,
      task.priority,
      task.status,
      task.due_at,
      task.completed_at,
      task.created_at,
      task.updated_at,
    );

  return task;
}

const PATCH_COLUMNS = {
  title: "title",
  notes: "notes",
  priority: "priority",
  status: "status",
  dueAt: "due_at",
};

export function updateTask(existing, patch) {
  const db = getDb();
  const now = new Date();

  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(PATCH_COLUMNS)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    assignments.push(`${column} = ?`);
    values.push(patch[key]);
  }

  // completed_at follows status; it is never accepted from the client.
  if (Object.prototype.hasOwnProperty.call(patch, "status")) {
    assignments.push("completed_at = ?");
    values.push(completionTimestamp(patch.status, now));
  }

  assignments.push("updated_at = ?");
  values.push(now.toISOString());

  db.prepare(`UPDATE tasks SET ${assignments.join(", ")} WHERE id = ?`).run(...values, existing.id);

  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(existing.id);
}

export function deleteTask(taskId) {
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
}

/**
 * One page of a list's tasks.
 *
 * Returns `{ items, next_cursor }`. `next_cursor` is null on the last page.
 * We ask for one row more than requested: its existence is what tells us
 * whether there is a next page, without a second COUNT query.
 */
export function queryTasks({ listId, status, dueBefore, search, sort = "created", cursor, limit }) {
  const sortConfig = SORTS[sort];
  if (!sortConfig) throw AppError.badRequest(`sort must be one of: ${SORT_KEYS.join(", ")}.`);

  const pageSize = Math.min(limit ?? config.defaultPageSize, config.maxPageSize);

  const where = ["list_id = ?"];
  const params = [listId];

  if (status) {
    where.push("status = ?");
    params.push(status);
  }
  if (dueBefore) {
    where.push("due_at IS NOT NULL AND due_at < ?");
    params.push(dueBefore);
  }
  if (search) {
    where.push("title LIKE ? ESCAPE '\\'");
    params.push(likePattern(search));
  }
  if (cursor) {
    const [value, id] = decodeCursor(cursor);
    where.push(`${sortConfig.keyExpression} ${sortConfig.operator} (?, ?)`);
    params.push(value, id);
  }

  const rows = getDb()
    .prepare(
      `SELECT * FROM tasks
        WHERE ${where.join(" AND ")}
        ORDER BY ${sortConfig.orderBy}
        LIMIT ?`,
    )
    .all(...params, pageSize + 1);

  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : rows;

  return {
    items,
    next_cursor: hasMore ? encodeCursor(sort, items[items.length - 1]) : null,
  };
}
