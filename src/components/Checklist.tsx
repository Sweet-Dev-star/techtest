"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { read, subscribe, write } from "@/lib/browserStore";

const KEY = "tm-takehome-checklist-v1";

function parse(raw: string | null, count: number): boolean[] {
  let stored: unknown = null;
  try {
    stored = raw ? JSON.parse(raw) : null;
  } catch {
    stored = null;
  }
  const list = Array.isArray(stored) ? stored : [];
  return Array.from({ length: count }, (_, i) => list[i] === true);
}

/**
 * Pre-flight checklist. State is a per-candidate convenience only — it never
 * leaves their browser, and the page renders correctly with none of it.
 */
export function Checklist({ items }: { items: ReactNode[] }) {
  const count = items.length;
  const raw = useSyncExternalStore<string | null>(
    subscribe,
    () => read(KEY),
    () => null,
  );

  const checked = useMemo(() => parse(raw, count), [raw, count]);
  const done = checked.filter(Boolean).length;

  function toggle(index: number) {
    const next = checked.map((value, i) => (i === index ? !value : value));
    write(KEY, JSON.stringify(next));
  }

  return (
    <>
      <div className="check">
        <div className="check-head">
          <span>Pre-flight checklist</span>
          <span className="check-count mono" aria-live="polite">
            {done} / {count}
          </span>
        </div>
        {items.map((item, i) => (
          <label key={i}>
            <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <p className="eyebrow" style={{ marginTop: 12 }}>
        Saved in this browser only. Nothing is sent anywhere.
      </p>
    </>
  );
}
