"use client";

import React, { useRef, useState, useCallback, useEffect, ReactNode } from "react";

export type HoloVariant = "blueprint" | "opinion" | "editorial";

interface HoloCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enableTilt?: boolean;
  variant?: HoloVariant;
  roundedClassName?: string;
}

// Particle color tokens per variant
const VARIANT_PALETTES = {
  blueprint: {
    dark: [
      "rgba(179, 166, 255, 0.9)", // lavender #b3a6ff
      "rgba(213, 176, 245, 0.9)", // orchid #d5b0f5
      "rgba(255, 179, 220, 0.9)", // pink #ffb3dc
      "rgba(166, 230, 242, 0.9)", // cyan #a6e6f2
      "rgba(201, 192, 255, 0.9)", // cool lavender
    ],
    light: [
      "rgba(157, 141, 245, 0.85)", // #9d8df5
      "rgba(197, 140, 236, 0.85)", // #c58cec
      "rgba(240, 143, 198, 0.85)", // #f08fc6
      "rgba(127, 210, 230, 0.85)", // #7fd2e6
      "rgba(181, 166, 255, 0.85)", // #b5a6ff
    ],
  },
  opinion: {
    dark: [
      "rgba(213, 176, 245, 0.95)", // orchid #d5b0f5
      "rgba(179, 166, 255, 0.9)",  // lavender #b3a6ff
      "rgba(255, 179, 220, 0.9)",  // pink #ffb3dc
      "rgba(166, 230, 242, 0.9)",  // cyan #a6e6f2
      "rgba(252, 196, 227, 0.85)", // pastel pink #fcc4e3
    ],
    light: [
      "rgba(197, 140, 236, 0.85)",
      "rgba(157, 141, 245, 0.85)",
      "rgba(240, 143, 198, 0.85)",
      "rgba(127, 210, 230, 0.85)",
      "rgba(247, 166, 209, 0.85)",
    ],
  },
  editorial: {
    dark: [
      "rgba(167, 139, 250, 0.95)", // violet-400
      "rgba(129, 140, 248, 0.9)",  // indigo-400
      "rgba(56, 189, 248, 0.9)",   // sky-400
      "rgba(244, 114, 182, 0.9)",  // pink-400
      "rgba(224, 231, 255, 0.85)", // ice indigo
    ],
    light: [
      "rgba(124, 58, 237, 0.85)",  // violet-600
      "rgba(99, 102, 241, 0.85)",  // indigo-500
      "rgba(14, 165, 233, 0.85)",  // sky-500
      "rgba(219, 39, 119, 0.85)",  // pink-600
      "rgba(79, 70, 229, 0.85)",
    ],
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIdx: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  alpha: number;
}

/**
 * HoloCard
 *
 * Adds a subtle pointer-responsive particle field, border glow, and optional tilt.
 */
export function HoloCard({
  children,
  className = "",
  style = {},
  enableTilt = true,
  variant = "blueprint",
  roundedClassName = "rounded-2xl",
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 50, y: 50, tiltX: 0, tiltY: 0 });

  const config = VARIANT_PALETTES[variant] || VARIANT_PALETTES.blueprint;

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
    const tiltX = -ny * 3.5;
    const tiltY = nx * 3.8;

    setCoords({
      x: Math.round(pctX * 10) / 10,
      y: Math.round(pctY * 10) / 10,
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
    const simulation = simRef.current;
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
        const count = variant === "editorial" ? 36 : 52;
        const particles: Particle[] = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() > 0.5 ? 2.2 : 1.5,
            colorIdx: i % 5,
            orbitRadius: 18 + Math.random() * 105,
            orbitAngle: Math.random() * Math.PI * 2,
            orbitSpeed: (0.016 + Math.random() * 0.032) * (Math.random() > 0.5 ? 1 : -1),
            alpha: 0.5 + Math.random() * 0.45,
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
      const palette = isDark ? config.dark : config.light;

      // Smooth pointer lerp
      simRef.current.currMouseX += (simRef.current.mouseX - simRef.current.currMouseX) * 0.16;
      simRef.current.currMouseY += (simRef.current.mouseY - simRef.current.currMouseY) * 0.16;

      const mx = simRef.current.currMouseX;
      const my = simRef.current.currMouseY;

      ctx.clearRect(0, 0, width, height);

      // 1. Atmospheric Accent Radial Aura centered on cursor
      const auraRadius = Math.max(width * 0.68, 250);
      const aura = ctx.createRadialGradient(mx, my, 0, mx, my, auraRadius);

      if (variant === "opinion") {
        // Orchid to lavender pastel aura
        if (isDark) {
          aura.addColorStop(0, "rgba(213, 176, 245, 0.16)"); // orchid
          aura.addColorStop(0.38, "rgba(179, 166, 255, 0.12)"); // lavender
          aura.addColorStop(0.72, "rgba(166, 230, 242, 0.04)"); // cyan
          aura.addColorStop(1, "transparent");
        } else {
          aura.addColorStop(0, "rgba(197, 140, 236, 0.15)");
          aura.addColorStop(0.4, "rgba(157, 141, 245, 0.10)");
          aura.addColorStop(1, "transparent");
        }
      } else if (variant === "editorial") {
        // Electric violet / ice lavender aura
        if (isDark) {
          aura.addColorStop(0, "rgba(167, 139, 250, 0.18)"); // electric violet
          aura.addColorStop(0.35, "rgba(129, 140, 248, 0.10)"); // indigo
          aura.addColorStop(0.7, "rgba(56, 189, 248, 0.03)"); // ice cyan
          aura.addColorStop(1, "transparent");
        } else {
          aura.addColorStop(0, "rgba(124, 58, 237, 0.15)");
          aura.addColorStop(0.4, "rgba(99, 102, 241, 0.06)");
          aura.addColorStop(1, "transparent");
        }
      } else {
        // Blueprint: Pastel particle palette (lavender #b3a6ff to pink #ffb3dc at 12-18% opacity, hint of cyan #a6e6f2)
        if (isDark) {
          aura.addColorStop(0, "rgba(179, 166, 255, 0.16)"); // lavender #b3a6ff
          aura.addColorStop(0.36, "rgba(255, 179, 220, 0.14)"); // pink #ffb3dc
          aura.addColorStop(0.72, "rgba(166, 230, 242, 0.05)"); // hint of cyan #a6e6f2
          aura.addColorStop(1, "transparent");
        } else {
          aura.addColorStop(0, "rgba(157, 141, 245, 0.16)");
          aura.addColorStop(0.36, "rgba(240, 143, 198, 0.13)");
          aura.addColorStop(0.72, "rgba(127, 210, 230, 0.05)");
          aura.addColorStop(1, "transparent");
        }
      }

      ctx.fillStyle = aura;
      ctx.fillRect(0, 0, width, height);

      // Interactive dot swarm (spring + orbit around cursor)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.orbitAngle += p.orbitSpeed;
        const targetX = mx + Math.cos(p.orbitAngle) * p.orbitRadius;
        const targetY = my + Math.sin(p.orbitAngle) * p.orbitRadius;

        const ax = (targetX - p.x) * 0.048;
        const ay = (targetY - p.y) * 0.048;

        p.vx = (p.vx + ax) * 0.88;
        p.vy = (p.vy + ay) * 0.88;

        p.x += p.vx;
        p.y += p.vy;

        const color = palette[p.colorIdx];

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(Math.round(p.x), Math.round(p.y), p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!prefersReducedMotion && isHovered) {
        simRef.current.rafId = requestAnimationFrame(render);
      }
    };

    simRef.current.rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(simulation.rafId);
      resizeObserver.disconnect();
    };
  }, [isHovered, variant, config]);

  const borderHighlight =
    variant === "opinion"
      ? `radial-gradient(circle 320px at ${coords.x}% ${coords.y}%, rgba(213, 176, 245, 0.15), rgba(179, 166, 255, 0.08) 50%, transparent 70%)`
      : variant === "editorial"
      ? `radial-gradient(circle 320px at ${coords.x}% ${coords.y}%, rgba(167, 139, 250, 0.15), transparent 70%)`
      : `radial-gradient(circle 320px at ${coords.x}% ${coords.y}%, rgba(179, 166, 255, 0.16), rgba(255, 179, 220, 0.12) 45%, rgba(166, 230, 242, 0.04) 65%, transparent 70%)`;

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`group relative ${roundedClassName} transition-all duration-300 will-change-transform ${className}`}
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
        className={`pointer-events-none absolute inset-0 z-20 w-full h-full ${roundedClassName} transition-opacity duration-300`}
        style={{
          opacity: isHovered ? 1 : 0,
        }}
      />

      {/* Dynamic Specular Border Glow following pointer */}
      <div
        className={`pointer-events-none absolute inset-0 z-30 ${roundedClassName} transition-opacity duration-300 border`}
        style={{
          opacity: isHovered ? 1 : 0,
          borderColor: isHovered
            ? variant === "opinion"
              ? "rgba(213, 176, 245, 0.35)"
              : variant === "editorial"
              ? "rgba(167, 139, 250, 0.35)"
              : "rgba(179, 166, 255, 0.3)"
            : "transparent",
          background: isHovered ? borderHighlight : "none",
          boxShadow: isHovered && roundedClassName !== "rounded-none"
            ? "0 20px 44px -14px rgba(0, 0, 0, 0.4), inset 0 0 14px rgba(255, 255, 255, 0.06)"
            : "none",
        }}
      />

    </div>
  );
}

export const AsciiCard = HoloCard;
