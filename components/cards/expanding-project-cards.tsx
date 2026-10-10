"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, Code2, ExternalLink, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/schemas";
import { HoloCard } from "./holo-card";
import { useRegisterTextBlock } from "@/components/particles/use-particles";

interface ExpandingProjectCardsProps {
  projects: Project[];
}

export function ExpandingProjectCards({ projects }: ExpandingProjectCardsProps) {
  // At rest, null means all cards are equal width
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useRegisterTextBlock("expanding-work-cards", containerRef);

  // Arrow key navigation between cards
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setActiveIndex(activeIndex === index ? null : index);
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % projects.length;
      cardRefs.current[nextIndex]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + projects.length) % projects.length;
      cardRefs.current[prevIndex]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col md:flex-row items-stretch gap-4 md:min-h-[460px]"
      role="tablist"
      aria-label="Interactive project showcase"
    >
      {projects.map((project, idx) => {
        const isExpanded = activeIndex === idx;
        const formattedIdx = String(idx + 1).padStart(2, "0");

        return (
          <div
            key={project.slug}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            tabIndex={0}
            role="button"
            aria-expanded={isExpanded}
            aria-label={`${project.title}. Press Enter or Space to expand.`}
            onClick={() => setActiveIndex(isExpanded ? null : idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            style={{
              flex: isExpanded ? "4.2 1 0%" : "1 1 0%",
              transition: "flex 650ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            className={`group relative outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)] focus-visible:ring-offset-2 rounded-2xl cursor-pointer select-none transition-all duration-300 ${
              isExpanded ? "md:min-w-[340px]" : "md:min-w-[130px]"
            }`}
          >
            <HoloCard
              hudText={`SPEC // № ${formattedIdx}`}
              className="h-full w-full"
            >
              <div
                className={`relative h-full w-full p-5 sm:p-6 rounded-2xl border transition-all duration-500 backdrop-blur-md flex flex-col justify-between overflow-hidden ${
                  isExpanded
                    ? "bg-[var(--bg)]/96 dark:bg-[#0c0c0e]/96 border-[var(--fg)]/40 shadow-xl"
                    : "bg-[var(--bg)]/90 dark:bg-[#0c0c0e]/90 border-[var(--line)] hover:border-[var(--mut)] shadow-sm"
                }`}
              >
                {/* ── CARD TOP: Index & Metadata ────────────────────── */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] pb-3 border-b border-[var(--line)]/50 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--fg)] font-medium">№ {formattedIdx}</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline uppercase">{project.year}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {project.stars !== undefined && (
                      <span className="flex items-center gap-1 font-mono text-[var(--mut)]">
                        <span>★</span>
                        <span>{project.stars}</span>
                      </span>
                    )}
                    {project.featured && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-mono tracking-wider bg-[var(--fg)] text-[var(--bg)] font-medium">
                        FEATURED
                      </span>
                    )}
                  </div>
                </div>

                {/* ── CARD MIDDLE: Resting vs Expanded View ────────── */}
                <div className="my-auto py-4 flex flex-col justify-center">
                  {/* Title */}
                  <h3
                    className={`font-normal tracking-[-0.03em] text-[var(--fg)] transition-all duration-300 leading-tight ${
                      isExpanded
                        ? "text-2xl sm:text-3xl md:text-4xl mb-3 text-halo"
                        : "text-lg sm:text-xl md:text-xl md:truncate group-hover:text-halo"
                    }`}
                  >
                    {project.title}
                  </h3>

                  {/* Rest state stack summary (shown when compressed on desktop) */}
                  {!isExpanded && (
                    <div className="hidden md:flex flex-wrap gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      {project.stack.slice(0, 2).map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[var(--line)]/60 text-[var(--fg)]/90"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expanded Content: Fades and slides up (400-500ms, delayed 250ms) */}
                  <div
                    className={`transition-all duration-500 ease-out flex flex-col ${
                      isExpanded
                        ? "opacity-100 translate-y-0 delay-200 pointer-events-auto max-h-[400px]"
                        : "opacity-0 translate-y-3 pointer-events-none max-h-0 overflow-hidden md:hidden"
                    }`}
                  >
                    {/* Blurb */}
                    <p className="text-sm sm:text-base text-[var(--fg)]/85 leading-relaxed font-sans mb-4">
                      {project.blurb}
                    </p>

                    {/* Architecture description if present */}
                    {project.body && (
                      <div className="mb-4 pt-3 border-t border-[var(--line)]/40 hidden sm:block">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--mut)] mb-1.5">
                          SPECIFICATION:
                        </div>
                        <p className="text-xs text-[var(--fg)]/75 leading-relaxed font-sans line-clamp-3">
                          {project.body}
                        </p>
                      </div>
                    )}

                    {/* Stack chips */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {project.stack.map((tech) => (
                        <span
                          key={tech}
                          className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--line)]/60 text-[var(--fg)]/90"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* External links */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
                      {project.links.repo && (
                        <a
                          href={project.links.repo}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[var(--mut)] hover:text-[var(--fg)] transition-colors hover:underline"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Code</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {project.links.live && (
                        <a
                          href={project.links.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[var(--mut)] hover:text-[var(--fg)] transition-colors hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Live</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── CARD BOTTOM: Actions ─────────────────────────── */}
                <div className="pt-3 border-t border-[var(--line)]/50 flex items-center justify-between text-xs font-mono shrink-0">
                  <span className="text-[10px] text-[var(--mut)] uppercase tracking-wide">
                    {isExpanded ? "CLICK TO COLLAPSE" : "CLICK TO EXPAND"}
                  </span>

                  <Link
                    href={`/work/${project.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-[var(--fg)] font-medium hover:underline group/cta"
                  >
                    <span>case study</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </HoloCard>
          </div>
        );
      })}
    </div>
  );
}
