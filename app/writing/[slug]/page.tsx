import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Clock, Calendar, Tag } from "lucide-react";
import { getPost, getPosts } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import { calculateReadingTime } from "@/lib/reading-time";
import { ArticleContent } from "@/components/writing/article-content";
import { TableOfContents } from "@/components/writing/table-of-contents";
import { JsonLd } from "@/components/seo/json-ld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found · BeeBombshell" };

  return {
    title: `${post.title} · Writing · BeeBombshell`,
    description: post.excerpt,
    alternates: {
      canonical: `/writing/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      tags: post.tags,
      authors: ["Bhavya Verma"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([getPost(slug), getPosts()]);

  if (!post || post.status !== "published") {
    notFound();
  }

  // Parse markdown and extract TOC
  const { html, headings } = await renderMarkdown(post.body);
  const readingTime = calculateReadingTime(post.body);

  const dateStr = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Next / Previous article calculation
  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: "Bhavya Verma",
      url: "https://beebombshell.com",
    },
    url: `https://beebombshell.com/writing/${slug}`,
    keywords: post.tags.join(", "),
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <JsonLd data={blogJsonLd} />
      <div>
        {/* Specimen Header & Back Link */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-8 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 text-[var(--fg)] hover:text-halo transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>BACK TO WRITING</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">FIG 0.4 · DISPATCH</span>
            <span className="text-[var(--fg)]">
              № {String(currentIndex + 1).padStart(3, "0")}
            </span>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-10 max-w-[68ch]">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3 mb-4 font-mono text-xs text-[var(--mut)]">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={post.publishedAt}>{dateStr}</time>
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{readingTime.text}</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.03em] leading-[1.1] text-[var(--fg)] text-halo mb-6">
            {post.title}
          </h1>

          <p className="text-lg sm:text-xl text-[var(--mut)] leading-relaxed text-halo mb-6">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--line)]/50">
            <Tag className="w-3 h-3 text-[var(--mut)]" />
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded text-xs font-mono bg-[var(--line)]/60 text-[var(--fg)]"
              >
                #{tag.toLowerCase()}
              </span>
            ))}
          </div>
        </header>

        {/* Layout: TOC + Main Article Column */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-12 items-start">
          {/* Main Reading Column */}
          <main className="max-w-[68ch] w-full">
            <ArticleContent html={html} />
          </main>

          {/* Sticky Table of Contents on Desktop */}
          {headings.length > 0 && (
            <aside className="hidden lg:block sticky top-24">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>
      </div>

      {/* Prev / Next Article Footer */}
      <footer className="mt-20 pt-8 border-t border-[var(--line)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          {prevPost ? (
            <Link
              href={`/writing/${prevPost.slug}`}
              className="text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>PREV: {prevPost.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextPost ? (
            <Link
              href={`/writing/${nextPost.slug}`}
              className="text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2 group"
            >
              <span>NEXT: {nextPost.title}</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </div>
  );
}
