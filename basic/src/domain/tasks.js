import { AppError } from "./errors.js";
import {
  has,
  optionalText,
  optionalTimestamp,
  requireInteger,
  requireObject,
  requireOneOf,
  requireString,
} from "./validate.js";

/**
 * Task rules that do not touch the database or HTTP. Everything here is a pure
 * function, so it can be tested without a server — see tests/domain.test.js.
 *
 * Problem 1's recurrence engine belongs beside this file, for the same reason.
 */

export const TASK_STATUSES = Object.freeze(["open", "done"]);

export const PRIORITY = Object.freeze({ low: 1, normal: 2, high: 3 });

const TITLE_MAX = 200;

/** Validates the body of POST /tasks. Applies the defaults a new task gets. */
export function taskCreateInput(input) {
  requireObject(input);

  return {
    title: requireString(input.title, "title", { max: TITLE_MAX }),
    notes: optionalText(input.notes, "notes"),
    priority:
      input.priority === undefined || input.priority === null
        ? PRIORITY.normal
        : requireInteger(input.priority, "priority", { min: 1, max: 3 }),
    status:
      input.status === undefined || input.status === null
        ? "open"
        : requireOneOf(input.status, "status", TASK_STATUSES),
    dueAt: optionalTimestamp(input.due_at, "due_at"),
  };
}

/**
 * Validates the body of PATCH /tasks/:id. Only keys the caller actually sent
 * come back, so a patch never silently resets a field it did not mention.
 */
export function taskUpdateInput(input) {
  requireObject(input);
  const patch = {};

  if (has(input, "title")) patch.title = requireString(input.title, "title", { max: TITLE_MAX });
  if (has(input, "notes")) patch.notes = optionalText(input.notes, "notes");
  if (has(input, "priority")) {
    patch.priority = requireInteger(input.priority, "priority", { min: 1, max: 3 });
  }
  if (has(input, "status")) patch.status = requireOneOf(input.status, "status", TASK_STATUSES);
  if (has(input, "due_at")) patch.dueAt = optionalTimestamp(input.due_at, "due_at");

  if (Object.keys(patch).length === 0) {
    throw AppError.badRequest("Send at least one field to update.");
  }

  return patch;
}

/**
 * completed_at is derived from status, never sent by the client — one source of
 * truth for "is this done".
 */
export function completionTimestamp(status, now = new Date()) {
  return status === "done" ? now.toISOString() : null;
}

/** The shape the API returns. Explicit, so a new column is never leaked by accident. */
export function serialiseTask(row) {
  return {
    id: row.id,
    list_id: row.list_id,
    parent_id: row.parent_id,
    title: row.title,
    notes: row.notes,
    priority: row.priority,
    status: row.status,
    due_at: row.due_at,
    completed_at: row.completed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
