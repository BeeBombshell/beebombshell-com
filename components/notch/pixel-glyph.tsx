"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import { COPY } from "@/lib/copy";
import { PARTICLE_PALETTE } from "@/lib/tokens";

interface PixelGlyphProps {
  status?: "open" | "closed";
  className?: string;
  title?: string;
}

/**
 * Deep pigment counterparts of the design.md particle palette.
 * Used when the notch surface is light / white (e.g. in dark theme where notch fill is #eeece6,
 * or against any white background) to ensure WCAG AA high contrast (> 4.5:1) while preserving
 * the exact hue family of the particle spectrum.
 */
const LIGHT_SURFACE_PALETTE = [
  "#5442dc", // 0: Deep Lavender (hue matching #9d8df5)
  "#8927bc", // 1: Deep Orchid (hue matching #c58cec)
  "#ba1d70", // 2: Deep Pink (hue matching #f08fc6)
  "#087893", // 3: Deep Cyan/Teal (hue matching #7fd2e6)
  "#384cd3", // 4: Deep Periwinkle (hue matching #b5a6ff)
  "#a41757", // 5: Deep Rose (hue matching #f7a6d1)
] as const;

function getPathPaletteIndex(pathname: string): number {
  let hash = 0;
  for (const character of pathname) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % PARTICLE_PALETTE.light.length;
}

/**
 * PixelGlyph
 *
 * Authentic 8x8 Galaxy Brain pixel matrix according to design.md & plan.md:
 * - 8x8 crisp pixel brain rendered at 16x16px (integer 2x2px raster per pixel node)
 * - Random particle palette tint every time (page load, route change, or easter egg click)
 * - Dual-surface contrast: luminous pastels on dark notch, deep pigments on light/white notch
 * - Core synaptic nodes with calm breathing pulse ("open for chats" / thinking idle)
 * - Luminous Galaxy Brain bloom and hyper-active synapse flicker on hover
 * - Easter egg: clicking triggers the "ouch." blink reaction (egg.logoClick per copy.md)
 */
export function PixelGlyph({
  status = "open",
  className = "",
  title = "Status: Open for chats",
}: PixelGlyphProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [paletteOffset, setPaletteOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const paletteIndex =
    (getPathPaletteIndex(pathname) + paletteOffset) %
    PARTICLE_PALETTE.light.length;

  // Easter egg click trigger: blinks and picks another random color
  const handleClick = () => {
    setIsBlinking(true);
    setPaletteOffset(
      (offset) =>
        (offset +
          1 +
          Math.floor(Math.random() * (PARTICLE_PALETTE.light.length - 1))) %
        PARTICLE_PALETTE.light.length
    );
  };

  useEffect(() => {
    if (!isBlinking) return;
    const timer = setTimeout(() => {
      setIsBlinking(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, [isBlinking]);

  // The notch inverts the page: in dark mode the notch fill is --fg (#eeece6 / light paper),
  // in light mode the notch fill is --fg (#121212 / dark ink).
  const isNotchSurfaceLight = resolvedTheme === "dark";

  // Select color: deep vibrant tone on light notch surface, luminous pastel on dark notch surface
  const activeColor = isNotchSurfaceLight
    ? LIGHT_SURFACE_PALETTE[paletteIndex]
    : PARTICLE_PALETTE.light[paletteIndex];

  // Opacities calibrated for high contrast on light vs dark surfaces
  const cranialOpacity = isNotchSurfaceLight ? 0.82 : 0.6;
  const lobeOpacity = isNotchSurfaceLight ? 0.9 : 0.75;
  const foldOpacity = isNotchSurfaceLight ? 0.85 : 0.65;
  const stemOpacity = isNotchSurfaceLight ? 0.75 : 0.5;

  return (
    <span
      className={`inline-flex items-center justify-center relative group cursor-pointer select-none w-4.5 h-4.5 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={title}
      aria-label={title}
      role="status"
    >
      {/* 8x8 SVG Pixel Art Matrix rendered cleanly at 16x16px (2px integer grid) */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 8 8"
        className={`block transition-all duration-300 ${
          isHovered ? "scale-110" : "opacity-95"
        } ${isBlinking ? "animate-pulse" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          shapeRendering: "crispEdges",
          color: activeColor,
          filter: isHovered
            ? isNotchSurfaceLight
              ? `drop-shadow(0 0 4px ${activeColor}99) drop-shadow(0 1px 1.5px rgba(0,0,0,0.22))`
              : `drop-shadow(0 0 5px ${activeColor})`
            : isNotchSurfaceLight
            ? "drop-shadow(0 1px 1px rgba(0,0,0,0.14))"
            : `drop-shadow(0 0 2px ${activeColor}60)`,
        }}
      >
        {isBlinking ? (
          /* Ouch / Wince Blinking State: Eyes squeeze shut, horizontal synaptic fissure */
          <g fill="currentColor">
            {/* Upper brow ridge */}
            <rect x="1" y="1" width="2" height="1" opacity={lobeOpacity} />
            <rect x="5" y="1" width="2" height="1" opacity={lobeOpacity} />
            {/* Squinting / wincing horizontal line */}
            <rect x="0" y="3" width="8" height="1" opacity="1" />
            {/* Lower cranial contour */}
            <rect x="1" y="5" width="6" height="1" opacity={lobeOpacity} />
            <rect x="3" y="6" width="2" height="1" opacity={stemOpacity} />
          </g>
        ) : (
          /* Standard Galaxy Brain Matrix */
          <g fill="currentColor">
            {/* Cranial Top Crests (Left & Right Lobes) */}
            <rect x="2" y="0" width="2" height="1" opacity={cranialOpacity} />
            <rect x="4" y="0" width="2" height="1" opacity={cranialOpacity} />

            {/* Bilateral Hemispheres separated by Longitudinal Sulcus */}
            <rect x="1" y="1" width="2" height="1" opacity={lobeOpacity} />
            <rect x="5" y="1" width="2" height="1" opacity={lobeOpacity} />

            {/* Upper Cortex & Lateral Folds */}
            <rect x="0" y="2" width="2" height="1" opacity={foldOpacity} />
            <rect x="3" y="2" width="2" height="1" opacity={foldOpacity} />
            <rect x="6" y="2" width="2" height="1" opacity={foldOpacity} />

            {/* Mid Cortex & Sulci Gaps */}
            <rect x="0" y="3" width="2" height="1" opacity={foldOpacity} />
            <rect x="3" y="3" width="2" height="1" opacity={foldOpacity} />
            <rect x="6" y="3" width="2" height="1" opacity={foldOpacity} />

            {/* Lower Neural Fissures */}
            <rect x="0" y="4" width="1" height="1" opacity={foldOpacity} />
            <rect x="7" y="4" width="1" height="1" opacity={foldOpacity} />

            {/* Temporal & Cerebellum Arc */}
            <rect x="1" y="5" width="2" height="1" opacity={lobeOpacity} />
            <rect x="5" y="5" width="2" height="1" opacity={lobeOpacity} />

            {/* Brainstem Base */}
            <rect x="2" y="6" width="4" height="1" opacity={stemOpacity} />
            <rect x="3" y="7" width="2" height="1" opacity={stemOpacity} />

            {/* Active Synaptic Nodes (Live Neural Activity) */}
            {/* Left Hemisphere Synapse */}
            <rect
              x="2"
              y="2"
              width="1"
              height="1"
              opacity="1"
              className={status === "open" && !isHovered ? "animate-pulse" : ""}
            />
            {/* Right Hemisphere Synapse */}
            <rect
              x="5"
              y="2"
              width="1"
              height="1"
              opacity="1"
              className={status === "open" && !isHovered ? "animate-pulse" : ""}
            />
            {/* Central Corpus Callosum Synapses */}
            <rect
              x="2"
              y="4"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.92}
            />
            <rect
              x="4"
              y="4"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.92}
            />
            {/* Core Neural Spark (Bright on hover or thinking) */}
            <rect
              x="3"
              y="5"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.88}
            />
          </g>
        )}
      </svg>

      {/* Floating "ouch." Easter Egg Speechlet */}
      <AnimatePresence>
        {isBlinking && (
          <motion.span
            initial={{ opacity: 0, y: -2, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -2, scale: 0.85 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            style={{ borderColor: `${activeColor}80` }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 px-1.5 py-0.5 rounded bg-[var(--fg)] text-[var(--bg)] border text-[9px] font-mono tracking-wider shadow-lg select-none whitespace-nowrap flex items-center gap-1"
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
            <span>{COPY.egg.logoClick}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
