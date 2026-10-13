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
  const engineRef = useRef<import("./particle-engine").ParticleEngine | null>(
    null
  );

  useEffect(() => {
    const syncEngine = () => {
      engineRef.current = window.__particleEngine ?? null;
    };

    syncEngine();
    window.addEventListener("particle-engine-ready", syncEngine);
    return () =>
      window.removeEventListener("particle-engine-ready", syncEngine);
  }, []);

  const morphTo = useCallback((mode: ParticleMode) => {
    (window.__particleEngine ?? engineRef.current)?.morphTo(mode);
  }, []);

  const registerRect = useCallback(
    (id: string, getRect: () => DOMRect | null) => {
      let registeredEngine = window.__particleEngine ?? engineRef.current;
      registeredEngine?.registerRect(id, getRect);

      const registerWithCurrentEngine = () => {
        const currentEngine = window.__particleEngine;
        if (!currentEngine || currentEngine === registeredEngine) return;
        registeredEngine?.unregisterRect(id);
        currentEngine.registerRect(id, getRect);
        registeredEngine = currentEngine;
      };

      window.addEventListener(
        "particle-engine-ready",
        registerWithCurrentEngine
      );
      return () => {
        window.removeEventListener(
          "particle-engine-ready",
          registerWithCurrentEngine
        );
        registeredEngine?.unregisterRect(id);
      };
    },
    []
  );

  const impulse = useCallback(
    (x: number, y: number, radius?: number, force?: number) => {
      (window.__particleEngine ?? engineRef.current)?.impulse(
        x,
        y,
        radius,
        force
      );
    },
    []
  );

  const setTheme = useCallback((theme: Theme) => {
    (window.__particleEngine ?? engineRef.current)?.setTheme(theme);
  }, []);

  const shearTakes = useCallback((vx: number) => {
    (window.__particleEngine ?? engineRef.current)?.shearTakes(vx);
  }, []);

  const slideImpulse = useCallback((direction: 1 | -1) => {
    (window.__particleEngine ?? engineRef.current)?.slideImpulse(direction);
  }, []);

  const setAccentTarget = useCallback(
    (point: { x: number; y: number } | null) => {
      (window.__particleEngine ?? engineRef.current)?.setAccentTarget(point);
    },
    []
  );

  const setGlyphTarget = useCallback((rect: DOMRect | null) => {
    (window.__particleEngine ?? engineRef.current)?.setGlyphTarget(rect);
  }, []);

  const setWordmarkElement = useCallback((element: HTMLElement | null) => {
    (window.__particleEngine ?? engineRef.current)?.setWordmarkElement(element);
  }, []);

  return {
    morphTo,
    registerRect,
    impulse,
    setTheme,
    shearTakes,
    slideImpulse,
    setAccentTarget,
    setGlyphTarget,
    setWordmarkElement,
  };
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
