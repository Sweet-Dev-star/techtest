import { beforeEach, describe, expect, it } from "vitest";
import { client, createList, freshApp, registerAndLogin } from "./helpers.js";

describe("lists", () => {
  let app: ReturnType<typeof freshApp>;
  beforeEach(() => {
    app = freshApp();
  });

  it("creates and lists", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    await createList(agent, "Work");
    await createList(agent, "Personal");

    const res = await agent.get("/api/lists");
    expect(res.body.lists.map((l: { name: string }) => l.name)).toEqual(["Work", "Personal"]);
    expect(res.body.lists[0].open_count).toBe(0);
  });

  it("renames a list", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const id = await createList(agent, "Draft");
    const res = await agent.patch(`/api/lists/${id}`).send({ name: "Final" });
    expect(res.body.list.name).toBe("Final");
  });

  it("deletes a list and its tasks", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const id = await createList(agent);
    await agent.post("/api/tasks").send({ list_id: id, title: "Doomed" });

    expect((await agent.delete(`/api/lists/${id}`)).status).toBe(204);
    expect((await agent.get("/api/lists")).body.lists).toHaveLength(0);
  });

  it("rejects an empty name", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    expect((await agent.post("/api/lists").send({ name: "   " })).status).toBe(400);
  });

  it("keeps a per-list open-task count", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const id = await createList(agent);
    await agent.post("/api/tasks").send({ list_id: id, title: "One" });
    const two = await agent.post("/api/tasks").send({ list_id: id, title: "Two" });
    await agent.patch(`/api/tasks/${two.body.task.id}`).send({ status: "done" });

    const res = await agent.get("/api/lists");
    expect(res.body.lists[0].open_count).toBe(1);
  });
});
