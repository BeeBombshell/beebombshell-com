"use client";

import React, { useEffect, useState, useSyncExternalStore } from "react";
import type { SpotifyNowPlayingResponse } from "@/app/api/spotify/route";
import { COPY } from "@/lib/copy";

function subscribeReducedMotion(cb: () => void) {
  const q = window.matchMedia("(prefers-reduced-motion: reduce)");
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
}

interface SpotifyStripProps {
  isPill: boolean;
  className?: string;
}

export function SpotifyStrip({ isPill, className = "" }: SpotifyStripProps) {
  const [data, setData] = useState<SpotifyNowPlayingResponse | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/spotify");
        if (res.ok) {
          const json: SpotifyNowPlayingResponse = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        // Silent catch for network hiccups
      }
    };

    fetchStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data || data.status === "offline") {
    return null;
  }

  const isPlaying = data.isPlaying;
  const marqueeText = isPlaying
    ? `${data.track} — ${data.artist} · `
    : `last played · ${data.track} — ${data.artist} · `;

  const ariaLabel = isPlaying
    ? `Currently playing ${data.track} by ${data.artist} on Spotify`
    : `Last played ${data.track} by ${data.artist} on Spotify`;

  // In pill mode: expand on hover. Otherwise when attached: show marquee unless screen is small.
  const showText = !isPill || isHovered;

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
      title={COPY.spotify.tooltip}
      className={`group flex items-center gap-2 px-1.5 py-0.5 rounded-full transition-all duration-300 hover:opacity-100 opacity-60 focus-visible:outline-2 focus-visible:outline-[var(--bg)] cursor-pointer ${className}`}
    >
      {/* 4 Pastel Equalizer Bars (#f7a6d1) */}
      <div
        className="flex items-end gap-[2px] h-[12px] w-[14px] flex-shrink-0"
        aria-hidden="true"
      >
        <span
          className={`w-[2px] bg-[#f7a6d1] rounded-full transition-all ${
            isPlaying && !reducedMotion ? "animate-eq-1" : "h-[4px]"
          }`}
          style={{ height: isPlaying && !reducedMotion ? undefined : "4px" }}
        />
        <span
          className={`w-[2px] bg-[#f7a6d1] rounded-full transition-all ${
            isPlaying && !reducedMotion ? "animate-eq-2" : "h-[9px]"
          }`}
          style={{ height: isPlaying && !reducedMotion ? undefined : "9px" }}
        />
        <span
          className={`w-[2px] bg-[#f7a6d1] rounded-full transition-all ${
            isPlaying && !reducedMotion ? "animate-eq-3" : "h-[12px]"
          }`}
          style={{ height: isPlaying && !reducedMotion ? undefined : "12px" }}
        />
        <span
          className={`w-[2px] bg-[#f7a6d1] rounded-full transition-all ${
            isPlaying && !reducedMotion ? "animate-eq-4" : "h-[5px]"
          }`}
          style={{ height: isPlaying && !reducedMotion ? undefined : "5px" }}
        />
      </div>

      {/* Marquee Window (104px wide, collapses with max-width bezier) */}
      <div
        className="overflow-hidden whitespace-nowrap transition-all duration-500 text-[11px] font-mono text-[var(--bg)]/85"
        style={{
          maxWidth: showText ? "104px" : "0px",
          opacity: showText ? 1 : 0,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {reducedMotion ? (
          <span className="truncate block">{data.track}</span>
        ) : (
          <div className="flex w-max animate-marquee text-[10px]">
            <span>{marqueeText}&nbsp;</span>
            <span>{marqueeText}&nbsp;</span>
          </div>
        )}
      </div>
    </a>
  );
}
