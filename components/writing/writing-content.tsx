"use client";

import React, { useRef } from "react";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { WritingRow } from "@/components/writing/writing-row";
import { Rss } from "lucide-react";
import type { Post } from "@/lib/schemas";
import { COPY } from "@/lib/copy";

import { SectionHeader } from "@/components/type/section-header";

interface WritingContentProps {
  posts: Post[];
}

export function WritingContent({ posts }: WritingContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Register container for particle engine dimming so particles don't overlap reading text
  useRegisterTextBlock("writing-container", containerRef);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full max-w-[72ch] mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans"
    >
      <div>
        <SectionHeader
          figure="FIG 0.4 · ESSAYS & ESSENCE"
          number="№ 003"
          title={COPY.writing.title}
          intro={COPY.writing.intro}
          meta={<span>{posts.length} POSTS</span>}
        />

        {/* Posts List with Editorial Hover Interaction */}
        <div className="divide-y divide-[var(--line)] border-b border-[var(--line)]">
          {posts.map((post, idx) => (
            <WritingRow key={post.slug} post={post} index={idx} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--mut)]">
        <span>STATUS: PERIODIC DISPATCHES</span>
        <div className="flex items-center gap-4">
          <a
            href="/feed.xml"
            className="hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1.5"
            title="Subscribe via RSS"
          >
            <Rss className="w-3 h-3" />
            <span>RSS FEED</span>
          </a>
          <span>·</span>
          <span>WRITING DRIFT ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
