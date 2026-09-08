import { describe, expect, it } from "vitest";
import { createStore } from "./store.ts";

describe("createStore", () => {
  it("merges partial updates and keeps other keys", () => {
    const store = createStore({ a: 1, b: 2 });
    store.set({ a: 10 });
    expect(store.get()).toEqual({ a: 10, b: 2 });
  });

  it("accepts a function updater", () => {
    const store = createStore({ count: 0 });
    store.set((current) => ({ count: current.count + 1 }));
    expect(store.get().count).toBe(1);
  });

  it("notifies subscribers on change and stops after unsubscribe", () => {
    const store = createStore({ v: 0 });
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.set({ v: 1 });
    unsubscribe();
    store.set({ v: 2 });
    expect(calls).toBe(1);
  });
});
