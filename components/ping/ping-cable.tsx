"use client";

import React from "react";

interface PingCableProps {
  isSending: boolean;
}

export function PingCable({ isSending }: PingCableProps) {
  return (
    <div className="relative flex justify-center w-full h-[36px] sm:h-[72px] pointer-events-none select-none overflow-visible -mb-2 z-10">
      <svg
        className="w-28 h-full overflow-visible"
        viewBox="0 0 112 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle gradient along the rubber cable */}
          <linearGradient id="cable-sheath" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e1e24" stopOpacity="0.2" />
            <stop offset="40%" stopColor="#2c2c34" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3d3d48" stopOpacity="1" />
          </linearGradient>

          {/* Electric pulse gradient on send */}
          <linearGradient id="pulse-grad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ff8ad1" />
            <stop offset="45%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#86d6f0" />
          </linearGradient>

          {/* Glow filter for the pulse */}
          <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Ambient faint background wire */}
        <path
          d="M 56 0 C 56 28, 56 42, 56 68"
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* 2. Main cable body with braided rubber texture */}
        <path
          d="M 56 0 C 56 28, 56 42, 56 68"
          stroke="url(#cable-sheath)"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* 3. Center highlight vein */}
        <path
          d="M 56 0 C 56 28, 56 42, 56 68"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />

        {/* 4. Active light pulse running upward when message sends */}
        {isSending && (
          <path
            d="M 56 68 C 56 42, 56 28, 56 0"
            stroke="url(#pulse-grad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#pulse-glow)"
            className="animate-cable-pulse"
          />
        )}

        {/* 5. Strain relief plug collar entering the pad */}
        <rect
          x="48"
          y="62"
          width="16"
          height="12"
          rx="3"
          fill="#16161a"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1"
        />
        {/* Metal ring accent on plug */}
        <line
          x1="50"
          y1="67"
          x2="62"
          y2="67"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1"
        />
        <rect
          x="51"
          y="72"
          width="10"
          height="4"
          rx="1"
          fill={isSending ? "#ff8ad1" : "#86d6f0"}
          className="transition-colors duration-200"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}
