"use client";

import React, { useRef } from "react";
import { ExpandableProjectCard } from "@/components/cards/expandable-project-card";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import type { Project } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { SectionHeader } from "@/components/type/section-header";

interface WorkContentProps {
  projects: Project[];
}

export function WorkContent({ projects }: WorkContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Register text blocks for text-aware particle dimming
  useRegisterTextBlock("work-container", containerRef);
  useRegisterTextBlock("work-header", headerRef);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans"
    >
      <div>
        <SectionHeader
          title={COPY.work.title}
          intro={COPY.work.intro}
          meta={<span>{projects.length} projects</span>}
        />

        {/* Expandable Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ExpandableProjectCard
              key={project.slug}
              project={project}
            />
          ))}
        </div>
      </div>

    </div>
  );
}
