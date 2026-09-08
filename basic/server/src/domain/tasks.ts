import type { TaskStatus } from "./schemas.js";

/**
 * Task rules that touch neither the database nor HTTP — pure functions, so they
 * are instant to test. A recurrence engine belongs beside this file for the
 * same reason.
 */

export const PRIORITY = { low: 1, normal: 2, high: 3 } as const;

export type TaskRow = {
  id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  notes: string | null;
  priority: number;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * completed_at is derived from status and never accepted from the client, so
 * "is this done" has one source of truth.
 */
export function completionTimestamp(status: TaskStatus, now: Date = new Date()): string | null {
  return status === "done" ? now.toISOString() : null;
}

/** The shape the API returns. Explicit, so a new column is never leaked by accident. */
export function serialiseTask(row: TaskRow) {
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
