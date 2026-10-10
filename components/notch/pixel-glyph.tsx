"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { COPY } from "@/lib/copy";
import { PARTICLE_PALETTE } from "@/lib/tokens";

interface PixelGlyphProps {
  status?: "open" | "closed";
  className?: string;
  title?: string;
}

/**
 * PixelGlyph
 *
 * Authentic 8x8 Galaxy Brain pixel matrix according to design.md & plan.md:
 * - 8x8 crisp pixel brain representation with distinct cranial hemispheres and sulci
 * - Random particle palette tint every time (page load, route change, or easter egg click)
 *   sampled from design.md particle tokens (#9d8df5, #c58cec, #f08fc6, #7fd2e6, #b5a6ff, #f7a6d1)
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
  const [mounted, setMounted] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Pick a random particle color on mount and on route transitions
  useEffect(() => {
    setMounted(true);
    const randomIndex = Math.floor(Math.random() * PARTICLE_PALETTE.light.length);
    setPaletteIndex(randomIndex);
  }, [pathname]);

  // Easter egg click trigger: blinks and picks another random color
  const handleClick = () => {
    setIsBlinking(true);
    setPaletteIndex((prev) => {
      const next =
        (prev + 1 + Math.floor(Math.random() * (PARTICLE_PALETTE.light.length - 1))) %
        PARTICLE_PALETTE.light.length;
      return next;
    });
  };

  useEffect(() => {
    if (!isBlinking) return;
    const timer = setTimeout(() => {
      setIsBlinking(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, [isBlinking]);

  // Determine current active color based on resolved theme
  const isDark = mounted && resolvedTheme === "dark";
  const activeColor = isDark
    ? PARTICLE_PALETTE.dark[paletteIndex]
    : PARTICLE_PALETTE.light[paletteIndex];

  return (
    <span
      className={`inline-flex items-center justify-center relative group cursor-pointer select-none ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      title={title}
      aria-label={title}
      role="status"
    >
      {/* 8x8 SVG Pixel Art Matrix with crisp rendering */}
      <svg
        width="13"
        height="13"
        viewBox="0 0 8 8"
        className={`block transition-all duration-300 ${
          isHovered ? "scale-110" : "opacity-90"
        } ${isBlinking ? "animate-pulse" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{
          shapeRendering: "crispEdges",
          color: activeColor,
          filter: isHovered
            ? `drop-shadow(0 0 4.5px ${activeColor})`
            : `drop-shadow(0 0 1.5px ${activeColor}55)`,
        }}
      >
        {isBlinking ? (
          /* Ouch / Wince Blinking State: Eyes squeeze shut, horizontal synaptic fissure */
          <g fill="currentColor">
            {/* Upper brow ridge */}
            <rect x="1" y="1" width="2" height="1" opacity="0.7" />
            <rect x="5" y="1" width="2" height="1" opacity="0.7" />
            {/* Squinting / wincing horizontal line */}
            <rect x="0" y="3" width="8" height="1" opacity="1" />
            {/* Lower cranial contour */}
            <rect x="1" y="5" width="6" height="1" opacity="0.6" />
            <rect x="3" y="6" width="2" height="1" opacity="0.4" />
          </g>
        ) : (
          /* Standard Galaxy Brain Matrix */
          <g fill="currentColor">
            {/* Cranial Top Crests (Left & Right Lobes) */}
            <rect x="2" y="0" width="2" height="1" opacity="0.5" />
            <rect x="4" y="0" width="2" height="1" opacity="0.5" />

            {/* Bilateral Hemispheres separated by Longitudinal Sulcus */}
            <rect x="1" y="1" width="2" height="1" opacity="0.65" />
            <rect x="5" y="1" width="2" height="1" opacity="0.65" />

            {/* Upper Cortex & Lateral Folds */}
            <rect x="0" y="2" width="2" height="1" opacity="0.55" />
            <rect x="3" y="2" width="2" height="1" opacity="0.45" />
            <rect x="6" y="2" width="2" height="1" opacity="0.55" />

            {/* Mid Cortex & Sulci Gaps */}
            <rect x="0" y="3" width="2" height="1" opacity="0.6" />
            <rect x="3" y="3" width="2" height="1" opacity="0.5" />
            <rect x="6" y="3" width="2" height="1" opacity="0.6" />

            {/* Lower Neural Fissures */}
            <rect x="0" y="4" width="1" height="1" opacity="0.5" />
            <rect x="7" y="4" width="1" height="1" opacity="0.5" />

            {/* Temporal & Cerebellum Arc */}
            <rect x="1" y="5" width="2" height="1" opacity="0.55" />
            <rect x="5" y="5" width="2" height="1" opacity="0.55" />

            {/* Brainstem Base */}
            <rect x="2" y="6" width="4" height="1" opacity="0.4" />
            <rect x="3" y="7" width="2" height="1" opacity="0.3" />

            {/* Active Synaptic Nodes (Live Neural Activity) */}
            {/* Left Hemisphere Synapse */}
            <rect
              x="2"
              y="2"
              width="1"
              height="1"
              opacity={isHovered ? 1 : 0.95}
              className={status === "open" && !isHovered ? "animate-pulse" : ""}
            />
            {/* Right Hemisphere Synapse */}
            <rect
              x="5"
              y="2"
              width="1"
              height="1"
              opacity={isHovered ? 1 : 0.95}
              className={status === "open" && !isHovered ? "animate-pulse" : ""}
            />
            {/* Central Corpus Callosum Synapses */}
            <rect
              x="2"
              y="4"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.85}
            />
            <rect
              x="4"
              y="4"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.85}
            />
            {/* Core Neural Spark (Bright on hover or thinking) */}
            <rect
              x="3"
              y="5"
              width="2"
              height="1"
              opacity={isHovered ? 1 : 0.75}
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
