"use client";

import React, { useRef, useState, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { PingCable } from "./ping-cable";
import { PingPad } from "./ping-pad";
import { PingBurst, type PingBurstHandle } from "./ping-burst";
import { PrivacyReceipt, type ReceiptData } from "./privacy-receipt";
import { useRegisterTextBlock } from "@/components/particles/use-particles";
import { COPY } from "@/lib/copy";
import "./ping.css";

export function PingPageContent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const burstRef = useRef<PingBurstHandle | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Register bounding boxes with the background particle engine for text-aware dimming
  useRegisterTextBlock("ping-container", containerRef);
  useRegisterTextBlock("ping-card", cardRef);
  useRegisterTextBlock("ping-footer", footerRef);

  const handleSendStart = useCallback(() => {
    setIsSending(true);
  }, []);

  const handleSendEnd = useCallback(() => {
    setIsSending(false);
  }, []);

  const handleSendSuccess = useCallback((receiptData: ReceiptData) => {
    setReceipt(receiptData);
    burstRef.current?.burst();
  }, []);

  const handleReset = useCallback(() => {
    setReceipt(null);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex flex-col items-center justify-start font-sans"
    >
      {/* Ambient glowing spotlight behind card */}
      <div className="ping-ambient-spotlight" aria-hidden="true" />

      {/* 80-pixel burst canvas and ambient particles */}
      <PingBurst ref={burstRef} />

      {/* Main Glass Card (matches ID card on the home page) */}
      <div
        ref={cardRef}
        className="ping-outer-card w-full max-w-2xl px-6 py-10 sm:px-12 sm:py-14 flex flex-col items-center z-10 transition-all duration-300"
      >
        {/* Dot grid texture & specular glare overlay */}
        <div className="ping-dots-grid" aria-hidden="true" />
        <div className="ping-glare" aria-hidden="true" />

        {/* Card Header Content */}
        <div className="relative z-10 text-center max-w-xl mx-auto mb-4">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#ff8ad1] animate-pulse"
              aria-hidden="true"
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/60">
              {COPY.ping.eyebrow}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.035em] text-white leading-[1.12] mb-3">
            {COPY.ping.headlineLead}
            <span className="ping-accent-text italic font-medium">
              {COPY.ping.headlineAccent}
            </span>
          </h1>

          {/* Explainer */}
          <p className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed font-normal max-w-md mx-auto">
            {receipt
              ? "Your note was delivered into Bee's notification stream. Zero identifiers remain on our servers."
              : COPY.ping.explainer}
          </p>
        </div>

        {/* Cable fading in above the pad (only when writing) */}
        {!receipt && <PingCable isSending={isSending} />}

        {/* Interactive Macro Pad (Visible before submit) */}
        {!receipt && (
          <PingPad
            onSendSuccess={handleSendSuccess}
            onSendStart={handleSendStart}
            onSendEnd={handleSendEnd}
            isSending={isSending}
          />
        )}

        {/* Privacy Receipt Ticket Display after sending */}
        {receipt && (
          <div className="w-full my-3">
            <PrivacyReceipt receipt={receipt} onReset={handleReset} />
          </div>
        )}

        {/* Disclosure Copy & Hints (Only visible when composing) */}
        {!receipt && (
          <div className="relative z-10 mt-9 text-center max-w-lg mx-auto">
            <p className="text-[12px] sm:text-[13px] text-white/60 leading-relaxed font-sans border-t border-white/10 pt-5">
              {COPY.ping.disclosure}
            </p>

            {/* Footer keyboard navigation hint */}
            <div className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-white/40">
              <span>{COPY.ping.footerHint}</span>
            </div>
          </div>
        )}
      </div>

      {/* Credit note at bottom */}
      <footer
        ref={footerRef}
        className="relative z-10 mt-8 mb-4 text-center font-mono text-[11px] sm:text-[12px] text-white/40 flex items-center justify-center gap-1.5 tracking-wide select-none"
      >
        <span>{COPY.ping.credit}</span>
        <a
          href={COPY.ping.creditUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/65 hover:text-white transition-colors underline decoration-white/20 hover:decoration-white/60 underline-offset-4 inline-flex items-center gap-0.5 group"
        >
          <span>{COPY.ping.creditProject}</span>
          <ArrowUpRight className="w-3 h-3 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </footer>
    </div>
  );
}

