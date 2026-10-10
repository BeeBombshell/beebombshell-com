"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COPY } from "@/lib/copy";

interface PixelGlyphProps {
  status?: "open" | "closed";
  className?: string;
  title?: string;
}

/**
 * PixelGlyph
 *
 * Authentic 8x8 Galaxy Brain pixel matrix according to design.md & plan.md:
 * - 8x8 crisp monochrome pixel brain representation with distinct cranial hemispheres and sulci
 * - Core synaptic nodes with calm breathing pulse ("open for chats" / thinking idle)
 * - Luminous Galaxy Brain bloom and hyper-active synapse flicker on hover
 * - Easter egg: clicking triggers the "ouch." blink reaction (egg.logoClick per copy.md)
 * - Strict adherence to design.md monochrome palette (using currentColor / var(--bg) inverted fill)
 */
export function PixelGlyph({
  status = "open",
  className = "",
  title = "Status: Open for chats",
}: PixelGlyphProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Easter egg click trigger
  const handleClick = () => {
    setIsBlinking(true);
  };

  useEffect(() => {
    if (!isBlinking) return;
    const timer = setTimeout(() => {
      setIsBlinking(false);
    }, 1300);
    return () => clearTimeout(timer);
  }, [isBlinking]);

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
          isHovered
            ? "scale-110 drop-shadow-[0_0_3.5px_rgba(255,255,255,0.7)]"
            : "opacity-85"
        } ${isBlinking ? "animate-pulse" : ""}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ shapeRendering: "crispEdges" }}
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
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2.5 z-50 px-1.5 py-0.5 rounded bg-[var(--fg)] text-[var(--bg)] border border-[var(--bg)]/30 text-[9px] font-mono tracking-wider shadow-lg select-none whitespace-nowrap"
          >
            {COPY.egg.logoClick}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
