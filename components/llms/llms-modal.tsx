"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, ExternalLink, Terminal } from "lucide-react";
import { useLlmsStore } from "@/lib/llms-store";

export function LlmsModal() {
  const { isOpen, variant, close, setVariant } = useLlmsStore();
  const [content, setContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loadedVariant, setLoadedVariant] = useState<string>("");

  const loading = isOpen && loadedVariant !== variant;

  // Fetch document when opened or variant changed
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const endpoint = variant === "full" ? "/llms-full.txt" : "/llms.txt";

    fetch(endpoint)
      .then((res) => res.text())
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setLoadedVariant(variant);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setContent(`Failed to load ${endpoint}: ${String(err)}`);
          setLoadedVariant(variant);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, variant]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = content.split("\n");

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          data-lenis-prevent
          className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Plain text llms.txt viewer"
        >
          <motion.div
            data-lenis-prevent
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full max-w-4xl h-[88vh] max-h-[88vh] min-h-0 flex flex-col rounded-2xl bg-[#0c0c0e] text-[#eeece6] border border-white/15 shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden font-mono"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Chrome */}
            <div className="flex-none flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="h-4 w-px bg-white/15 mx-1" />
                <div className="flex items-center gap-2 text-[11px] tracking-wider uppercase text-white/70">
                  <Terminal className="w-3.5 h-3.5 text-white/50" />
                  <span>SPEC · MACHINE CONTEXT</span>
                </div>
              </div>

              {/* Variant Tabs: Standard / Full */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setVariant("standard")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    variant === "standard"
                      ? "bg-white/20 text-white font-medium shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  /llms.txt
                </button>
                <button
                  type="button"
                  onClick={() => setVariant("full")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    variant === "full"
                      ? "bg-white/20 text-white font-medium shadow-sm"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  /llms-full.txt
                </button>
              </div>

              {/* Action Buttons: Copy, Open Raw, Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white/10 hover:bg-white/15 text-white/90 transition-colors focus-visible:outline-white"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 opacity-70" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={variant === "full" ? "/llms-full.txt" : "/llms.txt"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  title="Open raw document"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={close}
                  className="p-1.5 rounded-md hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  title="Close modal (Esc)"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Meta Spec Subheader */}
            <div className="flex-none flex items-center justify-between px-5 py-2 text-[10px] text-white/40 border-b border-white/5 bg-black/30">
              <div className="flex items-center gap-4">
                <span>FORMAT: MARKDOWN / PLAIN-TEXT</span>
                <span>CHARSET: UTF-8</span>
                <span>CACHE: 3600S</span>
              </div>
              <div>
                <span>{lines.length} LINES</span>
              </div>
            </div>

            {/* Editor Body */}
            <div
              data-lenis-prevent
              tabIndex={0}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 text-[12px] sm:text-[13px] leading-relaxed selection:bg-white selection:text-black focus:outline-none"
            >
              {loading ? (
                <div className="flex items-center justify-center py-16 text-white/40">
                  <span className="animate-pulse">Loading context stream...</span>
                </div>
              ) : (
                <div className="grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_1fr] gap-4">
                  {/* Line Numbers */}
                  <div className="text-right select-none text-white/20 font-mono text-[11px] leading-[1.625] pr-2 border-r border-white/10">
                    {lines.map((_, i) => (
                      <div key={i}>{String(i + 1).padStart(2, "0")}</div>
                    ))}
                  </div>

                  {/* Document Content */}
                  <pre className="font-mono text-[12px] sm:text-[13px] leading-[1.625] text-white/85 whitespace-pre-wrap break-words overflow-x-auto">
                    {content}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer Status Bar */}
            <div className="flex-none flex items-center justify-between px-4 py-2 border-t border-white/10 text-[10px] text-white/40 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>INDEXED & SYNCHRONIZED</span>
              </div>
              <div className="flex items-center gap-3">
                <span>CURL COMPLIANT</span>
                <span>BEEBOMBSHELL.COM</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
