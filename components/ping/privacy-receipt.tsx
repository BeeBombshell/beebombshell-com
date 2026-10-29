"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw, Send } from "lucide-react";
import { pingAudio } from "./ping-audio";

export interface ReceiptData {
  id: string;
  tag: string;
  timestamp: string;
  hashKey: string;
  pingsToday: number;
  dailyLimit: number;
}

interface PrivacyReceiptProps {
  receipt: ReceiptData;
  onReset: () => void;
}

export function PrivacyReceipt({ receipt, onReset }: PrivacyReceiptProps) {
  const [phase, setPhase] = useState<"fly" | "land" | "done">("fly");

  useEffect(() => {
    pingAudio.playKeyClick(0.75);
    const t1 = setTimeout(() => setPhase("land"), 350);
    const t2 = setTimeout(() => setPhase("done"), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const remaining = Math.max(0, receipt.dailyLimit - receipt.pingsToday);
  const isLimited = remaining === 0;

  const ts = new Date(receipt.timestamp);
  const timeString = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="receipt-root w-full max-w-[480px] mx-auto flex flex-col items-center gap-4 py-2">

      {/* ── Fly-away Send icon ──────────────────────────── */}
      <div className={`receipt-fly-wrap ${phase === "fly" ? "receipt-fly-wrap--active" : "receipt-fly-wrap--gone"}`} aria-hidden="true">
        <div className="receipt-fly-icon">
          <Send className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <div className="receipt-fly-trail" />
      </div>

      {/* ── Main Card ───────────────────────────────────── */}
      <div className={`receipt-card w-full ${phase === "fly" ? "receipt-card--hidden" : "receipt-card--visible"}`}>
        {/* soft ambient glow underneath */}
        <div className="receipt-ambient" aria-hidden="true" />

        <div className="receipt-body">

          {/* Header row */}
          <div className="receipt-header">
            <div className="receipt-dot" aria-hidden="true" />
            <span className="receipt-sent-label">Sent</span>
            <span className="receipt-id">#{receipt.id}</span>
          </div>

          {/* Hero */}
          <div className="receipt-hero">
            <h2 className="receipt-hero-headline">Bee&apos;s phone just buzzed.</h2>
            <p className="receipt-hero-sub">
              No IP. No fingerprint. Nothing left behind on our servers.
            </p>
          </div>

          {/* Meta chips row */}
          <div className="receipt-chips">
            <div className="receipt-chip">
              <span className="receipt-chip-label">tag</span>
              <span className="receipt-chip-val">#{receipt.tag}</span>
            </div>
            <div className="receipt-chip">
              <span className="receipt-chip-label">sent</span>
              <span className="receipt-chip-val">{timeString}</span>
            </div>
            <div className="receipt-chip receipt-chip--zero">
              <span className="receipt-chip-label">trackers</span>
              <span className="receipt-chip-val">0</span>
            </div>
          </div>

          {/* Dashed separator */}
          <div className="receipt-sep" aria-hidden="true" />

          {/* Rate limit meter */}
          <div className="receipt-quota">
            <div className="receipt-quota-row">
              <span className="receipt-quota-label">Daily pings</span>
              {isLimited ? (
                <span className="receipt-quota-badge receipt-quota-badge--full">Limit reached · resets midnight UTC</span>
              ) : (
                <span className="receipt-quota-badge">{remaining} / {receipt.dailyLimit} left</span>
              )}
            </div>

            {receipt.dailyLimit <= 10 ? (
              <div
                className="receipt-quota-track"
                role="meter"
                aria-valuenow={receipt.pingsToday}
                aria-valuemax={receipt.dailyLimit}
                aria-label={`${receipt.pingsToday} of ${receipt.dailyLimit} pings used today`}
              >
                {Array.from({ length: receipt.dailyLimit }).map((_, i) => (
                  <div
                    key={i}
                    className={`receipt-pill ${i < receipt.pingsToday ? "receipt-pill--used" : ""} ${phase !== "fly" && i < receipt.pingsToday ? "receipt-pill--lit" : ""}`}
                    style={{ transitionDelay: `${i * 110 + 200}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="receipt-quota-bar-track"
                role="meter"
                aria-valuenow={receipt.pingsToday}
                aria-valuemax={receipt.dailyLimit}
                aria-label={`${receipt.pingsToday} of ${receipt.dailyLimit} pings used today`}
              >
                <div
                  className={`receipt-quota-bar-fill ${phase !== "fly" ? "receipt-quota-bar-fill--lit" : ""}`}
                  style={{
                    width: `${Math.min(100, (receipt.pingsToday / receipt.dailyLimit) * 100)}%`,
                    transitionDelay: "200ms",
                  }}
                />
              </div>
            )}
          </div>

          {/* CTA */}
          {isLimited ? (
            <p className="receipt-limited">Come back tomorrow for more pings ✦</p>
          ) : (
            <button type="button" onClick={onReset} className="receipt-btn group">
              <RotateCcw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-rotate-180" strokeWidth={2.2} />
              <span>Send another</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

