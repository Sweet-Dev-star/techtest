import { beforeEach, describe, expect, it } from "vitest";
import { client, createList, freshApp, registerAndLogin } from "./helpers.js";

describe("tasks", () => {
  let app: ReturnType<typeof freshApp>;
  beforeEach(() => {
    app = freshApp();
  });

  it("creates and completes a task", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);

    const created = await agent.post("/api/tasks").send({ list_id: listId, title: "Write tests" });
    expect(created.status).toBe(201);
    expect(created.body.task.status).toBe("open");
    expect(created.body.task.completed_at).toBeNull();

    const done = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ status: "done" });
    expect(done.body.task.status).toBe("done");
    expect(done.body.task.completed_at).toBeTruthy();

    const reopened = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ status: "open" });
    expect(reopened.body.task.completed_at).toBeNull();
  });

  it("applies a partial update without touching other fields", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    const created = await agent.post("/api/tasks").send({ list_id: listId, title: "Keep notes", notes: "original" });

    const patched = await agent.patch(`/api/tasks/${created.body.task.id}`).send({ title: "New title" });
    expect(patched.body.task.title).toBe("New title");
    expect(patched.body.task.notes).toBe("original");
  });

  it("paginates with a cursor and never repeats a row", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    for (let i = 0; i < 7; i += 1) await agent.post("/api/tasks").send({ list_id: listId, title: `Task ${i}` });

    const seen: string[] = [];
    let cursor: string | null = null;
    let requests = 0;
    do {
      const query = `?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await agent.get(`/api/lists/${listId}/tasks${query}`);
      seen.push(...res.body.tasks.map((t: { id: string }) => t.id));
      cursor = res.body.next_cursor;
      requests += 1;
    } while (cursor && requests < 10);

    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
  });

  it("filters by status and searches titles", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    const keep = await agent.post("/api/tasks").send({ list_id: listId, title: "Renew passport" });
    await agent.post("/api/tasks").send({ list_id: listId, title: "Water the plants" });
    await agent.patch(`/api/tasks/${keep.body.task.id}`).send({ status: "done" });

    const done = await agent.get(`/api/lists/${listId}/tasks?status=done`);
    expect(done.body.tasks).toHaveLength(1);
    expect(done.body.tasks[0].title).toBe("Renew passport");

    const search = await agent.get(`/api/lists/${listId}/tasks?q=plants`);
    expect(search.body.tasks).toHaveLength(1);
  });

  it("treats a LIKE wildcard as a literal", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    await agent.post("/api/tasks").send({ list_id: listId, title: "Cut costs by 50%" });
    await agent.post("/api/tasks").send({ list_id: listId, title: "Nothing to do with numbers" });

    const res = await agent.get(`/api/lists/${listId}/tasks?q=${encodeURIComponent("%")}`);
    expect(res.body.tasks).toHaveLength(1);
  });

  it("rejects an unknown sort and a malformed cursor", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    expect((await agent.get(`/api/lists/${listId}/tasks?sort=sideways`)).status).toBe(400);
    expect((await agent.get(`/api/lists/${listId}/tasks?cursor=not-base64`)).status).toBe(400);
  });

  it("ignores fields the client is not allowed to set", async () => {
    const agent = client(app);
    await registerAndLogin(agent);
    const listId = await createList(agent);
    const created = await agent
      .post("/api/tasks")
      .send({ list_id: listId, title: "Mass assignment", id: "chosen-by-client", completed_at: "2020-01-01T00:00:00.000Z" });

    expect(created.body.task.id).not.toBe("chosen-by-client");
    expect(created.body.task.completed_at).toBeNull();
  });
});
