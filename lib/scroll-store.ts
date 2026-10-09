/**
 * scroll-store.ts
 * Shared scroll progress S = clamp(-heroTop / (heroHeight * 0.9), 0, 1),
 * smoothed with lerp 0.08. Used by the particle engine, hero copy, and badge.
 */

type Listener = () => void;

let s = 0; // raw target
let sSmooth = 0; // lerped value
let rafId = 0;
let heroRef: HTMLElement | null = null;
const listeners = new Set<Listener>();

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function tick() {
  if (!heroRef) {
    rafId = requestAnimationFrame(tick);
    return;
  }
  const rect = heroRef.getBoundingClientRect();
  const raw = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.9)));
  s = raw;
  const next = lerp(sSmooth, s, 0.08);
  if (Math.abs(next - sSmooth) > 0.0001) {
    sSmooth = next;
    listeners.forEach((l) => l());
  }
  rafId = requestAnimationFrame(tick);
}

export const scrollStore = {
  /** Call with the hero element to start tracking. */
  setHeroElement(el: HTMLElement | null) {
    heroRef = el;
    if (el && !rafId) {
      rafId = requestAnimationFrame(tick);
    }
    if (!el) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  },

  /** Current smoothed scroll progress (0–1). */
  get s() {
    return sSmooth;
  },

  /** Subscribe to changes. Returns unsubscribe fn. */
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
