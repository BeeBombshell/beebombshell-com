"use client";

import React, { useRef, useState } from "react";
import { type Take } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { HoloCard } from "@/components/cards/holo-card";
import { SectionHeader } from "@/components/type/section-header";

interface ViewsSectionProps {
  takes: Take[];
}

const TILTS = [-1.2, 1.3, -0.9, 1.4, -1.3, 0.8];

const DEADPAN_REPLIES = [
  "Noted. Ignored.",
  "Filed under /dev/null.",
  "Queued behind 412 higher priority tasks.",
  "The committee voted 1-0 against.",
  "Acknowledged. Discarded.",
  "Considered briefly, then archived.",
  "Ticket closed as WONTFIX.",
];

export function ViewsSection({ takes }: ViewsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  useRegisterTextBlock("views-section", containerRef);

  const [requestCount, setRequestCount] = useState(0);
  const [deadpanReply, setDeadpanReply] = useState<string | null>(null);

  const takeCount = takes.length || COPY.views.takes.length;

  const items = takes.length
    ? takes.map((t, i) => ({ id: t.id, text: t.text, num: i + 1 }))
    : COPY.views.takes.map((text, i) => ({ id: `take-${i + 1}`, text, num: i + 1 }));

  const handleRequestTake = () => {
    setRequestCount((prev) => prev + 1);
    const reply = DEADPAN_REPLIES[requestCount % DEADPAN_REPLIES.length];
    setDeadpanReply(reply);
  };

  return (
    <section
      id="about"
      ref={containerRef}
      data-section="views"
      className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-[clamp(96px,14vh,160px)] border-t border-[var(--line)]"
    >
      {/* Unified Section Header */}
      <SectionHeader
        figure="FIG 0.4 · UNSOLICITED TAKES"
        number="№ 004"
        title={COPY.views.title}
        intro={COPY.views.sub}
        meta={
          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center gap-3">
              <span>{requestCount} requests</span>
              <span>·</span>
              <span>{takeCount} takes</span>
              <span>·</span>
              <button
                type="button"
                onClick={handleRequestTake}
                className="px-2.5 py-1 rounded-full border border-[var(--line)] hover:border-[var(--fg)] hover:text-[var(--fg)] bg-[var(--bg)]/80 text-[11px] font-mono transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--fg)]"
              >
                + request a take
              </button>
            </div>
            {deadpanReply && (
              <span className="text-[11px] font-mono text-[var(--fg)]/70 italic animate-in fade-in slide-in-from-top-1 duration-200">
                &ldquo;{deadpanReply}&rdquo;
              </span>
            )}
          </div>
        }
      />

      {/* Bento Grid with Alternating Tilts and Mixed Card Sizes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
        {items.map((item, idx) => {
          const formattedNum = String(item.num).padStart(2, "0");
          const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `"${item.text}" — via @Bee_Bombshell`
          )}`;
          const tilt = TILTS[idx % TILTS.length];

          // Mixed card sizes: bento distribution
          // 0: wide (col-span-7)
          // 1: compact (col-span-5)
          // 2: compact (col-span-5)
          // 3: wide (col-span-7)
          // 4: half (col-span-6)
          // 5: half (col-span-6)
          const colSpanClass =
            idx === 0
              ? "md:col-span-7"
              : idx === 1
              ? "md:col-span-5"
              : idx === 2
              ? "md:col-span-5"
              : idx === 3
              ? "md:col-span-7"
              : "md:col-span-6";

          return (
            <div
              key={item.id}
              style={{
                transform: `rotate(${tilt}deg)`,
                transition: "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              className={`${colSpanClass} hover:!rotate-0 hover:!-translate-y-1 focus-within:!rotate-0 focus-within:!-translate-y-1`}
            >
              <HoloCard
                variant="opinion"
                hudText={`TAKE // № ${formattedNum}`}
                className="h-full"
              >
                <div className="group relative p-6 sm:p-7 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/85 dark:bg-[#0c0c0e]/85 hover:border-[var(--fg)]/30 transition-all duration-300 flex flex-col justify-between h-full backdrop-blur-md shadow-sm">
                  {/* Header Row: Number Specimen only */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="font-mono text-[11px] font-medium text-[var(--mut)] group-hover:text-[var(--fg)] transition-colors">
                      № {formattedNum}
                    </span>
                  </div>

                  {/* Take Body Quote */}
                  <blockquote className="text-base sm:text-lg font-normal tracking-[-0.015em] text-[var(--fg)] leading-snug my-auto py-2 group-hover:text-halo transition-colors duration-200">
                    &ldquo;{item.text}&rdquo;
                  </blockquote>

                  {/* Footer Action: single share ↗ button built from X intent URL */}
                  <div className="mt-5 pt-3 border-t border-[var(--line)]/50 flex items-center justify-end text-[11px] font-mono">
                    <a
                      href={tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--mut)] hover:text-[var(--fg)] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[var(--fg)] rounded px-1"
                      aria-label={`Share take ${formattedNum} on X`}
                    >
                      <span>share</span>
                      <span className="inline-block group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
                        ↗
                      </span>
                    </a>
                  </div>
                </div>
              </HoloCard>
            </div>
          );
        })}
      </div>
    </section>
  );
}
