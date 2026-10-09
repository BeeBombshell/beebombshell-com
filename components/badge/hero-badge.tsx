"use client";

import React, { useSyncExternalStore } from "react";
import { Badge } from "./Badge";
import { COPY } from "@/lib/copy";
import { useBookingStore } from "@/lib/booking-store";
import { useLlmsStore } from "@/lib/llms-store";
import { useParticleEngine } from "@/components/particles/use-particles";
import { scrollStore } from "@/lib/scroll-store";
import { ArrowUpRight, ArrowRight, Calendar, FileText } from "lucide-react";

export function HeroBadge({ className = "" }: { className?: string }) {
  const { open: openBooking } = useBookingStore();
  const { open: openLlms } = useLlmsStore();
  const { impulse } = useParticleEngine();

  // Scroll coupling: smooth progress S drives negative anchor offset
  const s = useSyncExternalStore(
    scrollStore.subscribe,
    () => scrollStore.s,
    () => 0
  );
  // Negative offset lifts anchors as user scrolls, swinging card up and out
  const anchorOffset = -s * 260;

  const handleFlip = ({ x, y }: { x: number; y: number }) => {
    impulse(x, y, 360, 11);
  };

  const handleCenter = ({ x, y }: { x: number; y: number }) => {
    if (typeof window !== "undefined" && window.__particleEngine) {
      window.__particleEngine.setCenter(
        "burst",
        x / window.innerWidth,
        y / window.innerHeight
      );
    }
  };

  const badgeCopy = {
    label: COPY.card.label,
    meta: COPY.card.meta,
    headline: COPY.card.headline,
    accent: COPY.card.headlineAccent,
    bio: COPY.card.bio,
    chips: [...COPY.card.chips],
    spec: COPY.card.spec,
    hint: COPY.card.hint,
    back: {
      label: COPY.card.back.label,
      actions: [
        {
          icon: <Calendar className="w-3.5 h-3.5" />,
          text: COPY.card.back.book,
          onClick: () => openBooking(),
        },
        {
          icon: <ArrowRight className="w-3.5 h-3.5" />,
          text: COPY.card.back.writing,
          onClick: () => {
            window.location.href = "/work";
          },
        },
        {
          icon: <FileText className="w-3.5 h-3.5" />,
          text: COPY.card.back.llms,
          onClick: () => openLlms("standard"),
        },
        {
          icon: <ArrowUpRight className="w-3.5 h-3.5" />,
          text: COPY.card.back.x,
          onClick: () => {
            window.open("https://x.com/Bee_Bombshell", "_blank", "noopener,noreferrer");
          },
        },
      ],
    },
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <Badge
        copy={badgeCopy}
        anchorOffset={anchorOffset}
        onFlip={handleFlip}
        onCenter={handleCenter}
      />
    </div>
  );
}
