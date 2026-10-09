"use client";

import React, { useState } from "react";
import { ArrowLeft, Save, Star, Loader2, Sparkles } from "lucide-react";
import type { Project } from "@/lib/schemas";

interface AdminProjectEditorProps {
  initialProject?: Project | null;
  onClose: () => void;
  onSaveSuccess: (savedProject: Project) => void;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminProjectEditor({
  initialProject,
  onClose,
  onSaveSuccess,
}: AdminProjectEditorProps) {
  const isEditing = Boolean(initialProject);

  const [title, setTitle] = useState(initialProject?.title || "");
  const [slug, setSlug] = useState(initialProject?.slug || "");
  const [blurb, setBlurb] = useState(initialProject?.blurb || "");
  const [body, setBody] = useState(initialProject?.body || "");
  const [stackStr, setStackStr] = useState(
    initialProject?.stack.join(", ") || "Next.js, TypeScript, Canvas 2D"
  );
  const [repoUrl, setRepoUrl] = useState(initialProject?.links.repo || "");
  const [liveUrl, setLiveUrl] = useState(initialProject?.links.live || "");
  const [year, setYear] = useState<number>(initialProject?.year || 2026);
  const [stars, setStars] = useState<number | undefined>(initialProject?.stars);
  const [order, setOrder] = useState<number>(initialProject?.order ?? 0);
  const [featured, setFeatured] = useState<boolean>(
    initialProject?.featured ?? true
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      setError("Title and slug are required");
      return;
    }

    setSaving(true);
    setError(null);

    const stack = stackStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const projectPayload: Project = {
      slug: slug.trim(),
      title: title.trim(),
      blurb: blurb.trim(),
      body: body.trim(),
      stack,
      links: {
        repo: repoUrl.trim() || undefined,
        live: liveUrl.trim() || undefined,
      },
      year: Number(year) || 2026,
      stars: stars ? Number(stars) : undefined,
      order: Number(order) || 0,
      featured,
    };

    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save project");
      }

      onSaveSuccess(data.project);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save project";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] overflow-y-auto flex flex-col">
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1.5 rounded-lg text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50 transition-colors"
            aria-label="Back to projects list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--mut)]">
              {initialProject ? `PROJECT // ${initialProject.slug}` : "NEW SPECIMEN // PROJECT"}
            </div>
            <h2 className="text-sm sm:text-base font-medium text-[var(--fg)] truncate">
              {title || "Untitled Project"}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-3.5 py-1.5 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-mono font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Save Project</span>
        </button>
      </header>

      <form onSubmit={handleSave} className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Particle Engine v2"
              required
              className="w-full text-base font-medium px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--mut)]">
                Slug
              </label>
              <button
                type="button"
                onClick={() => setSlug(generateSlug(title))}
                className="text-[10px] font-mono text-[var(--mut)] hover:text-[var(--fg)] inline-flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>auto</span>
              </button>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="particle-engine"
              required
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
            Blurb / Tagline
          </label>
          <input
            type="text"
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="A visceral physical canvas particle system with real-time text dimming..."
            required
            className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Tech Stack (comma separated)
            </label>
            <input
              type="text"
              value={stackStr}
              onChange={(e) => setStackStr(e.target.value)}
              placeholder="Next.js, Canvas, Verlet, TypeScript"
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Sort Order
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Repository URL (optional)
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Live Demo / Deploy URL (optional)
            </label>
            <input
              type="url"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://..."
              className="w-full text-xs font-mono px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg border border-[var(--line)] bg-[var(--bg)]/40">
          <input
            id="featured-toggle"
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="featured-toggle" className="text-xs font-mono text-[var(--fg)] cursor-pointer flex items-center gap-1.5">
            <Star className={`w-3.5 h-3.5 ${featured ? "text-amber-400 fill-amber-400" : "text-[var(--mut)]"}`} />
            <span>Feature prominently on homepage and work showcase</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
            Deep-Dive Case Study (Markdown)
          </label>
          <textarea
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the full technical case study for /work/[slug]..."
            className="w-full p-4 font-mono text-xs sm:text-sm leading-relaxed rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)] resize-y"
          />
        </div>
      </form>
    </div>
  );
}
