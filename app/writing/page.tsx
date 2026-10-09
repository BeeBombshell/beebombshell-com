import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Clock, Rss } from "lucide-react";
import { getPosts } from "@/lib/queries";
import { calculateReadingTime } from "@/lib/reading-time";

export const metadata: Metadata = {
  title: "Writing · BeeBombshell",
  description: "Essays, notes, and technical articles on systems and design.",
};

export default async function WritingPage() {
  const posts = await getPosts();

  return (
    <div className="flex-1 w-full max-w-[68ch] mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <div>
        {/* Caption */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-8 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--fg)] font-medium">№ 003</span>
            <span>FIG 0.4 · ESSAYS & ESSENCE</span>
          </div>
          <span>{posts.length} POSTS</span>
        </div>

        {/* Heading */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] leading-tight text-[var(--fg)] mb-3">
            Writing & Reflections
          </h1>
          <p className="text-[var(--mut)] text-base leading-relaxed">
            Thoughts on software aesthetics, spatial mathematics, physics engines, and systems architecture.
          </p>
        </div>

        {/* Posts List */}
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {posts.map((post) => {
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
                    {/* Meta row: Date, reading time, tags */}
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
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded bg-[var(--line)]/60 text-[var(--fg)] text-[10px]"
                          >
                            #{t.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Title with arrow icon on hover */}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-xl sm:text-2xl font-normal text-[var(--fg)] tracking-[-0.02em] group-hover:underline underline-offset-4 leading-snug">
                        {post.title}
                      </h2>
                      <ArrowUpRight className="w-4 h-4 text-[var(--mut)] group-hover:text-[var(--fg)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0 mt-1.5" />
                    </div>

                    {/* Excerpt */}
                    <p className="text-sm text-[var(--mut)] leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-4 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[var(--mut)]">
        <span>PLAIN TEXT DISPATCHES</span>
        <div className="flex items-center gap-4">
          <Link
            href="/feed.xml"
            target="_blank"
            className="inline-flex items-center gap-1.5 hover:text-[var(--fg)] transition-colors"
          >
            <Rss className="w-3 h-3 text-amber-500" />
            <span>RSS FEED</span>
          </Link>
          <Link
            href="/llms.txt"
            target="_blank"
            className="hover:text-[var(--fg)] transition-colors"
          >
            LLMS.TXT ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
