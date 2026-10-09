import { getProfile } from "@/lib/queries";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default async function HomePage() {
  const profile = await getProfile();

  return (
    <div className="relative min-h-screen flex flex-col justify-between p-5 md:p-8 font-sans selection:bg-[var(--fg)] selection:text-[var(--bg)]">
      {/* Top Bar with technical coordinates & Theme Toggle */}
      <header className="flex items-center justify-between border-b border-[var(--line)] pb-3 text-[11px] font-mono uppercase tracking-wider text-[var(--mut)]">
        <div className="flex items-center gap-4">
          <span className="text-[var(--fg)] font-medium">№ 001</span>
          <span className="hidden sm:inline">FIG 0.1 · CORE SPECIMEN</span>
          <span className="hidden md:inline">SYSTEM STATE: ONLINE</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-normal lowercase opacity-80">
            {profile.statusText}
          </span>
          <ThemeToggle />
        </div>
      </header>

      {/* Hero statement anchored bottom-left per design.md */}
      <main className="my-auto py-16 flex flex-col justify-end max-w-4xl">
        <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-3">
          {profile.role} · {profile.location}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] leading-[1.02] text-[var(--fg)] text-halo mb-6">
          {profile.name}
        </h1>

        <p className="text-xl sm:text-2xl md:text-[28px] font-normal leading-[1.28] tracking-[-0.02em] text-[var(--mut)] max-w-2xl text-halo mb-8">
          {profile.bio}
        </p>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[var(--line)]">
          {profile.socials.map((social) => (
            <a
              key={social.label}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-[var(--mut)] hover:text-[var(--fg)] transition-colors inline-flex items-center gap-1.5 focus-visible:rounded"
            >
              <span>{social.label}</span>
              <span className="text-[10px] opacity-60">↗</span>
            </a>
          ))}
        </div>
      </main>

      {/* Footer / Specs Readout */}
      <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-[var(--line)] pt-3 text-[11px] font-mono text-[var(--mut)] gap-2">
        <div>
          <span>BEEBOMBSHELL.COM</span>
          <span className="mx-2 opacity-30">/</span>
          <span>NEXT.JS APP ROUTER</span>
        </div>
        <div className="flex items-center gap-4">
          <span>PAPER & INK MONOCHROME</span>
          <span className="opacity-40">●</span>
          <span>PHASE 0 VALIDATED</span>
        </div>
      </footer>
    </div>
  );
}
