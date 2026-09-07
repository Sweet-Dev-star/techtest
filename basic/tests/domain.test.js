import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { AppError } from "../src/domain/errors.js";
import { hashPassword, verifyPassword } from "../src/domain/passwords.js";
import { completionTimestamp, taskCreateInput, taskUpdateInput } from "../src/domain/tasks.js";

/**
 * The domain runs without a database or a server, so these tests are instant.
 * Keep it that way: logic that needs a running server belongs in api.test.js.
 */

describe("taskCreateInput", () => {
  test("applies defaults", () => {
    const input = taskCreateInput({ title: "  Write the brief  " });

    assert.equal(input.title, "Write the brief");
    assert.equal(input.notes, null);
    assert.equal(input.priority, 2);
    assert.equal(input.status, "open");
    assert.equal(input.dueAt, null);
  });

  test("normalises due_at to UTC", () => {
    const input = taskCreateInput({ title: "Ship", due_at: "2026-03-01T09:00:00+01:00" });
    assert.equal(input.dueAt, "2026-03-01T08:00:00.000Z");
  });

  test("rejects a missing title", () => {
    assert.throws(() => taskCreateInput({}), (error) => error instanceof AppError && error.status === 400);
  });

  test("rejects a whitespace-only title", () => {
    assert.throws(() => taskCreateInput({ title: "   " }), AppError);
  });

  test("rejects an out-of-range priority", () => {
    assert.throws(() => taskCreateInput({ title: "x", priority: 9 }), AppError);
  });

  test("rejects an unparseable due date", () => {
    assert.throws(() => taskCreateInput({ title: "x", due_at: "next tuesday" }), AppError);
  });
});

describe("taskUpdateInput", () => {
  test("returns only the keys that were sent", () => {
    const patch = taskUpdateInput({ status: "done" });
    assert.deepEqual(Object.keys(patch), ["status"]);
  });

  test("tells an explicit null from an absent key", () => {
    assert.equal(taskUpdateInput({ due_at: null }).dueAt, null);
    assert.equal(Object.prototype.hasOwnProperty.call(taskUpdateInput({ title: "x" }), "dueAt"), false);
  });

  test("rejects an empty patch", () => {
    assert.throws(() => taskUpdateInput({}), AppError);
  });

  test("rejects an unknown status", () => {
    assert.throws(() => taskUpdateInput({ status: "maybe" }), AppError);
  });
});

describe("completionTimestamp", () => {
  test("stamps when done and clears when reopened", () => {
    const now = new Date("2026-01-02T03:04:05.000Z");
    assert.equal(completionTimestamp("done", now), "2026-01-02T03:04:05.000Z");
    assert.equal(completionTimestamp("open", now), null);
  });
});

describe("passwords", () => {
  test("verifies a correct password", () => {
    const hash = hashPassword("correct horse battery");
    assert.equal(verifyPassword("correct horse battery", hash), true);
  });

  test("rejects a wrong password", () => {
    assert.equal(verifyPassword("wrong", hashPassword("correct horse battery")), false);
  });

  test("salts, so the same password hashes differently every time", () => {
    assert.notEqual(hashPassword("same input"), hashPassword("same input"));
  });

  test("returns false rather than throwing on a malformed hash", () => {
    assert.equal(verifyPassword("anything", "not-a-hash"), false);
    assert.equal(verifyPassword("anything", ""), false);
  });
});
