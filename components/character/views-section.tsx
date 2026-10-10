"use client";

import React, { useRef } from "react";
import { type Take } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { HoloCard } from "@/components/cards/holo-card";

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

      {/* Grid of Takes with Solar Amber Accent HoloCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item) => {
          const formattedNum = String(item.num).padStart(2, "0");
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `"${item.text}" — via @Bee_Bombshell`
          )}`;

          return (
            <HoloCard
              key={item.id}
              variant="opinion"
              hudText={`TAKE // № ${formattedNum}`}
              className="h-full"
            >
              <a
                href={tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative p-6 sm:p-7 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/85 dark:bg-[#0c0c0e]/85 hover:border-[var(--fg)]/30 transition-all duration-300 flex flex-col justify-between h-full backdrop-blur-md cursor-pointer shadow-sm"
              >
                {/* Header Row: Number Specimen & Minimal Label */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <span className="font-mono text-[11px] font-medium text-[var(--mut)] group-hover:text-[var(--fg)] transition-colors">
                    № {formattedNum}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-500/90 dark:text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    UNSOLICITED TAKE
                  </span>
                </div>

                {/* Take Body Quote */}
                <p className="text-base sm:text-lg font-normal tracking-[-0.015em] text-[var(--fg)] leading-snug my-auto py-2 group-hover:text-halo transition-colors duration-200">
                  &ldquo;{item.text}&rdquo;
                </p>

                {/* Footer Status Bar with Clean X Dispatch Link */}
                <div className="mt-5 pt-3 border-t border-[var(--line)]/50 flex items-center justify-between text-[10px] font-mono text-[var(--mut)]">
                  <span className="text-[var(--mut)] group-hover:text-[var(--fg)] transition-colors">
                    OPINION SPECIMEN
                  </span>
                  <span className="flex items-center gap-1 text-[var(--mut)] group-hover:text-[var(--fg)] font-medium transition-colors">
                    <span>DISPATCH TO X</span>
                    <span className="inline-block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                      ↗
                    </span>
                  </span>
                </div>
              </a>
            </HoloCard>
          );
        })}
      </div>
    </section>
  );
}
