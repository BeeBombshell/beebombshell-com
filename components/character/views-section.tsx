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

      <p className="text-sm sm:text-base text-[var(--mut)] mb-8 max-w-xl text-halo">
        {COPY.views.sub}
      </p>

      {/* Grid of Takes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative p-6 rounded-xl border border-[var(--line)] bg-[var(--bg)]/80 hover:border-[var(--fg)]/40 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="font-mono text-[10px] text-[var(--mut)] mb-3">
              № {String(item.num).padStart(2, "0")}
            </div>
            <p className="text-base sm:text-lg font-normal tracking-[-0.015em] text-[var(--fg)] leading-snug">
              &ldquo;{item.text}&rdquo;
            </p>
            <div className="mt-4 pt-3 border-t border-[var(--line)]/40 flex items-center justify-between text-[10px] font-mono text-[var(--mut)]">
              <span>UNSOLICITED TAKE</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                X ↗
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
