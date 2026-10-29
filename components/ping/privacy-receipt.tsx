"use client";

import React, { useEffect, useState } from "react";
import { RotateCcw, Check, Sparkles, Radio } from "lucide-react";
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
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    // Play subtle mechanical receipt tick
    const timer = setTimeout(() => {
      setPrinted(true);
      pingAudio.playKeyClick(0.75);
    }, 180);
    return () => clearTimeout(timer);
  }, []);

  const remaining = Math.max(0, receipt.dailyLimit - receipt.pingsToday);
  const totalSlots = receipt.dailyLimit;

  return (
    <div className="w-full max-w-[480px] mx-auto py-2 flex flex-col items-center">
      {/* Top Terminal Feed Slot */}
      <div className="w-48 h-1.5 rounded-full bg-[#050508] border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] mb-[-2px] z-20 flex items-center justify-center">
        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#ff8ad1]/80 to-transparent animate-pulse" />
      </div>

      {/* The Dispensed Cyber-Ticket */}
      <div className="w-full relative animate-ticket-dispense z-10">
        {/* Holographic Glowing Frame */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-[#ff8ad1]/50 via-[#9b6bf0]/30 to-[#86d6f0]/40 shadow-[0_30px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(155,107,240,0.18)]">
          {/* Ticket Body */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#14141c] via-[#0d0d14] to-[#07070a] p-6 sm:p-7 backdrop-blur-2xl overflow-hidden font-mono">
            {/* Scanlines / CRT raster effect */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.8)_50%)] bg-[length:100%_4px]"
              aria-hidden="true"
            />
            {/* Diagonal gloss */}
            <div
              className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/[0.04] via-transparent to-transparent"
              aria-hidden="true"
            />

            {/* Header: Frequency / Transmission Delivered */}
            <div className="flex items-center justify-between border-b border-dashed border-white/15 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      DISPATCH DELIVERED
                    </span>
                    <span className="text-[10px] text-white/35">#{receipt.id}</span>
                  </div>
                  <span className="text-[11px] text-white/60 tracking-tight">
                    encrypted payload → phone
                  </span>
                </div>
              </div>

              {/* Status Tag Pill */}
              <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/10 text-[10px] text-[#ff8ad1] uppercase font-bold tracking-wider">
                #{receipt.tag}
              </span>
            </div>

            {/* Main Punchy Copy */}
            <div className="my-4 text-center">
              <div className="text-[20px] sm:text-[22px] font-sans font-medium text-white tracking-tight leading-tight">
                Bee&apos;s phone just buzzed.
              </div>
              <p className="text-[12px] text-white/50 font-sans mt-1">
                Zero logs. Your IP and browser signature were discarded in-flight.
              </p>
            </div>

            {/* Perforated Divider */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="w-full border-t border-dashed border-white/15" />
              <div className="absolute -left-8 w-4 h-4 rounded-full bg-[#1b1b1f]" />
              <div className="absolute -right-8 w-4 h-4 rounded-full bg-[#1b1b1f]" />
            </div>

            {/* 3-Slot Glowing LED Rate Limit Fuel Bar */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-3.5 mb-5">
              <div className="flex items-center justify-between text-[11px] mb-2.5">
                <span className="text-white/50 uppercase tracking-wider text-[10px] font-semibold">
                  Daily Quota
                </span>
                <span className="text-white/80">
                  <span className="text-[#ff8ad1] font-bold">{remaining}</span> / {totalSlots} remaining today
                </span>
              </div>

              {/* Glowing Segments */}
              <div className="grid grid-cols-3 gap-2 h-3 w-full">
                {Array.from({ length: totalSlots }).map((_, index) => {
                  const isUsed = index < receipt.pingsToday;
                  return (
                    <div
                      key={index}
                      className={`relative rounded-md transition-all duration-700 overflow-hidden border ${
                        isUsed
                          ? "bg-gradient-to-r from-[#ff8ad1] via-[#a78bfa] to-[#86d6f0] border-white/30 shadow-[0_0_12px_rgba(167,139,250,0.6)]"
                          : "bg-white/[0.04] border-white/10"
                      }`}
                    >
                      {isUsed && (
                        <div
                          className={`absolute inset-0 bg-white/40 transition-transform duration-1000 ${
                            printed ? "translate-x-full" : "-translate-x-full"
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center text-[10px] text-white/40 mt-2">
                <span>Resets 00:00 UTC</span>
                <span className="text-emerald-400/80 font-medium">● 0 trackers</span>
              </div>
            </div>

            {/* Send Another Action Button */}
            <button
              type="button"
              onClick={onReset}
              className="group relative w-full py-3 px-5 rounded-xl font-mono text-[12px] font-bold uppercase tracking-wider text-[#120e20] bg-gradient-to-r from-[#ff8ad1] via-[#a78bfa] to-[#86d6f0] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_6px_20px_rgba(167,139,250,0.35)] flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 duration-300" />
              <span>Send another note ↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}



