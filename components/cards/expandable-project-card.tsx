"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight, ChevronDown, Star, ExternalLink, Code2, ArrowRight } from "lucide-react";
import type { Project } from "@/lib/schemas";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { HoloCard } from "./holo-card";

interface ExpandableProjectCardProps {
  project: Project;
  index: number;
}

export function ExpandableProjectCard({ project, index }: ExpandableProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Register card rect for particle dimming
  useRegisterTextBlock(`project-${project.slug}`, cardRef);

  const formattedIdx = String(index + 1).padStart(2, "0");

  return (
    <HoloCard className="h-full">
      <motion.article
        ref={cardRef}
        layout
        className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl border transition-colors duration-300 h-full ${
          isExpanded
            ? "border-[var(--fg)]/40 bg-[var(--bg)]/95 dark:bg-[#0c0c0e]/95 shadow-2xl"
            : "border-[var(--line)] bg-[var(--bg)]/85 dark:bg-[#0c0c0e]/85 hover:border-[var(--fg)]/30 hover:bg-[var(--bg)]/90 dark:hover:bg-[#0c0c0e]/90 shadow-sm"
        } backdrop-blur-md`}
      >
      <div>
        {/* Specimen Header Metadata */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--mut)] mb-4 pb-2 border-b border-[var(--line)]/50">
          <span className="text-[var(--fg)] font-medium">№ {formattedIdx}</span>
          <div className="flex items-center gap-3">
            {project.stars !== undefined && (
              <span className="flex items-center gap-1 text-[var(--mut)]">
                <Star className="w-3 h-3 fill-current text-[var(--mut)]" />
                <span>{project.stars}</span>
              </span>
            )}
            <span>{project.year}</span>
          </div>
        </div>

        {/* Project Title */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 className="text-xl sm:text-2xl font-normal tracking-[-0.03em] text-[var(--fg)] group-hover:text-halo transition-colors">
            {project.title}
          </h2>
          {project.featured && (
            <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase bg-[var(--fg)] text-[var(--bg)] shrink-0 mt-1 font-medium">
              FEATURED
            </span>
          )}
        </div>

        {/* Summary Blurb */}
        <p className="text-sm text-[var(--fg)]/85 leading-relaxed mb-5">
          {project.blurb}
        </p>

        {/* Stack Badges */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--line)]/50 text-[var(--fg)]/90"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Expandable Accordion Body */}
      <div>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-[var(--line)] pt-4 mt-2"
            >
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
                ARCHITECTURAL SPECIFICATION:
              </div>
              <p className="text-xs sm:text-sm text-[var(--fg)]/80 leading-relaxed mb-5 font-sans">
                {project.body}
              </p>

              {/* Action Links Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 mb-4">
                {project.links.repo && (
                  <a
                    href={project.links.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--mut)] hover:text-[var(--fg)] transition-colors hover:underline"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Repository</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                )}
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[var(--mut)] hover:text-[var(--fg)] transition-colors hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Live Demo</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--line)]/50 mt-2">
          {/* Toggle Expand Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--fg)] rounded"
          >
            <span>{isExpanded ? "Collapse spec" : "Expand spec"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Full Case Study Link */}
          <Link
            href={`/work/${project.slug}`}
            className="font-mono text-xs text-[var(--fg)] hover:underline inline-flex items-center gap-1 group/link"
          >
            <span>Case Study</span>
            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.article>
  </HoloCard>
);
}
