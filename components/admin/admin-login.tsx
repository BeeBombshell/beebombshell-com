"use client";

import React, { useState } from "react";
import { Lock, ArrowRight, Eye, EyeOff, Terminal, ShieldAlert } from "lucide-react";

interface AdminLoginProps {
  onSuccess: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2 mb-6 text-xs font-mono uppercase tracking-widest text-[var(--mut)]">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span>SPECIMEN // ADMIN CONSOLE</span>
        </div>

        <h1 className="text-2xl font-normal tracking-[-0.03em] text-[var(--fg)] mb-2">
          Unlock Controller
        </h1>
        <p className="text-xs sm:text-sm text-[var(--mut)] leading-relaxed mb-6">
          Authenticate to manage essays, curate projects, and trigger edge cache revalidation.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-passphrase"
              className="block text-xs font-mono text-[var(--mut)] mb-1.5 uppercase tracking-wider"
            >
              Secret Passphrase / Key
            </label>
            <div className="relative">
              <input
                id="admin-passphrase"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ADMIN_SECRET..."
                required
                autoFocus
                className="w-full px-3.5 py-2.5 pr-10 text-sm font-mono rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--fg)] placeholder:text-[var(--mut)]/50 focus:outline-none focus:border-[var(--fg)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--mut)] hover:text-[var(--fg)] transition-colors p-1"
                aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-[10px] font-mono text-[var(--mut)]/80">
              Default local dev key: <code className="bg-[var(--line)] px-1 rounded">beebombshell-admin</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 px-4 rounded-lg font-mono text-xs uppercase tracking-wider bg-[var(--fg)] text-[var(--bg)] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Authorize Session</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
