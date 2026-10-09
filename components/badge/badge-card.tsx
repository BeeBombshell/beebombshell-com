"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { computeFoilState, generate7LobeBlobPath } from "./foil";
import { useEyes } from "./use-eyes";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";

// Pre-generated 8x8 matrix (about half pastel, half dark)
const PIXEL_PATCH_COLORS: (string | null)[] = [
  null, "#9d8df5", null, "#c58cec", null, "#f08fc6", null, null,
  "#7fd2e6", null, "#b5a6ff", null, "#f7a6d1", null, "#9d8df5", null,
  null, "#c58cec", null, null, "#7fd2e6", null, "#b5a6ff", null,
  "#f08fc6", null, "#9d8df5", "#c58cec", null, "#f7a6d1", null, "#7fd2e6",
  null, "#b5a6ff", null, null, "#f08fc6", null, "#9d8df5", null,
  "#7fd2e6", null, "#f7a6d1", null, "#c58cec", null, null, "#b5a6ff",
  null, "#9d8df5", null, "#7fd2e6", null, "#f08fc6", null, null,
  "#c58cec", null, "#b5a6ff", null, null, "#f7a6d1", null, "#9d8df5",
];

interface BadgeCardProps {
  theta: number; // in radians
  thetaDeg: number;
  tiltDeg: number;
  flipAngleRad: number; // 0 to PI
  isFlipped: boolean;
  vx: number;
  isDragging: boolean;
  reducedMotion?: boolean;
  onFlip: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
}

export function BadgeCard({
  theta,
  thetaDeg,
  tiltDeg,
  flipAngleRad,
  isFlipped,
  vx,
  isDragging,
  reducedMotion = false,
  onFlip,
  onPointerDown,
}: BadgeCardProps) {
  const blobCenterRef = useRef<HTMLDivElement>(null);
  const cardElementRef = useRef<HTMLDivElement>(null);
  const clipId = "badge-foil-blob-clip";
  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();

  // Dynamic eye and breathing simulation
  const eyeState = useEyes({
    blobCenterRef,
    cardAngleRad: theta,
    cardVx: vx,
    isDragging,
    reducedMotion,
  });

  // Foil gradients and specular highlights
  const foil = computeFoilState(thetaDeg, tiltDeg);
  const blobPath = generate7LobeBlobPath(134);

  // Keyboard navigation handler (accessibility Enter / Space to flip)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onFlip();
    }
  };

  const flipDeg = (flipAngleRad * 180) / Math.PI;

  return (
    <div
      ref={cardElementRef}
      role="button"
      tabIndex={0}
      aria-label="Interactive ID badge, press Enter to flip"
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      className="relative select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--fg)] rounded-[16px] cursor-grab active:cursor-grabbing"
      style={{
        width: 300,
        height: 190,
        perspective: 1000,
        touchAction: "none",
      }}
    >
      {/* 3D Flip Container */}
      <div
        className="relative w-full h-full rounded-[16px] transition-transform duration-75"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${flipDeg}deg) rotateZ(${tiltDeg * 0.4}deg)`,
        }}
      >
        {/* ======================================================== */}
        {/* FRONT FACE                                              */}
        {/* ======================================================== */}
        <div
          inert={isFlipped ? true : undefined}
          className="absolute inset-0 rounded-[16px] overflow-hidden bg-[#0b0b0c] text-white border border-white/[0.14] shadow-[0_28px_40px_rgba(0,0,0,0.22)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Top slot bar cutout: 44×7, radius 4 */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] h-[7px] rounded-[4px] bg-black/60 border border-white/10 shadow-inner z-20" />

          {/* Glare specular band (blended with screen) */}
          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              mixBlendMode: "screen",
              background: `linear-gradient(${120 + tiltDeg}deg, transparent ${Math.max(
                0,
                foil.glareBandPercent - 25
              )}%, rgba(255, 255, 255, 0.16) ${foil.glareBandPercent}%, transparent ${Math.min(
                100,
                foil.glareBandPercent + 25
              )}%)`,
            }}
          />

          {/* Meta Top-Left: (16, 14) */}
          <div className="absolute top-[14px] left-[16px] flex flex-col gap-0.5 z-10">
            <span className="font-mono text-[11px] font-medium tracking-[+0.14em] text-white/95 uppercase">
              BHAVYA / VERMA
            </span>
            <span className="font-mono text-[10px] tracking-[+0.08em] text-white/50 uppercase">
              PRODUCT ENGINEER · DELHI
            </span>
          </div>

          {/* Foil 7-Lobe Blob with 3 Stacked Layers & Eyes */}
          <div
            ref={blobCenterRef}
            className="absolute right-[14px] top-[26px] w-[134px] h-[134px] z-10 flex items-center justify-center"
            style={{
              transform: `translate(${eyeState.blobLeanX}px, ${eyeState.blobLeanY}px) scale(${eyeState.blobScale})`,
              transition: reducedMotion ? "none" : "transform 0.08s ease-out",
            }}
          >
            {/* SVG Clip Definition for 7-lobe blob */}
            <svg className="absolute w-0 h-0" aria-hidden="true">
              <defs>
                <clipPath id={clipId}>
                  <path d={blobPath} />
                </clipPath>
              </defs>
            </svg>

            {/* Blob Foil Surface masked by 7-lobe clip */}
            <div
              className="relative w-full h-full"
              style={{
                clipPath: `url(#${clipId})`,
                WebkitClipPath: `url(#${clipId})`,
              }}
            >
              {/* Layer 1: Conic gradient rotated by (40 + θ°·5 + tilt·4)deg */}
              <div
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from ${foil.blobConicAngleDeg}deg at 50% 50%, #5b3df5, #c13bd8, #ff6fb5, #4cc9f0, #7a5cff, #5b3df5)`,
                }}
              />

              {/* Layer 2: Pink radial glow at (50%, 62%) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 50% 62%, rgba(255, 111, 181, 0.75) 0%, transparent 65%)",
                }}
              />

              {/* Layer 3: Gloss highlight at (50 + tilt·1.1%, 28 + θ°·0.6%) */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at ${foil.blobGlossX}% ${foil.blobGlossY}%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0) 55%)`,
                }}
              />

              {/* Eyes: two 9×34 bars, radius 5, 6px apart at 50% / 36% of the blob */}
              <div
                className="absolute flex items-center gap-[6px] pointer-events-none"
                style={{
                  left: "50%",
                  top: "36%",
                  transform: `translate(calc(-50% + ${eyeState.offsetX}px), calc(-50% + ${eyeState.offsetY}px))`,
                }}
              >
                {/* Left Eye Bar */}
                <div
                  className="w-[9px] h-[34px] rounded-[5px] bg-[#0b0b0c] shadow-sm"
                  style={{
                    transform: `scaleY(${eyeState.scaleY})`,
                    transformOrigin: "center center",
                    transition: reducedMotion ? "none" : "transform 0.06s ease",
                  }}
                />
                {/* Right Eye Bar */}
                <div
                  className="w-[9px] h-[34px] rounded-[5px] bg-[#0b0b0c] shadow-sm"
                  style={{
                    transform: `scaleY(${eyeState.scaleY})`,
                    transformOrigin: "center center",
                    transition: reducedMotion ? "none" : "transform 0.06s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Name Bottom-Left: (16, 44 from bottom), 36px grotesk, clipped gradient fill */}
          <div className="absolute left-[16px] bottom-[44px] z-10">
            <h2
              className="text-[36px] font-sans font-normal tracking-[-0.04em] leading-none select-none"
              style={{
                background: `linear-gradient(${90 + tiltDeg * 0.5}deg, #c9b8ff ${Math.max(
                  0,
                  foil.nameGradPercent - 50
                )}%, #ff9ed6 ${foil.nameGradPercent}%, #8fe3f5 ${Math.min(
                  100,
                  foil.nameGradPercent + 50
                )}%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              BHAVYA
            </h2>
          </div>

          {/* Tagline at (16, 14 from bottom), width 150px */}
          <p className="absolute left-[16px] bottom-[14px] w-[150px] font-mono text-[9px] leading-[1.3] text-white/50 tracking-normal z-10">
            shipping features and memes in equal measure.
          </p>

          {/* Specimen watermark ID bottom-right */}
          <div className="absolute right-[14px] bottom-[10px] font-mono text-[9px] text-white/20 tracking-widest z-10">
            SPEC·001
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK FACE                                               */}
        {/* ======================================================== */}
        <div
          inert={!isFlipped ? true : undefined}
          className="absolute inset-0 rounded-[16px] overflow-hidden bg-[#0b0b0c] text-white border border-white/[0.14] shadow-[0_28px_40px_rgba(0,0,0,0.22)] p-[16px] flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top slot bar cutout */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] h-[7px] rounded-[4px] bg-black/60 border border-white/10 shadow-inner z-20" />

          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-medium tracking-[+0.14em] text-white/90">
              BACK / LINKS
            </span>
            <span className="font-mono text-[9px] text-white/40 tracking-wider">
              TAP OR ESC TO FLIP
            </span>
          </div>

          {/* Middle Body: 8x8 Pixel Patch + 3 Quick Action Links */}
          <div className="flex items-center justify-between gap-4 my-auto">
            {/* 8x8 pixel patch: 7px cells, 2px gap, half pastel / half #1c1c1e */}
            <div
              className="grid grid-cols-8 gap-[2px] p-1.5 rounded-lg bg-[#141416] border border-white/10"
              style={{ width: "fit-content" }}
              aria-hidden="true"
            >
              {PIXEL_PATCH_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-[7px] h-[7px] rounded-[1px] transition-colors duration-300"
                  style={{
                    backgroundColor: color || "#1c1c1e",
                  }}
                />
              ))}
            </div>

            {/* Three Actions (12px, line-height 2) */}
            <div className="flex flex-col text-[12px] font-mono leading-[2.1] text-right">
              {/* Book a Call */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBooking();
                }}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center justify-end gap-1.5 focus-visible:outline-white"
              >
                <span>book a call</span>
                <span className="text-[10px] opacity-60">↗</span>
              </button>

              {/* llms.txt */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLlms();
                }}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center justify-end gap-1.5 focus-visible:outline-white"
              >
                <span>llms.txt</span>
                <span className="text-[10px] opacity-60">↗</span>
              </button>

              {/* Writing */}
              <Link
                href="/writing"
                onClick={(e) => e.stopPropagation()}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center justify-end gap-1.5 focus-visible:outline-white"
              >
                <span>writing / notes</span>
                <span className="text-[10px] opacity-60">→</span>
              </Link>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[9px] font-mono text-white/40">
            <span>BEEBOMBSHELL IDENTITY CARD</span>
            <span>VERIFIED AUTH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
