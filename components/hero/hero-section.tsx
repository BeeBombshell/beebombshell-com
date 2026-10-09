"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowUp, Calendar } from "lucide-react";
import { type Profile, type Project, type Post, type Take } from "@/lib/schemas";
import { CoordinateReadout } from "@/components/type/coordinate-readout";
import { HeroBadge } from "@/components/badge/hero-badge";
import { scrollStore } from "@/lib/scroll-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { calculateReadingTime } from "@/lib/reading-time";
import { ViewsSection } from "@/components/character/views-section";
import { useCharacter, getTimeGreeting } from "@/components/character/use-character";
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
  const [greeting, setGreeting] = useState<string>("Morning.");
  const [footerLine, setFooterLine] = useState<string>(COPY.footer.lines[0]);

  useEffect(() => {
    setGreeting(getTimeGreeting());
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
        id="hero-section"
        ref={heroRef}
        className="relative min-h-[100svh] w-full max-w-6xl mx-auto px-5 sm:px-8 pt-4 pb-8 flex flex-col justify-between"
      >
        {/* Top Header Bar */}
        <header className="relative z-10 flex items-center justify-between border-b border-[var(--line)] pb-3 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-4">
            <span className="text-[var(--fg)] font-medium">№ 001</span>
            <span>FIG 0.1 · CORE SPECIMEN</span>
            <span className="hidden md:inline font-normal lowercase tracking-normal text-[var(--fg)]/80">
              ({currentMoodLabel})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <CoordinateReadout className="hidden sm:inline-block" />
            <span className="text-[11px] tracking-normal capitalize font-medium text-[var(--fg)]">
              {greeting}
            </span>
          </div>
        </header>

        {/* Lanyard Rope & Interactive ID Badge Stage (Spans Full First Screen) */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          <HeroBadge />
        </div>

        {/* Vertical spacer to balance first screen layout */}
        <div className="flex-1 min-h-[500px] pointer-events-none" />

        {/* Bottom Hero Controls & Scroll Hint */}
        <div className="relative z-10 flex flex-col gap-3">
          {/* Fading Scroll Hint per copy.md */}
          <div
            ref={scrollHintRef}
            className="flex justify-center transition-opacity duration-150"
            style={{ opacity: hintOpacity }}
          >
            <div className="font-mono text-xs text-[var(--mut)] tracking-wide bg-[var(--bg)]/80 px-3 py-1 rounded-full border border-[var(--line)]">
              {COPY.index.scrollHint} ↓
            </div>
          </div>

          {/* Hero Specs Footer */}
          <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[var(--line)] pt-3 text-[11px] font-mono text-[var(--mut)] gap-2">
            <div>
              <span>BEEBOMBSHELL.COM</span>
              <span className="mx-2 opacity-30">/</span>
              <span>SYSTEM CHROME v1.0</span>
            </div>
            <div className="flex items-center gap-4">
              <span>SPRING PHYSICS ACTIVE</span>
              <span className="opacity-40">●</span>
              <span>11-NODE VERLET ROPE</span>
            </div>
          </footer>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SELECTED WORK (FIG 0.2 · ISOMETRIC LATTICE)           */}
      {/* ======================================================== */}
      <section
        id="selected-work"
        ref={selectedWorkRef}
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
            <Link
              key={project.slug}
              href={`/work/${project.slug}`}
              className="group block p-6 sm:p-8 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 backdrop-blur-sm hover:border-[var(--fg)]/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-3">
                <span className="uppercase">{project.year}</span>
                {project.stars !== undefined && (
                  <span className="flex items-center gap-1">
                    <span>★</span>
                    <span>{project.stars}</span>
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-normal tracking-[-0.02em] text-[var(--fg)] mb-3 group-hover:text-halo transition-colors">
                {project.title}
              </h3>

              <p className="text-sm text-[var(--mut)] leading-relaxed mb-6">
                {project.blurb}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[var(--line)]/50">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--line)]/40 text-[var(--fg)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Link>
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
          id="recent-writing"
          ref={writingRef}
          className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 border-t border-[var(--line)]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4 mb-12">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
                {COPY.writing.caption}
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
                {COPY.writing.title}
              </h2>
            </div>
            <Link
              href="/writing"
              className="mt-4 sm:mt-0 font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <span>all essays & dispatches</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)]">
            {recentPosts.slice(0, 3).map((post) => {
              const readingTime = calculateReadingTime(post.body);
              const formattedDate = new Date(post.publishedAt).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }
              );

              return (
                <article key={post.slug} className="py-8 group">
                  <Link
                    href={`/writing/${post.slug}`}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)] rounded-lg p-2 -m-2"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--mut)]">
                        <time dateTime={post.publishedAt}>{formattedDate}</time>
                        <span>·</span>
                        <span>{readingTime.minutes} min read</span>
                        <div className="hidden sm:flex items-center gap-1.5 ml-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded text-[10px] bg-[var(--line)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-normal tracking-[-0.02em] text-[var(--fg)] group-hover:text-halo transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-sm sm:text-base text-[var(--mut)] leading-relaxed max-w-3xl">
                        {post.excerpt}
                      </p>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. GLOBAL TECHNICAL FOOTER                               */}
      {/* ======================================================== */}
      <footer
        id="colophon"
        ref={colophonRef}
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
