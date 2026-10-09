import Link from "next/link";
import { COPY } from "@/lib/copy";

export default function NotFound() {
  return (
    <div className="flex-1 w-full max-w-xl mx-auto px-5 sm:px-8 py-24 flex flex-col items-center justify-center text-center font-sans">
      <div className="font-mono text-xs uppercase tracking-widest text-[var(--mut)] mb-3">
        № 404 · SPECIMEN NOT FOUND
      </div>
      <h1 className="text-4xl sm:text-5xl font-normal tracking-[-0.03em] text-[var(--fg)] text-halo mb-4">
        {COPY.state.notFoundTitle}
      </h1>
      <p className="text-base sm:text-lg text-[var(--mut)] mb-8 max-w-md leading-relaxed text-halo">
        {COPY.state.notFoundBody}
      </p>
      <Link
        href="/"
        className="font-mono text-xs px-5 py-2.5 rounded-full bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity inline-flex items-center gap-2"
      >
        <span>←</span>
        <span>{COPY.state.notFoundCta}</span>
      </Link>
    </div>
  );
}
