"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const emptySubscribe = () => () => {};

/** Trigger a View-Transition-powered theme glide from the toggle button.
 *  Falls back to instant toggle if the browser doesn't support View Transitions. */
async function startThemeTransition(
  newTheme: "light" | "dark",
  trigger: HTMLButtonElement,
  setTheme: (t: string) => void
) {
  if (
    typeof document === "undefined" ||
    !("startViewTransition" in document)
  ) {
    setTheme(newTheme);
    return;
  }

  // Get the trigger rect so the ripple originates from the toggle button
  const rect = trigger.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  // Max radius needed to cover the full screen from origin point
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Stash origin as CSS custom props so the keyframes can use them
  document.documentElement.style.setProperty("--vt-x", `${x}px`);
  document.documentElement.style.setProperty("--vt-y", `${y}px`);
  document.documentElement.style.setProperty("--vt-r", `${endRadius}px`);

  const transition = (document as Document & { startViewTransition: (cb: () => void) => { ready: Promise<void> } }).startViewTransition(() => {
    setTheme(newTheme);
  });

  await transition.ready;

  // Going dark → bright flash (simulate bulb switch-on)
  // Going light → smooth dim (bulb fading off)
  const isDarkening = newTheme === "dark";

  const clipPath = [
    `circle(0px at ${x}px ${y}px)`,
    `circle(${endRadius}px at ${x}px ${y}px)`,
  ];

  document.documentElement.animate(
    {
      clipPath: isDarkening ? clipPath.slice().reverse() : clipPath,
    },
    {
      duration: isDarkening ? 520 : 420,
      easing: isDarkening
        ? "cubic-bezier(0.22, 1, 0.36, 1)"   // fast in, slow settle — like a bulb turning on
        : "cubic-bezier(0.64, 0, 0.78, 0)",   // slow start, fast cut — like a bulb turning off
      pseudoElement: isDarkening
        ? "::view-transition-old(root)"
        : "::view-transition-new(root)",
    }
  );
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

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
      ref={buttonRef}
      type="button"
      onClick={() => {
        if (buttonRef.current) {
          startThemeTransition(isDark ? "light" : "dark", buttonRef.current, setTheme);
        } else {
          setTheme(isDark ? "light" : "dark");
        }
      }}
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
