"use client";

import { useSyncExternalStore } from "react";
import { read, subscribe, write } from "@/lib/browserStore";

type Theme = "light" | "dark";
const KEY = "tm-theme";

function subscribeTheme(listener: () => void): () => void {
  const unsubscribe = subscribe(listener);
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", listener);
  return () => {
    unsubscribe();
    query.removeEventListener("change", listener);
  };
}

/** Stored choice if there is one, otherwise whatever the OS is asking for. */
function currentTheme(): Theme {
  const stored = read(KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Flips the `data-theme` stamp on <html>. Before hydration the snapshot is null
 * and the button reads "Theme", so server and client markup match exactly.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme | null>(subscribeTheme, currentTheme, () => null);

  function toggle() {
    const next: Theme = (theme ?? currentTheme()) === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    write(KEY, next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={
        theme === null
          ? "Switch theme"
          : `Switch to ${theme === "dark" ? "light" : "dark"} mode`
      }
    >
      {theme === null ? "Theme" : theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
