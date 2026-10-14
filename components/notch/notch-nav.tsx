"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, LayoutGroup } from "motion/react";
import { Calendar, FileText, Menu, X } from "lucide-react";
import { NotchLeftShoulder, NotchRightShoulder } from "./notch-shoulders";
import { PixelGlyph } from "./pixel-glyph";
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

export const SECTION_TO_NAV = {
  hero: "index",
  work: "work",
  views: "about",
  writing: "writing",
  footer: "none",
} as const;

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
}: {
  bookingUrl?: string;
  statusText?: string;
}) {
  const pathname = usePathname();
  const { isOpen: isBookingOpen, toggle: toggleBooking, close: closeBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [isPill, setIsPill] = useState(false);
  const [activeSectionNav, setActiveSectionNav] = useState<string>("index");

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

  // Section observer on home page to keep active nav item synchronized
  useEffect(() => {
    if (pathname !== "/") return;

    const sectionDefs = [
      { id: "hero", nav: SECTION_TO_NAV.hero, fallback: "hero-section" },
      { id: "work", nav: SECTION_TO_NAV.work, fallback: "selected-work" },
      { id: "writing", nav: SECTION_TO_NAV.writing, fallback: "recent-writing" },
      { id: "about", nav: SECTION_TO_NAV.views, fallback: "views-nobody-asked-for" },
      { id: "footer", nav: SECTION_TO_NAV.footer, fallback: "colophon" },
    ];

    const getElements = () =>
      sectionDefs
        .map((s) => ({
          ...s,
          el: document.getElementById(s.id) || document.getElementById(s.fallback),
        }))
        .filter((s): s is typeof s & { el: HTMLElement } => s.el !== null);

    const updateActiveSection = () => {
      const items = getElements();
      if (!items.length) return;

      // Check footer bottom proximity
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollBottom < 100) {
        setActiveSectionNav(SECTION_TO_NAV.footer);
        return;
      }

      // Check which section is crossing mid-viewport
      const triggerY = window.innerHeight * 0.38;
      let matchedNav: string = SECTION_TO_NAV.hero;

      for (const item of items) {
        const rect = item.el.getBoundingClientRect();
        if (rect.top <= triggerY && rect.bottom >= triggerY * 0.3) {
          matchedNav = item.nav;
        }
      }

      setActiveSectionNav(matchedNav);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [pathname]);

  // Handle URL hash on initial load
  useEffect(() => {
    if (pathname !== "/" || typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const targetId =
      hash === "index" || hash === "hero" ? "hero" :
      hash === "work" ? "work" :
      hash === "about" || hash === "views" ? "about" :
      hash === "writing" ? "writing" : "";
    if (targetId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId) ||
          document.getElementById(
            targetId === "hero" ? "hero-section" :
            targetId === "work" ? "selected-work" :
            targetId === "about" ? "views-nobody-asked-for" :
            targetId === "writing" ? "recent-writing" : ""
          );
        if (el) {
          if (window.__lenis) {
            window.__lenis.scrollTo(el, { offset: targetId === "hero" ? 0 : -20, duration: 0.85 });
          } else {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Determine current active state
  const isActive = (item: NavItem) => {
    if (pathname === "/") {
      if (activeSectionNav === "none") return false;
      return activeSectionNav === item.label;
    }
    if (item.href === "/") return pathname === "/";
    return pathname.startsWith(item.href);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (pathname === "/") {
      e.preventDefault();
      const targetMap: Record<string, string> = {
        "/": "hero",
        "/work": "work",
        "/about": "about",
        "/writing": "writing",
      };
      const sectionId = targetMap[item.href];
      if (sectionId) {
        const el = document.getElementById(sectionId) ||
          document.getElementById(
            sectionId === "hero" ? "hero-section" :
            sectionId === "work" ? "selected-work" :
            sectionId === "about" ? "views-nobody-asked-for" :
            sectionId === "writing" ? "recent-writing" : ""
          );
        if (el) {
          const hash = item.label;
          if (window.__lenis) {
            window.__lenis.scrollTo(el, { offset: sectionId === "hero" ? 0 : -20, duration: 0.85 });
          } else {
            el.scrollIntoView({ behavior: "smooth" });
          }
          if (window.history.pushState) {
            window.history.pushState(null, "", `#${hash}`);
          } else {
            window.location.hash = hash;
          }
        }
      }
    }
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
        <motion.div
          initial={false}
          animate={{
            width: isPill ? 0 : 16,
            opacity: isPill ? 0 : 1,
          }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 280, damping: 26 }
          }
          className="overflow-hidden shrink-0"
          style={{ pointerEvents: isPill ? "none" : "auto" }}
        >
          <NotchLeftShoulder />
        </motion.div>

        {/* Notch / Floating Pill Body */}
        <motion.nav
          aria-label={COPY.a11y.notchLabel}
          layout
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 280, damping: 26 }
          }
          className={`relative flex flex-col items-center font-mono text-[12px] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-250 ease-out ${
            isPill
              ? "bg-[#f6f5f1]/90 dark:bg-[#0d0d0c]/90 text-[#121212] dark:text-[#eeece6] backdrop-blur-[14px] rounded-full px-4 py-[9px] border border-black/10 dark:border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
              : "bg-[var(--fg)] text-[var(--bg)] rounded-b-[22px] px-4 pt-[9px] pb-[11px] sm:px-4.5"
          }`}
        >
          {/* Main Desktop Bar / Header */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Pixel Glyph */}
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, NAV_ITEMS[0])}
              className={`flex items-center pl-1 pr-1.5 sm:pr-2 transition-opacity focus-visible:rounded ${
                isPill ? "hover:opacity-100" : "opacity-85 hover:opacity-100"
              }`}
              aria-label="Home · Bhavya Verma"
            >
              <PixelGlyph title={`Status: ${statusText}`} />
            </Link>

            {/* Desktop Navigation Links */}
            <LayoutGroup id="notch-nav">
              <div className="hidden sm:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      aria-current={active ? "page" : undefined}
                      className={`relative px-2.5 py-1 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-current ${
                        isPill
                          ? active
                            ? "text-[#121212] dark:text-[#eeece6] font-medium"
                            : "text-[rgba(18,18,18,0.64)] dark:text-[rgba(238,236,230,0.64)] hover:text-[#121212] dark:hover:text-[#eeece6]"
                          : active
                          ? "text-[var(--bg)] font-medium"
                          : "text-[var(--bg)]/65 hover:text-[var(--bg)]"
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
                          className={`absolute inset-0 rounded-full -z-10 ${
                            isPill
                              ? "bg-black/[0.08] dark:bg-white/[0.12]"
                              : "bg-[var(--bg)]/18"
                          }`}
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
              className={`hidden sm:block w-px h-3 my-auto ${
                isPill ? "bg-black/10 dark:bg-white/15" : "bg-[var(--bg)]/20"
              }`}
              aria-hidden="true"
            />

            {/* Action Buttons: Calendar, Spotify, llms.txt, Theme */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Calendar Booking Button */}
              <button
                type="button"
                onClick={toggleBooking}
                className={`p-1.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-current cursor-pointer ${
                  isPill
                    ? isBookingOpen
                      ? "text-current bg-black/[0.08] dark:bg-white/[0.12]"
                      : "text-[rgba(18,18,18,0.64)] dark:text-[rgba(238,236,230,0.64)] hover:text-current"
                    : isBookingOpen
                    ? "text-[var(--bg)] bg-[var(--bg)]/20"
                    : "text-[var(--bg)]/65 hover:text-[var(--bg)]"
                }`}
                aria-label={COPY.nav.calendarTooltip}
                aria-haspopup="dialog"
                aria-expanded={isBookingOpen}
                title={COPY.nav.calendarTooltip}
              >
                <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* llms.txt toggle (text label collapses in pill mode with bezier transition) */}
              <button
                type="button"
                onClick={() => openLlms("standard")}
                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-all focus-visible:outline-2 focus-visible:outline-current cursor-pointer ${
                  isPill
                    ? "text-[rgba(18,18,18,0.64)] dark:text-[rgba(238,236,230,0.64)] hover:text-current"
                    : "text-[var(--bg)]/65 hover:text-[var(--bg)]"
                }`}
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

              {/* Theme Toggle configured for Notch inverted palette / Pill palette */}
              <ThemeToggle
                className={
                  isPill
                    ? "text-[rgba(18,18,18,0.64)] dark:text-[rgba(238,236,230,0.64)] hover:text-current"
                    : "text-[var(--bg)]/65 hover:text-[var(--bg)]"
                }
              />

              {/* Mobile Menu Hamburger / Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
                className={`sm:hidden p-1.5 rounded-full transition-opacity focus-visible:outline-2 focus-visible:outline-current ${
                  isPill
                    ? "text-[rgba(18,18,18,0.7)] dark:text-[rgba(238,236,230,0.7)] hover:text-current"
                    : "text-[var(--bg)]/70 hover:text-[var(--bg)]"
                }`}
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
              className={`sm:hidden flex flex-col items-center gap-2 pt-3 mt-2 border-t w-full ${
                isPill
                  ? "border-black/10 dark:border-white/10"
                  : "border-[var(--bg)]/15"
              }`}
            >
              <div className="flex flex-wrap justify-center gap-1 w-full">
                {NAV_ITEMS.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        setIsMobileExpanded(false);
                        handleNavClick(e, item);
                      }}
                      aria-current={active ? "page" : undefined}
                      className={`px-3 py-1 rounded-full text-center ${
                        active
                          ? isPill
                            ? "bg-black/[0.08] dark:bg-white/[0.12] font-medium"
                            : "bg-[var(--bg)]/20 font-medium"
                          : isPill
                          ? "text-[rgba(18,18,18,0.64)] dark:text-[rgba(238,236,230,0.64)]"
                          : "opacity-65 hover:opacity-90"
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
        <motion.div
          initial={false}
          animate={{
            width: isPill ? 0 : 16,
            opacity: isPill ? 0 : 1,
          }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 280, damping: 26 }
          }
          className="overflow-hidden shrink-0"
          style={{ pointerEvents: isPill ? "none" : "auto" }}
        >
          <NotchRightShoulder />
        </motion.div>
      </motion.div>
    </header>
  );
}
