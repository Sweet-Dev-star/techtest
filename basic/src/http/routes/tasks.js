import { config } from "../../config.js";
import { requireListForUser, requireTaskForUser } from "../../db/repositories/access.js";
import {
  createTask,
  deleteTask,
  queryTasks,
  SORT_KEYS,
  updateTask,
} from "../../db/repositories/tasks.js";
import { AppError } from "../../domain/errors.js";
import {
  serialiseTask,
  taskCreateInput,
  taskUpdateInput,
  TASK_STATUSES,
} from "../../domain/tasks.js";
import { requireObject, requireString } from "../../domain/validate.js";
import { readJsonBody, requireUser } from "../middleware.js";
import { sendJson, sendNoContent } from "../respond.js";

/** Turns the query string into the arguments queryTasks expects. */
function readFilters(query) {
  const status = query.get("status");
  if (status && !TASK_STATUSES.includes(status)) {
    throw AppError.badRequest(`status must be one of: ${TASK_STATUSES.join(", ")}.`);
  }

  const sort = query.get("sort") ?? "created";
  if (!SORT_KEYS.includes(sort)) {
    throw AppError.badRequest(`sort must be one of: ${SORT_KEYS.join(", ")}.`);
  }

  const dueBefore = query.get("due_before");
  if (dueBefore && Number.isNaN(new Date(dueBefore).getTime())) {
    throw AppError.badRequest("due_before must be a valid ISO 8601 timestamp.");
  }

  const rawLimit = query.get("limit");
  let limit = config.defaultPageSize;
  if (rawLimit !== null) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      throw AppError.badRequest("limit must be a positive whole number.");
    }
  }

  return {
    status: status ?? null,
    sort,
    dueBefore: dueBefore ? new Date(dueBefore).toISOString() : null,
    search: query.get("q")?.trim() || null,
    cursor: query.get("cursor") || null,
    limit,
  };
}

export function registerTaskRoutes(router) {
  router.get("/lists/:listId/tasks", async ({ req, res, params, query }) => {
    const user = requireUser(req);
    const list = requireListForUser(params.listId, user.id);

    const page = queryTasks({ listId: list.id, ...readFilters(query) });

    sendJson(res, 200, {
      tasks: page.items.map(serialiseTask),
      next_cursor: page.next_cursor,
    });
  });

  router.post("/tasks", async ({ req, res }) => {
    const user = requireUser(req);
    const body = requireObject(await readJsonBody(req));

    const listId = requireString(body.list_id, "list_id", { max: 64 });
    const list = requireListForUser(listId, user.id);

    const input = taskCreateInput(body);
    const task = createTask({ listId: list.id, ...input });

    sendJson(res, 201, { task: serialiseTask(task) });
  });

  router.patch("/tasks/:taskId", async ({ req, res, params }) => {
    const user = requireUser(req);
    const existing = requireTaskForUser(params.taskId, user.id);

    // Problem 2 wants a version check here: reject a write built on a stale
    // read with 409 instead of overwriting a newer one.
    const patch = taskUpdateInput(await readJsonBody(req));

    sendJson(res, 200, { task: serialiseTask(updateTask(existing, patch)) });
  });

  router.delete("/tasks/:taskId", async ({ req, res, params }) => {
    const user = requireUser(req);
    const task = requireTaskForUser(params.taskId, user.id);

    deleteTask(task.id);
    sendNoContent(res);
  });
}
