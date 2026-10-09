import { getPosts } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing · BeeBombshell",
  description: "Essays, notes, and technical articles on systems and design.",
};

export default async function WritingPage() {
  const posts = await getPosts();

  return (
    <div className="flex-1 w-full max-w-[65ch] mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
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

            return (
              <article key={post.slug} className="py-6 group">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)]">
                    <time dateTime={post.publishedAt}>{dateStr}</time>
                    <div className="flex items-center gap-2">
                      {post.tags.map((t) => (
                        <span key={t}>#{t.toLowerCase()}</span>
                      ))}
                    </div>
                  </div>

                  <h2 className="text-xl font-normal text-[var(--fg)] tracking-[-0.02em] group-hover:underline">
                    {post.title}
                  </h2>

                  <p className="text-sm text-[var(--mut)] leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-4 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--mut)]">
        <span>PLAIN TEXT DISPATCHES</span>
        <span>RSS & LLMS FEED AVAILABLE</span>
      </div>
    </div>
  );
}
