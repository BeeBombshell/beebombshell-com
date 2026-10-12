"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/type/section-header";
import { COPY } from "@/lib/copy";
import { type Take } from "@/lib/schemas";
import {
  useParticleEngine,
  useRegisterTextBlock,
} from "@/components/particles/use-particles";

interface ViewsSectionProps {
  takes?: Take[];
  enableCharacter?: boolean;
}

export function ViewsSection({
  takes = [],
  enableCharacter = true,
}: ViewsSectionProps) {
  const items = useMemo<Take[]>(() => {
    return takes.length > 0
      ? takes
      : COPY.views.takes.map((text, idx) => ({
          id: String(idx + 1).padStart(3, "0"),
          text,
          url: undefined,
          order: idx + 1,
        }));
  }, [takes]);

  const total = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useRegisterTextBlock("views-stage", panelRef);

  const { morphTo, setAccentTarget, setGlyphTarget } = useParticleEngine();
  const reducedMotion = useReducedMotion() ?? false;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
          morphTo("takes");
        }
      },
      { threshold: [0.35] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [morphTo]);

  const selectedIndex = Math.min(activeIndex, Math.max(0, total - 1));
  const activeTake = items[selectedIndex];
  const activeNumber = String(selectedIndex + 1).padStart(2, "0");
  const totalNumber = String(total).padStart(2, "0");
  const counter = COPY.views.counter.replace("{n}", String(total));

  const handleLinkEnter = () => {
    if (linkRef.current) {
      setGlyphTarget(linkRef.current.getBoundingClientRect());
    }
  };

  const handleLinkLeave = () => {
    setGlyphTarget(null);
  };

  const handleAccentTarget = (element: HTMLElement | null) => {
    if (!element) {
      setAccentTarget(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    setAccentTarget({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const moveSelection = (direction: 1 | -1) => {
    const nextIndex = (selectedIndex + direction + total) % total;
    setActiveIndex(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  if (!activeTake) {
    return null;
  }

  return (
    <section
      id="about"
      ref={containerRef}
      data-section="views"
      aria-label={COPY.views.title}
      className="relative z-10 mx-auto w-full max-w-6xl px-5 py-[clamp(88px,13vh,148px)] sm:px-8"
    >
      <SectionHeader
        number="№ 004"
        figure={COPY.views.caption || "FIG 0.4 · UNSOLICITED TAKES"}
        title={COPY.views.title}
        intro={COPY.views.sub}
        meta={
          <span className="inline-flex items-center gap-2 tabular-nums">
            <span>{counter}</span>
            <span className="opacity-35">/</span>
            <span>
              {activeNumber} of {totalNumber}
            </span>
          </span>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
        <div
          ref={panelRef}
          id={`take-panel-${activeTake.id}`}
          role="tabpanel"
          aria-labelledby={`take-tab-${activeTake.id}`}
          onMouseEnter={(event) => handleAccentTarget(event.currentTarget)}
          onMouseLeave={() => handleAccentTarget(null)}
          className="relative overflow-hidden border border-[var(--line)] bg-[var(--bg)] shadow-[0_20px_60px_rgba(0,0,0,0.05)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-[1px] hover:shadow-[0_24px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_26px_82px_rgba(0,0,0,0.28)]"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              backgroundImage:
                "linear-gradient(to right, transparent, transparent calc(100% - 1px), var(--line) calc(100% - 1px)), linear-gradient(to bottom, transparent, transparent calc(100% - 1px), var(--line) calc(100% - 1px))",
              backgroundSize: "100% 100%, 100% 100%",
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[72px] h-px bg-[var(--line)]"
          />

          <div className="relative flex min-h-[340px] flex-col justify-between p-6 sm:p-8 md:min-h-[380px] md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-4 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mut)]">
              <div className="flex items-center gap-3">
                <span className="text-[var(--fg)]">current take</span>
                <span className="opacity-35">·</span>
                <span>specimen {activeNumber}</span>
                {activeTake.date ? (
                  <>
                    <span className="opacity-35">·</span>
                    <span>{activeTake.date}</span>
                  </>
                ) : null}
              </div>

              <div className="text-[var(--mut)]/80">
                {enableCharacter ? "live selection" : "static selection"}
              </div>
            </div>

            <div className="py-8 md:py-10">
              <AnimatePresence mode="wait" initial={false}>
                <motion.blockquote
                  key={activeTake.id}
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: reducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={`max-w-4xl font-normal tracking-[-0.04em] text-[var(--fg)] [text-wrap:balance] ${
                    activeTake.text.length > 120
                      ? "text-[clamp(28px,4vw,46px)] leading-[1.1]"
                      : "text-[clamp(32px,4.8vw,58px)] leading-[1.04]"
                  }`}
                >
                  &ldquo;{activeTake.text}&rdquo;
                </motion.blockquote>
              </AnimatePresence>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--line)] pt-4">
              <div className="max-w-md font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mut)]">
                Hover, focus, or tap the index to inspect each take without the page fighting back.
              </div>

              {activeTake.url ? (
                <a
                  ref={linkRef}
                  href={activeTake.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={handleLinkEnter}
                  onMouseLeave={handleLinkLeave}
                  onFocus={handleLinkEnter}
                  onBlur={handleLinkLeave}
                  className="group inline-flex items-center gap-2 border border-[var(--line)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--fg)] transition-colors hover:bg-[var(--fg)] hover:text-[var(--bg)] focus-visible:outline-2 focus-visible:outline-[var(--fg)] focus-visible:outline-offset-2"
                >
                  <span>Open on X</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ) : (
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mut)]">
                  {activeNumber} / {totalNumber}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="border-y border-[var(--line)]"
          onMouseLeave={() => handleAccentTarget(null)}
        >
          <div
            role="tablist"
            aria-label="Unsolicited takes index"
            className="divide-y divide-[var(--line)]"
          >
            {items.map((take, index) => {
              const isActive = index === selectedIndex;
              const number = String(index + 1).padStart(2, "0");

              return (
                <button
                  key={take.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  id={`take-tab-${take.id}`}
                  type="button"
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                  aria-controls={`take-panel-${take.id}`}
                  onClick={() => setActiveIndex(index)}
                  onFocus={(event) => {
                    setActiveIndex(index);
                    handleAccentTarget(event.currentTarget);
                  }}
                  onBlur={() => handleAccentTarget(null)}
                  onMouseEnter={(event) => {
                    setActiveIndex(index);
                    handleAccentTarget(event.currentTarget);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                      event.preventDefault();
                      moveSelection(1);
                    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                      event.preventDefault();
                      moveSelection(-1);
                    } else if (event.key === "Home") {
                      event.preventDefault();
                      setActiveIndex(0);
                      tabRefs.current[0]?.focus();
                    } else if (event.key === "End") {
                      event.preventDefault();
                      setActiveIndex(total - 1);
                      tabRefs.current[total - 1]?.focus();
                    }
                  }}
                  className="group relative flex w-full items-start gap-4 px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--fg)] focus-visible:outline-offset-[-2px] sm:px-5 sm:py-5"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="views-active-row"
                      className="absolute inset-0 bg-[var(--fg)]/[0.045]"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  ) : null}

                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-3 bottom-3 w-px origin-center transition-transform duration-300 ${
                      isActive
                        ? "scale-y-100 bg-[var(--fg)]"
                        : "scale-y-0 bg-[var(--mut)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                    }`}
                  />

                  <span
                    className={`relative z-10 mt-0.5 w-9 shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] transition-transform duration-200 ${
                      isActive ? "text-[var(--fg)]" : "text-[var(--mut)]"
                    } group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5`}
                  >
                    № {number}
                  </span>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div
                      className={`text-[17px] leading-[1.35] tracking-[-0.02em] transition-[transform,color] duration-200 sm:text-[18px] ${
                        isActive ? "text-[var(--fg)]" : "text-[var(--fg)]/78"
                      } group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5`}
                    >
                      {take.text}
                    </div>

                    <div className="mt-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--mut)]">
                      <span>{isActive ? "selected" : "inspect"}</span>
                      {take.date ? (
                        <>
                          <span className="opacity-35">·</span>
                          <span>{take.date}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
