import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/domain/passwords.js";
import { completionTimestamp } from "../src/domain/tasks.js";
import { parse, taskCreateSchema, taskUpdateSchema } from "../src/domain/schemas.js";

// Pure logic — no database, no server, instant.

describe("passwords", () => {
  it("verifies a correct password", () => {
    expect(verifyPassword("correct horse battery", hashPassword("correct horse battery"))).toBe(true);
  });

  it("rejects a wrong password", () => {
    expect(verifyPassword("wrong", hashPassword("correct horse battery"))).toBe(false);
  });

  it("salts, so the same password hashes differently each time", () => {
    expect(hashPassword("same input")).not.toBe(hashPassword("same input"));
  });

  it("returns false rather than throwing on a malformed hash", () => {
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(verifyPassword("anything", "")).toBe(false);
  });
});

describe("completionTimestamp", () => {
  it("stamps when done and clears when reopened", () => {
    const now = new Date("2026-01-02T03:04:05.000Z");
    expect(completionTimestamp("done", now)).toBe("2026-01-02T03:04:05.000Z");
    expect(completionTimestamp("open", now)).toBeNull();
  });
});

describe("taskCreateSchema", () => {
  it("applies defaults and trims the title", () => {
    const input = parse(taskCreateSchema, { list_id: "l1", title: "  Write the brief  " });
    expect(input.title).toBe("Write the brief");
    expect(input.priority).toBeUndefined();
  });

  it("normalises due_at to UTC", () => {
    const input = parse(taskCreateSchema, { list_id: "l1", title: "Ship", due_at: "2026-03-01T09:00:00+01:00" });
    expect(input.due_at).toBe("2026-03-01T08:00:00.000Z");
  });

  it("rejects a missing title", () => {
    expect(() => parse(taskCreateSchema, { list_id: "l1" })).toThrow();
  });

  it("rejects an out-of-range priority", () => {
    expect(() => parse(taskCreateSchema, { list_id: "l1", title: "x", priority: 9 })).toThrow();
  });
});

describe("taskUpdateSchema", () => {
  it("rejects an empty patch", () => {
    expect(() => parse(taskUpdateSchema, {})).toThrow();
  });

  it("rejects unknown keys (mass assignment guard)", () => {
    expect(() => parse(taskUpdateSchema, { completed_at: "2020-01-01T00:00:00.000Z" })).toThrow();
  });

  it("keeps an explicit null distinct from an absent key", () => {
    expect(parse(taskUpdateSchema, { due_at: null }).due_at).toBeNull();
    expect(parse(taskUpdateSchema, { title: "x" })).not.toHaveProperty("due_at");
  });
});
