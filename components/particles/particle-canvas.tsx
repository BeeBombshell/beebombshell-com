"use client";

/**
 * ParticleCanvas
 * Fixed full-viewport canvas behind everything.
 * Creates the singleton ParticleEngine and wires up:
 *   - cursor tracking (mousemove)
 *   - click bursts (click)
 *   - theme changes (next-themes)
 *   - scroll progress (scrollStore)
 *   - Lenis smooth scroll (optional, passive)
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import type { Theme, ParticleMode } from "./particle-engine";

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  // ── Bootstrap engine ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return;

    let engine: import("./particle-engine").ParticleEngine;

    async function init() {
      const { ParticleEngine } = await import("./particle-engine");

      if (!canvasRef.current) return;

      engine = new ParticleEngine(canvasRef.current);
      window.__particleEngine = engine;
      window.dispatchEvent(new Event("particle-engine-ready"));

      // Cursor tracking
      const onMove = (e: MouseEvent) => engine.setCursor(e.clientX, e.clientY);
      window.addEventListener("mousemove", onMove, { passive: true });

      // Click burst
      const onClick = (e: MouseEvent) =>
        engine.clickBurst(e.clientX, e.clientY);
      window.addEventListener("click", onClick, { passive: true });

      // Touch cursor tracking
      const onTouch = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          engine.setCursor(e.touches[0].clientX, e.touches[0].clientY);
        }
      };
      window.addEventListener("touchmove", onTouch, { passive: true });

      // Section-aware particle morphing with 45% / 40% hysteresis
      const SECTIONS: Array<{ id: string; mode: ParticleMode }> = [
        { id: "hero", mode: "burst" },
        { id: "work", mode: "lattice" },
        { id: "writing", mode: "writing" },
        { id: "views", mode: "takes" },
        { id: "footer", mode: "wordmark" },
      ];

      let activeSectionMode: ParticleMode = "burst";

      const onScroll = () => {
        // Only run multi-section morphing on the home page
        if (window.location.pathname !== "/") return;

        const windowH = window.innerHeight;
        const visibilities = SECTIONS.map((sec) => {
          const el =
            document.getElementById(sec.id) ||
            document.querySelector(`[data-section="${sec.id}"]`);
          if (!el) return { mode: sec.mode, ratio: 0 };
          const rect = el.getBoundingClientRect();
          const visibleTop = Math.max(0, rect.top);
          const visibleBottom = Math.min(windowH, rect.bottom);
          const visibleH = Math.max(0, visibleBottom - visibleTop);
          const ratio = visibleH / windowH;
          return { mode: sec.mode, ratio };
        });

        const currentActive = visibilities.find(
          (v) => v.mode === activeSectionMode
        );
        const currentRatio = currentActive?.ratio ?? 0;

        // If another section has crossed 45% visibility and exceeds current active, switch to it
        const candidate = visibilities.find(
          (v) =>
            v.mode !== activeSectionMode &&
            v.ratio >= 0.45 &&
            v.ratio > currentRatio
        );

        if (candidate) {
          activeSectionMode = candidate.mode;
          engine.morphTo(activeSectionMode);
        } else if (currentRatio < 0.4) {
          // Current section fell below 40% exit threshold: pick dominant visible section
          const best = visibilities.reduce(
            (max, curr) => (curr.ratio > max.ratio ? curr : max),
            visibilities[0]
          );
          if (best.ratio >= 0.25 && best.mode !== activeSectionMode) {
            activeSectionMode = best.mode;
            engine.morphTo(activeSectionMode);
          }
        }

        engine.syncWordmarkPosition();
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      // Trigger initial check
      onScroll();

      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("click", onClick);
        window.removeEventListener("touchmove", onTouch);
        window.removeEventListener("scroll", onScroll);
        engine.destroy();
        delete window.__particleEngine;
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  // ── Theme sync ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!resolvedTheme) return;
    window.__particleEngine?.setTheme(resolvedTheme as Theme);
  }, [resolvedTheme]);

  // ── Route-based Particle Mode Sync ──────────────────────────────────────────
  useEffect(() => {
    if (!pathname) return;

    let targetMode: ParticleMode = "burst";
    if (pathname === "/") {
      targetMode = "burst";
    } else if (pathname.startsWith("/work")) {
      targetMode = "lattice";
    } else if (pathname.startsWith("/about")) {
      targetMode = "contours";
    } else if (pathname.startsWith("/writing")) {
      targetMode = "writing";
    } else if (pathname.startsWith("/llms")) {
      targetMode = "llms";
    }

    window.__particleEngine?.morphTo(targetMode);
  }, [pathname]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
