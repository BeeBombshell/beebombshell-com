"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import type { Post } from "@/lib/schemas";

interface WritingRowProps {
  post: Post;
  index: number;
}

/**
 * WritingRow
 *
 * Implements an authentic Editorial Margin Rule & Paper Proof hover interaction:
 * - Left vertical ink margin indicator that expands full-height on hover
 * - Smooth frosted paper slip highlight backing
 * - Animated editorial proof tag: [PROOF // READ]
 * - Smooth title glide and spring-translated corner arrow
 * - High contrast, comfortable typography matching design.md
 */
export function WritingRow({ post, index }: WritingRowProps) {
  const dateStr = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const readingTime = calculateReadingTime(post.body);
  const formattedIndex = String(index + 1).padStart(3, "0");

  return (
    <article className="group relative transition-all duration-300 rounded-xl my-1">
      {/* Left Margin Vertical Ink Rule */}
      <div className="absolute left-0 inset-y-2 w-[2.5px] rounded-full bg-[var(--fg)] transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

      <Link
        href={`/writing/${post.slug}`}
        className="block px-4 sm:px-6 py-6 sm:py-7 rounded-xl transition-all duration-300 bg-transparent group-hover:bg-[var(--line)]/15 dark:group-hover:bg-white/[0.04] group-focus-visible:outline-2 group-focus-visible:outline-[var(--fg)]"
      >
        <div className="flex flex-col gap-2.5">
          {/* Metadata Row: Index, Date, Reading Time, Proof Tag */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--mut)]">
            <div className="flex items-center gap-2.5">
              <span className="font-medium text-[var(--fg)]/80 group-hover:text-[var(--fg)] transition-colors">
                № {formattedIndex}
              </span>
              <span>·</span>
              <time dateTime={post.publishedAt}>{dateStr}</time>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 opacity-70" />
                <span>{readingTime.text}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Proofreader Editorial Tag revealed on hover */}
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--fg)] text-[var(--bg)] font-medium">
                DISPATCH // READ
              </span>

              {post.tags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-[var(--line)]/50 text-[var(--fg)] text-[10px] font-mono"
                >
                  #{t.toLowerCase()}
                </span>
              ))}
            </div>
          </div>

          {/* Title Row with spring-animated arrow */}
          <div className="flex items-start justify-between gap-4 mt-1">
            <h2 className="text-xl sm:text-2xl font-normal text-[var(--fg)] tracking-[-0.025em] leading-snug group-hover:translate-x-1 transition-transform duration-200">
              <span className="group-hover:underline underline-offset-4 decoration-[var(--line)] group-hover:decoration-[var(--fg)] transition-all">
                {post.title}
              </span>
            </h2>
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-transparent group-hover:border-[var(--line)] group-hover:bg-[var(--bg)] transition-all duration-200 mt-1">
              <ArrowUpRight className="w-4 h-4 text-[var(--mut)] group-hover:text-[var(--fg)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </div>
          </div>

          {/* Excerpt with high contrast readability */}
          {post.excerpt && (
            <p className="text-[14px] sm:text-[15px] text-[var(--fg)]/80 leading-relaxed line-clamp-2 mt-1 font-normal group-hover:text-[var(--fg)]/90 transition-colors">
              {post.excerpt}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
