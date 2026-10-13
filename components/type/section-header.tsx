"use client";

import React from "react";

interface SectionHeaderProps {
  title: string;
  intro?: string;
  meta?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  intro,
  meta,
  className = "",
}: SectionHeaderProps) {
  return (
    <header className={`border-b border-[var(--line)] pb-4 mb-10 ${className}`}>
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
