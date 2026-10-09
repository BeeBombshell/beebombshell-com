"use client";

import { useEffect, useSyncExternalStore } from "react";
import { moodStore, type MoodType } from "./mood-store";
import { COPY } from "@/lib/copy";

function subscribeReducedMotion(cb: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

export function useCharacter(enabled = true) {
  const current = useSyncExternalStore(
    moodStore.subscribe,
    () => moodStore.state,
    () => moodStore.state
  );

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // 1. DevTools Console Easter Egg
  useEffect(() => {
    if (!enabled) return;
    try {
      console.log(
        "%c" + COPY.egg.console,
        "color: #c9b8ff; font-family: monospace; font-size: 11px; padding: 4px;"
      );
    } catch {
      // ignore
    }
  }, [enabled]);

  // 2. Tab Blur / Focus Title Switch
  useEffect(() => {
    if (!enabled) return;
    let originalTitle = document.title;
    let restoreTimeout: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        originalTitle = document.title;
        document.title = COPY.tab.away;
      } else {
        document.title = COPY.tab.return;
        clearTimeout(restoreTimeout);
        restoreTimeout = setTimeout(() => {
          document.title = originalTitle;
        }, 2200);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(restoreTimeout);
    };
  }, [enabled]);

  // 3. Idle Escalation Engine
  useEffect(() => {
    if (!enabled || reducedMotion) return;

    let idleCount = 0;
    const currentHour = new Date().getHours();
    const isLateNight = currentHour >= 1 && currentHour < 5;

    const interval = setInterval(() => {
      idleCount += 1;

      if (idleCount >= 30) {
        moodStore.setIdleState(idleCount, COPY.idle.stillHere);
      } else if (idleCount >= 15) {
        // At 15s, badge hops / fidgets once
        const hop = idleCount === 15;
        moodStore.setIdleState(idleCount, COPY.idle.fidgeting, hop);
      } else if (idleCount >= 5) {
        moodStore.setMood("restless");
        moodStore.setIdleState(idleCount, null);
      } else {
        if (isLateNight) {
          moodStore.setMood("sleepy");
        } else {
          moodStore.setMood("chilling");
        }
        moodStore.setIdleState(idleCount, null);
      }
    }, 1000);

    const resetIdle = () => {
      idleCount = 0;
      if (isLateNight) {
        moodStore.setMood("sleepy");
      } else {
        moodStore.setMood("chilling");
      }
      moodStore.setIdleState(0, null);
    };

    window.addEventListener("mousemove", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle, { passive: true });
    window.addEventListener("scroll", resetIdle, { passive: true });
    window.addEventListener("touchstart", resetIdle, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, [enabled, reducedMotion]);

  return {
    mood: current.mood,
    idleCaption: current.idleCaption,
    shouldHop: current.shouldHop,
    setMood: (mood: MoodType) => {
      if (enabled) moodStore.setMood(mood);
    },
    resetHop: () => moodStore.resetHop(),
  };
}

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return COPY.greet.morning;
  if (hour >= 12 && hour < 17) return COPY.greet.afternoon;
  if (hour >= 17 && hour < 22) return COPY.greet.evening;
  if (hour >= 22 || hour < 1) return COPY.greet.late;
  return COPY.greet.veryLate;
}
