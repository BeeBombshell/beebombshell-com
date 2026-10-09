"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  Edit3,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  FileCode,
  Quote,
  List,
  Link as LinkIcon,
  Sparkles,
  Save,
  Globe,
  Loader2,
} from "lucide-react";
import type { Post } from "@/lib/schemas";

interface AdminPostEditorProps {
  initialPost?: Post | null;
  onClose: () => void;
  onSaveSuccess: (savedPost: Post) => void;
}

const COMMON_TAGS = [
  "systems",
  "canvas",
  "physics",
  "react",
  "perf",
  "craft",
  "design",
  "nextjs",
  "typescript",
  "creative-coding",
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminPostEditor({
  initialPost,
  onClose,
  onSaveSuccess,
}: AdminPostEditorProps) {
  const isEditing = Boolean(initialPost);

  const [title, setTitle] = useState(initialPost?.title || "");
  const [slug, setSlug] = useState(initialPost?.slug || "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt || "");
  const [body, setBody] = useState(initialPost?.body || "");
  const [tags, setTags] = useState<string[]>(initialPost?.tags || ["systems"]);
  const [status, setStatus] = useState<"draft" | "published">(
    initialPost?.status || "draft"
  );
  const [publishedAt, setPublishedAt] = useState(
    initialPost?.publishedAt || new Date().toISOString()
  );

  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-generate slug from title if new post and slug not customized
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(newTitle));
    }
  };

  // Quick tag toggle
  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = tagInput.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed]);
        setTagInput("");
      }
    }
  };

  // Helper to insert markdown text around selection
  const insertMarkdown = (prefix: string, suffix: string = "", placeholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = textarea.value.substring(start, end) || placeholder;

    const replacement = `${prefix}${selection}${suffix}`;
    const newBody =
      textarea.value.substring(0, start) +
      replacement +
      textarea.value.substring(end);

    setBody(newBody);

    // Re-focus and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selection.length
      );
    }, 10);
  };

  // Load preview when preview tab opens
  useEffect(() => {
    if (activeTab === "preview") {
      setPreviewLoading(true);
      fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: body || "*No content entered yet.*" }),
      })
        .then((res) => res.json())
        .then((data) => {
          setPreviewHtml(data.html || "");
        })
        .catch((err) => {
          setPreviewHtml(`<p class="text-rose-400">Failed to render preview: ${err.message}</p>`);
        })
        .finally(() => {
          setPreviewLoading(false);
        });
    }
  }, [activeTab, body]);

  const handleSave = async (overrideStatus?: "draft" | "published") => {
    const finalStatus = overrideStatus || status;
    if (!title.trim()) {
      setSaveError("Title is required");
      return;
    }
    const finalSlug = slug.trim() || generateSlug(title);
    if (!finalSlug) {
      setSaveError("Slug is required");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const postPayload: Post = {
      slug: finalSlug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      body: body.trim(),
      tags,
      status: finalStatus,
      publishedAt: publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save post");
      }

      onSaveSuccess(data.post);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save post";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg)] overflow-y-auto flex flex-col">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-20 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -ml-1.5 rounded-lg text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/50 transition-colors"
            aria-label="Back to posts list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--mut)]">
              {initialPost ? `EDITING // ${initialPost.slug}` : "NEW ARTICLE // DRAFT"}
            </div>
            <h2 className="text-sm sm:text-base font-medium text-[var(--fg)] truncate">
              {title || "Untitled Article"}
            </h2>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-mono text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span> Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-mono font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-emerald-500" />
            )}
            <span>Publish</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {saveError && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
            {saveError}
          </div>
        )}

        {/* Post Metadata Inputs */}
        <div className="space-y-4 border-b border-[var(--line)] pb-6">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Interactive Badge Physics & Verlet Dynamics"
              className="w-full text-lg sm:text-2xl font-normal tracking-tight px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--mut)]/40 focus:outline-none focus:border-[var(--fg)] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="interactive-badge-physics"
                className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--mut)]/40 focus:outline-none focus:border-[var(--fg)]"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
                Status & Publication Date
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                >
                  <option value="draft">DRAFT</option>
                  <option value="published">PUBLISHED</option>
                </select>
                <input
                  type="datetime-local"
                  value={publishedAt ? publishedAt.substring(0, 16) : ""}
                  onChange={(e) =>
                    setPublishedAt(e.target.value ? new Date(e.target.value).toISOString() : "")
                  }
                  className="flex-1 text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
              Short Excerpt / Abstract
            </label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A concise synopsis shown on the index cards, RSS feed, and OpenGraph preview..."
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--mut)]/40 focus:outline-none focus:border-[var(--fg)]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1.5">
              Tags
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {COMMON_TAGS.map((ct) => {
                const active = tags.includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => toggleTag(ct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                      active
                        ? "bg-[var(--fg)] text-[var(--bg)]"
                        : "bg-[var(--line)]/40 text-[var(--mut)] hover:text-[var(--fg)]"
                    }`}
                  >
                    #{ct}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddCustomTag}
              placeholder="Add custom tag (press Enter)..."
              className="w-full max-w-xs text-xs font-mono px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
            />
          </div>
        </div>

        {/* Editor Controls & Tabs */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 gap-2 flex-wrap">
          {/* Write / Preview Segmented Toggle */}
          <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 bg-[var(--bg)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "write"
                  ? "bg-[var(--fg)] text-[var(--bg)] font-medium"
                  : "text-[var(--mut)] hover:text-[var(--fg)]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Write</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-[var(--fg)] text-[var(--bg)] font-medium"
                  : "text-[var(--mut)] hover:text-[var(--fg)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
          </div>

          {/* Quick Markdown Toolbar (for Write mode) */}
          {activeTab === "write" && (
            <div className="flex items-center gap-1 overflow-x-auto py-1 text-[var(--mut)]">
              <button
                type="button"
                onClick={() => insertMarkdown("## ", "\n", "Heading 2")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("### ", "\n", "Heading 3")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("**", "**", "bold text")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("_", "_", "italic text")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("`", "`", "code")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Inline Code"
              >
                <Code className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("```ts\n", "\n```\n", "// code here")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Code Block"
              >
                <FileCode className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("> ", "\n", "quote")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("- ", "\n", "item")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="List"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertMarkdown("[", "](https://example.com)", "link title")}
                className="p-1.5 rounded hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                title="Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tab Body: Write or Preview */}
        {activeTab === "write" ? (
          <div>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your article in Markdown here..."
              rows={22}
              className="w-full p-4 font-mono text-xs sm:text-sm leading-relaxed rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--mut)]/30 focus:outline-none focus:border-[var(--fg)] resize-y"
            />
            <div className="flex justify-between items-center text-[10px] font-mono text-[var(--mut)] mt-1.5">
              <span>{body.length} characters</span>
              <span>Markdown with Shiki code highlight support</span>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 rounded-xl border border-[var(--line)] bg-[var(--bg)]/40 backdrop-blur-sm min-h-[400px]">
            {previewLoading ? (
              <div className="flex items-center justify-center py-20 text-xs font-mono text-[var(--mut)] gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rendering high-fidelity preview...</span>
              </div>
            ) : (
              <div
                className="prose max-w-none text-sm sm:text-base leading-relaxed text-[var(--fg)]"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
