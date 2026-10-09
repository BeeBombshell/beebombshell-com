"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";
import { Calendar, FileText, Menu, X } from "lucide-react";
import { NotchLeftShoulder, NotchRightShoulder } from "./notch-shoulders";
import { PixelGlyph } from "./pixel-glyph";
import { SpotifyStrip } from "./spotify-strip";
import { BookingPopover } from "./booking-popover";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { scrollStore } from "@/lib/scroll-store";
import { COPY } from "@/lib/copy";

function subscribeReducedMotion(cb: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "index", href: "/" },
  { label: "work", href: "/work" },
  { label: "writing", href: "/writing" },
  { label: "about", href: "/about" },
];

export function NotchNav({
  bookingUrl = "https://cal.com/beebombshell/coffee",
  statusText = "open for chats",
  enableSpotify = true,
}: {
  bookingUrl?: string;
  statusText?: string;
  enableSpotify?: boolean;
}) {
  const pathname = usePathname();
  const { isOpen: isBookingOpen, toggle: toggleBooking, close: closeBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isPill, setIsPill] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  // Subscribe to scroll store with hysteresis: pill > 12%, notch < 6%
  useEffect(() => {
    let currentPill = false;
    const unsubscribe = scrollStore.subscribe(() => {
      const s = scrollStore.s;
      if (!currentPill && s > 0.12) {
        currentPill = true;
        setIsPill(true);
      } else if (currentPill && s < 0.06) {
        currentPill = false;
        setIsPill(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Determine current active item
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none select-none">
      <motion.div
        animate={{
          y: isPill ? 12 : 0,
        }}
        transition={
          reducedMotion
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 280, damping: 24, mass: 0.8 }
        }
        className="relative flex items-start pointer-events-auto"
      >
        {/* Left concave fillet shoulder (collapses in pill mode) */}
        <div
          className="transition-all duration-400 overflow-hidden shrink-0"
          style={{
            width: isPill ? "0px" : "16px",
            opacity: isPill ? 0 : 1,
            pointerEvents: isPill ? "none" : "auto",
          }}
        >
          <NotchLeftShoulder />
        </div>

        {/* Notch / Floating Pill Body */}
        <motion.nav
          aria-label={COPY.a11y.notchLabel}
          layout
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className={`relative flex flex-col items-center font-mono text-[12px] shadow-lg transition-all duration-500 ${
            isPill
              ? "bg-[var(--fg)]/80 text-[var(--bg)] backdrop-blur-[14px] rounded-full px-4 py-[9px] border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
              : "bg-[var(--fg)] text-[var(--bg)] rounded-b-[22px] px-3 pt-[9px] pb-[11px]"
          }`}
        >
          {/* Main Desktop Bar / Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Pixel Glyph */}
            <Link
              href="/"
              className="flex items-center gap-2 pr-1 opacity-80 hover:opacity-100 transition-opacity focus-visible:rounded"
              aria-label="Home · Bhavya Verma"
            >
              <PixelGlyph title={`Status: ${statusText}`} />
            </Link>

            {/* Desktop Navigation Links */}
            <LayoutGroup id="notch-nav">
              <div className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative px-2.5 py-1 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--bg)] ${
                        active
                          ? "opacity-100 font-medium"
                          : "opacity-55 hover:opacity-85"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="notch-active-pill"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                          className="absolute inset-0 rounded-full bg-[var(--bg)]/15 -z-10"
                        />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </LayoutGroup>

            {/* Divider */}
            <div
              className="hidden sm:block w-px h-3 bg-[var(--bg)]/20 my-auto"
              aria-hidden="true"
            />

            {/* Action Buttons: Calendar, Spotify, llms.txt, Theme */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Calendar Booking Button */}
              <button
                type="button"
                onClick={toggleBooking}
                className={`p-1.5 rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--bg)] cursor-pointer ${
                  isBookingOpen ? "opacity-100 bg-[var(--bg)]/20" : "opacity-55 hover:opacity-85"
                }`}
                aria-label={COPY.nav.calendarTooltip}
                aria-haspopup="dialog"
                aria-expanded={isBookingOpen}
                title={COPY.nav.calendarTooltip}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Spotify Strip (Equalizer bars + Marquee) */}
              {enableSpotify && <SpotifyStrip isPill={isPill} />}

              {/* llms.txt toggle (text label collapses in pill mode with bezier transition) */}
              <button
                type="button"
                onClick={() => openLlms("standard")}
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] opacity-55 hover:opacity-85 transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--bg)] cursor-pointer"
                aria-label={COPY.nav.llmsTooltip}
                title={COPY.nav.llmsTooltip}
              >
                <FileText className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span
                  className="overflow-hidden whitespace-nowrap transition-all duration-500"
                  style={{
                    maxWidth: isPill ? "0px" : "56px",
                    opacity: isPill ? 0 : 1,
                    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {COPY.nav.llmsLabel}
                </span>
              </button>

              {/* Theme Toggle configured for Notch inverted palette */}
              <ThemeToggle className="text-[var(--bg)]" />

              {/* Mobile Menu Hamburger / Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                className="sm:hidden p-1.5 rounded-full opacity-70 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--bg)]"
                aria-label={isMobileExpanded ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileExpanded}
              >
                {isMobileExpanded ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Menu className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Expanded Drawer */}
          {isMobileExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="sm:hidden flex flex-col items-center gap-2 pt-3 mt-2 border-t border-[var(--bg)]/15 w-full"
            >
              <div className="flex flex-wrap justify-center gap-1 w-full">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileExpanded(false)}
                      aria-current={active ? "page" : undefined}
                      className={`px-3 py-1 rounded-full text-center ${
                        active
                          ? "bg-[var(--bg)]/20 opacity-100 font-medium"
                          : "opacity-60 hover:opacity-90"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileExpanded(false);
                    openLlms("standard");
                  }}
                  className="text-[11px] opacity-55 hover:opacity-85 cursor-pointer"
                >
                  llms.txt · context
                </button>
              </div>
            </motion.div>
          )}

          {/* Booking Popover Modal */}
          <BookingPopover
            bookingUrl={bookingUrl}
            isOpen={isBookingOpen}
            onClose={closeBooking}
          />
        </motion.nav>

        {/* Right concave fillet shoulder (collapses in pill mode) */}
        <div
          className="transition-all duration-400 overflow-hidden shrink-0"
          style={{
            width: isPill ? "0px" : "16px",
            opacity: isPill ? 0 : 1,
            pointerEvents: isPill ? "none" : "auto",
          }}
        >
          <NotchRightShoulder />
        </div>
      </motion.div>
    </header>
  );
}
