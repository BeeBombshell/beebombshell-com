"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar as CalendarIcon, ExternalLink, Clock, ShieldCheck } from "lucide-react";

interface BookingPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  bookingUrl?: string;
  statusText?: string;
}

export function BookingPopover({
  isOpen,
  onClose,
  bookingUrl = "https://cal.com/bhavya",
  statusText = "Open for chats & collaboration",
}: BookingPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-title"
          className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-[340px] max-w-[92vw] z-50 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur-xl shadow-2xl p-5 text-[var(--fg)] font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 id="booking-title" className="font-mono text-xs uppercase tracking-wider font-medium text-[var(--fg)]">
                Booking & Schedule
              </h2>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-full text-[var(--mut)] hover:text-[var(--fg)] transition-colors focus-visible:outline-2"
              aria-label="Close booking popover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-3.5 mb-5 text-xs text-[var(--mut)]">
            <p className="text-sm font-normal text-[var(--fg)] leading-snug">
              {statusText}
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <Clock className="w-3.5 h-3.5 text-[var(--mut)]" />
              <span>30-minute casual or technical chats</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--mut)]" />
              <span>Syncs automatically with Cal.com</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90 transition-opacity focus-visible:outline-2"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Select Time Slot</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center text-[10px] text-[var(--mut)] hover:underline pt-1"
            >
              Direct Link: {bookingUrl}
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
