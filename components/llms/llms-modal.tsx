"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, ExternalLink, FileText, X } from "lucide-react";
import { useLlmsStore } from "@/lib/llms-store";

export function LlmsModal() {
  const { isOpen, variant, close, setVariant } = useLlmsStore();
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadedVariant, setLoadedVariant] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const endpoint = variant === "full" ? "/llms-full.txt" : "/llms.txt";
  const loading = isOpen && loadedVariant !== variant;
  const lines = content.split("\n");

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return response.text();
      })
      .then((text) => {
        setContent(text);
        setLoadedVariant(variant);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setContent(`Unable to load ${endpoint}.\n\n${String(error)}`);
        setLoadedVariant(variant);
      });

    return () => controller.abort();
  }, [endpoint, isOpen, variant]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [close, isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/65 sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.section
            data-lenis-prevent
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ type: "spring", damping: 30, stiffness: 360 }}
            className="flex h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border border-black/20 bg-[#f1eee6] text-[#171716] shadow-[0_32px_90px_rgba(0,0,0,0.45)] sm:h-[min(82vh,760px)] sm:rounded-[24px]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex-none bg-[#151516] text-white">
              <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.06]">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id={titleId}
                      className="truncate text-sm font-medium tracking-[-0.01em]"
                    >
                      {endpoint.slice(1)}
                    </h2>
                    <p className="hidden font-mono text-[10px] tracking-[0.08em] text-white/45 uppercase sm:block">
                      Plain-text context for humans and machines
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={loading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs text-white/75 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                    aria-label="Copy document"
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    <span className="hidden sm:inline">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>
                  <a
                    href={endpoint}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid size-9 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label={`Open ${endpoint.slice(1)} in a new tab`}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={close}
                    className="grid size-9 place-items-center rounded-lg text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    aria-label="Close document"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <nav
                className="flex gap-1 border-t border-white/[0.07] px-4 pt-2 sm:px-6"
                aria-label="LLM documents"
              >
                {(["standard", "full"] as const).map((item) => {
                  const selected = variant === item;
                  const label = item === "full" ? "llms-full.txt" : "llms.txt";
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setCopied(false);
                        setVariant(item);
                      }}
                      aria-pressed={selected}
                      className={`relative rounded-t-lg px-3 py-2 font-mono text-[11px] transition-colors ${
                        selected
                          ? "bg-[#f1eee6] text-[#171716]"
                          : "text-white/45 hover:text-white/80"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            </header>

            <div
              data-lenis-prevent
              tabIndex={0}
              className="min-h-0 flex-1 overflow-auto overscroll-contain bg-[#f1eee6] focus-visible:outline-none"
            >
              {loading ? (
                <div className="grid min-h-full place-items-center p-8">
                  <div className="flex items-center gap-2 font-mono text-xs text-black/45">
                    <span className="size-1.5 animate-pulse rounded-full bg-black/50" />
                    Loading {endpoint.slice(1)}
                  </div>
                </div>
              ) : (
                <ol className="min-w-full py-5 font-mono text-[12px] leading-6 sm:py-7 sm:text-[13px] sm:leading-7">
                  {lines.map((line, index) => (
                    <li
                      key={`${index}-${line.slice(0, 12)}`}
                      className="grid grid-cols-[3rem_minmax(0,1fr)] px-3 transition-colors hover:bg-black/[0.035] sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:px-6"
                    >
                      <span className="border-r border-black/10 pr-3 text-right text-black/25 select-none sm:pr-5">
                        {index + 1}
                      </span>
                      <code className="block pl-3 break-words whitespace-pre-wrap text-black/78 sm:pl-5">
                        {line || "\u00a0"}
                      </code>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <footer className="flex h-10 flex-none items-center justify-between border-t border-black/10 bg-[#e7e3da] px-4 font-mono text-[9px] tracking-[0.07em] text-black/45 uppercase sm:px-6 sm:text-[10px]">
              <span className="inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                Public · UTF-8
              </span>
              <span>
                {lines.length} lines · {content.length.toLocaleString()}{" "}
                characters
              </span>
            </footer>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
}
