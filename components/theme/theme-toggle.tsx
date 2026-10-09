"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const emptySubscribe = () => () => {};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <button
        type="button"
        className={`w-7 h-7 flex items-center justify-center opacity-55 hover:opacity-100 transition-opacity ${className}`}
        aria-label="Toggle theme"
      >
        <span className="w-3.5 h-3.5 block" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-7 h-7 flex items-center justify-center opacity-55 hover:opacity-100 transition-opacity focus-visible:rounded-full ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Moon className="w-3.5 h-3.5" aria-hidden="true" />
      )}
    </button>
  );
}
