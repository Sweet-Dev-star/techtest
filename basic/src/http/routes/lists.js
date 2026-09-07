import { requireListForUser } from "../../db/repositories/access.js";
import {
  createList,
  deleteList,
  listsForUser,
  serialiseList,
  updateList,
} from "../../db/repositories/lists.js";
import { requireObject, requireString } from "../../domain/validate.js";
import { readJsonBody, requireUser } from "../middleware.js";
import { sendJson, sendNoContent } from "../respond.js";

export function registerListRoutes(router) {
  router.get("/lists", async ({ req, res }) => {
    const user = requireUser(req);
    sendJson(res, 200, { lists: listsForUser(user.id).map(serialiseList) });
  });

  router.post("/lists", async ({ req, res }) => {
    const user = requireUser(req);
    const body = requireObject(await readJsonBody(req));
    const name = requireString(body.name, "name", { max: 120 });

    const list = createList({ ownerId: user.id, name });
    sendJson(res, 201, { list: serialiseList(list) });
  });

  router.patch("/lists/:listId", async ({ req, res, params }) => {
    const user = requireUser(req);
    const list = requireListForUser(params.listId, user.id);

    const body = requireObject(await readJsonBody(req));
    const name = requireString(body.name, "name", { max: 120 });

    sendJson(res, 200, { list: serialiseList(updateList(list.id, { name })) });
  });

  router.delete("/lists/:listId", async ({ req, res, params }) => {
    const user = requireUser(req);
    const list = requireListForUser(params.listId, user.id);

    deleteList(list.id);
    sendNoContent(res);
  });
}
