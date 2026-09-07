/**
 * A tiny external store over localStorage, shaped for `useSyncExternalStore`.
 *
 * Two things it buys us:
 *  - no reading storage into state from an effect (React 19 flags that, and it
 *    causes a cascading render on every mount);
 *  - a memory fallback, so a browser that blocks site data still gets working
 *    checkboxes for the session instead of controls that silently do nothing.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
const memory = new Map<string, string>();

function notify() {
  for (const listener of listeners) listener();
}

/** Subscribes to changes from this tab and from other tabs. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Current value, or null if unset. Returns a primitive, so snapshots stay stable. */
export function read(key: string): string | null {
  const fallback = memory.get(key);
  if (fallback !== undefined) return fallback;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
  notify();
}
