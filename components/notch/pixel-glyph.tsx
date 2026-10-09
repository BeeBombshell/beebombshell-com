"use client";

import React from "react";

interface PixelGlyphProps {
  status?: "open" | "closed";
  className?: string;
  title?: string;
}

export function PixelGlyph({
  status = "open",
  className = "",
  title = "Status: Open for chats",
}: PixelGlyphProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-3 h-3 group cursor-help relative ${className}`}
      title={title}
      aria-label={title}
      role="status"
    >
      {/* 8x8 viewBox pixel art glyph */}
      <svg
        width="10"
        height="10"
        viewBox="0 0 8 8"
        className="block"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Pixel brain / node matrix */}
        <rect x="2" y="1" width="4" height="1" fill="currentColor" opacity="0.6" />
        <rect x="1" y="2" width="6" height="4" fill="currentColor" opacity="0.8" />
        <rect x="2" y="6" width="4" height="1" fill="currentColor" opacity="0.6" />
        
        {/* Active glowing core */}
        <rect
          x="3"
          y="3"
          width="2"
          height="2"
          className={
            status === "open"
              ? "fill-[#7fd2e6] dark:fill-[#a6e6f2] animate-pulse"
              : "fill-[var(--mut)]"
          }
        />
      </svg>

      {/* Subtle indicator beacon */}
      <span
        className={`absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full ${
          status === "open" ? "bg-emerald-400 animate-ping" : "bg-transparent"
        } opacity-75`}
        aria-hidden="true"
      />
    </span>
  );
}
