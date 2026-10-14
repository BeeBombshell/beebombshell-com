"use client";

import React, { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  type Profile,
  type Project,
  type Post,
  type Take,
} from "@/lib/schemas";
import { HeroBadge } from "@/components/badge/hero-badge";
import { scrollStore } from "@/lib/scroll-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { ViewsSection } from "@/components/character/views-section";
import { ExpandingProjectCards } from "@/components/cards/expanding-project-cards";
import { WritingRow } from "@/components/writing/writing-row";
import { SectionHeader } from "@/components/type/section-header";
import { SiteFooter } from "@/components/footer/site-footer";
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

  // Register text blocks for text-aware particle dimming
  useRegisterTextBlock("selected-work", selectedWorkRef);
  useRegisterTextBlock("recent-writing", writingRef);

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

  return (
    <div className="relative w-full">
      {/* ======================================================== */}
      {/* 1. FIRST SCREEN: SIGNATURE FULL-PAGE BADGE CARD           */}
      {/* ======================================================== */}
      <section
        id="hero"
        ref={heroRef}
        data-section="hero"
        className="relative flex min-h-[100svh] w-full flex-col justify-end pb-8"
      >
        {/* Lanyard Rope & Interactive ID Badge Stage (Spans Full First Screen) */}
        <div className="pointer-events-none absolute inset-0 z-20">
          <HeroBadge />
        </div>

        {/* Fading Scroll Hint per copy.md */}
        <div
          ref={scrollHintRef}
          className="relative z-10 mb-3 flex justify-center transition-opacity duration-150"
          style={{ opacity: hintOpacity }}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--bg)]/85 px-3 py-1 font-mono text-[11px] tracking-wide text-[var(--mut)] shadow-sm backdrop-blur-md">
            <span>{COPY.index.scrollHint}</span>
            <span className="inline-block animate-bounce text-[10px]">↓</span>
          </div>
        </div>
      </section>

      {/* Selected work */}
      <section
        id="work"
        ref={selectedWorkRef}
        data-section="work"
        className="relative z-10 mx-auto w-full max-w-6xl px-5 py-[clamp(96px,14vh,160px)] transition-all duration-100 sm:px-8"
        style={{
          opacity: workOpacity,
          transform: `translateY(${workTranslateY}px)`,
          pointerEvents: workOpacity < 0.05 ? "none" : "auto",
        }}
      >
        <SectionHeader
          title={COPY.index.workIntroTitle}
          intro={COPY.work.intro}
          meta={
            <Link
              href="/work"
              className="group inline-flex items-center gap-2 font-mono text-xs text-[var(--mut)] transition-colors hover:text-[var(--fg)]"
            >
              <span>view all case studies</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          }
        />

        {/* Expanding Project Cards Row */}
        <ExpandingProjectCards projects={selectedProjects.slice(0, 4)} />
      </section>

      {/* Recent writing */}
      {recentPosts.length > 0 && (
        <section
          id="writing"
          ref={writingRef}
          data-section="writing"
          className="relative z-10 mx-auto w-full max-w-6xl border-t border-[var(--line)] px-5 py-[clamp(96px,14vh,160px)] sm:px-8"
        >
          <SectionHeader
            title={COPY.writing.title}
            intro={COPY.writing.intro}
            meta={
              <Link
                href="/writing"
                className="group inline-flex items-center gap-2 font-mono text-xs text-[var(--mut)] transition-colors hover:text-[var(--fg)]"
              >
                <span>all essays & dispatches</span>
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            }
          />

          <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
            {(
              recentPosts.filter((p) => p.tags.includes("Work")).length > 0
                ? recentPosts.filter((p) => p.tags.includes("Work"))
                : recentPosts.slice(0, 4)
            ).map((post) => (
              <WritingRow key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Views nobody asked for */}
      <ViewsSection takes={takes} />

      <SiteFooter profile={profile} />
    </div>
  );
}
