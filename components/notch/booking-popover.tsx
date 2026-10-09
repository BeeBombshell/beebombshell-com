"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Coffee, ArrowUpRight } from "lucide-react";

interface BookingPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  bookingUrl?: string;
  statusText?: string;
}

export function BookingPopover({
  isOpen,
  onClose,
  bookingUrl = "https://cal.com/beebombshell/coffee",
  statusText = "Open for chats",
}: BookingPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize target URL to ensure coffee link is used
  const targetUrl =
    bookingUrl && !bookingUrl.includes("20min")
      ? bookingUrl
      : "https://cal.com/beebombshell/coffee";

  // Close on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);


  // Automatically redirect after brief moment
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      onClose();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isOpen, targetUrl, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="booking-modal-title"
        >
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="relative w-[420px] max-w-[94vw] rounded-2xl sm:rounded-3xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] shadow-2xl p-6 flex flex-col font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h2
                  id="booking-modal-title"
                  className="font-mono text-xs uppercase tracking-wider font-semibold text-[var(--fg)]"
                >
                  Coffee Chat · Cal.com
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/60 transition-colors focus-visible:outline-2"
                aria-label="Close booking modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--line)]/50 text-[var(--fg)]">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-[var(--fg)] leading-snug">
                    Grab a virtual coffee
                  </h3>
                  <p className="text-xs text-[var(--mut)]">
                    {statusText} · 20 min conversation
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--mut)] leading-relaxed pt-1">
                Redirecting to Cal.com to pick a convenient slot...
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 font-mono text-xs">
              <a
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity focus-visible:outline-2"
              >
                <span>Continue to Cal.com</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-center text-[11px] text-[var(--mut)] hover:text-[var(--fg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
