"use client";

import React, { useRef } from "react";
import { type Take } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { useRegisterTextBlock } from "@/components/particles/use-particles";

interface ViewsSectionProps {
  takes: Take[];
}

export function ViewsSection({ takes }: ViewsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  useRegisterTextBlock("views-section", containerRef);

  const takeCount = takes.length || COPY.views.takes.length;
  const counterText = COPY.views.counter.replace("{n}", String(takeCount));

  const items = takes.length
    ? takes.map((t, i) => ({ id: t.id, text: t.text, num: i + 1 }))
    : COPY.views.takes.map((text, i) => ({ id: `take-${i + 1}`, text, num: i + 1 }));

  return (
    <section
      id="views-nobody-asked-for"
      ref={containerRef}
      className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 border-t border-[var(--line)]"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4 mb-10">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
            {COPY.views.caption}
          </div>
          <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
            {COPY.views.title}
          </h2>
        </div>
        <div className="mt-3 sm:mt-0 flex items-center gap-4 text-xs font-mono text-[var(--mut)]">
          <span>{counterText}</span>
          <span>·</span>
          <a
            href="https://x.com/Bee_Bombshell"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--fg)] transition-colors underline underline-offset-4 decoration-[var(--line)] hover:decoration-[var(--fg)]"
          >
            {COPY.views.cta}
          </a>
        </div>
      </div>

      <p className="text-sm sm:text-base text-[var(--fg)]/80 mb-8 max-w-xl text-halo font-normal">
        {COPY.views.sub}
      </p>

      {/* Grid of Takes with Editorial Stamp & Thermal Tape Hover Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const formattedNum = String(item.num).padStart(2, "0");
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `"${item.text}" — via @Bee_Bombshell`
          )}`;

          return (
            <a
              key={item.id}
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/85 dark:bg-[#0c0c0e]/85 hover:border-[var(--fg)]/50 transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-md hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.35)] cursor-pointer"
            >
              {/* Thermal Print Scan Beam (Sweeps down on hover) */}
              <div className="pointer-events-none absolute inset-x-0 -top-4 h-1.5 bg-gradient-to-r from-transparent via-amber-400/60 dark:via-amber-400/80 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-y-[280px] transition-all duration-700 ease-in-out" />

              {/* Tape Accent Tab at Top Left */}
              <div className="absolute top-0 left-6 h-[3px] w-10 bg-[var(--line)] group-hover:bg-amber-400/80 dark:group-hover:bg-amber-400/90 transition-colors duration-300" />

              {/* Header Row: Number Badge & Editorial Rubber Stamp */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-medium text-[var(--mut)] group-hover:text-[var(--fg)] transition-colors">
                    № {formattedNum}
                  </span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px] uppercase tracking-wider text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                    TAKE
                  </span>
                </div>

                {/* Angled Editorial Rubber Stamp */}
                <div className="pointer-events-none transform rotate-[-4deg] scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                  <span className="font-mono text-[9px] font-semibold tracking-wider uppercase border border-dashed border-red-500/70 dark:border-red-400/70 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded shadow-sm bg-red-500/5">
                    UNSOLICITED
                  </span>
                </div>
              </div>

              {/* Take Body Quote (Slides slightly forward on hover) */}
              <p className="text-base sm:text-lg font-normal tracking-[-0.015em] text-[var(--fg)] leading-snug group-hover:translate-x-1 transition-transform duration-200 my-auto py-2">
                &ldquo;{item.text}&rdquo;
              </p>

              {/* Footer Status Bar with X Share Prompt */}
              <div className="mt-5 pt-3 border-t border-[var(--line)]/50 flex items-center justify-between text-[10px] font-mono text-[var(--mut)]">
                <span className="group-hover:text-[var(--fg)] transition-colors">
                  OPINION SPECIMEN
                </span>
                <span className="flex items-center gap-1 text-[var(--mut)] group-hover:text-[var(--fg)] font-medium transition-colors">
                  <span>DISPATCH TO X</span>
                  <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                    ↗
                  </span>
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
