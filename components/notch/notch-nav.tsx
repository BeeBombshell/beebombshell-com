"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";
import { Calendar, FileText, Menu, X } from "lucide-react";
import { NotchLeftShoulder, NotchRightShoulder } from "./notch-shoulders";
import { PixelGlyph } from "./pixel-glyph";
import { BookingPopover } from "./booking-popover";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useBookingStore } from "@/lib/booking-store";

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
  bookingUrl = "https://cal.com/bhavya",
  statusText = "Open for chats",
}: {
  bookingUrl?: string;
  statusText?: string;
}) {
  const pathname = usePathname();
  const { isOpen: isBookingOpen, open: openBooking, close: closeBooking, toggle: toggleBooking } = useBookingStore();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  // Determine current active item
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none select-none">
      <div className="relative flex items-start pointer-events-auto">
        {/* Left concave fillet shoulder */}
        <NotchLeftShoulder />

        {/* Notch Body */}
        <motion.nav
          aria-label="Main Navigation"
          layout
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="relative flex flex-col items-center bg-[var(--fg)] text-[var(--bg)] rounded-b-[22px] px-3 pt-[9px] pb-[11px] font-mono text-[12px] shadow-lg transition-colors duration-500"
        >
          {/* Main Desktop Bar / Collapsed Header */}
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

            {/* Action Buttons: Calendar, llms.txt, Theme */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Calendar Booking Button */}
              <button
                type="button"
                onClick={toggleBooking}
                className={`p-1.5 rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--bg)] ${
                  isBookingOpen ? "opacity-100 bg-[var(--bg)]/20" : "opacity-55 hover:opacity-85"
                }`}
                aria-label="Open booking calendar"
                aria-haspopup="dialog"
                aria-expanded={isBookingOpen}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* llms.txt link */}
              <Link
                href="/llms.txt"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] opacity-55 hover:opacity-85 transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--bg)]"
                aria-label="Plain text documentation (llms.txt)"
              >
                <FileText className="w-3 h-3" aria-hidden="true" />
                <span>llms.txt</span>
              </Link>

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

              <Link
                href="/llms.txt"
                target="_blank"
                onClick={() => setIsMobileExpanded(false)}
                className="text-[11px] opacity-55 hover:opacity-85 pt-1"
              >
                llms.txt ↗
              </Link>
            </motion.div>
          )}

          {/* Booking Popover Modal */}
          <BookingPopover
            isOpen={isBookingOpen}
            onClose={closeBooking}
            bookingUrl={bookingUrl}
            statusText={statusText}
          />
        </motion.nav>

        {/* Right concave fillet shoulder */}
        <NotchRightShoulder />
      </div>
    </header>
  );
}
