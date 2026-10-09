import { getProfile } from "@/lib/queries";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = {
  title: "About · Bhavya Verma",
  description: "About Bhavya Verma - product engineer, developer experience.",
  alternates: {
    canonical: "/about",
  },
};

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <div>
        {/* Technical Caption Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-8 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--fg)] font-medium">№ 004</span>
            <span>{COPY.about.caption}</span>
          </div>
          <span>BEEBOMBSHELL.COM</span>
        </div>

        {/* Section title & Long Bio */}
        <div className="mb-14">
          <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo mb-8">
            {COPY.about.title}
          </h1>

          <div className="space-y-6 text-[17px] sm:text-[18px] leading-[1.75] text-[var(--mut)] max-w-[65ch]">
            {COPY.bio.long.map((paragraph, idx) => (
              <p key={idx} className="text-halo">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* How I Work Section */}
        <div className="py-8 border-t border-[var(--line)] mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-6">
            {COPY.about.howTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COPY.about.howItems.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl border border-[var(--line)] bg-[var(--bg)]/40 backdrop-blur-sm"
              >
                <div className="font-mono text-[10px] text-[var(--mut)] mb-2">
                  RULE 0{idx + 1}
                </div>
                <p className="text-sm text-[var(--fg)] font-normal leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Source & Mentoring */}
        <div className="py-8 border-t border-[var(--line)] mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-4">
            {COPY.about.ossTitle}
          </h2>
          <p className="text-base text-[var(--mut)] leading-relaxed max-w-[65ch] mb-4">
            {COPY.about.ossBody}
          </p>
          <p className="text-xs font-mono text-[var(--mut)]">
            {COPY.about.ossProjects}
          </p>
        </div>

        {/* Off the clock & Fun Facts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-t border-[var(--line)] mb-10">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-3">
              {COPY.about.offclockTitle}
            </h2>
            <p className="text-sm text-[var(--mut)] leading-relaxed">
              {COPY.about.offclockBody}
            </p>
          </div>

          <div>
            <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-3">
              {COPY.about.funTitle}
            </h2>
            <ul className="space-y-2 text-xs font-mono text-[var(--mut)]">
              {COPY.about.funItems.map((fact, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--fg)] opacity-50">·</span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Currently */}
        <div className="py-8 border-t border-[var(--line)] mb-10">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-2">
            {COPY.about.nowTitle}
          </h2>
          <p className="text-base text-[var(--fg)] font-medium">
            {COPY.about.nowBody}
          </p>
        </div>

        {/* Channels / Elsewhere Links */}
        <div className="pt-8 border-t border-[var(--line)]">
          <h2 className="text-xs font-mono uppercase tracking-widest text-[var(--mut)] mb-6">
            ELSEWHERE / CHANNELS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.socials.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl border border-[var(--line)] hover:border-[var(--mut)] transition-colors flex items-center justify-between font-mono text-xs bg-[var(--bg)]/40 backdrop-blur-sm"
              >
                <div>
                  <span className="text-[var(--fg)] font-medium block">
                    {social.label}
                  </span>
                  {social.handle && (
                    <span className="text-[10px] text-[var(--mut)]">
                      {social.handle}
                    </span>
                  )}
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--mut)] group-hover:text-[var(--fg)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Readout */}
      <footer className="mt-16 pt-4 border-t border-[var(--line)] flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] font-mono text-[var(--mut)] gap-2">
        <span>STATUS: {profile.statusText.toUpperCase()}</span>
        <span>CONTOUR FIELD ACTIVE</span>
      </footer>
    </div>
  );
}
