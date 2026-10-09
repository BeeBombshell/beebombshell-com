"use client";

/**
 * use-particles.ts
 * React hook exposing morphTo(), registerRect(), and impulse()
 * from the singleton ParticleEngine.
 */

import { useEffect, useRef, useCallback } from "react";
import type { ParticleMode, Theme } from "./particle-engine";

// Singleton engine ref — shared across the tree
// (window-level so HMR doesn't recreate it)
declare global {
  interface Window {
    __particleEngine?: import("./particle-engine").ParticleEngine;
  }
}

export function useParticleEngine() {
  const engineRef = useRef<import("./particle-engine").ParticleEngine | null>(null);

  useEffect(() => {
    // Get the engine that the ParticleCanvas already created
    if (typeof window !== "undefined" && window.__particleEngine) {
      engineRef.current = window.__particleEngine;
    }
  }, []);

  const morphTo = useCallback((mode: ParticleMode) => {
    engineRef.current?.morphTo(mode);
  }, []);

  const registerRect = useCallback((id: string, getRect: () => DOMRect | null) => {
    engineRef.current?.registerRect(id, getRect);
    return () => engineRef.current?.unregisterRect(id);
  }, []);

  const impulse = useCallback(
    (x: number, y: number, radius?: number, force?: number) => {
      engineRef.current?.impulse(x, y, radius, force);
    },
    []
  );

  const setTheme = useCallback((theme: Theme) => {
    engineRef.current?.setTheme(theme);
  }, []);

  return { morphTo, registerRect, impulse, setTheme };
}

/**
 * useRegisterTextBlock
 * Convenience hook: registers a ref'd element's bounding rect
 * with the particle engine for text-aware dimming.
 * Refreshes on mount and window resize.
 */
export function useRegisterTextBlock(
  id: string,
  elRef: React.RefObject<HTMLElement | null>
) {
  const { registerRect } = useParticleEngine();

  useEffect(() => {
    const getRect = () => elRef.current?.getBoundingClientRect() ?? null;
    const unregister = registerRect(id, getRect);
    return unregister;
  }, [id, elRef, registerRect]);
}
