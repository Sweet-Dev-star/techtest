import { beforeEach, describe, expect, it } from "vitest";
import { client, freshApp, registerAndLogin } from "./helpers.js";

describe("auth", () => {
  let app: ReturnType<typeof freshApp>;
  beforeEach(() => {
    app = freshApp();
  });

  it("registers, identifies and signs out", async () => {
    const agent = client(app);
    const registered = await agent
      .post("/api/auth/register")
      .send({ username: "ada", email: "ada@example.com", password: "password123" });
    expect(registered.status).toBe(201);
    expect(registered.body.user.email).toBe("ada@example.com");
    expect(registered.body.user.password_hash).toBeUndefined();

    const me = await agent.get("/api/auth/me");
    expect(me.body.user.username).toBe("ada");

    expect((await agent.post("/api/auth/logout")).status).toBe(204);
    expect((await agent.get("/api/auth/me")).body.user).toBeNull();
  });

  it("rejects a duplicate email, case-insensitively", async () => {
    const agent = client(app);
    await registerAndLogin(agent, { email: "dupe@example.com", username: "one" });
    const second = await agent
      .post("/api/auth/register")
      .send({ username: "two", email: "DUPE@example.com", password: "password123" });
    expect(second.status).toBe(409);
    expect(second.body.error.details.email).toBeTruthy();
  });

  it("rejects a duplicate username, case-insensitively", async () => {
    const agent = client(app);
    await registerAndLogin(agent, { username: "Ada", email: "a@example.com" });
    const second = await agent
      .post("/api/auth/register")
      .send({ username: "ADA", email: "b@example.com", password: "password123" });
    expect(second.status).toBe(409);
    expect(second.body.error.details.username).toBeTruthy();
  });

  it("rejects a short password", async () => {
    const res = await client(app)
      .post("/api/auth/register")
      .send({ username: "ada", email: "ada@example.com", password: "abc" });
    expect(res.status).toBe(400);
  });

  it("gives the same answer for a wrong password and an unknown user", async () => {
    const agent = client(app);
    await registerAndLogin(agent, { email: "known@example.com", username: "known" });
    await agent.post("/api/auth/logout");

    const wrongPassword = await agent
      .post("/api/auth/login")
      .send({ identifier: "known@example.com", password: "wrongwrongwrong" });
    const unknownUser = await agent
      .post("/api/auth/login")
      .send({ identifier: "nobody@example.com", password: "wrongwrongwrong" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownUser.body);
  });

  it("signs in by username as well as email", async () => {
    const agent = client(app);
    await registerAndLogin(agent, { username: "ada", email: "ada@example.com" });
    await agent.post("/api/auth/logout");
    const res = await agent.post("/api/auth/login").send({ identifier: "ada", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe("ada");
  });

  it("requires a session for protected routes", async () => {
    expect((await client(app).get("/api/lists")).status).toBe(401);
  });
});
