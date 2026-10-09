import { getProjects } from "@/lib/queries";
import { ArrowUpRight, Star } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work · BeeBombshell",
  description: "Selected projects and software craftsmanship.",
};

export default async function WorkPage() {
  const projects = await getProjects();

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <div>
        {/* Technical Caption Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-8 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--fg)] font-medium">№ 002</span>
            <span>FIG 0.2 · SELECTED WORKS</span>
          </div>
          <span>TOTAL: {projects.length} UNITS</span>
        </div>

        {/* Header statement */}
        <div className="max-w-2xl mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.03em] leading-tight text-[var(--fg)] mb-4">
            Engineering tools, expressive interfaces, and interactive systems.
          </h1>
          <p className="text-[var(--mut)] text-base sm:text-lg leading-relaxed">
            A selection of open source software, micro-frameworks, and creative experiments built for speed and delight.
          </p>
        </div>

        {/* Projects Grid / List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project, idx) => (
            <article
              key={project.slug}
              className="group relative flex flex-col justify-between p-6 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/60 hover:border-[var(--mut)] transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-4">
                  <span>0{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    {project.stars && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {project.stars}
                      </span>
                    )}
                    <span>{project.year}</span>
                  </div>
                </div>

                <h2 className="text-xl font-normal tracking-[-0.02em] text-[var(--fg)] mb-2 group-hover:underline">
                  {project.title}
                </h2>

                <p className="text-xs text-[var(--mut)] leading-relaxed mb-6">
                  {project.blurb}
                </p>
              </div>

              <div>
                {/* Tech Stack Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {project.stack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--fg)]/5 text-[var(--mut)] border border-[var(--line)]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex items-center gap-4 text-xs font-mono pt-3 border-t border-[var(--line)]">
                  {project.links.repo && (
                    <a
                      href={project.links.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--mut)] hover:text-[var(--fg)] transition-colors"
                    >
                      <span>Source</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                  {project.links.live && (
                    <a
                      href={project.links.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--fg)] hover:opacity-80 transition-opacity font-medium"
                    >
                      <span>Live Demo</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Footer Annotation */}
      <div className="mt-16 pt-4 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--mut)]">
        <span>STATUS: ARCHIVED & ACTIVE REPOSITORIES</span>
        <span>ISOMETRIC LATTICE FIELD PENDING PHASE 2</span>
      </div>
    </div>
  );
}
