"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { pingAudio } from "./ping-audio";
import { type ReceiptData } from "./privacy-receipt";

const TAGS = ["compliment", "question", "roast", "confession", "secret"] as const;
type Tag = (typeof TAGS)[number];

const PROMPTS = [
  "What did you never say at standup?",
  "What feature should I build next?",
  "Roast my site, don't hold back.",
  "What's your most controversial engineering opinion?",
  "Tell me something you've never told anyone online.",
  "Drop a hot take I'd secretly agree with.",
  "What is your all-time favorite developer tool?",
];

const DAILY_LIMIT = 3;

interface PingPadProps {
  onSendSuccess: (receipt: ReceiptData) => void;
  onSendStart: () => void;
  onSendEnd: () => void;
  isSending: boolean;
}

export function PingPad({
  onSendSuccess,
  onSendStart,
  onSendEnd,
  isSending,
}: PingPadProps) {
  const [tagIndex, setTagIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [hp, setHp] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [litKeyId, setLitKeyId] = useState<string | null>(null);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);
  const [isShredding, setIsShredding] = useState(false);
  const [isBumping, setIsBumping] = useState(false);
  const [levelBars, setLevelBars] = useState([20, 45, 75, 50, 30]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);

  // Mouse tilt & spotlight tracking
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  const padWrapperRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const litTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentTag = TAGS[tagIndex];
  const currentPrompt = PROMPTS[promptIndex];

  // Helper to show temporary toast
  const showToast = useCallback((msg: string, duration = 3500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  // Daily limit tracker in localStorage
  useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const raw = localStorage.getItem("beebombshell_ping_daily");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.date === today) {
          setDailyCount(parsed.count || 0);
        } else {
          localStorage.setItem(
            "beebombshell_ping_daily",
            JSON.stringify({ date: today, count: 0 })
          );
          setDailyCount(0);
        }
      }
    } catch {
      // LocalStorage access fallback
    }
  }, []);

  // 3D Tilt and Spotlight tracking
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const wrapper = padWrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2; // -1 to 1
    const normY = (y / rect.height - 0.5) * 2; // -1 to 1

    const rotX = -normY * 2.2; // very subtle max 2.2 deg
    const rotY = normX * 2.8; // very subtle max 2.8 deg

    const sx = Math.round((normX * 0.5 + 0.5) * 100);
    const sy = Math.round((normY * 0.5 + 0.5) * 100);

    setTiltStyle({
      transform: `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
      // @ts-expect-error CSS variable
      "--sx": `${sx}%`,
      "--sy": `${sy}%`,
    });

    setEyeOffset({
      x: normX * 1.5,
      y: normY * 1.0,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: "perspective(1200px) rotateX(0deg) rotateY(0deg)",
      // @ts-expect-error CSS variable
      "--sx": "30%",
      "--sy": "0%",
    });
    setEyeOffset({ x: 0, y: 0 });
  }, []);


  // Audio level bar animations
  const bumpLevelBars = useCallback(() => {
    setLevelBars([
      Math.floor(25 + Math.random() * 75),
      Math.floor(35 + Math.random() * 65),
      Math.floor(45 + Math.random() * 55),
      Math.floor(30 + Math.random() * 70),
      Math.floor(20 + Math.random() * 80),
    ]);
  }, []);

  // Temporarily light up a random key during typing
  const flashRandomKey = useCallback(() => {
    const keyIds = ["tag", "up", "sound", "left", "down", "right", "reject", "mic"];
    const randomKey = keyIds[Math.floor(Math.random() * keyIds.length)];
    setLitKeyId(randomKey);

    if (litTimeoutRef.current) clearTimeout(litTimeoutRef.current);
    litTimeoutRef.current = setTimeout(() => {
      setLitKeyId(null);
    }, 140);
  }, []);

  // Cycle tag
  const nextTag = useCallback(() => {
    setTagIndex((prev) => (prev + 1) % TAGS.length);
    pingAudio.playKeyClick(0.9);
    bumpLevelBars();
  }, [bumpLevelBars]);

  const prevTag = useCallback(() => {
    setTagIndex((prev) => (prev - 1 + TAGS.length) % TAGS.length);
    pingAudio.playKeyClick(0.9);
    bumpLevelBars();
  }, [bumpLevelBars]);

  // Cycle prompt
  const nextPrompt = useCallback(() => {
    setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
    pingAudio.playKeyClick(0.85);
    bumpLevelBars();
  }, [bumpLevelBars]);

  const prevPrompt = useCallback(() => {
    setPromptIndex((prev) => (prev - 1 + PROMPTS.length) % PROMPTS.length);
    pingAudio.playKeyClick(0.85);
    bumpLevelBars();
  }, [bumpLevelBars]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    pingAudio.setMuted(!nextState);
    if (nextState) {
      pingAudio.playKeyClick(1.2);
    }
  }, [soundEnabled]);

  // Reject / Clear draft
  const handleReject = useCallback(() => {
    if (!message) return;
    pingAudio.playRejectSound();
    setIsShredding(true);
    setTimeout(() => {
      setMessage("");
      setIsShredding(false);
    }, 450);
  }, [message]);

  // Send ping
  const handleSend = useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      showToast("Write a note on the pad screen first!");
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 500) {
      showToast("Message exceeds the 500 character limit.");
      return;
    }

    if (dailyCount >= DAILY_LIMIT) {
      showToast(`Daily limit of ${DAILY_LIMIT} pings reached. Come back tomorrow!`);
      return;
    }

    // Trigger bump animation
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 500);

    onSendStart();
    const endpoint =
      process.env.NEXT_PUBLIC_PING_ENDPOINT || "/api/ping";

    try {
      const formattedMessage = `[${currentTag}] ${trimmed}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: formattedMessage,
          hp: hp,
        }),
      });

      if (!res.ok) {
        throw new Error("Bad status: " + res.status);
      }

      const data = await res.json().catch(() => ({}));

      // Update daily count
      const newCount = dailyCount + 1;
      setDailyCount(newCount);
      try {
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem(
          "beebombshell_ping_daily",
          JSON.stringify({ date: today, count: newCount })
        );
      } catch {
        // LocalStorage fallback
      }

      // Success sequence
      pingAudio.playSendChime();
      setMessage("");
      showToast("Delivered. Bee's phone just buzzed.");

      // Generate receipt
      const receiptId = (data.receiptId || Math.random().toString(36).substring(2, 9)).toUpperCase();
      const hashKey =
        data.hashKey ||
        Array.from({ length: 32 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join("");

      onSendSuccess({
        id: receiptId,
        tag: currentTag,
        timestamp: new Date().toISOString(),
        hashKey,
        pingsToday: newCount,
        dailyLimit: DAILY_LIMIT,
      });
    } catch {
      showToast("Couldn't send. Press Enter to retry.");
    } finally {
      onSendEnd();
    }
  }, [
    message,
    dailyCount,
    hp,
    currentTag,
    onSendStart,
    onSendEnd,
    onSendSuccess,
    showToast,
  ]);

  // Physical keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isFocusedInTextarea = activeEl === textareaRef.current;

      // Inside textarea: Ctrl/Cmd + Enter sends
      if (isFocusedInTextarea) {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          handleSend();
        }
        return;
      }

      // Outside textarea: Macro pad shortcuts
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          prevPrompt();
          triggerKeyVisual("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          nextPrompt();
          triggerKeyVisual("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          prevTag();
          triggerKeyVisual("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          nextTag();
          triggerKeyVisual("right");
          break;
        case "Enter":
          e.preventDefault();
          handleSend();
          triggerKeyVisual("enter");
          break;
        case "Escape":
        case "Backspace":
          e.preventDefault();
          handleReject();
          triggerKeyVisual("reject");
          break;
        case "t":
        case "T":
          e.preventDefault();
          nextTag();
          triggerKeyVisual("tag");
          break;
        case "s":
        case "S":
          e.preventDefault();
          toggleSound();
          triggerKeyVisual("sound");
          break;
      }
    };

    const triggerKeyVisual = (id: string) => {
      setPressedKeyId(id);
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current);
      pressedTimeoutRef.current = setTimeout(() => {
        setPressedKeyId(null);
      }, 150);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSend, handleReject, nextPrompt, prevPrompt, nextTag, prevTag, toggleSound]);

  // Prevent mousedown default on keys so textarea stays focused on mobile
  const handleKeyMouseDown = (e: React.MouseEvent) => {
    if (document.activeElement === textareaRef.current) {
      e.preventDefault();
    }
  };

  return (
    <div
      className="ping-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={padWrapperRef}
        style={tiltStyle}
        className={`ping-pad-wrapper ${isBumping ? "is-bumping" : ""} ${
          message.length > 0 ? "is-typing" : ""
        } ${isSending ? "is-sending" : ""}`}
      >
        {/* Blurred conic gradient breathing halo */}
        <div className="ping-halo" aria-hidden="true" />

        <div className="ping-shell-wrap">
          {/* Rotating gradient rim behind */}
          <div className="ping-shape ping-rim" aria-hidden="true" />

          {/* Black body scaled to 99.2% on top */}
          <div className="ping-shape ping-shell">
            <div className="ping-body">
              {/* 1. Head Row: Left eye, status strip, Right eye */}
              <div className="ping-head" aria-hidden="true">
                <div
                  className={`ping-eye ${isSending ? "is-squinting" : ""}`}
                  style={{
                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                  }}
                />

                <div
                  className="ping-oled"
                  role="status"
                  aria-live="polite"
                  aria-label={`Tag: ${currentTag}`}
                >
                  <span className="font-mono text-[11px] text-[#ff8ad1] select-none">
                    ‹
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-white font-medium">
                    {currentTag}
                  </span>
                  <span className="font-mono text-[11px] text-[#ff8ad1] select-none">
                    ›
                  </span>

                  <div className="ping-level-bars ml-1.5" aria-hidden="true">
                    {levelBars.map((lvl, idx) => (
                      <div
                        key={idx}
                        className={`ping-level-bar ${
                          message.length > 0 || isSending ? "active" : ""
                        }`}
                        style={{ height: `${lvl}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div
                  className={`ping-eye ${isSending ? "is-squinting" : ""}`}
                  style={{
                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                  }}
                />
              </div>

              {/* 2. Screen (Textarea input wrapped in label) */}
              <label
                htmlFor="ping-msg"
                className={`ping-screen ${isShredding ? "is-shredding" : ""}`}
              >
                <div className="ping-screen-top">
                  <span className="ping-prompt" aria-hidden="true">
                    &gt;
                  </span>
                  <textarea
                    id="ping-msg"
                    ref={textareaRef}
                    maxLength={500}
                    value={message}
                    disabled={isSending}
                    placeholder={currentPrompt}
                    aria-label="Your anonymous message"
                    onChange={(e) => {
                      setMessage(e.target.value);
                      bumpLevelBars();
                      flashRandomKey();
                      pingAudio.playKeyClick(0.7);
                    }}
                    className="ping-textarea"
                  />
                </div>

                {/* Honeypot hidden off-screen */}
                <input
                  type="text"
                  name="hp"
                  value={hp}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="ping-hp"
                  onChange={(e) => setHp(e.target.value)}
                />

                <div className="ping-screen-bottom">
                  <span
                    className={`ping-count ${
                      message.length >= 450 ? "near-limit" : ""
                    }`}
                  >
                    {message.length}/500
                  </span>
                </div>
              </label>

              {/* 3. Keys Grid (7-column, 3-row) */}
              <div className="ping-keys" role="group" aria-label="Pad controls">
                {/* Row 1 / Col 1-2: Tag */}
                <button
                  type="button"
                  aria-label={`Cycle tag. Current: ${currentTag}`}
                  style={{ gridColumn: "1 / span 2", gridRow: 1 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={nextTag}
                  className={`ping-key ${
                    litKeyId === "tag" ? "is-lit" : ""
                  } ${pressedKeyId === "tag" ? "is-pressed" : ""}`}
                >
                  <span className="flex items-center justify-center gap-1 w-full px-1">
                    <span className="text-[9px] uppercase tracking-wider text-white/40">#</span>
                    <span className="truncate font-semibold tracking-wide text-white/95">
                      {currentTag}
                    </span>
                  </span>
                </button>

                {/* Row 1 / Col 4: Up prompt */}
                <button
                  type="button"
                  aria-label="Previous prompt"
                  style={{ gridColumn: 4, gridRow: 1 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={prevPrompt}
                  className={`ping-key ${
                    litKeyId === "up" ? "is-lit" : ""
                  } ${pressedKeyId === "up" ? "is-pressed" : ""}`}
                >
                  ▲
                </button>

                {/* Row 1 / Col 6-7: Sound toggle */}
                <button
                  type="button"
                  aria-label={`Toggle sound effects. Currently ${
                    soundEnabled ? "on" : "off"
                  }`}
                  style={{ gridColumn: "6 / span 2", gridRow: 1 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={toggleSound}
                  className={`ping-key ${
                    soundEnabled ? "border-[#ff8ad1]/40 text-white" : "text-white/60"
                  } ${litKeyId === "sound" ? "is-lit" : ""} ${
                    pressedKeyId === "sound" ? "is-pressed" : ""
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span>{soundEnabled ? "🔊" : "🔈"}</span>
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-white/70">
                      {soundEnabled ? "sfx: on" : "sfx: off"}
                    </span>
                  </span>
                </button>


                {/* Row 2 / Col 3: Left tag */}
                <button
                  type="button"
                  aria-label="Previous tag"
                  style={{ gridColumn: 3, gridRow: 2 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={prevTag}
                  className={`ping-key ${
                    litKeyId === "left" ? "is-lit" : ""
                  } ${pressedKeyId === "left" ? "is-pressed" : ""}`}
                >
                  ◄
                </button>

                {/* Row 2 / Col 4: Down prompt */}
                <button
                  type="button"
                  aria-label="Next prompt"
                  style={{ gridColumn: 4, gridRow: 2 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={nextPrompt}
                  className={`ping-key ${
                    litKeyId === "down" ? "is-lit" : ""
                  } ${pressedKeyId === "down" ? "is-pressed" : ""}`}
                >
                  ▼
                </button>

                {/* Row 2 / Col 5: Right tag */}
                <button
                  type="button"
                  aria-label="Next tag"
                  style={{ gridColumn: 5, gridRow: 2 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={nextTag}
                  className={`ping-key ${
                    litKeyId === "right" ? "is-lit" : ""
                  } ${pressedKeyId === "right" ? "is-pressed" : ""}`}
                >
                  ►
                </button>

                {/* Row 3 / Col 1-2: Reject (Clear) */}
                <button
                  type="button"
                  aria-label="Clear draft message"
                  style={{ gridColumn: "1 / span 2", gridRow: 3 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={handleReject}
                  className={`ping-key ping-key-reject ${
                    litKeyId === "reject" ? "is-lit" : ""
                  } ${pressedKeyId === "reject" ? "is-pressed" : ""}`}
                >
                  ✕ clear
                </button>

                {/* Row 3 / Col 3-6: Enter (Send) */}
                <button
                  type="button"
                  aria-label="Send message"
                  disabled={isSending}
                  style={{ gridColumn: "3 / span 4", gridRow: 3 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={handleSend}
                  className={`ping-key ping-key-enter ${
                    pressedKeyId === "enter" ? "is-pressed" : ""
                  }`}
                >
                  {isSending ? "SENDING..." : "SEND ↵"}
                </button>

                {/* Row 3 / Col 7: Mic (Disabled for privacy) */}
                <button
                  type="button"
                  aria-label="Voice input disabled for privacy"
                  style={{ gridColumn: 7, gridRow: 3 }}
                  onMouseDown={handleKeyMouseDown}
                  onClick={() => {
                    pingAudio.playKeyClick(0.7);
                    showToast(
                      "Voice is disabled on purpose: browser speech APIs can send audio to third parties. Your privacy comes first."
                    );
                  }}
                  className={`ping-key ${
                    litKeyId === "mic" ? "is-lit" : ""
                  } text-white/50 hover:text-white`}
                >
                  🎙
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Toast Banner */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[#121217]/95 px-5 py-2.5 font-mono text-[12px] text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8ad1] animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
