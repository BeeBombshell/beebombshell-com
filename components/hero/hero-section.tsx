"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Clock, Calendar, ArrowUp } from "lucide-react";
import { type Profile, type Project, type Post } from "@/lib/schemas";
import { CoordinateReadout } from "@/components/type/coordinate-readout";
import { HeroBadge } from "@/components/badge/hero-badge";
import { scrollStore } from "@/lib/scroll-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { calculateReadingTime } from "@/lib/reading-time";

interface HeroSectionProps {
  profile: Profile;
  selectedProjects: Project[];
  recentPosts?: Post[];
}

export function HeroSection({
  profile,
  selectedProjects,
  recentPosts = [],
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const selectedWorkRef = useRef<HTMLDivElement>(null);
  const writingRef = useRef<HTMLDivElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const colophonRef = useRef<HTMLDivElement>(null);

  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();

  // Local time in New Delhi (IST)
  const [localTime, setLocalTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLocalTime(
        new Intl.DateTimeFormat("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(now) + " IST"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Register text blocks for text-aware particle dimming
  useRegisterTextBlock("hero-copy", copyRef);
  useRegisterTextBlock("selected-work", selectedWorkRef);
  useRegisterTextBlock("recent-writing", writingRef);
  useRegisterTextBlock("philosophy", philosophyRef);
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

  // Subscribe to reactive smoothed scroll progress S (0 to 1)
  const s = useSyncExternalStore(
    scrollStore.subscribe,
    () => scrollStore.s,
    () => 0
  );

  // Hero copy fade: opacity = max(0, 1 - 2.4·S) and translateY(-70·S px)
  const copyOpacity = Math.max(0, 1 - 2.4 * s);
  const copyTranslateY = -70 * s;

  // Selected work intro fade: starts earlier at S > 0.15 for snappy reveal
  const workOpacity = Math.max(0, Math.min(1, (s - 0.15) * 2));
  const workTranslateY = Math.max(0, (1 - s) * 20);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      {/* ======================================================== */}
      {/* 1. HERO VIEWPORT (min-height: 100svh)                     */}
      {/* ======================================================== */}
      <section
        id="hero-section"
        ref={heroRef}
        className="relative min-h-[100svh] w-full max-w-6xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between"
      >
        {/* Lanyard Rope & Interactive ID Badge (Anchored from Top) */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <HeroBadge />
        </div>

        {/* Top Header Bar */}
        <header className="relative z-10 flex items-center justify-between border-b border-[var(--line)] pb-3 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-4">
            <span className="text-[var(--fg)] font-medium">№ 001</span>
            <span className="hidden sm:inline">FIG 0.1 · CORE SPECIMEN</span>
            <span className="hidden md:inline">BURST PROJECTION: READY</span>
          </div>
          <div className="flex items-center gap-4">
            <CoordinateReadout className="hidden sm:inline-block" />
            <span className="text-[10px] tracking-normal lowercase opacity-80">
              {profile.statusText}
            </span>
          </div>
        </header>

        {/* Hero copy anchored bottom-left per design.md */}
        <div
          ref={copyRef}
          className="relative z-10 my-auto py-16 sm:py-24 flex flex-col justify-end max-w-xl transition-transform duration-75"
          style={{
            opacity: copyOpacity,
            transform: `translateY(${copyTranslateY}px)`,
            pointerEvents: copyOpacity < 0.05 ? "none" : "auto",
          }}
        >
          <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-4">
            {profile.role} · {profile.location}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] leading-[1.02] text-[var(--fg)] text-halo mb-6">
            Hi, I&apos;m Bhavya.
          </h1>

          <p className="text-xl sm:text-2xl md:text-[28px] font-normal leading-[1.28] tracking-[-0.02em] text-[var(--mut)] text-halo mb-8">
            Shipping features and memes in equal measure.
          </p>

          <p className="text-sm sm:text-base text-[var(--mut)] leading-relaxed text-halo mb-8">
            {profile.bio}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--line)]">
            {profile.socials.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1.5 focus-visible:rounded"
              >
                <span>{social.label}</span>
                <span className="text-[10px] opacity-60">↗</span>
              </a>
            ))}
          </div>
        </div>

        {/* Hero Footer / Specs Readout */}
        <footer className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[var(--line)] pt-3 text-[11px] font-mono text-[var(--mut)] gap-2">
          <div>
            <span>BEEBOMBSHELL.COM</span>
            <span className="mx-2 opacity-30">/</span>
            <span>SYSTEM CHROME v1.0</span>
          </div>
          <div className="flex items-center gap-4">
            <span>SPRING PHYSICS ACTIVE</span>
            <span className="opacity-40">●</span>
            <span>LAT: 28.6139° N</span>
          </div>
        </footer>
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
              FIG 0.2 · ISOMETRIC LATTICE
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
              Selected Work
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
              className="group block p-6 sm:p-8 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 backdrop-blur-sm hover:border-[var(--fg)]/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-3">
                <span className="uppercase">{project.year}</span>
                <span className="uppercase tracking-wider">
                  {project.featured ? "FEATURED SPECIMEN" : "PROJECT"}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-medium tracking-[-0.02em] text-[var(--fg)] mb-2 group-hover:text-halo transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-[var(--mut)] leading-relaxed mb-6">
                {project.blurb}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded text-[10px] font-mono bg-[var(--line)] text-[var(--mut)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. RECENT WRITING (FIG 0.3 · ESSAYS & DISPATCHES)        */}
      {/* ======================================================== */}
      {recentPosts.length > 0 && (
        <section
          id="recent-writing"
          ref={writingRef}
          className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4 mb-10">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
                FIG 0.3 · ESSAYS & DISPATCHES
              </div>
              <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
                Recent Writing
              </h2>
            </div>
            <Link
              href="/writing"
              className="mt-4 sm:mt-0 font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <span>all essays ({recentPosts.length})</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {recentPosts.slice(0, 3).map((post) => {
              const dateStr = new Date(post.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const readingTime = calculateReadingTime(post.body);

              return (
                <article key={post.slug} className="py-6 sm:py-8 group">
                  <Link
                    href={`/writing/${post.slug}`}
                    className="block group-focus-visible:outline-2 group-focus-visible:outline-[var(--fg)] rounded-lg"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--mut)]">
                        <div className="flex items-center gap-3">
                          <time dateTime={post.publishedAt}>{dateStr}</time>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-70" />
                            <span>{readingTime.text}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {post.tags.slice(0, 2).map((tag) => (
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
      {/* 4. PHILOSOPHY & CRAFT (FIG 0.4 · CRAFT & ARCHITECTURE)   */}
      {/* ======================================================== */}
      <section
        id="philosophy"
        ref={philosophyRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-[var(--line)] pb-4 mb-12">
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-2">
              FIG 0.4 · CRAFT & ARCHITECTURE
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo">
              Engineering Principles
            </h2>
          </div>
          <Link
            href="/about"
            className="mt-4 sm:mt-0 font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
          >
            <span>read bio & background</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-4">
          <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/30 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--mut)] mb-3">
              01 / PHYSICALITY
            </div>
            <h3 className="text-lg font-medium text-[var(--fg)] mb-2">
              Spring Dynamics
            </h3>
            <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
              Verlet integration, damping, and continuous momentum instead of linear easing. Interfaces should feel weighted, tactile, and alive.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/30 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--mut)] mb-3">
              02 / PERFORMANCE
            </div>
            <h3 className="text-lg font-medium text-[var(--fg)] mb-2">
              Frame Budgets
            </h3>
            <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
              Capped DPR, text-aware dimming, and memory hygiene. Creative code must run at a solid 60fps on low-end hardware.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/30 backdrop-blur-sm">
            <div className="font-mono text-[10px] uppercase tracking-widest text-[var(--mut)] mb-3">
              03 / REFINEMENT
            </div>
            <h3 className="text-lg font-medium text-[var(--fg)] mb-2">
              Minimal Chrome
            </h3>
            <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed">
              Paper, ink, and technical annotations. Color is reserved for dynamic particles and high-energy centerpiece foil.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. GLOBAL TECHNICAL FOOTER (FIG 0.5 · SYSTEM COLOPHON)   */}
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
                <span>schedule a conversation</span>
              </button>
            </div>
          </div>

          {/* Location & Time Readout */}
          <div className="flex flex-col md:items-end gap-1.5 text-[11px]">
            <div>ORIGIN: {profile.location.toUpperCase()}</div>
            <div>COORDINATES: 28.6139° N, 77.2090° E</div>
            {localTime && <div>LOCAL TIME: {localTime}</div>}
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
              <span>llms.txt</span>
              <span className="text-[9px] opacity-60">↗</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span>© 2026 BEEBOMBSHELL.COM</span>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-1 rounded hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1 cursor-pointer"
              aria-label="Back to top"
            >
              <span>TOP</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
