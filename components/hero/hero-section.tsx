"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUp, Calendar } from "lucide-react";
import { type Profile, type Project, type Post, type Take } from "@/lib/schemas";
import { HeroBadge } from "@/components/badge/hero-badge";
import { scrollStore } from "@/lib/scroll-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { calculateReadingTime } from "@/lib/reading-time";
import { ViewsSection } from "@/components/character/views-section";
import { useCharacter } from "@/components/character/use-character";
import { HoloCard } from "@/components/cards/holo-card";
import { WritingRow } from "@/components/writing/writing-row";
import { COPY } from "@/lib/copy";

interface HeroSectionProps {
  profile: Profile;
  selectedProjects: Project[];
  recentPosts?: Post[];
  takes?: Take[];
}

export function HeroSection({
  profile,
  selectedProjects,
  recentPosts = [],
  takes = [],
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const selectedWorkRef = useRef<HTMLDivElement>(null);
  const writingRef = useRef<HTMLDivElement>(null);
  const colophonRef = useRef<HTMLDivElement>(null);

  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();

  // Character engine hook
  const { mood, idleCaption } = useCharacter(true);
  const [footerLine, setFooterLine] = useState<string>(COPY.footer.lines[0]);

  useEffect(() => {
    // Pick random rotating footer line on mount
    const randomLine =
      COPY.footer.lines[Math.floor(Math.random() * COPY.footer.lines.length)];
    setFooterLine(randomLine);
  }, []);

  // Register text blocks for text-aware particle dimming
  useRegisterTextBlock("selected-work", selectedWorkRef);
  useRegisterTextBlock("recent-writing", writingRef);
  useRegisterTextBlock("colophon", colophonRef);

  // Wire hero element to scrollStore
  useEffect(() => {
    if (heroRef.current) {
      scrollStore.setHeroElement(heroRef.current);
    }
    return () => {
      scrollStore.setHeroElement(null);
    };
  }, []);

  // Subscribe to smoothed scroll progress S (0 to 1)
  const s = useSyncExternalStore(
    scrollStore.subscribe,
    () => scrollStore.s,
    () => 0
  );

  // Scroll hint fade: fades out rapidly as user scrolls
  const hintOpacity = Math.max(0, 1 - 2.8 * s);

  // Selected work intro fade: starts at s > 0.12
  const workOpacity = Math.max(0, Math.min(1, (s - 0.12) * 2.2));
  const workTranslateY = Math.max(0, (1 - s) * 24);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentMoodLabel = idleCaption || `mood: ${mood}`;

  return (
    <div className="relative w-full">
      {/* ======================================================== */}
      {/* 1. FIRST SCREEN: SIGNATURE FULL-PAGE BADGE CARD           */}
      {/* ======================================================== */}
      <section
        id="hero"
        ref={heroRef}
        data-section="hero"
        className="relative min-h-[100svh] w-full flex flex-col justify-end pb-8"
      >
        {/* Lanyard Rope & Interactive ID Badge Stage (Spans Full First Screen) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <HeroBadge />
        </div>

        {/* Fading Scroll Hint per copy.md */}
        <div
          ref={scrollHintRef}
          className="relative z-10 flex justify-center transition-opacity duration-150"
          style={{ opacity: hintOpacity }}
        >
          <div className="font-mono text-xs text-[var(--mut)] tracking-wide bg-[var(--bg)]/80 px-3 py-1 rounded-full border border-[var(--line)]">
            {COPY.index.scrollHint} ↓
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SELECTED WORK            */}
      {/* ======================================================== */}
      <section
        id="work"
        ref={selectedWorkRef}
        data-section="work"
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 transition-all duration-100"
        style={{
          opacity: workOpacity,
          transform: `translateY(${workTranslateY}px)`,
          pointerEvents: workOpacity < 0.05 ? "none" : "auto",
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4 mb-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
              {COPY.work.caption}
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
              {COPY.index.workIntroTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--fg)]/75 font-normal">
              {COPY.work.intro}
            </p>
          </div>
          <Link
            href="/work"
            className="mt-4 sm:mt-0 font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
          >
            <span>view all case studies</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Selected Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {selectedProjects.slice(0, 4).map((project) => (
            <HoloCard key={project.slug} className="h-full">
              <Link
                href={`/work/${project.slug}`}
                className="group block p-6 sm:p-8 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/85 dark:bg-[#0c0c0e]/85 backdrop-blur-md hover:border-[var(--fg)]/30 transition-all duration-300 h-full flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-3">
                    <span className="uppercase">{project.year}</span>
                    {project.stars !== undefined && (
                      <span className="flex items-center gap-1 font-mono text-[var(--mut)]">
                        <span>★</span>
                        <span>{project.stars}</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-normal tracking-[-0.02em] text-[var(--fg)] mb-3 group-hover:text-halo transition-colors">
                    {project.title}
                  </h3>

                  <p className="text-sm text-[var(--fg)]/85 leading-relaxed mb-6">
                    {project.blurb}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--line)]/50">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--line)]/50 text-[var(--fg)]/90"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </Link>
            </HoloCard>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. VIEWS NOBODY ASKED FOR (FIG 0.5 · UNSOLICITED TAKES)  */}
      {/* ======================================================== */}
      <ViewsSection takes={takes} />

      {/* ======================================================== */}
      {/* 4. RECENT WRITING (FIG 0.4 · DASHES, DRIFTING)           */}
      {/* ======================================================== */}
      {recentPosts.length > 0 && (
        <section
          id="writing"
          ref={writingRef}
          data-section="writing"
          className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 border-t border-[var(--line)]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
                {COPY.writing.caption}
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
                {COPY.writing.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--fg)]/75 font-normal">
                {COPY.writing.intro}
              </p>
            </div>
            <Link
              href="/writing"
              className="mt-4 sm:mt-0 font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <span>all essays & dispatches</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
            {recentPosts.slice(0, 3).map((post, idx) => (
              <WritingRow key={post.slug} post={post} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. GLOBAL TECHNICAL FOOTER                               */}
      {/* ======================================================== */}
      <footer
        id="footer"
        ref={colophonRef}
        data-section="footer"
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-16 pb-24 border-t border-[var(--line)] mt-12 text-xs font-mono text-[var(--mut)]"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-12">
          {/* Status & Booking CTA */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[var(--fg)] font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>STATUS: {profile.statusText.toUpperCase()}</span>
            </div>
            <p className="text-[11px] max-w-md text-[var(--mut)]">
              Interested in collaborating, discussing system craft, or trading memes?
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={openBooking}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{COPY.booking.cta}</span>
              </button>
            </div>
          </div>

          {/* Rotating Footer Line per page load */}
          <div className="flex flex-col md:items-end gap-1.5 text-[11px]">
            <div className="text-[var(--fg)] font-medium tracking-wide">
              {footerLine}
            </div>
            <div className="opacity-70">
              DX · PRODUCT ENGINEERING · VERLET INTEGRATION
            </div>
          </div>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[var(--line)] text-[11px]">
          <div className="flex flex-wrap items-center gap-6">
            {profile.socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1"
              >
                <span>{s.label}</span>
                <span className="text-[9px] opacity-60">↗</span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => openLlms("standard")}
              className="hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{COPY.llms.toggle}</span>
              <span className="text-[9px] opacity-60">↗</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 BEEBOMBSHELL.COM</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-1 rounded hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 cursor-pointer"
              aria-label={COPY.footer.backToTop}
            >
              <span>{COPY.footer.backToTop}</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
