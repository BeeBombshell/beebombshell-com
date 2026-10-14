import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Code2, ExternalLink, Star } from "lucide-react";
import type { Metadata } from "next";
import { getProject, getProjects } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import { ArticleContent } from "@/components/writing/article-content";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project Not Found · BeeBombshell" };

  return {
    title: `${project.title} · Case Study · BeeBombshell`,
    description: project.blurb,
    alternates: {
      canonical: `/work/${slug}`,
    },
    openGraph: {
      title: `${project.title} · Case Study`,
      description: project.blurb,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.blurb,
    },
  };
}

export default async function ProjectCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const [project, allProjects] = await Promise.all([
    getProject(slug),
    getProjects(),
  ]);

  if (!project) {
    notFound();
  }

  const { html } = await renderMarkdown(project.body);

  // Find next and previous projects for navigation
  const currentIndex = allProjects.findIndex((p) => p.slug === slug);
  const prevProject = currentIndex > 0 ? allProjects[currentIndex - 1] : null;
  const nextProject =
    currentIndex >= 0 && currentIndex < allProjects.length - 1
      ? allProjects[currentIndex + 1]
      : null;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <div>
        <div className="mb-8 text-[11px] font-mono uppercase tracking-wider">
          <Link
            href="/work"
            className="inline-flex items-center gap-1.5 text-[var(--fg)] hover:text-halo transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>BACK TO WORK</span>
          </Link>
        </div>

        {/* Hero Section */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs text-[var(--mut)] uppercase tracking-widest">
              {project.year}
            </span>
            {project.featured && (
              <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-[var(--fg)] text-[var(--bg)]">
                FEATURED
              </span>
            )}
            {project.stars !== undefined && (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-[var(--mut)]">
                <Star className="w-3.5 h-3.5 fill-current text-[var(--mut)]" />
                <span>{project.stars} stars</span>
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] leading-[1.04] text-[var(--fg)] text-halo mb-6">
            {project.title}
          </h1>

          <p className="text-xl sm:text-2xl text-[var(--mut)] font-normal leading-relaxed text-halo max-w-2xl">
            {project.blurb}
          </p>
        </header>

        {/* Project details and links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/70 backdrop-blur-md mb-12">
          {/* Technology stack */}
          <div className="sm:col-span-2">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
              Technology stack
            </div>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-[var(--line)] text-[var(--fg)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
              Links
            </div>
            <div className="flex flex-col gap-2 text-xs font-mono">
              {project.links.live && (
                <a
                  href={project.links.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--fg)] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Live Production</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              )}
              {project.links.repo && (
                <a
                  href={project.links.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[var(--mut)] hover:text-[var(--fg)] transition-colors hover:underline"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Deep Dive Case Study Content */}
        <article className="space-y-8 text-[var(--fg)]/90 leading-relaxed max-w-2xl text-base sm:text-lg">
          <section>
            <ArticleContent html={html} />
          </section>

          <section className="border-t border-[var(--line)] pt-8">
            <h2 className="text-xl sm:text-2xl font-normal tracking-[-0.02em] text-[var(--fg)] mb-4 font-sans">
              Engineering Principles
            </h2>
            <ul className="space-y-3 text-sm sm:text-base text-[var(--mut)] font-sans">
              <li className="flex items-start gap-3">
                <span>
                  <strong>Zero compromise frame budget:</strong> Engineered to hold 60fps on mid-tier mobile hardware and low-power devices.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong>Physical tactile feel:</strong> Spring mechanics, velocity preservation, and responsive collision boundaries.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span>
                  <strong>Resilient fallbacks:</strong> Clean degradation on reduced motion settings, touch interfaces, and server caching.
                </span>
              </li>
            </ul>
          </section>
        </article>
      </div>

      {/* Prev / Next Case Study Footer Navigation */}
      <footer className="mt-20 pt-8 border-t border-[var(--line)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          {prevProject ? (
            <Link
              href={`/work/${prevProject.slug}`}
              className="text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>PREV: {prevProject.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {nextProject ? (
            <Link
              href={`/work/${nextProject.slug}`}
              className="text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-2"
            >
              <span>NEXT: {nextProject.title}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </div>
  );
}
