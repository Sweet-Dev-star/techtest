/**
 * Ten lines of state management: a value, subscribers, and a merge.
 *
 * Deliberately minimal. Problem 2 asks who owns the truth between server and
 * client — answering it will mean replacing or growing this file, and it is
 * easier to reason about that starting from something you can read at a glance
 * than from a framework's cache.
 */
export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    get: () => state,

    set(patch) {
      const next = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...next };
      for (const listener of listeners) listener(state);
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
