import { useSyncExternalStore } from "react";

/**
 * A minimal external store: a value, subscribers, and a merge. Deliberately
 * tiny — the client-state and offline work will grow or replace this, and it is
 * easier to reason about that starting from something you can read at a glance
 * than from a framework's cache.
 *
 * useStore() returns the whole state and re-renders on every change. That is
 * fine at this size and openly wrong for thousands of rows: every keystroke
 * re-renders the entire tree. That is where the rendering work begins.
 */
export function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();

  const store = {
    get: () => state,
    set(patch: Partial<T> | ((current: T) => Partial<T>)) {
      const next = typeof patch === "function" ? (patch as (c: T) => Partial<T>)(state) : patch;
      // A new object reference each change, so useSyncExternalStore re-renders.
      state = { ...state, ...next };
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  function useStore(): T {
    return useSyncExternalStore(store.subscribe, store.get, () => initial);
  }

  return { ...store, useStore };
}
