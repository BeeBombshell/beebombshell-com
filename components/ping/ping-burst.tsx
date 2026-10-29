"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export interface PingBurstHandle {
  burst: (originX?: number, originY?: number) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  fade: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  pulseSpeed: number;
  pulseOffset: number;
}

const COLORS = ["#ff8ad1", "#a78bfa", "#86d6f0", "#ffffff", "#c9b8ff"];

export const PingBurst = forwardRef<PingBurstHandle, { className?: string }>(
  function PingBurst({ className = "" }, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const burstParticles = useRef<Particle[]>([]);
    const ambientParticles = useRef<AmbientParticle[]>([]);
    const animFrameRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      burst: (originX?: number, originY?: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Check reduced motion
        if (
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          return;
        }

        const rect = canvas.getBoundingClientRect();
        const startX = originX ?? rect.width / 2;
        const startY = originY ?? rect.height * 0.45;

        // Create ~80 pixel particles
        const count = 80;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 2.5 + Math.random() * 8.5;
          const size = 3 + Math.floor(Math.random() * 4); // 3px to 6px square pixels
          const maxLife = 40 + Math.floor(Math.random() * 35);
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];

          burstParticles.current.push({
            x: startX,
            y: startY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5, // slight upward bias
            size,
            color,
            alpha: 1,
            fade: 1 / maxLife,
            rotation: (Math.random() - 0.5) * 0.2,
            vRot: (Math.random() - 0.5) * 0.1,
            life: 0,
            maxLife,
          });
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (prefersReducedMotion) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      const handleResize = () => {
        if (!canvas || !canvas.parentElement) return;
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      };
      window.addEventListener("resize", handleResize);

      // Initialize 46 ambient faint square pixels drifting upward behind the card
      ambientParticles.current = [];
      const ambientCount = 46;
      for (let i = 0; i < ambientCount; i++) {
        ambientParticles.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vy: -(0.2 + Math.random() * 0.5),
          size: Math.random() > 0.7 ? 3 : 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.12 + Math.random() * 0.22,
          pulseSpeed: 0.02 + Math.random() * 0.03,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }

      let time = 0;

      const render = () => {
        time++;
        ctx.clearRect(0, 0, width, height);

        // 1. Render ambient drifting pixels
        for (let i = 0; i < ambientParticles.current.length; i++) {
          const p = ambientParticles.current[i];
          p.y += p.vy;
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }

          const currentAlpha =
            p.alpha * (0.6 + 0.4 * Math.sin(time * p.pulseSpeed + p.pulseOffset));

          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha;
          ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
        }

        // 2. Render explosion burst particles
        for (let i = burstParticles.current.length - 1; i >= 0; i--) {
          const p = burstParticles.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.14; // gravity
          p.vx *= 0.96; // air resistance
          p.vy *= 0.98;
          p.life++;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);

          if (p.life >= p.maxLife || p.alpha <= 0) {
            burstParticles.current.splice(i, 1);
            continue;
          }

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          // Crisp retro square pixel
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }

        ctx.globalAlpha = 1;
        animFrameRef.current = requestAnimationFrame(render);
      };

      animFrameRef.current = requestAnimationFrame(render);

      return () => {
        window.removeEventListener("resize", handleResize);
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-30 w-full h-full overflow-hidden ${className}`}
      />
    );
  }
);
