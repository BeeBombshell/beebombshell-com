"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { computeFoilState, generate7LobeBlobPath } from "./foil";
import { useEyes } from "./use-eyes";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { COPY } from "@/lib/copy";

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
  isMobile?: boolean;
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
  isMobile = false,
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

  // Responsive dimensions: 560×380 on desktop, 330×480 on mobile
  const cardWidth = isMobile ? 330 : 560;
  const cardHeight = isMobile ? 480 : 380;

  // Dot grid position shifts with tilt (tilt·1.5 px horizontally, deg·1.2 px vertically)
  const dotX = tiltDeg * 1.5;
  const dotY = thetaDeg * 1.2;

  // Glare band position: 50 - tilt·3 - deg·2 %
  const glarePercent = Math.max(0, Math.min(100, 50 - tiltDeg * 3 - thetaDeg * 2));

  // Extrusion offset for blob: (4 - tilt·0.22, 7)
  const extrusionX = 4 - tiltDeg * 0.22;
  const extrusionY = 7;

  return (
    <div
      ref={cardElementRef}
      role="button"
      tabIndex={0}
      aria-label={COPY.a11y.badgeLabel}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      className="relative select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--fg)] rounded-[20px] cursor-grab active:cursor-grabbing"
      style={{
        width: cardWidth,
        height: cardHeight,
        perspective: 1200,
        touchAction: "none",
      }}
    >
      {/* 3D Flip Container */}
      <div
        className="relative w-full h-full rounded-[20px] transition-transform duration-75"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${flipDeg}deg) rotateZ(${tiltDeg * 0.35}deg)`,
        }}
      >
        {/* ======================================================== */}
        {/* FRONT FACE                                              */}
        {/* ======================================================== */}
        <div
          inert={isFlipped ? true : undefined}
          aria-label={COPY.a11y.badgeFront}
          className="absolute inset-0 rounded-[20px] overflow-hidden bg-[#0b0b0c] text-white border border-white/[0.14] shadow-[0_28px_40px_rgba(0,0,0,0.22)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Top slot bar cutout: 44×7, radius 4, at -6px */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] h-[7px] rounded-[4px] bg-black/70 border border-white/10 shadow-inner z-20 flex items-center justify-center">
            {/* Metal split ring passing through (13×21, 2.5px border) */}
            <div className="w-[13px] h-[16px] rounded-full border-[2.5px] border-zinc-400/80 -mt-2 pointer-events-none" />
          </div>

          {/* Holographic dot overlay (7px grid of 1px white dots at 14% alpha, screen blend, 50% opacity) */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-50"
            style={{
              mixBlendMode: "screen",
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.14) 1px, transparent 1px)",
              backgroundSize: "7px 7px",
              backgroundPosition: `${dotX}px ${dotY}px`,
            }}
          />

          {/* Glare specular diagonal band (16% alpha, screen blend) */}
          <div
            className="absolute inset-0 pointer-events-none z-30"
            style={{
              mixBlendMode: "screen",
              background: `linear-gradient(${120 + tiltDeg * 0.8}deg, transparent ${Math.max(
                0,
                glarePercent - 22
              )}%, rgba(255, 255, 255, 0.16) ${glarePercent}%, transparent ${Math.min(
                100,
                glarePercent + 22
              )}%)`,
            }}
          />

          {/* Meta Top-Left: (24px, 20px) */}
          <div className="absolute top-[20px] left-[24px] flex flex-col gap-0.5 z-20">
            <span className="font-mono text-[11px] font-medium tracking-[+0.14em] text-white/95 uppercase">
              {COPY.card.label}
            </span>
            <span className="font-mono text-[10px] tracking-[+0.08em] text-white/50">
              {COPY.card.meta}
            </span>
          </div>

          {/* Blob Mascot at Top-Right: (24px, 24px), 134×134 */}
          <div
            ref={blobCenterRef}
            className="absolute right-[24px] top-[24px] w-[134px] h-[134px] z-20 flex items-center justify-center"
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

            {/* Extrusion Underlayer (shifts with tilt) */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none -z-10"
              style={{
                transform: `translate(${extrusionX}px, ${extrusionY}px)`,
                background: "linear-gradient(145deg, #4b2fd6 0%, #201366 100%)",
                filter: "blur(2px)",
                opacity: 0.8,
              }}
            />

            {/* Blob Foil Surface masked by 7-lobe clip */}
            <div
              className="relative w-full h-full shadow-lg"
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

              {/* Rim light & shade */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    "inset 2.5px 2.5px 6px rgba(255, 255, 255, 0.8), inset -2.5px -2.5px 6px rgba(75, 47, 214, 0.35)",
                }}
              />

              {/* Layer 3: Moving gloss spot */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 30px 18px at ${Math.max(
                    20,
                    Math.min(80, 45 + tiltDeg * 0.9)
                  )}% ${Math.max(
                    15,
                    Math.min(85, 38 + thetaDeg * 0.5)
                  )}%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 60%)`,
                }}
              />

              {/* Eyes: two 9×34 bars, radius 5, 6px apart at 50% / 36% */}
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
                    transform: `scaleY(${eyeState.scaleY}) scaleX(${eyeState.scaleX})`,
                    transformOrigin: "center center",
                    transition: reducedMotion ? "none" : "transform 0.06s ease",
                  }}
                />
                {/* Right Eye Bar */}
                <div
                  className="w-[9px] h-[34px] rounded-[5px] bg-[#0b0b0c] shadow-sm"
                  style={{
                    transform: `scaleY(${eyeState.scaleY}) scaleX(${eyeState.scaleX})`,
                    transformOrigin: "center center",
                    transition: reducedMotion ? "none" : "transform 0.06s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Headline at (24px, 82px), width max-w-[360px] */}
          <div className="absolute left-[24px] top-[74px] sm:top-[82px] max-w-[320px] sm:max-w-[360px] z-20">
            <h1 className="text-xl sm:text-2xl font-normal tracking-[-0.03em] leading-[1.2] text-white">
              <span>{COPY.card.headlineLead}</span>
              <span className="foil-text font-medium">{COPY.card.headlineAccent}</span>
            </h1>
          </div>

          {/* Bio at (24px, 184px), width max-w-[370px] */}
          <div className="absolute left-[24px] top-[152px] sm:top-[175px] max-w-[320px] sm:max-w-[370px] z-20">
            <p className="text-xs sm:text-[13px] leading-[1.65] text-white/70 font-normal">
              {COPY.card.bio}
            </p>
          </div>

          {/* Chips along bottom-left (24px, 24px from bottom), 8px gap */}
          <div className="absolute left-[24px] bottom-[20px] sm:bottom-[24px] flex flex-wrap items-center gap-2 z-20">
            {COPY.card.chips.map((chip) => (
              <span
                key={chip}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-tight bg-white/[0.08] text-white/80 border border-white/10"
              >
                {chip}
              </span>
            ))}
          </div>

          {/* Hint & SPEC tag Bottom-Right: (24px, 24px) */}
          <div className="absolute right-[24px] bottom-[20px] sm:bottom-[24px] flex items-center gap-3 font-mono text-[10px] z-20">
            <span className="text-white/40 tracking-wider hidden sm:inline">
              {COPY.card.hint}
            </span>
            <span className="text-white/30 tracking-widest">
              {COPY.card.spec}
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BACK FACE                                               */}
        {/* ======================================================== */}
        <div
          inert={!isFlipped ? true : undefined}
          aria-label={COPY.a11y.badgeBack}
          className="absolute inset-0 rounded-[20px] overflow-hidden bg-[#0b0b0c] text-white border border-white/[0.14] shadow-[0_28px_40px_rgba(0,0,0,0.22)] p-[24px] flex flex-col justify-between"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Top slot cutout */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[44px] h-[7px] rounded-[4px] bg-black/70 border border-white/10 shadow-inner z-20 flex items-center justify-center">
            <div className="w-[13px] h-[16px] rounded-full border-[2.5px] border-zinc-400/80 -mt-2 pointer-events-none" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-[11px] font-medium tracking-[+0.14em] text-white/90">
              {COPY.card.back.label}
            </span>
            <span className="font-mono text-[10px] text-white/40 tracking-wider">
              {COPY.card.hintBack}
            </span>
          </div>

          {/* Center Body: Pixel Patch Matrix + Actions List */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 my-auto">
            {/* 8x8 Pixel Patch Specimen */}
            <div
              className="grid grid-cols-8 gap-[3px] p-2 rounded-xl bg-[#141416] border border-white/10"
              style={{ width: "fit-content" }}
              aria-hidden="true"
            >
              {PIXEL_PATCH_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-[9px] h-[9px] rounded-[1.5px] transition-colors duration-300"
                  style={{
                    backgroundColor: color || "#1c1c1e",
                  }}
                />
              ))}
            </div>

            {/* Actions Column (13px, line-height 2.1) */}
            <div className="flex flex-col text-[13px] font-mono leading-[2.1] sm:text-right w-full sm:w-auto">
              {/* Book a Call */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openBooking();
                }}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center sm:justify-end gap-2 focus-visible:outline-white cursor-pointer"
              >
                <span>{COPY.card.back.book}</span>
                <span className="text-[11px] opacity-60">↗</span>
              </button>

              {/* Writing */}
              <Link
                href="/writing"
                onClick={(e) => e.stopPropagation()}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center sm:justify-end gap-2 focus-visible:outline-white"
              >
                <span>{COPY.card.back.writing}</span>
                <span className="text-[11px] opacity-60">→</span>
              </Link>

              {/* llms.txt */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLlms();
                }}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center sm:justify-end gap-2 focus-visible:outline-white cursor-pointer"
              >
                <span>{COPY.card.back.llms}</span>
                <span className="text-[11px] opacity-60">↗</span>
              </button>

              {/* Unsolicited views on X */}
              <a
                href="https://x.com/Bee_Bombshell"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white/80 hover:text-white transition-colors hover:underline inline-flex items-center sm:justify-end gap-2 focus-visible:outline-white"
              >
                <span>{COPY.card.back.x}</span>
              </a>
            </div>
          </div>

          {/* Footer note */}
          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-[10px] font-mono text-white/40">
            <span>BEEBOMBSHELL IDENTITY CARD</span>
            <span>{COPY.card.spec}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
