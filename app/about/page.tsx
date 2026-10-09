import { getProfile } from "@/lib/queries";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · BeeBombshell",
  description: "About Bhavya Verma - builder, engineer, and tinkerer.",
};

export default async function AboutPage() {
  const profile = await getProfile();

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-8 py-8 md:py-12 flex flex-col justify-between font-sans">
      <div>
        {/* Caption */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 mb-8 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
          <div className="flex items-center gap-3">
            <span className="text-[var(--fg)] font-medium">№ 004</span>
            <span>FIG 0.3 · BIOGRAPHY & SYSTEM</span>
          </div>
          <span>ORIGIN: {profile.location}</span>
        </div>

        {/* Hero statement */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.03em] leading-tight text-[var(--fg)] mb-6">
            Building software with visceral feel, mechanical precision, and aesthetic integrity.
          </h1>

          <p className="text-base sm:text-lg text-[var(--mut)] leading-relaxed mb-6 max-w-2xl">
            {profile.bio}
          </p>

          <p className="text-base sm:text-lg text-[var(--mut)] leading-relaxed max-w-2xl">
            I spend my days architecting resilient web platforms and crafting playful user interfaces. When not writing code, I explore generative graphics, audio synthesis, and interactive mathematics.
          </p>
        </div>

        {/* Elsewhere Links */}
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
                className="group p-4 rounded-xl border border-[var(--line)] hover:border-[var(--mut)] transition-colors flex items-center justify-between font-mono text-xs"
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
                <ArrowUpRight className="w-4 h-4 text-[var(--mut)] group-hover:text-[var(--fg)] transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 pt-4 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono text-[var(--mut)]">
        <span>BEEBOMBSHELL BIOGRAPHY SPECIFICATION</span>
        <span>STATUS: {profile.statusText.toUpperCase()}</span>
      </div>
    </div>
  );
}
