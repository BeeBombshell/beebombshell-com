"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { type Profile, type Project } from "@/lib/schemas";
import { CoordinateReadout } from "@/components/type/coordinate-readout";
import { HeroBadge } from "@/components/badge/hero-badge";
import { scrollStore } from "@/lib/scroll-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";

interface HeroSectionProps {
  profile: Profile;
  selectedProjects: Project[];
}

export function HeroSection({ profile, selectedProjects }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const selectedWorkRef = useRef<HTMLDivElement>(null);

  // Register text blocks for text-aware particle dimming
  useRegisterTextBlock("hero-copy", copyRef);
  useRegisterTextBlock("selected-work", selectedWorkRef);

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

  // Selected work intro fade: (S - 0.5) · 2.2 clamped between 0 and 1
  const workOpacity = Math.max(0, Math.min(1, (s - 0.5) * 2.2));
  const workTranslateY = Math.max(0, (1 - s) * 30);

  return (
    <div className="relative w-full">
      {/* ======================================================== */}
      {/* HERO VIEWPORT (min-height: 100svh)                       */}
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
            Hi, I'm Bhavya.
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
      {/* SELECTED WORK INTRO (Revealed on Scroll over Lattice)   */}
      {/* ======================================================== */}
      <section
        ref={selectedWorkRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 py-20 transition-all duration-100"
        style={{
          opacity: workOpacity,
          transform: `translateY(${workTranslateY}px)`,
          pointerEvents: workOpacity < 0.1 ? "none" : "auto",
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
              className="group block p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/40 backdrop-blur-sm hover:border-[var(--fg)]/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-3">
                <span className="uppercase">{project.year}</span>
                <span className="uppercase tracking-wider">{project.featured ? "FEATURED" : "PROJECT"}</span>
              </div>
              <h3 className="text-xl font-medium tracking-[-0.02em] text-[var(--fg)] mb-2 group-hover:text-halo transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-[var(--mut)] leading-relaxed mb-4">
                {project.blurb}
              </p>
              <div className="flex flex-wrap gap-2">
                {project.stack.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--line)] text-[var(--mut)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
