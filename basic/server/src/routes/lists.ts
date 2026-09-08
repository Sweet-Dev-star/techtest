import { Router } from "express";
import { listCreateSchema, listUpdateSchema, parse } from "../domain/schemas.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireUser } from "../middleware/context.js";
import { requireListForUser } from "../repositories/access.js";
import { createList, deleteList, listsForUser, serialiseList, updateListName } from "../repositories/lists.js";

export const listsRouter = Router();

listsRouter.get(
  "/",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    res.json({ lists: listsForUser(user.id).map(serialiseList) });
  }),
);

listsRouter.post(
  "/",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const { name } = parse(listCreateSchema, req.body);
    res.status(201).json({ list: serialiseList(createList({ ownerId: user.id, name })) });
  }),
);

listsRouter.patch(
  "/:listId",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const list = requireListForUser(req.params.listId!, user.id);
    const { name } = parse(listUpdateSchema, req.body);
    res.json({ list: serialiseList(updateListName(list.id, name)) });
  }),
);

listsRouter.delete(
  "/:listId",
  asyncHandler((req, res) => {
    const user = requireUser(req);
    const list = requireListForUser(req.params.listId!, user.id);
    deleteList(list.id);
    res.status(204).end();
  }),
);
