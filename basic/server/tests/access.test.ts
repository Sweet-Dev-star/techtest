import { beforeEach, describe, expect, it } from "vitest";
import { client, createList, freshApp, registerAndLogin } from "./helpers.js";

describe("access control", () => {
  let app: ReturnType<typeof freshApp>;
  beforeEach(() => {
    app = freshApp();
  });

  it("one user cannot see or touch another user's data", async () => {
    const owner = client(app);
    await registerAndLogin(owner, { username: "owner", email: "owner@example.com" });
    const listId = await createList(owner, "Private");
    const taskId = (await owner.post("/api/tasks").send({ list_id: listId, title: "Secret" })).body.task.id;

    const stranger = client(app);
    await registerAndLogin(stranger, { username: "stranger", email: "stranger@example.com" });

    expect((await stranger.get(`/api/lists/${listId}/tasks`)).status).toBe(404);
    expect((await stranger.patch(`/api/tasks/${taskId}`).send({ title: "Hijacked" })).status).toBe(404);
    expect((await stranger.delete(`/api/tasks/${taskId}`)).status).toBe(404);
    expect((await stranger.post("/api/tasks").send({ list_id: listId, title: "Injected" })).status).toBe(404);
    expect((await stranger.delete(`/api/lists/${listId}`)).status).toBe(404);

    // ...and the owner's data is untouched.
    const remaining = await owner.get(`/api/lists/${listId}/tasks`);
    expect(remaining.body.tasks).toHaveLength(1);
    expect(remaining.body.tasks[0].title).toBe("Secret");
  });

  it("answers 404, not 403, for someone else's resource", async () => {
    const owner = client(app);
    await registerAndLogin(owner, { username: "owner", email: "owner@example.com" });
    const listId = await createList(owner);

    const stranger = client(app);
    await registerAndLogin(stranger, { username: "stranger", email: "stranger@example.com" });

    const res = await stranger.get(`/api/lists/${listId}/tasks`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("404s an unknown API route and never falls through to the SPA", async () => {
    const res = await client(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("reports a healthy liveness probe", async () => {
    const res = await client(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
