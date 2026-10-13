import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { calculateReadingTime } from "@/lib/reading-time";
import type { Post } from "@/lib/schemas";
import { HoloCard } from "@/components/cards/holo-card";

interface WritingRowProps {
  post: Post;
}

export function WritingRow({ post }: WritingRowProps) {
  const dateStr = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const readingTime = calculateReadingTime(post.body);

  return (
    <HoloCard
      variant="editorial"
      enableTilt={false}
      roundedClassName="rounded-none"
      className="w-full"
    >
      <article className="group relative w-full transition-all duration-300">
        <Link
          href={`/writing/${post.slug}`}
          className="block w-full px-4 sm:px-6 py-7 transition-all duration-300 bg-transparent group-focus-visible:outline-2 group-focus-visible:outline-[var(--fg)]"
        >
          <div className="flex flex-col gap-2.5">
            {/* Metadata Row: Date, Reading Time, Tags */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[var(--mut)]">
              <div className="flex items-center gap-2.5">
                <time dateTime={post.publishedAt}>{dateStr}</time>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>{readingTime.text}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                {post.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-[var(--line)]/40 text-[var(--fg)]/85 text-[10px] font-mono group-hover:text-[var(--fg)] transition-colors"
                  >
                    #{t.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Title Row with smooth arrow glide */}
            <div className="flex items-start justify-between gap-4 mt-1">
              <h2 className="text-xl sm:text-2xl font-normal text-[var(--fg)] tracking-[-0.025em] leading-snug group-hover:text-halo transition-colors duration-200">
                <span className="group-hover:underline underline-offset-4 decoration-[var(--line)] transition-all">
                  {post.title}
                </span>
              </h2>
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-transparent group-hover:border-[var(--line)] transition-all duration-200 mt-1">
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
    </HoloCard>
  );
}
