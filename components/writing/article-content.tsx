"use client";

import React, { useEffect, useRef } from "react";

interface ArticleContentProps {
  html: string;
}

export function ArticleContent({ html }: ArticleContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Wire up copy button interactions on code blocks
  useEffect(() => {
    if (!containerRef.current) return;

    const copyButtons = containerRef.current.querySelectorAll<HTMLButtonElement>(".copy-code-btn");

    const handlers: { btn: HTMLButtonElement; handler: () => void }[] = [];

    copyButtons.forEach((btn) => {
      const handler = async () => {
        const rawCode = btn.getAttribute("data-code");
        if (!rawCode) return;
        try {
          const code = decodeURIComponent(rawCode);
          await navigator.clipboard.writeText(code);
          const originalText = btn.textContent;
          btn.textContent = "Copied!";
          btn.classList.add("text-emerald-500");
          setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove("text-emerald-500");
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code:", err);
        }
      };

      btn.addEventListener("click", handler);
      handlers.push({ btn, handler });
    });

    return () => {
      handlers.forEach(({ btn, handler }) => {
        btn.removeEventListener("click", handler);
      });
    };
  }, [html]);

  // Register text bounding box with particle engine for dynamic text dimming
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = window.__particleEngine;
    if (engine) {
      engine.registerRect("writing-article-body", () => {
        if (!containerRef.current) return null;
        return containerRef.current.getBoundingClientRect();
      });
    }

    return () => {
      window.__particleEngine?.unregisterRect("writing-article-body");
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="prose-article font-sans"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
