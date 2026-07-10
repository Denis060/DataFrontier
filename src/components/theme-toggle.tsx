"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const THEME_EVENT = "df:themechange";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

function getSnapshot(): Theme {
  return (document.documentElement.dataset.theme as Theme) ?? "dark";
}

/** The server has no access to localStorage, so it renders the neutral state. */
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or storage disabled — the theme still applies this session.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme
          ? `Switch to ${theme === "light" ? "dark" : "light"} theme`
          : "Switch theme"
      }
      className={`inline-flex size-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-border-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
    >
      {theme === "light" ? (
        <Moon className="size-4" aria-hidden />
      ) : theme === "dark" ? (
        <Sun className="size-4" aria-hidden />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
