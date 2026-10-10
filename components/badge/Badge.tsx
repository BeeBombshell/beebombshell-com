"use client";

import React, { useEffect, useRef, useId, useState, ReactNode } from "react";
import {
  createRopeNodes,
  createRopeConstraints,
  step,
  type RopeNode,
  type Constraint,
} from "./rope";
import { catmull, drawRibbon, metal, RIBBON_THEMES, type V } from "./ribbon";
import { BLOB_POINTS } from "./blob";
import realGitHubData from "@/content/seed/github-contributions.json";
import "./badge.css";

export type BadgeProps = {
  copy: {
    label: string;
    meta: string;
    headline: string;
    accent: string;
    bio: string;
    chips: string[];
    spec: string;
    hint: string;
    back: {
      label: string;
      actions: { icon: ReactNode; text: string; onClick: () => void }[];
    };
  };
  anchorOffset?: number; // px, negative moves the anchors up (scroll coupling)
  onFlip?: (center: { x: number; y: number }) => void; // lets the particle field fire an impulse
  onCenter?: (center: { x: number; y: number }) => void; // card center each frame, for the particle burst
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function Badge({ copy, anchorOffset = 0, onFlip, onCenter }: BadgeProps) {
  const [contribData, setContribData] = useState(realGitHubData);

  useEffect(() => {
    fetch("/api/github-contributions")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.weeks) {
          setContribData(data);
        }
      })
      .catch(() => {});
  }, []);
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const backFaceRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef<HTMLSpanElement>(null);

  // Mascot & Eye refs
  const mascotContainerRef = useRef<HTMLDivElement>(null);
  const eyesWrapRef = useRef<HTMLDivElement>(null);
  const topGradRef = useRef<SVGLinearGradientElement>(null);
  const glossEllipseRef = useRef<SVGEllipseElement>(null);
  const extrusionPolysRef = useRef<SVGPolygonElement[]>([]);

  // Unique IDs for SVG gradients and clip paths
  const baseId = useId().replace(/:/g, "-");
  const extrusionGradId = `mascot-eg-${baseId}`;
  const topGradId = `mascot-tg-${baseId}`;
  const glossGradId = `mascot-gg-${baseId}`;
  const clipId = `mascot-clip-${baseId}`;
  const rimBlurId = `mascot-blur-${baseId}`;

  // Keep latest callbacks and anchorOffset in refs for the RAF loop
  const anchorOffsetRef = useRef(anchorOffset);
  anchorOffsetRef.current = anchorOffset;
  const onFlipRef = useRef(onFlip);
  onFlipRef.current = onFlip;
  const onCenterRef = useRef(onCenter);
  onCenterRef.current = onCenter;

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const card = cardRef.current;
    const flipEl = flipRef.current;
    const frontFace = frontFaceRef.current;
    const backFace = backFaceRef.current;
    const dotsEl = dotsRef.current;
    const glareEl = glareRef.current;
    const accentEl = accentRef.current;
    const mascotEl = mascotContainerRef.current;
    const eyesEl = eyesWrapRef.current;
    const topGradEl = topGradRef.current;
    const glossEl = glossEllipseRef.current;
    const extrusions = extrusionPolysRef.current;

    if (!stage || !canvas || !card || !flipEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Check debug mode (?debug in URL)
    const isDebug =
      typeof window !== "undefined" && window.location.search.includes("debug");

    let stageWidth = stage.clientWidth || window.innerWidth;
    let stageHeight = stage.clientHeight || window.innerHeight;
    let isMobile = stageWidth < 640;
    let cardW = card.clientWidth || (isMobile ? 320 : 560);
    let cardH = card.clientHeight || (isMobile ? 440 : 380);

    // Physics Simulation state
    let ax = stageWidth / 2;
    let nodes: RopeNode[] = createRopeNodes(ax, cardH, anchorOffsetRef.current);
    let cons: Constraint[] = createRopeConstraints(cardH);
    let drag = { active: false, target: { x: ax, y: 160 + cardH } };
    let curAnchorOffset = anchorOffsetRef.current;

    // Smooth transform variables
    let prevCx = (nodes[9].x + nodes[10].x) / 2;
    let vxc = 0;
    let flip = 0; // current flip angle (0 or 180)
    let flipTarget = 0; // target flip angle

    // Eye tracking state
    let ex = 0;
    let ey = 0;
    let nextBlinkTime = performance.now() + 2600;
    let blinkEndTime = 0;
    let isBlinking = false;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let hasPointer = false;
    let stagePointer = { x: ax, y: 350 };
    let grabOffset = { x: 0, y: 0 };
    let dragMovedDist = 0;
    let idleTarget = { x: 0, y: 0 };
    let nextIdleTime = 0;

    // FPS counter for debug
    let lastTime = performance.now();
    let frameCount = 0;
    let fps = 60;

    const updateDimensions = () => {
      stageWidth = stage.clientWidth || window.innerWidth;
      stageHeight = stage.clientHeight || window.innerHeight;
      isMobile = stageWidth < 640;
      cardW = card.clientWidth || (isMobile ? 320 : 560);
      cardH = card.clientHeight || (isMobile ? 440 : 380);
      ax = stageWidth / 2;

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = stageWidth * dpr;
      canvas.height = stageHeight * dpr;
      canvas.style.width = `${stageWidth}px`;
      canvas.style.height = `${stageHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rebuild rope from new center
      nodes = createRopeNodes(ax, cardH, curAnchorOffset);
      cons = createRopeConstraints(cardH);
      prevCx = (nodes[9].x + nodes[10].x) / 2;
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(stage);

    // Scroll tracking
    const handleScroll = () => {
      const curY = window.scrollY;
      scrollVelocity = curY - lastScrollY;
      lastScrollY = curY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Pointer tracking across window for mascot eye follow
    const handleGlobalPointerMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      stagePointer.x = e.clientX - rect.left;
      stagePointer.y = e.clientY - rect.top;
      hasPointer = true;
    };
    const handleGlobalPointerLeave = () => {
      hasPointer = false;
    };
    window.addEventListener("pointermove", handleGlobalPointerMove, { passive: true });
    window.addEventListener("pointerleave", handleGlobalPointerLeave);

    // Card Pointer Drag & Flip
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest("a, button, .badge-spotify-link, .badge-social-pill")) {
        return;
      }
      e.preventDefault();
      card.setPointerCapture(e.pointerId);
      const rect = stage.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      stagePointer.x = px;
      stagePointer.y = py;

      // grab = bottom - pointer
      const bottom = nodes[10];
      grabOffset.x = bottom.x - px;
      grabOffset.y = bottom.y - py;
      dragMovedDist = 0;
      drag.active = true;
      drag.target.x = px + grabOffset.x;
      drag.target.y = py + grabOffset.y;

      card.classList.add("is-dragging");
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const rect = stage.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dx = px - stagePointer.x;
      const dy = py - stagePointer.y;
      stagePointer.x = px;
      stagePointer.y = py;

      dragMovedDist += Math.abs(dx) + Math.abs(dy);
      drag.target.x = px + grabOffset.x;
      drag.target.y = py + grabOffset.y;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!drag.active) return;
      try {
        card.releasePointerCapture(e.pointerId);
      } catch {}

      drag.active = false;
      card.classList.remove("is-dragging");

      const target = e.target as HTMLElement;
      if (target && target.closest("a, button, .badge-spotify-link, .badge-social-pill")) {
        return;
      }

      // Click under 6px movement flips the card
      if (dragMovedDist < 6) {
        flipTarget = flipTarget === 0 ? 180 : 0;
        const cx = (nodes[9].x + nodes[10].x) / 2;
        const cy = (nodes[9].y + nodes[10].y) / 2;
        onFlipRef.current?.({ x: cx, y: cy });

        if (prefersReducedMotion) {
          flip = flipTarget;
          flipEl.style.transform = `rotateY(${flip}deg)`;
          if (frontFace && backFace) {
            frontFace.style.pointerEvents = flip > 90 ? "none" : "auto";
            backFace.style.pointerEvents = flip > 90 ? "auto" : "none";
          }
        }
      }
    };

    card.addEventListener("pointerdown", handlePointerDown);
    card.addEventListener("pointermove", handlePointerMove);
    card.addEventListener("pointerup", handlePointerUp);
    card.addEventListener("pointercancel", handlePointerUp);

    // Keyboard accessibility: Enter or Space to flip
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flipTarget = flipTarget === 0 ? 180 : 0;
        const cx = (nodes[9].x + nodes[10].x) / 2;
        const cy = (nodes[9].y + nodes[10].y) / 2;
        onFlipRef.current?.({ x: cx, y: cy });

        if (prefersReducedMotion) {
          flip = flipTarget;
          flipEl.style.transform = `rotateY(${flip}deg)`;
          if (frontFace && backFace) {
            frontFace.style.pointerEvents = flip > 90 ? "none" : "auto";
            backFace.style.pointerEvents = flip > 90 ? "auto" : "none";
          }
        }
      }
    };
    card.addEventListener("keydown", handleKeyDown);

    // Pause loop when off-screen or tab hidden
    let isVisible = true;
    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      // Resume without velocity spike
      if (isVisible) {
        for (const p of nodes) {
          p.ox = p.x;
          p.oy = p.y;
        }
      }
    });
    io.observe(stage);

    // If reduced motion is requested: run ~240 physics steps, draw single frame, then stop
    if (prefersReducedMotion) {
      for (let i = 0; i < 240; i++) {
        step(nodes, cons, drag, 18);
      }
      // Single frame render
      const clip = nodes[9];
      const bottom = nodes[10];
      const cx = (clip.x + bottom.x) / 2;
      const cy = (clip.y + bottom.y) / 2;
      const theta = Math.atan2(-(bottom.x - clip.x), bottom.y - clip.y);
      card.style.transform = `translate(${cx - cardW / 2}px, ${cy - cardH / 2}px) rotate(${theta}rad)`;
      flipEl.style.transform = `rotateY(0deg)`;
      onCenterRef.current?.({ x: cx, y: cy });

      // Draw strap
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, stageWidth, stageHeight);
      const isDark = document.documentElement.classList.contains("dark");
      const theme = isDark ? RIBBON_THEMES.dark : RIBBON_THEMES.light;
      const L = catmull([nodes[0], nodes[1], nodes[2], nodes[3]]);
      const R = catmull([nodes[4], nodes[5], nodes[6], nodes[3]]);
      const K = catmull([nodes[3], nodes[7], nodes[8]]);
      drawRibbon(ctx, L, {
        width: 20,
        twist: () => 0,
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
        print: {
          text: "BHAVYA VERMA · PRODUCT ENGINEER · ",
          phase: 40,
          color: theme.print,
          font: "500 11px var(--font-geist-mono), monospace",
        },
      });
      drawRibbon(ctx, R, {
        width: 20,
        twist: () => 0,
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
        print: {
          text: "BHAVYA VERMA · PRODUCT ENGINEER · ",
          phase: 92,
          color: theme.print,
          font: "500 11px var(--font-geist-mono), monospace",
        },
      });
      drawRibbon(ctx, K, {
        width: 13,
        twist: () => 0,
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
      });

      // Hardware
      const n3 = nodes[3],
        n7 = nodes[7],
        n8 = nodes[8],
        n9 = nodes[9];
      const dx37 = n7.x - n3.x,
        dy37 = n7.y - n3.y,
        l37 = Math.hypot(dx37, dy37) || 1;
      const crimpX = n3.x + (dx37 / l37) * 6,
        crimpY = n3.y + (dy37 / l37) * 6;
      metal(ctx, crimpX, crimpY, 24, 36, 5, Math.atan2(dy37, dx37) + Math.PI / 2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(n8.x, n8.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#c4c4cb";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      const midHX = (n8.x + n9.x) / 2,
        midHY = (n8.y + n9.y) / 2;
      const hLen = Math.hypot(n9.x - n8.x, n9.y - n8.y) + 10;
      metal(
        ctx,
        midHX,
        midHY,
        12,
        hLen,
        6,
        Math.atan2(n9.y - n8.y, n9.x - n8.x) - Math.PI / 2
      );

      return () => {
        resizeObserver.disconnect();
        io.disconnect();
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("pointermove", handleGlobalPointerMove);
        window.removeEventListener("pointerleave", handleGlobalPointerLeave);
        card.removeEventListener("pointerdown", handlePointerDown);
        card.removeEventListener("pointermove", handlePointerMove);
        card.removeEventListener("pointerup", handlePointerUp);
        card.removeEventListener("pointercancel", handlePointerUp);
        card.removeEventListener("keydown", handleKeyDown);
      };
    }

    // Main 60fps RequestAnimationFrame Loop
    let rafId = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);

      if (!isVisible || document.hidden) return;

      // FPS tracking for debug
      frameCount++;
      if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
      }

      // 1. Scroll coupling: clamp anchor offset changes to 40px per frame
      const targetOffset = anchorOffsetRef.current;
      const dOffset = clamp(targetOffset - curAnchorOffset, -40, 40);
      curAnchorOffset += dOffset;
      nodes[0].y = -50 + curAnchorOffset;
      nodes[4].y = -50 + curAnchorOffset;

      // Decay scroll velocity
      scrollVelocity *= 0.92;

      // 2. Physics Step
      const iterations = isMobile ? 10 : 18;
      step(nodes, cons, drag, iterations);

      // 3. Card transform calculations
      const clip = nodes[9];
      const bottom = nodes[10];
      const cx = (clip.x + bottom.x) / 2;
      const cy = (clip.y + bottom.y) / 2;
      const theta = Math.atan2(-(bottom.x - clip.x), bottom.y - clip.y); // 0 when hanging straight down
      const vx = cx - prevCx;
      prevCx = cx;
      vxc += (vx - vxc) * 0.2; // smoothed horizontal speed
      const tilt = clamp(vxc * 4.5, -38, 38); // degrees
      const deg = (theta * 180) / Math.PI;

      // Smooth flip transition
      flip += (flipTarget - flip) * 0.12;

      // Direct DOM style updates (zero React re-renders)
      card.style.transform = `translate(${cx - cardW / 2}px, ${cy - cardH / 2}px) rotate(${theta}rad)`;
      flipEl.style.transform = `rotateY(${flip + tilt}deg)`;

      // Front vs Back face pointer event toggling
      if (frontFace && backFace) {
        const isShowingBack = flip > 90;
        frontFace.style.pointerEvents = isShowingBack ? "none" : "auto";
        backFace.style.pointerEvents = isShowingBack ? "auto" : "none";
      }

      // Card center notification for particle burst
      onCenterRef.current?.({ x: cx, y: cy });

      // Holographic text, glare, and dot overlay direct updates
      if (dotsEl) {
        dotsEl.style.backgroundPosition = `${tilt * 1.5}px ${deg * 1.2}px`;
      }
      if (accentEl) {
        accentEl.style.backgroundPosition = `${50 + deg * 3 + tilt * 2}% 0`;
      }
      if (glareEl) {
        glareEl.style.backgroundPosition = `${50 - tilt * 3 - deg * 2}% 0`;
      }

      // Mascot Extrusion & Shader updates
      const exx = 4 - tilt * 0.22;
      const eyy = 7;
      for (let i = 0; i < 8; i++) {
        const poly = extrusions[i];
        if (poly) {
          const factor = (8 - i) / 8;
          poly.setAttribute(
            "transform",
            `translate(${(exx * factor).toFixed(2)}, ${(eyy * factor).toFixed(2)})`
          );
        }
      }
      if (topGradEl) {
        topGradEl.setAttribute(
          "gradientTransform",
          `rotate(${(deg * 3 + tilt * 3).toFixed(1)} 0.5 0.5)`
        );
      }
      if (glossEl) {
        glossEl.setAttribute("cx", `${(45 + tilt * 0.9).toFixed(1)}`);
        glossEl.setAttribute("cy", `${(38 + deg * 0.5).toFixed(1)}`);
      }

      // Mascot center relative to card center
      let lx0 = 189 * (cardW / 560);
      let ly0 = -99 * (cardH / 380);
      if (mascotEl) {
        const mx = mascotEl.offsetLeft + mascotEl.offsetWidth / 2;
        const my = mascotEl.offsetTop + mascotEl.offsetHeight / 2;
        lx0 = mx - cardW / 2;
        ly0 = my - cardH / 2;
      }
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      const bx = cx + lx0 * cosT - ly0 * sinT;
      const by = cy + lx0 * sinT + ly0 * cosT;

      let targetX = 0;
      let targetY = 0;

      if (hasPointer) {
        const dx = stagePointer.x - bx;
        const dy = stagePointer.y - by;
        const lx = dx * cosT + dy * sinT;
        const ly = -dx * sinT + dy * cosT;
        const len = Math.hypot(lx, ly) || 1;
        const k = Math.tanh(len / 150);
        targetX = (lx / len) * k * 9;
        targetY = (ly / len) * k * 7;
      } else {
        // Idle drift between random targets every 0.9 to 1.8s
        if (now >= nextIdleTime) {
          idleTarget.x = (Math.random() - 0.5) * 12;
          idleTarget.y = (Math.random() - 0.5) * 8;
          nextIdleTime = now + 900 + Math.random() * 900;
        }
        targetX = idleTarget.x;
        targetY = idleTarget.y;
      }

      // Look up as page scrolls down
      targetY += clamp(scrollVelocity * 0.6, -7, 7);

      ex += (targetX - ex) * 0.22;
      ey += (targetY - ey) * 0.22;

      // Blink animation (every 2.6 to 5.2s, lasts 130ms)
      if (!isBlinking && now >= nextBlinkTime) {
        isBlinking = true;
        blinkEndTime = now + 130;
      } else if (isBlinking && now >= blinkEndTime) {
        isBlinking = false;
        nextBlinkTime = now + 2600 + Math.random() * 2600;
      }

      // scaleY & scaleX expressions:
      // blink .12, dragging or fast scroll 1.25 (scaleX 1.1), fast swing (|vxc| > 3) .7, else 1
      let scaleY = 1.0;
      let scaleX = 1.0;
      if (isBlinking) {
        scaleY = 0.12;
      } else if (drag.active || Math.abs(scrollVelocity) > 12) {
        scaleY = 1.25;
        scaleX = 1.1;
      } else if (Math.abs(vxc) > 3) {
        scaleY = 0.7;
      }

      if (eyesEl) {
        eyesEl.style.transform = `translate(${ex + tilt * 0.15}px, ${ey}px) scale(${scaleX}, ${scaleY})`;
      }
      if (mascotEl) {
        mascotEl.style.transform = `translate(${ex * 0.6}px, ${ey * 0.6}px) scale(${1 + 0.025 * Math.sin(now / 600)})`;
      }

      // 4. Strap Rendering on 2D Canvas
      ctx.clearRect(0, 0, stageWidth, stageHeight);

      const isDark = document.documentElement.classList.contains("dark");
      const theme = isDark ? RIBBON_THEMES.dark : RIBBON_THEMES.light;
      const flipRad = (flip * Math.PI) / 180;
      const tw0 = theta * 2.2 + vxc * 0.1;
      const t = now / 900;

      const L = catmull([nodes[0], nodes[1], nodes[2], nodes[3]]);
      const R = catmull([nodes[4], nodes[5], nodes[6], nodes[3]]);
      const K = catmull([nodes[3], nodes[7], nodes[8]]);

      drawRibbon(ctx, L, {
        width: 20,
        twist: (u) => tw0 * u + flipRad * 0.5 * u + 0.3 * Math.sin(t + u * 4),
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
        print: {
          text: "BHAVYA VERMA · PRODUCT ENGINEER · ",
          phase: 40,
          color: theme.print,
          font: "500 11px var(--font-geist-mono), monospace",
        },
      });

      drawRibbon(ctx, R, {
        width: 20,
        twist: (u) => tw0 * u + flipRad * 0.5 * u + 0.3 * Math.sin(t + u * 4 + 2),
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
        print: {
          text: "BHAVYA VERMA · PRODUCT ENGINEER · ",
          phase: 92,
          color: theme.print,
          font: "500 11px var(--font-geist-mono), monospace",
        },
      });

      drawRibbon(ctx, K, {
        width: 13,
        twist: (u) => tw0 * u + flipRad * u,
        front: theme.front,
        back: theme.back,
        stitching: theme.stitching,
      });

      // Metallic Hardware
      const n3 = nodes[3],
        n7 = nodes[7],
        n8 = nodes[8],
        n9 = nodes[9];
      const dx37 = n7.x - n3.x,
        dy37 = n7.y - n3.y,
        l37 = Math.hypot(dx37, dy37) || 1;
      const crimpX = n3.x + (dx37 / l37) * 6,
        crimpY = n3.y + (dy37 / l37) * 6;
      metal(ctx, crimpX, crimpY, 24, 36, 5, Math.atan2(dy37, dx37) + Math.PI / 2);

      // Split ring at n8
      ctx.save();
      ctx.beginPath();
      ctx.arc(n8.x, n8.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = "#c4c4cb";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Swivel hook mid(n8, n9)
      const midHX = (n8.x + n9.x) / 2,
        midHY = (n8.y + n9.y) / 2;
      const hLen = Math.hypot(n9.x - n8.x, n9.y - n8.y) + 10;
      metal(
        ctx,
        midHX,
        midHY,
        12,
        hLen,
        6,
        Math.atan2(n9.y - n8.y, n9.x - n8.x) - Math.PI / 2
      );

      // Debug readout overlay
      if (isDebug) {
        ctx.save();
        // Draw constraints as green lines
        ctx.strokeStyle = "rgba(0, 255, 100, 0.6)";
        ctx.lineWidth = 1.5;
        for (const [ia, ib] of cons) {
          ctx.beginPath();
          ctx.moveTo(nodes[ia].x, nodes[ia].y);
          ctx.lineTo(nodes[ib].x, nodes[ib].y);
          ctx.stroke();
        }
        // Draw nodes as dots
        for (let i = 0; i < nodes.length; i++) {
          ctx.fillStyle = nodes[i].pin ? "#ff3b30" : "#00f0ff";
          ctx.beginPath();
          ctx.arc(nodes[i].x, nodes[i].y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Readout text
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(12, 12, 220, 95);
        ctx.fillStyle = "#ffffff";
        ctx.font = "11px monospace";
        ctx.fillText(`FPS: ${fps}`, 20, 30);
        ctx.fillText(`theta: ${deg.toFixed(2)}°`, 20, 48);
        ctx.fillText(`tilt: ${tilt.toFixed(2)}°`, 20, 66);
        ctx.fillText(`vxc: ${vxc.toFixed(2)}`, 20, 84);
        ctx.fillText(`flip: ${flip.toFixed(1)}°`, 20, 100);
        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      io.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerleave", handleGlobalPointerLeave);
      card.removeEventListener("pointerdown", handlePointerDown);
      card.removeEventListener("pointermove", handlePointerMove);
      card.removeEventListener("pointerup", handlePointerUp);
      card.removeEventListener("pointercancel", handlePointerUp);
      card.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <section ref={stageRef} className="badge-stage">
      {/* 2D Canvas for Lanyard Strap & Metallic Hardware */}
      <canvas ref={canvasRef} className="badge-rope" />

      {/* Physics 3D Interactive Card */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label="Interactive ID badge. Press Enter to flip."
        className="badge-card"
      >
        {/* Hardware Slot Cutout */}
        <div className="badge-slot" />

        {/* Metal Split Ring */}
        <div className="badge-ring" />

        {/* 3D Perspective & Flip Container */}
        <div className="badge-perspective">
          <div ref={flipRef} className="badge-flip">
            {/* ==================================================== */}
            {/* FRONT FACE                                           */}
            {/* ==================================================== */}
            <div ref={frontFaceRef} className="badge-face front">
              {/* Dot Grid Holographic Overlay */}
              <div ref={dotsRef} className="badge-dots" />

              {/* Specular Glare Band */}
              <div ref={glareRef} className="badge-glare" />

              {/* Meta Top-Left */}
              <div className="badge-meta-group">
                <div className="badge-label">{copy.label}</div>
                <div className="badge-meta">{copy.meta}</div>
              </div>

              {/* Headline with tilt-shifting gradient accent phrase */}
              <h1 className="badge-headline">
                {copy.headline.replace(copy.accent, "")}
                <span ref={accentRef} className="badge-accent">
                  {copy.accent}
                </span>
              </h1>

              {/* Bio summary */}
              <p className="badge-bio">{copy.bio}</p>

              {/* Chips Along Bottom-Left */}
              <div className="badge-chips">
                {copy.chips.map((chip) => (
                  <span key={chip} className="badge-chip">
                    {chip}
                  </span>
                ))}
              </div>

              {/* Footer Meta Bottom-Right */}
              <div className="badge-footer-meta">
                <span>{copy.hint}</span>
                <span>{copy.spec}</span>
              </div>

              {/* Mascot Container at right: 24, top: 24, 134×134 */}
              <div ref={mascotContainerRef} className="badge-mascot-container">
                <svg
                  className="badge-mascot-svg"
                  viewBox="0 0 134 134"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Linear gradient for extrusion */}
                    <linearGradient
                      id={extrusionGradId}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#4b2fd6" />
                      <stop offset="100%" stopColor="#b43bd0" />
                    </linearGradient>

                    {/* Linear gradient for top face */}
                    <linearGradient
                      id={topGradId}
                      ref={topGradRef}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#e2d8ff" />
                      <stop offset="50%" stopColor="#ff9ed6" />
                      <stop offset="100%" stopColor="#8fe3f5" />
                    </linearGradient>

                    {/* Radial gradient for gloss spot */}
                    <radialGradient id={glossGradId} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
                    </radialGradient>

                    {/* Blur filter for rim light and shade */}
                    <filter id={rimBlurId} x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.2" />
                    </filter>

                    {/* ClipPath from 7-lobe polygon */}
                    <clipPath id={clipId}>
                      <polygon points={BLOB_POINTS} />
                    </clipPath>
                  </defs>

                  {/* Layer 1: Extrusion - 8 polygons drawn from i=7 down to 0 */}
                  {Array.from({ length: 8 }, (_, i) => 7 - i).map((idx) => (
                    <polygon
                      key={idx}
                      ref={(el) => {
                        if (el) extrusionPolysRef.current[7 - idx] = el;
                      }}
                      points={BLOB_POINTS}
                      fill={`url(#${extrusionGradId})`}
                      stroke={`url(#${extrusionGradId})`}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  ))}

                  {/* Layer 2: Top Face */}
                  <polygon points={BLOB_POINTS} fill={`url(#${topGradId})`} />

                  {/* Layer 3: Clipped Rim Light, Shade, and Moving Gloss Spot */}
                  <g clipPath={`url(#${clipId})`}>
                    {/* Rim light */}
                    <polygon
                      points={BLOB_POINTS}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="6"
                      opacity="0.8"
                      filter={`url(#${rimBlurId})`}
                      transform="translate(2.5, 2.5)"
                    />

                    {/* Shade */}
                    <polygon
                      points={BLOB_POINTS}
                      fill="none"
                      stroke="#4b2fd6"
                      strokeWidth="6"
                      opacity="0.35"
                      filter={`url(#${rimBlurId})`}
                      transform="translate(-2.5, -2.5)"
                    />

                    {/* Gloss spot */}
                    <ellipse
                      ref={glossEllipseRef}
                      cx="45"
                      cy="38"
                      rx="30"
                      ry="18"
                      fill={`url(#${glossGradId})`}
                    />
                  </g>
                </svg>

                {/* Eyes: two white bars at 50% / 36% of mascot */}
                <div ref={eyesWrapRef} className="badge-eyes-wrap">
                  <div className="badge-eye-bar left" />
                  <div className="badge-eye-bar right" />
                </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* BACK FACE                                            */}
            {/* ==================================================== */}
            <div ref={backFaceRef} className="badge-face back">
              {/* Back Header */}
              <div className="badge-back-header">
                <div className="badge-back-label">{copy.back.label}</div>
                <div className="badge-back-sub">
                  GITHUB · {contribData.totalContributions} CONTRIBUTIONS (2025–2026)
                </div>
              </div>

              {/* GitHub Contributions Chart stretching across card width */}
              <div className="badge-contrib-wrap">
                <div className="badge-contrib-grid">
                  {contribData.weeks.map((col, cIdx) => (
                    <div key={cIdx} className="badge-contrib-col">
                      {col.map((cell, rIdx) => (
                        <div
                          key={rIdx}
                          className="badge-contrib-cell"
                          data-level={cell.level}
                          title={`${cell.count} contribution${cell.count === 1 ? "" : "s"} on ${cell.date}`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Socials Row below chart & above links */}
              <div className="badge-back-socials">
                <a
                  href="https://x.com/Bee_Bombshell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge-social-pill"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X</span>
                  <span className="badge-social-arrow">↗</span>
                </a>

                <a
                  href="https://www.linkedin.com/in/beebombshell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge-social-pill"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                  <span className="badge-social-arrow">↗</span>
                </a>

                <a
                  href="https://github.com/BeeBombshell"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="badge-social-pill"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>GitHub</span>
                  <span className="badge-social-arrow">↗</span>
                </a>
              </div>

              {/* Bottom Row: Actions (left) + Spotify Embed Widget (right) */}
              <div className="badge-back-bottom">
                {/* Actions Column */}
                <div className="badge-back-actions">
                  {copy.back.actions.map((act, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        act.onClick();
                      }}
                      className="badge-back-action"
                    >
                      {act.icon}
                      <span>{act.text}</span>
                    </button>
                  ))}
                </div>

                {/* Spotify Now Playing Embed Widget */}
                <div className="badge-back-spotify">
                  <a
                    href="https://spotify.beebombshell.com/now-playing?uid=a55e8495c5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="badge-spotify-link"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <img
                      src="https://spotify.beebombshell.com/now-playing?uid=a55e8495c5"
                      alt="Spotify Now Playing"
                      className="badge-spotify-img"
                    />
                  </a>
                </div>
              </div>

              {/* Back Face Footer Meta */}
              <div className="badge-back-footer">
                <span>BEEBOMBSHELL IDENTITY CARD</span>
                <span>{copy.spec}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
