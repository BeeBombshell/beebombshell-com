"use client";

import React from "react";

interface SectionHeaderProps {
  figure: string; // e.g. "FIG 0.2 · SELECTED WORKS"
  number?: string; // e.g. "№ 002"
  title: string;
  intro?: string;
  meta?: React.ReactNode; // e.g. link or counter aligned to the baseline
  className?: string;
}

export function SectionHeader({
  figure,
  number,
  title,
  intro,
  meta,
  className = "",
}: SectionHeaderProps) {
  return (
    <header className={`border-b border-[var(--line)] pb-4 mb-10 ${className}`}>
      {/* Top technical caption row */}
      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.1em] text-[var(--mut)] mb-3">
        <div className="flex items-center gap-3">
          {number && <span className="text-[var(--fg)] font-medium">{number}</span>}
          {number && <span>·</span>}
          <span>{figure}</span>
        </div>
      </div>

      {/* Main title + baseline-aligned meta */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-[50px] font-normal tracking-[-0.03em] leading-[1.08] text-[var(--fg)] text-halo">
            {title}
          </h2>
          {intro && (
            <p className="mt-2 text-sm sm:text-base text-[var(--fg)]/80 font-normal leading-relaxed text-halo">
              {intro}
            </p>
          )}
        </div>

        {meta && (
          <div className="font-mono text-xs text-[var(--mut)] shrink-0 sm:pb-1">
            {meta}
          </div>
        )}
      </div>
    </header>
  );
}
