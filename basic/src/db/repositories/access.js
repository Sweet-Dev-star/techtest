import { AppError } from "../../domain/errors.js";
import { getDb } from "../connection.js";

/**
 * THE AUTHORISATION SEAM.
 *
 * Every route that touches a list or a task resolves it through this module —
 * no handler queries `lists` or `tasks` by id on its own. That is deliberate:
 * Problem 3 replaces "is the caller the owner" with "is the caller a member,
 * and does their role permit this", and it should be a change to this file plus
 * a role argument at the call sites, not an audit of every handler.
 *
 * Note the 404s. A user who is not allowed to see a list is told it does not
 * exist, rather than that it exists and is someone else's.
 */

export function findListForUser(listId, userId) {
  const list = getDb().prepare("SELECT * FROM lists WHERE id = ?").get(listId);
  if (!list) return null;
  if (list.owner_id !== userId) return null;
  return list;
}

export function requireListForUser(listId, userId) {
  const list = findListForUser(listId, userId);
  if (!list) throw AppError.notFound("List not found.");
  return list;
}

/** Resolves a task and proves the caller may reach it, in one query. */
export function findTaskForUser(taskId, userId) {
  return (
    getDb()
      .prepare(
        `SELECT t.*
           FROM tasks t
           JOIN lists l ON l.id = t.list_id
          WHERE t.id = ? AND l.owner_id = ?`,
      )
      .get(taskId, userId) ?? null
  );
}

export function requireTaskForUser(taskId, userId) {
  const task = findTaskForUser(taskId, userId);
  if (!task) throw AppError.notFound("Task not found.");
  return task;
}
