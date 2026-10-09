"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RopeSimulation } from "./rope";
import {
  sampleStrandSpline,
  drawRibbon,
  RIBBON_THEMES,
  RibbonTheme,
} from "./ribbon";
import { drawCrimp, drawSwivelHook } from "./hardware";
import { BadgeCard } from "./badge-card";
import { useParticleEngine, useRegisterTextBlock } from "@/components/particles/use-particles";
import { scrollStore } from "@/lib/scroll-store";

interface HeroBadgeProps {
  className?: string;
}

export function HeroBadge({ className = "" }: HeroBadgeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  const { impulse } = useParticleEngine();
  useRegisterTextBlock("hero-badge", cardWrapperRef);

  // Reduced motion preference
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Card physics state for React render
  const [cardState, setCardState] = useState({
    hookX: 0,
    hookY: 0,
    bottomX: 0,
    bottomY: 0,
    centerX: 0,
    centerY: 0,
    theta: 0,
    thetaDeg: 0,
    vx: 0,
    tiltDeg: 0,
    isDragging: false,
  });

  // Flip animation state
  const isFlippedRef = useRef(false);
  const flipAngleRef = useRef(0); // 0 to Math.PI
  const [isFlipped, setIsFlipped] = useState(false);
  const [flipAngleRad, setFlipAngleRad] = useState(0);

  // Drag interaction tracking
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const isPointerDownRef = useRef(false);

  // Rope simulation instance
  const ropeRef = useRef<RopeSimulation | null>(null);

  // Active theme for strap colors
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");

  // Check reduced motion & mobile
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(motionQuery.matches);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();

    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setThemeMode(isDark ? "dark" : "light");
    };
    handleThemeChange();

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("resize", checkMobile);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Flip Card Action
  const handleFlip = useCallback(() => {
    const nextFlipped = !isFlippedRef.current;
    isFlippedRef.current = nextFlipped;
    setIsFlipped(nextFlipped);

    // Reduced motion flips instantly
    if (reducedMotion) {
      flipAngleRef.current = nextFlipped ? Math.PI : 0;
      setFlipAngleRad(flipAngleRef.current);
    }

    // Trigger impulse burst from badge center per design.md (radius 320, force 11)
    if (cardWrapperRef.current) {
      const rect = cardWrapperRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      impulse(cx, cy, 320, 11);
    }
  }, [impulse, reducedMotion]);

  // Pointer Down on Badge Card
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isPointerDownRef.current = true;
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    lastPointerPosRef.current = { x: e.clientX, y: e.clientY };
    pointerVelocityRef.current = { vx: 0, vy: 0 };

    if (ropeRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      ropeRef.current.startDrag(localX, localY);
    }
  }, []);

  // Global Pointer Move & Up listeners for drag
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!isPointerDownRef.current || !containerRef.current || !ropeRef.current) return;

      const vx = e.clientX - lastPointerPosRef.current.x;
      const vy = e.clientY - lastPointerPosRef.current.y;
      pointerVelocityRef.current = { vx, vy };
      lastPointerPosRef.current = { x: e.clientX, y: e.clientY };

      const rect = containerRef.current.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      ropeRef.current.updateDrag(localX, localY);
    }

    function handlePointerUp(e: PointerEvent) {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      // Check click vs drag: movement < 6px flips
      if (pointerDownPosRef.current) {
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 6) {
          handleFlip();
        }
      }

      if (ropeRef.current) {
        // Release with momentum
        ropeRef.current.endDrag(
          pointerVelocityRef.current.vx * 1.2,
          pointerVelocityRef.current.vy * 1.2
        );
      }
      pointerDownPosRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handleFlip]);

  // Main Physics Simulation & Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize rope
    const updateDimensions = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Anchor at 66% width on desktop, 50% on mobile
      const anchorX = isMobile ? width * 0.5 : width * 0.66;
      const anchorY = 0;

      if (!ropeRef.current) {
        ropeRef.current = new RopeSimulation(anchorX, anchorY, isMobile);
      }
    };

    updateDimensions();

    let rafId = 0;
    let isVisible = true;

    // IntersectionObserver to pause when hero is off-screen
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    io.observe(container);

    const animate = (time: number) => {
      rafId = requestAnimationFrame(animate);

      // Pause simulation when S > 0.95, tab hidden, or off-screen
      if (!isVisible || document.hidden || scrollStore.s > 0.95) {
        return;
      }

      const rope = ropeRef.current;
      if (!rope) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      // Real scroll synchronisation: anchor Y follows hero top relative to viewport
      const heroRect = container.getBoundingClientRect();
      const anchorX = isMobile ? width * 0.5 : width * 0.66;
      // Anchor Y in container local space
      const anchorY = Math.max(-100, Math.min(100, -heroRect.top * 0.4));
      rope.setAnchorPosition(anchorX, anchorY);

      if (!reducedMotion) {
        rope.step();
      }

      const state = rope.getCardState();

      // Smooth flip angle spring with lerp 0.12
      const targetFlip = isFlippedRef.current ? Math.PI : 0;
      if (!reducedMotion) {
        flipAngleRef.current += (targetFlip - flipAngleRef.current) * 0.12;
      } else {
        flipAngleRef.current = targetFlip;
      }

      // Update React state for card DOM
      setCardState(state);
      setFlipAngleRad(flipAngleRef.current);

      // Render Lanyard Ribbon and Hardware on Canvas
      ctx.clearRect(0, 0, width, height);

      const ribbonTheme: RibbonTheme =
        themeMode === "dark" ? RIBBON_THEMES.dark : RIBBON_THEMES.light;

      // Sample curves
      const leftPts = rope.getLeftStrandPoints();
      const rightPts = rope.getRightStrandPoints();
      const stemPts = rope.getStemPoints();

      const leftSamples = sampleStrandSpline(
        leftPts,
        20, // 20px wide
        state.theta,
        state.vx,
        flipAngleRef.current,
        0.5,
        0,
        time
      );

      const rightSamples = sampleStrandSpline(
        rightPts,
        20,
        state.theta,
        state.vx,
        flipAngleRef.current,
        0.5,
        Math.PI,
        time
      );

      const stemSamples = sampleStrandSpline(
        stemPts,
        13, // 13px wide
        state.theta,
        state.vx,
        flipAngleRef.current,
        1.0,
        0,
        time
      );

      // Draw strands
      drawRibbon(ctx, leftSamples, ribbonTheme, true);
      drawRibbon(ctx, rightSamples, ribbonTheme, true);
      drawRibbon(ctx, stemSamples, ribbonTheme, false);

      // Draw Hardware
      const junction = rope.getJunctionPoint();
      const hook = rope.getHookPoint();

      // Metal Crimp at Junction (24×36, radius 5)
      drawCrimp(ctx, junction.x, junction.y, state.theta * 0.5);

      // Swivel Hook & Ring through top slot
      drawSwivelHook(ctx, stemPts[stemPts.length - 2].x, stemPts[stemPts.length - 2].y, hook.x, hook.y);
    };

    rafId = requestAnimationFrame(animate);

    const handleResize = () => {
      updateDimensions();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [themeMode, isMobile, reducedMotion]);

  // Card DOM positioning
  // The hook node is at the top slot center of the 300x190 card.
  // Card local slot is at top center: (150, 8).
  const cardScale = isMobile ? 0.8 : 1.0;
  const cardLeft = cardState.hookX - 150 * cardScale;
  const cardTop = cardState.hookY - 8 * cardScale;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full pointer-events-none select-none ${className}`}
      style={{ overflow: "visible" }}
    >
      {/* 2D Canvas for Lanyard Ribbon and Metallic Hardware */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Interactive 3D Card DOM Layer */}
      <div
        ref={cardWrapperRef}
        className="absolute z-20 pointer-events-auto"
        style={{
          left: cardLeft,
          top: cardTop,
          transform: `scale(${cardScale}) rotate(${cardState.thetaDeg}deg)`,
          transformOrigin: "150px 8px",
          transition: reducedMotion ? "none" : undefined,
        }}
      >
        <BadgeCard
          theta={cardState.theta}
          thetaDeg={cardState.thetaDeg}
          tiltDeg={cardState.tiltDeg}
          flipAngleRad={flipAngleRad}
          isFlipped={isFlipped}
          vx={cardState.vx}
          isDragging={cardState.isDragging}
          reducedMotion={reducedMotion}
          onFlip={handleFlip}
          onPointerDown={handlePointerDown}
        />
      </div>
    </div>
  );
}
