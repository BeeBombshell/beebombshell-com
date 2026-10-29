"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const remaining = Math.max(0, receipt.dailyLimit - receipt.pingsToday);
  const totalSlots = receipt.dailyLimit;

  return (
    <div className="w-full max-w-[460px] mx-auto py-4 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      {/* 1. Animated Success Icon with expanding soft halo */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Breathing halo back glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff8ad1]/30 via-[#9b6bf0]/30 to-[#86d6f0]/30 blur-xl animate-pulse scale-150" />
        
        {/* Floating Orb Badge */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-[#1b1b22] to-[#0d0d12] border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.25)]">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 stroke-[2.2] animate-in zoom-in-75 duration-300" />
        </div>
      </div>

      {/* 2. Primary Delivered Status */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
            Delivered
          </span>
          <span className="text-white/20">·</span>
          <span className="font-mono text-[10px] text-white/50">
            #{receipt.id}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-normal text-white tracking-tight">
          Bee&apos;s phone just buzzed.
        </h3>
        <p className="text-sm text-white/50 mt-1 font-sans">
          Zero logs kept. Your IP and browser identity were never recorded.
        </p>
      </div>

      {/* 3. Rate Limit Meter (Sleek battery / segment indicator) */}
      <div className="w-full rounded-2xl bg-white/[0.03] border border-white/10 p-4 mb-6 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-mono mb-2.5">
          <span className="text-white/60">Daily transmission quota</span>
          <span className="font-medium text-white/90">
            <span className="text-[#ff8ad1] font-semibold">{remaining}</span> of {totalSlots} remaining today
          </span>
        </div>

        {/* Segmented Slot Bars */}
        <div className="grid grid-cols-3 gap-2 h-2.5 w-full">
          {Array.from({ length: totalSlots }).map((_, index) => {
            const isUsed = index < receipt.pingsToday;
            return (
              <div
                key={index}
                className={`relative rounded-full transition-all duration-700 overflow-hidden ${
                  isUsed
                    ? "bg-gradient-to-r from-[#ff8ad1] via-[#a78bfa] to-[#86d6f0] shadow-[0_0_10px_rgba(167,139,250,0.5)]"
                    : "bg-white/10"
                }`}
              >
                {isUsed && (
                  <div
                    className={`absolute inset-0 bg-white/30 transition-transform duration-1000 ${
                      mounted ? "translate-x-full" : "-translate-x-full"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-white/40 mt-2">
          <span>Resets midnight UTC</span>
          <span className="text-white/50">#{receipt.tag}</span>
        </div>
      </div>

      {/* 4. Action: Send Another Button */}
      <button
        type="button"
        onClick={onReset}
        className="group relative inline-flex items-center justify-center gap-2 w-full max-w-xs py-3 px-6 rounded-xl font-mono text-[12px] font-bold uppercase tracking-wider text-[#120e20] bg-gradient-to-r from-[#ff8ad1] via-[#a78bfa] to-[#86d6f0] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(167,139,250,0.35)]"
      >
        <RotateCcw className="w-3.5 h-3.5 transition-transform group-hover:-rotate-90 duration-300" />
        <span>Send another note ↵</span>
      </button>
    </div>
  );
}


