"use client";

import React, { useEffect, useState } from "react";
import type { HeadingItem } from "@/lib/markdown";

interface TableOfContentsProps {
  headings: HeadingItem[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0% -60% 0%",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md text-xs font-mono mb-8 lg:mb-0"
    >
      <div className="text-[10px] uppercase tracking-wider text-[var(--mut)] mb-3 font-semibold">
        TABLE OF CONTENTS
      </div>
      <ul className="space-y-2">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li
              key={h.id}
              className={`transition-colors ${
                h.level === 3 ? "pl-3 text-[11px]" : ""
              }`}
            >
              <a
                href={`#${h.id}`}
                className={`block truncate transition-colors hover:text-[var(--fg)] ${
                  isActive
                    ? "text-[var(--fg)] font-medium"
                    : "text-[var(--mut)]"
                }`}
              >
                <span className="opacity-50 mr-1.5">{h.level === 3 ? "·" : "§"}</span>
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
