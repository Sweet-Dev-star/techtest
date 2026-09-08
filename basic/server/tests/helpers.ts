import supertest from "supertest";
import type TestAgent from "supertest/lib/agent.js";
import { createApp } from "../src/app.js";
import { useInMemoryDb } from "../src/db/connection.js";

/**
 * A fresh in-memory database and app per call, so every test is isolated and
 * the suite can run in parallel without touching disk.
 */
export function freshApp() {
  useInMemoryDb();
  return createApp();
}

/**
 * A supertest agent that keeps cookies between requests, like a browser, plus a
 * helper to register and stay signed in.
 */
export function client(app: ReturnType<typeof createApp>): TestAgent {
  return supertest.agent(app);
}

export async function registerAndLogin(
  agent: TestAgent,
  overrides: Partial<{ username: string; email: string; password: string }> = {},
): Promise<{ id: string; username: string; email: string }> {
  const body = {
    username: overrides.username ?? "ada",
    email: overrides.email ?? "ada@example.com",
    password: overrides.password ?? "password123",
  };
  const res = await agent.post("/api/auth/register").send(body);
  return res.body.user;
}

export async function createList(agent: TestAgent, name = "Inbox"): Promise<string> {
  const res = await agent.post("/api/lists").send({ name });
  return res.body.list.id;
}
