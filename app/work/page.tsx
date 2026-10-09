import { getProjects } from "@/lib/queries";
import { ExpandableProjectCard } from "@/components/cards/expandable-project-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work · BeeBombshell",
  description: "Selected projects and software craftsmanship by Bhavya Verma.",
  alternates: {
    canonical: "/work",
  },
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
          <span>TOTAL: {projects.length} SPECIMENS</span>
        </div>

        {/* Header statement */}
        <div className="max-w-2xl mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.03em] leading-tight text-[var(--fg)] text-halo mb-4">
            Engineering tools, expressive interfaces, and interactive systems.
          </h1>
          <p className="text-[var(--mut)] text-base sm:text-lg leading-relaxed text-halo">
            A selection of open source software, micro-frameworks, and creative experiments built for speed and mechanical precision.
          </p>
        </div>

        {/* Expandable Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, idx) => (
            <ExpandableProjectCard
              key={project.slug}
              project={project}
              index={idx}
            />
          ))}
        </div>
      </div>

      {/* Footer Annotation */}
      <footer className="mt-16 pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-[var(--mut)] gap-2">
        <span>STATUS: ARCHIVED & ACTIVE REPOSITORIES</span>
        <span>ISOMETRIC LATTICE FIELD ACTIVE</span>
      </footer>
    </div>
  );
}
