import { getProfile } from "@/lib/queries";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About · BeeBombshell",
  description: "About Bhavya Verma - product engineer, builder, and creative technologist.",
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
            <span>FIG 0.3 · BIOGRAPHY & SYSTEM</span>
          </div>
          <span>ORIGIN: {profile.location}</span>
        </div>

        {/* Section statement per design.md (26-28px, line-height 1.28, letter-spacing -0.02em) */}
        <div className="mb-12">
          <h1 className="text-2xl sm:text-[28px] font-normal tracking-[-0.02em] leading-[1.28] text-[var(--fg)] text-halo mb-8 max-w-2xl">
            Building software with visceral feel, mechanical precision, and aesthetic integrity.
          </h1>

          <div className="space-y-6 text-[17px] sm:text-[18px] leading-[1.7] text-[var(--mut)] max-w-[65ch]">
            <p className="text-halo">
              {profile.bio}
            </p>

            <p className="text-halo">
              I treat digital interfaces like mechanical hardware. Every interaction deserves weight, momentum, and tactile resistance. When software feels physical, using it becomes a pleasure rather than a chore.
            </p>

            <p className="text-halo">
              My work sits at the intersection of systems architecture, frontend craft, and creative computation—shipping production features that run at 60fps on mid-tier mobile hardware while looking stunning on high-DPI displays.
            </p>
          </div>
        </div>

        {/* Technical Pillars / Craft Philosophy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8 border-t border-[var(--line)] mb-12">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
              01 / PHYSICALITY
            </div>
            <h2 className="text-base font-medium text-[var(--fg)] mb-1">
              Spring Dynamics
            </h2>
            <p className="text-xs text-[var(--mut)] leading-relaxed">
              Verlet integration, damping, and continuous momentum instead of linear transitions.
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
              02 / PERFORMANCE
            </div>
            <h2 className="text-base font-medium text-[var(--fg)] mb-1">
              Frame Budgets
            </h2>
            <p className="text-xs text-[var(--mut)] leading-relaxed">
              Capped DPR, memory efficiency, and text-aware dimming to preserve readability and speed.
            </p>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--mut)] mb-2">
              03 / REFINEMENT
            </div>
            <h2 className="text-base font-medium text-[var(--fg)] mb-1">
              Minimal Chrome
            </h2>
            <p className="text-xs text-[var(--mut)] leading-relaxed">
              Single high-energy centerpieces surrounded by quiet, editorial monospace hierarchy.
            </p>
          </div>
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
