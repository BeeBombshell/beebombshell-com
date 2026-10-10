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
import { ExpandingProjectCards } from "@/components/cards/expanding-project-cards";
import { WritingRow } from "@/components/writing/writing-row";
import { SectionHeader } from "@/components/type/section-header";
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
    if (typeof window !== "undefined" && (window as unknown as { __lenis?: { scrollTo: (target: number, opts?: object) => void } }).__lenis) {
      (window as unknown as { __lenis: { scrollTo: (target: number, opts?: object) => void } }).__lenis.scrollTo(0, {
        duration: 1.2,
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
        {/* Mood caption top-left per design.md and prompt */}
        <div className="absolute top-6 sm:top-8 left-5 sm:left-8 z-30 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--mut)] pointer-events-none">
          <div className="text-[var(--fg)] font-medium">FIG 0.1 · BADGE</div>
          <div className="text-[var(--mut)] lowercase mt-0.5 tracking-normal">{currentMoodLabel}</div>
        </div>

        {/* Lanyard Rope & Interactive ID Badge Stage (Spans Full First Screen) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <HeroBadge />
        </div>

        {/* Fading Scroll Hint per copy.md */}
        <div
          ref={scrollHintRef}
          className="relative z-10 flex justify-center transition-opacity duration-150 mb-3"
          style={{ opacity: hintOpacity }}
        >
          <div className="font-mono text-[11px] text-[var(--mut)] tracking-wide bg-[var(--bg)]/85 backdrop-blur-md px-3 py-1 rounded-full border border-[var(--line)] inline-flex items-center gap-1.5 shadow-sm">
            <span>{COPY.index.scrollHint}</span>
            <span className="inline-block animate-bounce text-[10px]">↓</span>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SELECTED WORK (FIG 0.2 · LATTICE, EXPANDING CARDS)    */}
      {/* ======================================================== */}
      <section
        id="work"
        ref={selectedWorkRef}
        data-section="work"
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-[clamp(96px,14vh,160px)] transition-all duration-100"
        style={{
          opacity: workOpacity,
          transform: `translateY(${workTranslateY}px)`,
          pointerEvents: workOpacity < 0.05 ? "none" : "auto",
        }}
      >
        <SectionHeader
          figure={COPY.work.caption}
          number="№ 002"
          title={COPY.index.workIntroTitle}
          intro={COPY.work.intro}
          meta={
            <Link
              href="/work"
              className="font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <span>view all case studies</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          }
        />

        {/* Expanding Project Cards Row */}
        <ExpandingProjectCards projects={selectedProjects.slice(0, 4)} />
      </section>

      {/* Typographic Rhythm Moment */}
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 overflow-hidden select-none py-4 border-y border-[var(--line)]/30 text-center">
        <p className="font-mono text-[clamp(22px,4.5vw,56px)] tracking-[-0.04em] uppercase text-[var(--fg)]/10 font-bold whitespace-nowrap">
          HONEST CODE · TACTILE PHYSICS · ZERO AMBER
        </p>
      </div>

      {/* ======================================================== */}
      {/* 3. VIEWS NOBODY ASKED FOR (FIG 0.3 · UNSOLICITED TAKES)  */}
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
          className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-[clamp(96px,14vh,160px)] border-t border-[var(--line)]"
        >
          <SectionHeader
            figure={COPY.writing.caption}
            number="№ 004"
            title={COPY.writing.title}
            intro={COPY.writing.intro}
            meta={
              <Link
                href="/writing"
                className="font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
              >
                <span>all essays & dispatches</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            }
          />

          <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
            {recentPosts.slice(0, 3).map((post, idx) => (
              <WritingRow key={post.slug} post={post} index={idx} />
            ))}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. GLOBAL TECHNICAL FOOTER (REAL ENDING)                 */}
      {/* ======================================================== */}
      <footer
        id="footer"
        ref={colophonRef}
        data-section="footer"
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 pt-20 pb-24 border-t border-[var(--line)] mt-20 text-xs font-mono text-[var(--mut)]"
      >
        {/* Large closing ending line per item 14 */}
        <div className="mb-14">
          <div className="flex items-center gap-2 text-[var(--fg)] font-medium text-xs mb-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>STATUS: {profile.statusText.toUpperCase()}</span>
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-[64px] font-normal tracking-[-0.035em] text-[var(--fg)] text-halo leading-none mb-3">
            {COPY.booking.title}
          </h2>

          <p className="text-base sm:text-lg text-[var(--mut)] font-normal mb-8 max-w-xl">
            {COPY.booking.sub}
          </p>

          <button
            type="button"
            onClick={openBooking}
            className="inline-flex items-center gap-2.5 h-11 px-6 rounded-full text-xs font-mono font-medium bg-[var(--fg)] text-[var(--bg)] shadow-md hover:scale-[1.03] active:scale-[0.98] transition-transform duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--fg)] focus-visible:ring-offset-2"
          >
            <Calendar className="w-4 h-4" />
            <span>{COPY.booking.cta}</span>
          </button>
        </div>

        {/* Rotating line and skills */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-t border-[var(--line)]/50 pt-8">
          <div className="text-[var(--fg)] font-medium text-xs tracking-wide">
            {footerLine}
          </div>
          <div className="text-[11px] opacity-75 font-mono">
            DX · PRODUCT ENGINEERING · OPEN SOURCE
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
                className="hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[var(--fg)] rounded px-1"
              >
                <span>{s.label}</span>
                <span className="text-[9px] opacity-60">↗</span>
              </a>
            ))}
            <button
              type="button"
              onClick={() => openLlms("standard")}
              className="hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--fg)] rounded px-1"
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
              className="p-1.5 rounded hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--fg)]"
              aria-label={COPY.footer.backToTop}
            >
              <span>{COPY.footer.backToTop} ↑</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
