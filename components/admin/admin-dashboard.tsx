"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  FileText,
  Briefcase,
  Settings,
  Plus,
  RefreshCw,
  LogOut,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Database,
  Search,
  Star,
  Globe,
  Sliders,
  Calendar,
} from "lucide-react";
import type { Post, Project, SiteConfig, Profile } from "@/lib/schemas";
import { AdminPostEditor } from "./admin-post-editor";
import { AdminProjectEditor } from "./admin-project-editor";

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "projects" | "config">("posts");
  const [loading, setLoading] = useState(true);

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Post & Project Editors
  const [editingPost, setEditingPost] = useState<Post | null | undefined>(undefined);
  const [editingProject, setEditingProject] = useState<Project | null | undefined>(undefined);

  // Filters & Search
  const [postSearch, setPostSearch] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState<"all" | "published" | "draft">("all");

  // Revalidate Notification
  const [revalidating, setRevalidating] = useState(false);
  const [revalidateMessage, setRevalidateMessage] = useState<string | null>(null);

  // Config Saving
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/data");
      if (!res.ok) {
        if (res.status === 401) {
          onLogout();
          return;
        }
        throw new Error("Failed to load admin data");
      }
      const data = await res.json();
      setPosts(data.posts || []);
      setProjects(data.projects || []);
      setConfig(data.config || null);
      setProfile(data.profile || null);
      setIsFirestoreConnected(Boolean(data.isFirestoreConnected));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRevalidateAll = async () => {
    try {
      setRevalidating(true);
      setRevalidateMessage(null);
      const res = await fetch("/api/admin/revalidate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRevalidateMessage("All caches purged and updated at " + new Date().toLocaleTimeString());
        setTimeout(() => setRevalidateMessage(null), 5000);
      }
    } catch {
      setRevalidateMessage("Failed to revalidate caches.");
    } finally {
      setRevalidating(false);
    }
  };

  const handleTogglePostStatus = async (post: Post) => {
    const nextStatus: "draft" | "published" =
      post.status === "published" ? "draft" : "published";
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...post, status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(posts.map((p) => (p.slug === post.slug ? data.post : p)));
      }
    } catch (err) {
      console.error("Status toggle failed:", err);
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete post "${slug}"?`)) return;
    try {
      const res = await fetch(`/api/admin/posts?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleDeleteProject = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete project "${slug}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProjects(projects.filter((p) => p.slug !== slug));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      setSavingConfig(true);
      setConfigMessage(null);
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setConfigMessage("Site configuration saved & revalidated!");
        setTimeout(() => setConfigMessage(null), 4000);
      }
    } catch {
      setConfigMessage("Failed to save configuration.");
    } finally {
      setSavingConfig(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (postStatusFilter !== "all" && post.status !== postStatusFilter) {
      return false;
    }
    if (postSearch.trim()) {
      const query = postSearch.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.slug.toLowerCase().includes(query) ||
        post.tags.some((t) => t.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] pb-24">
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-30 bg-[var(--bg)]/90 backdrop-blur-md border-b border-[var(--line)] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--mut)]">
              BEEBOMBSHELL // SYSTEM
            </div>
            <h1 className="text-sm sm:text-base font-medium tracking-tight">
              Specimen Controller
            </h1>
          </div>
        </div>

        {/* Status indicator & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border border-[var(--line)] text-[var(--mut)]">
            <Database className="w-3 h-3 text-emerald-500" />
            <span>{isFirestoreConnected ? "FIRESTORE LIVE" : "LOCAL SEED SYNC"}</span>
          </div>

          <button
            type="button"
            onClick={handleRevalidateAll}
            disabled={revalidating}
            className="p-1.5 sm:px-3 sm:py-1 rounded-lg border border-[var(--line)] text-xs font-mono text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Purge and revalidate all ISR caches"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${revalidating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Purge Cache</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await fetch("/api/admin/auth", { method: "DELETE" });
              onLogout();
            }}
            className="p-1.5 sm:px-3 sm:py-1 rounded-lg border border-[var(--line)] text-xs font-mono text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Revalidate toast */}
      {revalidateMessage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-4">
          <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{revalidateMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "posts"
                ? "bg-[var(--fg)] text-[var(--bg)] font-medium"
                : "text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/30"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Articles</span>
            <span className="text-[10px] opacity-70">({posts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("projects")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "projects"
                ? "bg-[var(--fg)] text-[var(--bg)] font-medium"
                : "text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/30"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Projects</span>
            <span className="text-[10px] opacity-70">({projects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === "config"
                ? "bg-[var(--fg)] text-[var(--bg)] font-medium"
                : "text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/30"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Site Config</span>
          </button>
        </div>

        {/* Tab 1: POSTS */}
        {activeTab === "posts" && (
          <div className="mt-6 space-y-6">
            {/* Search, Filter, and + New Post Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mut)]" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="Search articles or tags..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                  />
                </div>

                <div className="inline-flex rounded-lg border border-[var(--line)] p-0.5 text-[11px] font-mono shrink-0">
                  <button
                    type="button"
                    onClick={() => setPostStatusFilter("all")}
                    className={`px-2 py-1 rounded transition-colors ${
                      postStatusFilter === "all"
                        ? "bg-[var(--fg)] text-[var(--bg)]"
                        : "text-[var(--mut)]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatusFilter("published")}
                    className={`px-2 py-1 rounded transition-colors ${
                      postStatusFilter === "published"
                        ? "bg-[var(--fg)] text-[var(--bg)]"
                        : "text-[var(--mut)]"
                    }`}
                  >
                    Pub
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostStatusFilter("draft")}
                    className={`px-2 py-1 rounded transition-colors ${
                      postStatusFilter === "draft"
                        ? "bg-[var(--fg)] text-[var(--bg)]"
                        : "text-[var(--mut)]"
                    }`}
                  >
                    Draft
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="py-2 px-3.5 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-mono font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Article</span>
              </button>
            </div>

            {/* Posts List */}
            <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--bg)]/50">
              {filteredPosts.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-[var(--mut)]">
                  No articles matched your criteria.
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div
                    key={post.slug}
                    className="p-4 sm:p-5 hover:bg-[var(--line)]/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePostStatus(post)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-transform active:scale-95 ${
                            post.status === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-[var(--line)] text-[var(--mut)] border border-[var(--line)]"
                          }`}
                          title="Click to toggle status"
                        >
                          {post.status}
                        </button>
                        <span className="text-[11px] font-mono text-[var(--mut)]">
                          {new Date(post.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--mut)] opacity-60">
                          · /{post.slug}
                        </span>
                      </div>

                      <h3 className="text-base font-medium text-[var(--fg)] truncate">
                        {post.title}
                      </h3>

                      <p className="text-xs text-[var(--mut)] line-clamp-1 max-w-2xl">
                        {post.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono text-[var(--mut)] bg-[var(--line)]/40 px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--line)]/50">
                      <a
                        href={`/writing/${post.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                        title="View Live Article"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setEditingPost(post)}
                        className="p-1.5 px-2.5 rounded-lg border border-[var(--line)] text-xs font-mono text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.slug)}
                        className="p-1.5 rounded-lg border border-[var(--line)] text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Article"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: PROJECTS */}
        {activeTab === "projects" && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium">Showcase Projects</h2>
                <p className="text-xs text-[var(--mut)]">
                  Ordered works displayed on the homepage and /work showcase.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="py-2 px-3.5 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-mono font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>

            <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden bg-[var(--bg)]/50">
              {projects.map((proj) => (
                <div
                  key={proj.slug}
                  className="p-4 sm:p-5 hover:bg-[var(--line)]/10 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[var(--line)]/50 text-[var(--fg)]">
                        #{proj.order}
                      </span>
                      {proj.featured && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[var(--fg)] bg-[var(--line)] px-2 py-0.5 rounded border border-[var(--line)]">
                          <Star className="w-3 h-3 fill-[var(--fg)]" />
                          <span>FEATURED</span>
                        </span>
                      )}
                      <span className="text-xs font-mono text-[var(--mut)]">
                        {proj.year}
                      </span>
                    </div>

                    <h3 className="text-base font-medium text-[var(--fg)]">
                      {proj.title}
                    </h3>
                    <p className="text-xs text-[var(--mut)] line-clamp-1">
                      {proj.blurb}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {proj.stack.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-mono text-[var(--mut)] bg-[var(--line)]/40 px-1.5 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/work/${proj.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--mut)] hover:text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors"
                      title="View Case Study"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setEditingProject(proj)}
                      className="p-1.5 px-2.5 rounded-lg border border-[var(--line)] text-xs font-mono text-[var(--fg)] hover:bg-[var(--line)]/40 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.slug)}
                      className="p-1.5 rounded-lg border border-[var(--line)] text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: SITE CONFIG */}
        {activeTab === "config" && config && (
          <div className="mt-6 max-w-2xl space-y-6">
            <div>
              <h2 className="text-base font-medium">Site Availability & Booking</h2>
              <p className="text-xs text-[var(--mut)]">
                Controls the live availability indicator in the notch and booking triggers.
              </p>
            </div>

            {configMessage && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-4 p-5 rounded-xl border border-[var(--line)] bg-[var(--bg)]/40">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
                  Availability Status
                </label>
                <select
                  value={config.availability}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      availability: e.target.value as "open" | "closed",
                    })
                  }
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                >
                  <option value="open">OPEN (Accepting new conversations/chats)</option>
                  <option value="closed">CLOSED (Not currently accepting bookings)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
                  Booking Provider
                </label>
                <select
                  value={config.bookingProvider}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bookingProvider: e.target.value as "cal" | "google" | "custom",
                    })
                  }
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                >
                  <option value="cal">Cal.com Embed</option>
                  <option value="google">Google Calendar Appointment Scheduling</option>
                  <option value="custom">Custom External URL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[var(--mut)] mb-1">
                  Direct Booking / Cal.com URL
                </label>
                <input
                  type="url"
                  value={config.bookingUrl || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      bookingUrl: e.target.value || undefined,
                    })
                  }
                  placeholder="https://cal.com/bhavya/coffee"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus:border-[var(--fg)]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="py-2 px-4 rounded-lg bg-[var(--fg)] text-[var(--bg)] text-xs font-mono font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingConfig ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sliders className="w-3.5 h-3.5" />
                  )}
                  <span>Save Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Post Editor Overlay Modal */}
      {editingPost !== undefined && (
        <AdminPostEditor
          initialPost={editingPost}
          onClose={() => setEditingPost(undefined)}
          onSaveSuccess={(savedPost) => {
            setPosts((prev) => {
              const idx = prev.findIndex((p) => p.slug === savedPost.slug);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = savedPost;
                return next;
              }
              return [savedPost, ...prev];
            });
            setEditingPost(undefined);
          }}
        />
      )}

      {/* Project Editor Overlay Modal */}
      {editingProject !== undefined && (
        <AdminProjectEditor
          initialProject={editingProject}
          onClose={() => setEditingProject(undefined)}
          onSaveSuccess={(savedProj) => {
            setProjects((prev) => {
              const idx = prev.findIndex((p) => p.slug === savedProj.slug);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = savedProj;
                return next;
              }
              return [...prev, savedProj];
            });
            setEditingProject(undefined);
          }}
        />
      )}
    </div>
  );
}
