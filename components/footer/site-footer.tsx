"use client";

import { useEffect, useRef } from "react";
import { type Profile } from "@/lib/schemas";
import { COPY } from "@/lib/copy";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import {
  useParticleEngine,
  useRegisterTextBlock,
} from "@/components/particles/use-particles";

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
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const talkRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();
  const { morphTo, setWordmarkElement } = useParticleEngine();

  useRegisterTextBlock("footer-talk", talkRef);
  useRegisterTextBlock("footer-links", linksRef);

  useEffect(() => {
    const activateWordmark = () => {
      const element = wordmarkRef.current;
      setWordmarkElement(element);
      if (!element) return;

      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        morphTo("wordmark");
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWordmarkElement(wordmarkRef.current);
          morphTo("wordmark");
        }
      },
      { threshold: 0.05 }
    );

    if (wordmarkRef.current) observer.observe(wordmarkRef.current);
    activateWordmark();
    window.addEventListener("particle-engine-ready", activateWordmark);
    return () => {
      observer.disconnect();
      window.removeEventListener("particle-engine-ready", activateWordmark);
      setWordmarkElement(null);
    };
  }, [morphTo, setWordmarkElement]);

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
      className="relative z-10 mx-auto mt-[clamp(72px,10vw,128px)] w-full max-w-[1024px] px-5 pb-[max(16px,env(safe-area-inset-bottom))] sm:px-8"
    >
      <section
        ref={talkRef}
        aria-labelledby="footer-heading"
        className="flex flex-col gap-6 border-t border-[var(--line)] py-6 sm:flex-row sm:items-end sm:justify-between sm:py-7"
      >
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-[0.1em] text-[var(--mut)] uppercase">
            <span
              aria-hidden="true"
              className="footer-status-glyph h-2 w-2 bg-[var(--fg)]"
            />
            <span>{COPY.footer.status}</span>
          </div>
          <h2
            id="footer-heading"
            className="text-[clamp(30px,4vw,40px)] leading-none font-normal tracking-[-0.035em] text-[var(--fg)]"
          >
            {COPY.footer.heading}
          </h2>
          <p className="mt-2 font-mono text-[12.5px] leading-relaxed text-[var(--mut)]">
            {COPY.footer.sub}
          </p>
        </div>

        <button
          type="button"
          onClick={openBooking}
          className="group inline-flex h-11 w-fit shrink-0 items-center gap-2 rounded-full bg-[var(--fg)] px-5 font-mono text-[13px] font-medium text-[var(--bg)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--fg)]"
        >
          <span>{COPY.footer.cta}</span>
          <ExternalArrow />
        </button>
      </section>

      <div
        ref={wordmarkRef}
        aria-hidden="true"
        data-wordmark={COPY.footer.wordmark}
        className="relative h-[clamp(104px,11vw,140px)] w-full touch-none font-mono"
      />

      <div
        ref={linksRef}
        className="flex flex-col gap-4 border-t border-[var(--line)] py-[18px] font-mono text-[11.5px] text-[var(--mut)] sm:flex-row sm:items-center sm:justify-between"
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
