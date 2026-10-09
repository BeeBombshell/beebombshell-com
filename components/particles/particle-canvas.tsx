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

      // Cursor tracking
      const onMove = (e: MouseEvent) => engine.setCursor(e.clientX, e.clientY);
      window.addEventListener("mousemove", onMove, { passive: true });

      // Click burst
      const onClick = (e: MouseEvent) => engine.clickBurst(e.clientX, e.clientY);
      window.addEventListener("click", onClick, { passive: true });

      // Touch cursor tracking
      const onTouch = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          engine.setCursor(e.touches[0].clientX, e.touches[0].clientY);
        }
      };
      window.addEventListener("touchmove", onTouch, { passive: true });

      // Scroll progress for burst↔lattice morph
      const onScroll = () => {
        // Simple scroll progress: hero is the first section
        const hero = document.getElementById("hero-section");
        if (!hero) return;
        const rect = hero.getBoundingClientRect();
        const s = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.78)));
        engine.onScroll(s);
      };
      window.addEventListener("scroll", onScroll, { passive: true });

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
    init().then((fn) => { cleanup = fn; });

    return () => { cleanup?.(); };
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
