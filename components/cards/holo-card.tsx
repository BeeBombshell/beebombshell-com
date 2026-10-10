"use client";

import React, { useRef, useState, useCallback, useEffect, ReactNode } from "react";

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enableTilt?: boolean;
}

// Particle color tokens sampled from design.md (pastel palette)
const PASTEL_PALETTE = {
  dark: [
    "rgba(179, 166, 255, 0.9)", // #b3a6ff lavender
    "rgba(213, 176, 245, 0.9)", // #d5b0f5 orchid
    "rgba(255, 179, 220, 0.9)", // #ffb3dc pink
    "rgba(166, 230, 242, 0.9)", // #a6e6f2 cyan
    "rgba(255, 145, 110, 0.95)", // warm coral / ember
  ],
  light: [
    "rgba(145, 125, 240, 0.85)",
    "rgba(185, 125, 230, 0.85)",
    "rgba(235, 120, 185, 0.85)",
    "rgba(100, 195, 220, 0.85)",
    "rgba(220, 85, 55, 0.9)",
  ],
};

// Technical ASCII micro-glyphs for stipple particle swarm
const GLYPHS = ["·", "+", "*", "×", "▪", "▫", "::", "1", "0"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  glyph: string;
  isGlyph: boolean;
  colorIdx: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  alpha: number;
}

/**
 * HoloCard / BlueprintParticleCard
 *
 * Implements an interactive technical blueprint stipple particle & ASCII micro-glyph
 * interaction designed to harmonize with the portfolio's precision drawing aesthetic (design.md).
 *
 * Features:
 * - 48 interactive spring particles: mix of 1.5px stipple square dots and ASCII technical glyphs
 * - Magnetic orbit swarm following the pointer with momentum physics
 * - Subtle isometric lattice points that illuminate near the cursor
 * - Dashed blueprint crosshair guides tracking cursor coordinates
 * - Four corner registration brackets (┌ ┐ └ ┘)
 * - Live coordinate HUD in the margin (• X 000 / Y 000)
 * - Dynamic specular border glow rotating with cursor direction
 * - Smooth 3D spring tilt with zero idle CPU overhead
 */
export function HoloCard({
  children,
  className = "",
  style = {},
  enableTilt = true,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 50, y: 50, pxX: 0, pxY: 0, tiltX: 0, tiltY: 0 });

  // Physics simulation state
  const simRef = useRef<{
    rafId: number;
    particles: Particle[];
    mouseX: number;
    mouseY: number;
    currMouseX: number;
    currMouseY: number;
    width: number;
    height: number;
    time: number;
  }>({
    rafId: 0,
    particles: [],
    mouseX: 0,
    mouseY: 0,
    currMouseX: 0,
    currMouseY: 0,
    width: 0,
    height: 0,
    time: 0,
  });

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    simRef.current.mouseX = x;
    simRef.current.mouseY = y;

    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // 3D tilt
    const nx = (x / rect.width - 0.5) * 2;
    const ny = (y / rect.height - 0.5) * 2;
    const tiltX = -ny * 4.2;
    const tiltY = nx * 4.5;

    setCoords({
      x: Math.round(pctX * 10) / 10,
      y: Math.round(pctY * 10) / 10,
      pxX: Math.round(x),
      pxY: Math.round(y),
      tiltX: Math.round(tiltX * 10) / 10,
      tiltY: Math.round(tiltY * 10) / 10,
    });
  }, []);

  const handlePointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const card = cardRef.current;
    if (card) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      simRef.current.mouseX = x;
      simRef.current.mouseY = y;
      simRef.current.currMouseX = x;
      simRef.current.currMouseY = y;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    setCoords((prev) => ({ ...prev, tiltX: 0, tiltY: 0 }));
  }, []);

  // Initialize and run particle canvas simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    const card = cardRef.current;
    if (!canvas || !card) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateSize = () => {
      const rect = card.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      simRef.current.width = rect.width;
      simRef.current.height = rect.height;

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Initialize swarm particles
      if (simRef.current.particles.length === 0 && rect.width > 0) {
        const count = 62;
        const particles: Particle[] = [];
        for (let i = 0; i < count; i++) {
          const isGlyph = i % 3 === 0;
          particles.push({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            vx: (Math.random() - 0.5) * 1.6,
            vy: (Math.random() - 0.5) * 1.6,
            size: isGlyph ? 9 : Math.random() > 0.5 ? 2.0 : 1.4,
            glyph: GLYPHS[i % GLYPHS.length],
            isGlyph,
            colorIdx: i % 5,
            orbitRadius: 20 + Math.random() * 110,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: (0.016 + Math.random() * 0.032) * (Math.random() > 0.5 ? 1 : -1),
            alpha: 0.45 + Math.random() * 0.5,
          });
        }
        simRef.current.particles = particles;
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(card);

    if (!isHovered) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return () => {
        resizeObserver.disconnect();
      };
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      simRef.current.time += dt;

      const { width, height, particles } = simRef.current;
      if (width <= 0 || height <= 0) return;

      const isDark = document.documentElement.classList.contains("dark");
      const palette = isDark ? PASTEL_PALETTE.dark : PASTEL_PALETTE.light;

      // Smooth pointer lerp
      simRef.current.currMouseX += (simRef.current.mouseX - simRef.current.currMouseX) * 0.16;
      simRef.current.currMouseY += (simRef.current.mouseY - simRef.current.currMouseY) * 0.16;

      const mx = simRef.current.currMouseX;
      const my = simRef.current.currMouseY;

      ctx.clearRect(0, 0, width, height);

      // 1. Atmospheric Dusk & Ember Radial Aura
      const auraRadius = Math.max(width * 0.68, 250);
      const aura = ctx.createRadialGradient(mx, my, 0, mx, my, auraRadius);
      if (isDark) {
        aura.addColorStop(0, "rgba(255, 125, 75, 0.22)"); // Warm ember core
        aura.addColorStop(0.32, "rgba(213, 176, 245, 0.11)"); // Pastel orchid mid
        aura.addColorStop(0.68, "rgba(166, 230, 242, 0.04)"); // Dusk cyan edge
        aura.addColorStop(1, "transparent");
      } else {
        aura.addColorStop(0, "rgba(235, 95, 60, 0.15)");
        aura.addColorStop(0.38, "rgba(180, 100, 160, 0.07)");
        aura.addColorStop(1, "transparent");
      }
      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle Isometric Lattice Points (design.md spec: 34 x 19)
      const latticeStepX = 34;
      const latticeStepY = 19;
      for (let lx = latticeStepX / 2; lx < width; lx += latticeStepX) {
        for (let ly = latticeStepY / 2; ly < height; ly += latticeStepY) {
          const dist = Math.hypot(lx - mx, ly - my);
          if (dist < 150) {
            const glowFactor = Math.pow(1 - dist / 150, 2);
            ctx.fillStyle = isDark
              ? `rgba(166, 230, 242, ${0.12 + glowFactor * 0.45})`
              : `rgba(127, 210, 230, ${0.1 + glowFactor * 0.4})`;
            ctx.fillRect(lx - 0.75, ly - 0.75, 1.5, 1.5);
          }
        }
      }

      // 3. Precision Pointer Crosshair Guides (Dashed technical hairline)
      ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)";
      ctx.lineWidth = 0.75;
      ctx.setLineDash([3, 4]);

      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(14, my);
      ctx.lineTo(width - 14, my);
      ctx.stroke();

      // Vertical crosshair
      ctx.beginPath();
      ctx.moveTo(mx, 14);
      ctx.lineTo(mx, height - 14);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 4. Interactive Physics Swarm (Spring + Orbit around cursor)
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Orbit calculation
        p.orbitAngle += p.orbitSpeed;
        const targetX = mx + Math.cos(p.orbitAngle) * p.orbitRadius;
        const targetY = my + Math.sin(p.orbitAngle) * p.orbitRadius;

        // Spring physics toward target position
        const ax = (targetX - p.x) * 0.048;
        const ay = (targetY - p.y) * 0.048;

        p.vx = (p.vx + ax) * 0.88;
        p.vy = (p.vy + ay) * 0.88;

        p.x += p.vx;
        p.y += p.vy;

        const color = palette[p.colorIdx];

        if (p.isGlyph) {
          // Technical micro-glyph in mono font
          ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
          ctx.fillStyle = color;
          ctx.fillText(p.glyph, Math.round(p.x), Math.round(p.y));
        } else {
          // Stipple square dot
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.round(p.x - p.size / 2),
            Math.round(p.y - p.size / 2),
            p.size,
            p.size
          );
        }
      }

      // 5. Corner Technical Registration Brackets
      ctx.font = '500 11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.28)";

      const margin = 12;
      ctx.fillText("┌", margin, margin);
      ctx.fillText("┐", width - margin, margin);
      ctx.fillText("└", margin, height - margin);
      ctx.fillText("┘", width - margin, height - margin);

      if (!prefersReducedMotion && isHovered) {
        simRef.current.rafId = requestAnimationFrame(render);
      }
    };

    simRef.current.rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(simRef.current.rafId);
      resizeObserver.disconnect();
    };
  }, [isHovered]);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`group relative rounded-2xl transition-all duration-300 will-change-transform ${className}`}
      style={{
        ...style,
        perspective: "1000px",
        transform: enableTilt && isHovered
          ? `perspective(1000px) rotateX(${coords.tiltX}deg) rotateY(${coords.tiltY}deg) scale3d(1.012, 1.012, 1.012)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovered
          ? "transform 0.12s ease-out, border-color 0.25s ease, box-shadow 0.25s ease"
          : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      {/* Underlying Card Content */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {/* Interactive Blueprint Canvas Overlay (z-20 pointer-events-none) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 w-full h-full rounded-2xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Dynamic Specular Border Glow following pointer */}
      <div
        className="pointer-events-none absolute inset-0 z-30 rounded-2xl transition-opacity duration-300 border"
        style={{
          opacity: isHovered ? 1 : 0,
          borderColor: isHovered
            ? "rgba(255, 255, 255, 0.25)"
            : "transparent",
          background: isHovered
            ? `radial-gradient(circle 320px at ${coords.x}% ${coords.y}%, rgba(255, 145, 110, 0.12), transparent 70%)`
            : "none",
          boxShadow: isHovered
            ? "0 20px 44px -14px rgba(0, 0, 0, 0.4), inset 0 0 14px rgba(255, 255, 255, 0.06)"
            : "none",
        }}
      />

      {/* Blueprint Live Coordinate Readout (FIG Caption per design.md) */}
      <div
        className="pointer-events-none absolute bottom-2.5 right-4 z-30 flex items-center gap-2 text-[9px] font-mono tracking-wider transition-opacity duration-300 text-[var(--mut)] select-none bg-[var(--bg)]/80 px-2 py-0.5 rounded backdrop-blur-sm border border-[var(--line)]/40"
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          X {String(coords.pxX).padStart(3, "0")} / Y {String(coords.pxY).padStart(3, "0")}
        </span>
      </div>
    </div>
  );
}

export const AsciiCard = HoloCard;
