import assert from "node:assert/strict";
import http from "node:http";
import test, { after, before, describe } from "node:test";

// Must be set before anything imports config.js.
process.env.DATABASE_FILE = ":memory:";

const { createApp } = await import("../src/app.js");
const { migrate } = await import("../src/db/migrate.js");

let server;
let baseUrl;

/** A browser-ish client: remembers the session cookie between calls. */
function createClient() {
  let cookie = null;

  return async function call(method, path, body) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        ...(body ? { "content-type": "application/json" } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = response.headers.getSetCookie?.()[0];
    if (setCookie) cookie = setCookie.split(";")[0];

    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  };
}

before(async () => {
  migrate();
  server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server?.close());

describe("auth", () => {
  test("registers, identifies and signs out", async () => {
    const call = createClient();

    const registered = await call("POST", "/auth/register", {
      email: "auth@example.com",
      password: "password123",
    });
    assert.equal(registered.status, 201);
    assert.equal(registered.body.user.email, "auth@example.com");
    assert.equal(registered.body.user.password_hash, undefined, "must never return the hash");

    assert.equal((await call("GET", "/auth/me")).body.user.email, "auth@example.com");

    assert.equal((await call("POST", "/auth/logout")).status, 204);
    assert.equal((await call("GET", "/auth/me")).body.user, null);
  });

  test("rejects a duplicate email", async () => {
    const call = createClient();
    await call("POST", "/auth/register", { email: "dupe@example.com", password: "password123" });

    const second = await call("POST", "/auth/register", {
      email: "DUPE@example.com",
      password: "password123",
    });
    assert.equal(second.status, 409, "email uniqueness is case-insensitive");
  });

  test("rejects a short password", async () => {
    const call = createClient();
    const result = await call("POST", "/auth/register", { email: "short@example.com", password: "abc" });
    assert.equal(result.status, 400);
  });

  test("gives the same answer for a wrong password and an unknown user", async () => {
    const call = createClient();
    await call("POST", "/auth/register", { email: "known@example.com", password: "password123" });
    await call("POST", "/auth/logout");

    const wrongPassword = await call("POST", "/auth/login", {
      email: "known@example.com",
      password: "wrongwrongwrong",
    });
    const unknownUser = await call("POST", "/auth/login", {
      email: "nobody@example.com",
      password: "wrongwrongwrong",
    });

    assert.equal(wrongPassword.status, 401);
    assert.deepEqual(wrongPassword.body, unknownUser.body, "must not reveal which half was wrong");
  });

  test("requires a session", async () => {
    const call = createClient();
    assert.equal((await call("GET", "/lists")).status, 401);
  });
});

describe("tasks", () => {
  let call;
  let listId;

  before(async () => {
    call = createClient();
    await call("POST", "/auth/register", { email: "tasks@example.com", password: "password123" });
    listId = (await call("POST", "/lists", { name: "Inbox" })).body.list.id;
  });

  test("creates and completes a task", async () => {
    const created = await call("POST", "/tasks", { list_id: listId, title: "Write tests" });
    assert.equal(created.status, 201);
    assert.equal(created.body.task.status, "open");
    assert.equal(created.body.task.completed_at, null);

    const done = await call("PATCH", `/tasks/${created.body.task.id}`, { status: "done" });
    assert.equal(done.body.task.status, "done");
    assert.ok(done.body.task.completed_at, "completed_at is derived from status");

    const reopened = await call("PATCH", `/tasks/${created.body.task.id}`, { status: "open" });
    assert.equal(reopened.body.task.completed_at, null);
  });

  test("paginates with a cursor and never repeats a row", async () => {
    const page = (await call("POST", "/lists", { name: "Paged" })).body.list.id;
    for (let i = 0; i < 7; i += 1) {
      await call("POST", "/tasks", { list_id: page, title: `Task ${i}` });
    }

    const seen = [];
    let cursor = null;
    let requests = 0;

    do {
      const query = `?limit=3${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const result = await call("GET", `/lists/${page}/tasks${query}`);
      seen.push(...result.body.tasks.map((task) => task.id));
      cursor = result.body.next_cursor;
      requests += 1;
    } while (cursor && requests < 10);

    assert.equal(seen.length, 7);
    assert.equal(new Set(seen).size, 7, "no duplicates across pages");
  });

  test("filters by status and searches titles", async () => {
    const list = (await call("POST", "/lists", { name: "Filters" })).body.list.id;
    const keep = await call("POST", "/tasks", { list_id: list, title: "Renew passport" });
    await call("POST", "/tasks", { list_id: list, title: "Water the plants" });
    await call("PATCH", `/tasks/${keep.body.task.id}`, { status: "done" });

    const done = await call("GET", `/lists/${list}/tasks?status=done`);
    assert.equal(done.body.tasks.length, 1);
    assert.equal(done.body.tasks[0].title, "Renew passport");

    const search = await call("GET", `/lists/${list}/tasks?q=plants`);
    assert.equal(search.body.tasks.length, 1);
  });

  test("treats a LIKE wildcard as a literal", async () => {
    const list = (await call("POST", "/lists", { name: "Wildcards" })).body.list.id;
    await call("POST", "/tasks", { list_id: list, title: "Cut costs by 50%" });
    await call("POST", "/tasks", { list_id: list, title: "Nothing to do with numbers" });

    const result = await call("GET", `/lists/${list}/tasks?q=${encodeURIComponent("%")}`);
    assert.equal(result.body.tasks.length, 1, "a bare % must not match every row");
  });

  test("rejects an unknown sort and a malformed cursor", async () => {
    assert.equal((await call("GET", `/lists/${listId}/tasks?sort=sideways`)).status, 400);
    assert.equal((await call("GET", `/lists/${listId}/tasks?cursor=not-base64`)).status, 400);
  });

  test("ignores fields the client is not allowed to set", async () => {
    const created = await call("POST", "/tasks", {
      list_id: listId,
      title: "Mass assignment",
      completed_at: "2020-01-01T00:00:00.000Z",
      id: "chosen-by-the-client",
    });

    assert.notEqual(created.body.task.id, "chosen-by-the-client");
    assert.equal(created.body.task.completed_at, null);
  });
});

describe("access control", () => {
  test("one user cannot see or touch another user's data", async () => {
    const owner = createClient();
    await owner("POST", "/auth/register", { email: "owner@example.com", password: "password123" });
    const listId = (await owner("POST", "/lists", { name: "Private" })).body.list.id;
    const taskId = (await owner("POST", "/tasks", { list_id: listId, title: "Secret" })).body.task.id;

    const stranger = createClient();
    await stranger("POST", "/auth/register", { email: "stranger@example.com", password: "password123" });

    assert.equal((await stranger("GET", `/lists/${listId}/tasks`)).status, 404);
    assert.equal((await stranger("PATCH", `/tasks/${taskId}`, { title: "Hijacked" })).status, 404);
    assert.equal((await stranger("DELETE", `/tasks/${taskId}`)).status, 404);
    assert.equal((await stranger("POST", "/tasks", { list_id: listId, title: "Injected" })).status, 404);
    assert.equal((await stranger("DELETE", `/lists/${listId}`)).status, 404);

    // ...and the owner's data is untouched.
    const remaining = await owner("GET", `/lists/${listId}/tasks`);
    assert.equal(remaining.body.tasks.length, 1);
    assert.equal(remaining.body.tasks[0].title, "Secret");
  });
});

describe("routing", () => {
  test("405 when the path exists but the method does not", async () => {
    const call = createClient();
    const result = await call("GET", "/auth/login");
    assert.equal(result.status, 405);
    assert.equal(result.body.error.code, "method_not_allowed");
  });

  test("404 for an unknown path", async () => {
    assert.equal((await createClient()("GET", "/nope")).status, 404);
  });

  test("serves the web client at /", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /text\/html/);
  });

  test("does not serve files outside public/", async () => {
    const response = await fetch(`${baseUrl}/../package.json`, { redirect: "manual" });
    assert.notEqual(response.status, 200);
  });
});
