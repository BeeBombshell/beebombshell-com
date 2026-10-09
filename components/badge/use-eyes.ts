"use client";

import { useEffect, useRef, useState } from "react";

export interface EyeState {
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
  blobLeanX: number;
  blobLeanY: number;
  blobScale: number;
}

interface UseEyesProps {
  blobCenterRef: React.RefObject<HTMLDivElement | null>;
  cardAngleRad: number;
  cardVx: number;
  isDragging: boolean;
  reducedMotion?: boolean;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function useEyes({
  blobCenterRef,
  cardAngleRad,
  cardVx,
  isDragging,
  reducedMotion = false,
}: UseEyesProps): EyeState {
  // Cursor position
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // Smoothed eye offsets
  const eyeOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Blink state
  const isBlinkingRef = useRef(false);
  const nextBlinkTimeRef = useRef(0);
  const blinkEndTimeRef = useRef(0);

  // Scroll velocity tracking for vertical bias
  const lastScrollYRef = useRef(0);
  const scrollVelocityRef = useRef(0);

  const [state, setState] = useState<EyeState>({
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    blobLeanX: 0,
    blobLeanY: 0,
    blobScale: 1,
  });

  // Track global cursor & scroll
  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      cursorRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleScroll() {
      const curY = window.scrollY;
      const v = curY - lastScrollYRef.current;
      scrollVelocityRef.current = v;
      lastScrollYRef.current = curY;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Animation frame loop
  useEffect(() => {
    if (reducedMotion) return;

    let rafId = 0;
    const scheduleNextBlink = (now: number) => {
      // Every 2.6 to 5.2 seconds
      const interval = 2600 + Math.random() * 2600;
      nextBlinkTimeRef.current = now + interval;
    };

    scheduleNextBlink(performance.now());

    const update = (time: number) => {
      // 1. Check Blink
      if (!isBlinkingRef.current && time >= nextBlinkTimeRef.current) {
        isBlinkingRef.current = true;
        blinkEndTimeRef.current = time + 130; // 130ms blink
      } else if (isBlinkingRef.current && time >= blinkEndTimeRef.current) {
        isBlinkingRef.current = false;
        scheduleNextBlink(time);
      }

      // Decay scroll velocity
      scrollVelocityRef.current *= 0.92;

      // 2. Cursor direction in card frame
      let targetOffsetX = 0;
      let targetOffsetY = 0;

      if (blobCenterRef.current && cursorRef.current) {
        const rect = blobCenterRef.current.getBoundingClientRect();
        const blobX = rect.left + rect.width / 2;
        const blobY = rect.top + rect.height / 2;

        const dx = cursorRef.current.x - blobX;
        const dy = cursorRef.current.y - blobY;
        const dist = Math.hypot(dx, dy);

        // Magnitude tanh(distance / 150)
        const mag = Math.tanh(dist / 150);

        if (dist > 0.001) {
          const dirX = dx / dist;
          const dirY = dy / dist;

          // Rotate into card local frame
          const cos = Math.cos(-cardAngleRad);
          const sin = Math.sin(-cardAngleRad);
          const localDirX = dirX * cos - dirY * sin;
          const localDirY = dirX * sin + dirY * cos;

          // Vertical bias: look up when page scrolls down
          const verticalBias = -Math.min(3, Math.max(-3, scrollVelocityRef.current * 0.15));

          targetOffsetX = Math.max(-9, Math.min(9, localDirX * mag * 9));
          targetOffsetY = Math.max(-7, Math.min(7, localDirY * mag * 7 + verticalBias));
        }
      }

      // Smooth with lerp 0.22
      eyeOffsetRef.current.x = lerp(eyeOffsetRef.current.x, targetOffsetX, 0.22);
      eyeOffsetRef.current.y = lerp(eyeOffsetRef.current.y, targetOffsetY, 0.22);

      // 3. Eye Expression scaleY & scaleX
      let scaleY = 1.0;
      let scaleX = 1.0;
      if (isBlinkingRef.current) {
        scaleY = 0.12;
      } else if (isDragging || Math.abs(scrollVelocityRef.current) > 15) {
        scaleY = 1.25; // Wide when grabbed or fast scroll
        scaleX = 1.1;
      } else if (Math.abs(cardVx) > 5) {
        scaleY = 0.7; // Squint when swinging fast
      }

      // 4. Blob lean (60% of eye offset) and breathing (±2.5%, period ~4s)
      const blobLeanX = eyeOffsetRef.current.x * 0.6;
      const blobLeanY = eyeOffsetRef.current.y * 0.6;
      const breatheCycle = (time / 4000) * (Math.PI * 2);
      const blobScale = 1 + 0.025 * Math.sin(breatheCycle);

      setState({
        offsetX: eyeOffsetRef.current.x,
        offsetY: eyeOffsetRef.current.y,
        scaleX,
        scaleY,
        blobLeanX,
        blobLeanY,
        blobScale,
      });

      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [blobCenterRef, cardAngleRad, cardVx, isDragging, reducedMotion]);

  return state;
}
