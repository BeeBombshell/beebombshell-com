"use client";

import { useRef } from "react";
import { type Profile } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { useRegisterTextBlock } from "@/components/particles/use-particles";

interface SiteFooterProps {
  profile: Profile;
}

function ExternalArrow() {
  return (
    <span
      aria-hidden="true"
      className="inline-block transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5"
    >
      ↗
    </span>
  );
}

export function SiteFooter({ profile }: SiteFooterProps) {
  const talkRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();

  useRegisterTextBlock("footer-talk", talkRef);
  useRegisterTextBlock("footer-links", linksRef);

  const socialUrl = (label: string) =>
    profile.socials.find((social) => social.label.toLowerCase() === label)?.url;

  const links = [
    { label: COPY.footer.links.github, url: socialUrl("github") },
    { label: COPY.footer.links.x, url: socialUrl("x") },
    { label: COPY.footer.links.linkedin, url: socialUrl("linkedin") },
  ].flatMap((link) => (link.url ? [{ label: link.label, url: link.url }] : []));

  const scrollToTop = () => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const lenis = (
      window as typeof window & {
        __lenis?: { scrollTo: (target: number, options?: object) => void };
      }
    ).__lenis;

    if (lenis) {
      lenis.scrollTo(
        0,
        reducedMotion ? { immediate: true } : { duration: 1.2 }
      );
      return;
    }

    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const copyright = COPY.footer.copyright.replace("{year}", "2026");

  return (
    <footer
      id="footer"
      data-section="footer"
      className="relative z-10 mx-auto mt-[clamp(72px,10vw,128px)] w-full max-w-6xl px-5 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-8"
    >
      <section
        ref={talkRef}
        aria-labelledby="footer-heading"
        className="grid gap-10 border-t border-[var(--line)] py-[clamp(48px,7vw,80px)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <div className="max-w-2xl">
          <div className="mb-5 flex items-center gap-2 font-mono text-[11px] text-[var(--mut)]">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[var(--fg)]"
            />
            <span>{COPY.footer.status}</span>
          </div>
          <h2
            id="footer-heading"
            className="text-[clamp(38px,6vw,64px)] leading-[0.98] font-normal tracking-[-0.045em] text-[var(--fg)]"
          >
            {COPY.footer.heading}
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[var(--mut)] sm:text-base">
            {COPY.footer.sub}
          </p>
        </div>

        <button
          type="button"
          onClick={openBooking}
          className="group inline-flex w-fit shrink-0 items-center gap-2 border-b border-[var(--fg)] pb-1.5 font-mono text-[13px] text-[var(--fg)] transition-opacity hover:opacity-65 focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-[var(--fg)]"
        >
          <span>{COPY.footer.cta}</span>
          <ExternalArrow />
        </button>
      </section>

      <div
        ref={linksRef}
        className="flex flex-col gap-5 border-t border-[var(--line)] py-5 font-mono text-[11.5px] text-[var(--mut)] sm:flex-row sm:items-center sm:justify-between"
      >
        <nav
          aria-label="Footer links"
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          {links.map((link) => (
            <a
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--fg)] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--fg)]"
            >
              <span>{link.label}</span>
              <ExternalArrow />
            </a>
          ))}
          <button
            type="button"
            onClick={() => openLlms("standard")}
            className="group inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[var(--fg)] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--fg)]"
          >
            <span>{COPY.footer.links.llms}</span>
            <ExternalArrow />
          </button>
        </nav>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
          <span>{copyright}</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex cursor-pointer items-center gap-1.5 transition-colors hover:text-[var(--fg)] focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--fg)]"
            aria-label={`${COPY.footer.top}, back to top`}
          >
            <span>{COPY.footer.top}</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:-translate-y-[3px] group-focus-visible:-translate-y-[3px]"
            >
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
