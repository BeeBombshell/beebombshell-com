"use client";

import React, { useEffect, useState } from "react";

export function CoordinateReadout({ className = "" }: { className?: string }) {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  const formatPad = (num: number) => num.toString().padStart(4, "0");

  return (
    <span
      className={`font-mono text-[11px] tracking-widest text-[var(--mut)] select-none tabular-nums ${className}`}
      aria-hidden="true"
    >
      X:{formatPad(coords.x)} · Y:{formatPad(coords.y)}
    </span>
  );
}
