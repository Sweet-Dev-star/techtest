import { Router } from "express";
import { config } from "../config.js";
import { AppError } from "../domain/errors.js";
import { parse, TASK_STATUSES, taskCreateSchema, taskUpdateSchema } from "../domain/schemas.js";
import { serialiseTask } from "../domain/tasks.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireUser } from "../middleware/context.js";
import { requireListForUser, requireTaskForUser } from "../repositories/access.js";
import { createTask, deleteTask, queryTasks, SORT_KEYS, updateTask } from "../repositories/tasks.js";

export const tasksRouter = Router();

/** Read filters off the query string into what queryTasks expects. */
function readFilters(query: Record<string, unknown>) {
  const status = typeof query.status === "string" ? query.status : null;
  if (status && !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
    throw AppError.badRequest(`status must be one of: ${TASK_STATUSES.join(", ")}.`);
  }

  const sort = typeof query.sort === "string" ? query.sort : "created";
  if (!SORT_KEYS.includes(sort)) throw AppError.badRequest(`sort must be one of: ${SORT_KEYS.join(", ")}.`);

  const dueBefore = typeof query.due_before === "string" ? query.due_before : null;
  if (dueBefore && Number.isNaN(new Date(dueBefore).getTime())) {
    throw AppError.badRequest("due_before must be a valid ISO 8601 timestamp.");
  }

  let limit: number = config.defaultPageSize;
  if (typeof query.limit === "string") {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1) throw AppError.badRequest("limit must be a positive whole number.");
  }

  return {
    status,
    sort,
    dueBefore: dueBefore ? new Date(dueBefore).toISOString() : null,
    search: typeof query.q === "string" && query.q.trim() ? query.q.trim() : null,
    cursor: typeof query.cursor === "string" && query.cursor ? query.cursor : null,
    limit,
  };
}

// GET /api/lists/:listId/tasks — nested, so the list is authorised first.
export const listTasksRouter = Router({ mergeParams: true });

listTasksRouter.get(
  "/",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const list = requireListForUser(req.params.listId!, user.id);
    const page = queryTasks({ listId: list.id, ...readFilters(req.query as Record<string, unknown>) });
    res.json({ tasks: page.items.map(serialiseTask), next_cursor: page.nextCursor });
  }),
);

tasksRouter.post(
  "/",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const input = parse(taskCreateSchema, req.body);
    const list = requireListForUser(input.list_id, user.id);

    const task = createTask({
      listId: list.id,
      title: input.title,
      notes: input.notes ?? null,
      priority: input.priority,
      status: input.status,
      dueAt: input.due_at ?? null,
    });
    res.status(201).json({ task: serialiseTask(task) });
  }),
);

tasksRouter.patch(
  "/:taskId",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const existing = requireTaskForUser(req.params.taskId!, user.id);
    const patch = parse(taskUpdateSchema, req.body);
    res.json({ task: serialiseTask(updateTask(existing, patch)) });
  }),
);

tasksRouter.delete(
  "/:taskId",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const task = requireTaskForUser(req.params.taskId!, user.id);
    deleteTask(task.id);
    res.status(204).end();
  }),
);
