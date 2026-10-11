/**
 * particle-engine.ts
 * Core Canvas 2D particle engine for BeeBombshell.com.
 *
 * Design spec: design.md §Particle system
 * Plan spec:   plan.md §Phase 2
 *
 * Architecture:
 *  - One fixed canvas behind everything
 *  - ~1500 particles on desktop, scaled by viewport + device
 *  - Modes: burst | lattice | contours | writing | llms
 *  - Cursor repel, click burst, pastel palette per theme
 *  - Text-aware dimming: registered rects fade nearby particles
 *  - Lenis scroll progress drives burst→lattice morph
 *  - prefers-reduced-motion: one static frame
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticleMode = "burst" | "lattice" | "contours" | "writing" | "footer" | "llms";
export type Theme = "light" | "dark";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number; // target x
  ty: number; // target y
  relTx?: number;
  relTy?: number;
  size: number;
  colorIdx: number;
  baseOpacity: number;
  opacity: number;
  // writing mode: dash length / angle
  dashLen: number;
  dashAngle: number;
}

interface RegisteredRect {
  id: string;
  getRect: () => DOMRect | null;
  cached: DOMRect | null;
  lastRefresh: number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE_LIGHT = ["#9d8df5", "#c58cec", "#f08fc6", "#7fd2e6", "#b5a6ff", "#f7a6d1"];
const PALETTE_DARK  = ["#b3a6ff", "#d5b0f5", "#ffb3dc", "#a6e6f2", "#c9c0ff", "#fcc4e3"];

// ─── Physics constants (design.md §Physics) ───────────────────────────────────

const SPRING       = 0.018;   // toward target
const DAMPING      = 0.86;    // per frame
const REPEL_R      = 90;      // cursor repel radius px
const REPEL_F      = 1.6;     // cursor repel force
const CLICK_R      = 260;     // click burst radius px
const CLICK_F      = 14;      // click burst force

// Hysteresis thresholds for scroll morph (plan.md §Phase 2)
const S_TO_LATTICE = 0.45;
const S_TO_BURST   = 0.40;

// ─── Engine ───────────────────────────────────────────────────────────────────

export class ParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private mode: ParticleMode = "burst";
  private pendingMode: ParticleMode | null = null;
  private theme: Theme = "light";
  private reducedMotion: boolean;
  private rafId = 0;
  private paused = false;
  private frameCount = 0;

  // Cursor state
  private cx = -9999;
  private cy = -9999;

  // Registered rects for text-aware dimming
  private rects: RegisteredRect[] = [];

  // Mode center percents
  private modeCenter: Record<ParticleMode, [number, number]> = {
    burst:    [0.50, 0.42],
    lattice:  [0.50, 0.50],
    contours: [0.50, 0.50],
    writing:  [0.50, 0.50],
    footer:   [0.50, 0.85],
    llms:     [0.50, 0.50],
  };

  private particleCount = 0;
  private dpr = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.init();
  }

  // ── Initialise / resize ─────────────────────────────────────────────────────

  private init() {
    this.resize();
    window.addEventListener("resize", () => this.resize(), { passive: true });

    // Visibility: pause when hidden
    document.addEventListener("visibilitychange", () => {
      this.paused = document.hidden;
      if (!this.paused && !this.rafId) this.start();
    });

    this.buildParticles();
    this.retarget(this.mode);

    if (this.reducedMotion) {
      this.drawFrame();
    } else {
      this.start();
    }
  }

  private resize() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width  = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.canvas.style.width  = W + "px";
    this.canvas.style.height = H + "px";

    this.ctx.scale(this.dpr, this.dpr);

    // Scale particle count: ~1000-1250 at 1920×1080, down to 450 on mobile for fluid 60-120fps on all systems
    const area = W * H;
    const base = Math.round(1150 * (area / (1920 * 1080)));
    this.particleCount = Math.max(450, Math.min(1250, base));

    // Rebuild if count changed significantly
    if (Math.abs(this.particles.length - this.particleCount) > 80) {
      this.buildParticles();
      this.retarget(this.mode);
    }
  }

  private buildParticles() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const n = this.particleCount;
    this.particles = Array.from({ length: n }, (_, i) => {
      const xFrac = i / n;
      // Color index: left-to-right cool-to-warm with gaussian noise
      const colorIdx = Math.max(0, Math.min(5, Math.floor(xFrac * 6 + (Math.random() - 0.5) * 0.3 * 6)));
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: 0,
        vy: 0,
        tx: Math.random() * W,
        ty: Math.random() * H,
        relTx: 0,
        relTy: 0,
        size: 1.0 + Math.random() * 0.9, // 1.0 to 1.9px per design.md
        colorIdx,
        baseOpacity: this.theme === "light" ? 0.80 + Math.random() * 0.1 : 0.85 + Math.random() * 0.1,
        opacity: 0,
        dashLen: 4 + Math.random() * 8,
        dashAngle: Math.random() * Math.PI * 2,
      };
    });
    // Sort by colorIdx so canvas fillStyle switches are minimized to at most 6 per frame
    this.particles.sort((a, b) => a.colorIdx - b.colorIdx);
  }

  // ── Targeting ───────────────────────────────────────────────────────────────

  private retarget(mode: ParticleMode) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const [cx, cy] = this.modeCenter[mode].map((p, i) => p * (i === 0 ? W : H));

    switch (mode) {
      case "burst":    this.targetBurst(cx, cy, W, H); break;
      case "lattice":  this.targetLattice(cx, cy, W, H); break;
      case "contours": this.targetContours(W, H); break;
      case "writing":  this.targetWriting(W, H); break;
      case "footer":   this.targetFooter(W, H); break;
      case "llms":     this.targetContours(W, H); break; // same as contours, dimmed
    }
  }

  private targetBurst(cx: number, cy: number, W: number, H: number) {
    const n = this.particles.length;
    const coreCount = Math.floor(n * 0.35); // Dense core
    const rayCount  = n - coreCount;
    const rays = 8;

    this.particles.forEach((p, i) => {
      if (i < coreCount) {
        // Gaussian core, radius ~120px
        const r = Math.abs(gaussianRandom()) * 110;
        const angle = Math.random() * Math.PI * 2;
        p.relTx = Math.cos(angle) * r;
        p.relTy = Math.sin(angle) * r;
        p.tx = cx + p.relTx;
        p.ty = cy + p.relTy;
      } else {
        // 8 tapered rays, distance 60–420px
        const ray = Math.floor(((i - coreCount) / rayCount) * rays);
        const baseAngle = (ray / rays) * Math.PI * 2;
        const spread = 0.14 * (1 - (i - coreCount) / rayCount); // tapers
        const angle = baseAngle + (Math.random() - 0.5) * spread * 2;
        const dist = 60 + Math.pow(Math.random(), 0.75) * 360;
        p.relTx = Math.cos(angle) * dist;
        p.relTy = Math.sin(angle) * dist;
        p.tx = Math.max(10, Math.min(W - 10, cx + p.relTx));
        p.ty = Math.max(10, Math.min(H - 10, cy + p.relTy));
      }
    });
  }

  private targetFooter(W: number, H: number) {
    // Low density drift in bottom margin
    this.particles.forEach((p) => {
      p.tx = Math.random() * W;
      p.ty = H * 0.5 + Math.random() * (H * 0.5);
    });
  }

  private targetLattice(cx: number, cy: number, W: number, H: number) {
    // Isometric lattice: axes (34,19), (-34,19), (0,-38), cell 34×19
    const ax1x = 34, ax1y = 19;
    const ax2x = -34, ax2y = 19;

    // How many lattice points fit: tile a grid and pick the N closest to center
    const cols = Math.ceil(W / 34) + 2;
    const rowsH = Math.ceil(H / 19) + 2;
    const pts: Array<[number, number]> = [];

    for (let r = -rowsH; r <= rowsH; r++) {
      for (let c = -cols; c <= cols; c++) {
        const x = cx + c * ax1x + r * ax2x;
        const y = cy + c * ax1y + r * ax2y;
        if (x > -50 && x < W + 50 && y > -50 && y < H + 50) {
          pts.push([x, y]);
        }
      }
    }

    // Sort by distance from center and assign
    pts.sort((a, b) => dist2(a[0], a[1], cx, cy) - dist2(b[0], b[1], cx, cy));

    this.particles.forEach((p, i) => {
      const pt = pts[i % pts.length];
      p.tx = pt[0] + (Math.random() - 0.5) * 3;
      p.ty = pt[1] + (Math.random() - 0.5) * 3;
    });
  }

  private targetContours(W: number, H: number) {
    // Horizontal contour lines every 26px, displaced by two sines
    const lineSpacing = 26;
    const numLines = Math.ceil(H / lineSpacing) + 1;

    this.particles.forEach((p, i) => {
      const line = i % numLines;
      const baseY = line * lineSpacing + (lineSpacing / 2);
      const xPos = Math.random() * W;
      // Two sine displacements
      const dy = Math.sin(xPos * 0.012 + line * 1.1) * 16
               + Math.sin(xPos * 0.024 + line * 2.3) * 12;
      p.tx = xPos;
      p.ty = baseY + dy;
    });
  }

  private targetWriting(W: number, H: number) {
    // Low-density drifting dashes, kept out of the reading column
    // Reading column: center, max 65ch ≈ ~650px at 17px
    const colW = 650;
    const colL = (W - colW) / 2;
    const colR = (W + colW) / 2;

    this.particles.forEach((p) => {
      let x: number;
      // Keep out of reading column
      if (Math.random() < 0.5) {
        x = Math.random() * Math.max(colL - 20, 20);
      } else {
        x = colR + 20 + Math.random() * Math.max(W - colR - 20, 20);
      }
      p.tx = Math.max(5, Math.min(W - 5, x));
      p.ty = 10 + Math.random() * (H - 20);
      p.dashAngle = (Math.random() - 0.5) * 0.4; // nearly horizontal dashes
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Switch particle mode. The particles will spring to new targets. */
  morphTo(mode: ParticleMode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.retarget(mode);
  }

  /** Update scroll progress. Used to morph between burst↔lattice. */
  onScroll(s: number) {
    if (this.mode === "burst" && s > S_TO_LATTICE) {
      this.morphTo("lattice");
    } else if (this.mode === "lattice" && s < S_TO_BURST) {
      this.morphTo("burst");
    }
  }

  /** Register a DOM rect for text-aware dimming. */
  registerRect(id: string, getRect: () => DOMRect | null) {
    const existing = this.rects.findIndex((r) => r.id === id);
    if (existing >= 0) {
      this.rects[existing].getRect = getRect;
    } else {
      this.rects.push({ id, getRect, cached: null, lastRefresh: 0 });
    }
  }

  unregisterRect(id: string) {
    this.rects = this.rects.filter((r) => r.id !== id);
  }

  /** Set the center for a given mode (percent of viewport). */
  setCenter(mode: ParticleMode, xPct: number, yPct: number) {
    this.modeCenter[mode] = [xPct, yPct];
  }

  /** Fire an impulse burst from a point (e.g. badge flip). */
  impulse(x: number, y: number, radius = CLICK_R, force = CLICK_F) {
    this.applyBurst(x, y, radius, force);
  }

  /** Update theme. Particle opacities shift. */
  setTheme(theme: Theme) {
    this.theme = theme;
    const isDark = theme === "dark";
    this.particles.forEach((p) => {
      p.baseOpacity = isDark ? 0.85 + Math.random() * 0.1 : 0.80 + Math.random() * 0.1;
    });
  }

  /** Update cursor position in viewport coordinates. */
  setCursor(x: number, y: number) {
    this.cx = x;
    this.cy = y;
  }

  /** Click burst at a point (called externally for canvas clicks). */
  clickBurst(x: number, y: number) {
    this.applyBurst(x, y, CLICK_R, CLICK_F);
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  // ── RAF loop ─────────────────────────────────────────────────────────────────

  private start() {
    if (this.rafId) return;
    const loop = () => {
      if (!this.paused) {
        this.drawFrame();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private drawFrame() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const palette = this.theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT;

    // Refresh registered rects every ~20 frames
    if (this.frameCount % 20 === 0) {
      const now = performance.now();
      this.rects.forEach((r) => {
        if (now - r.lastRefresh > 300) {
          r.cached = r.getRect();
          r.lastRefresh = now;
        }
      });
    }
    this.frameCount++;

    this.ctx.clearRect(0, 0, W, H);

    const isWriting = this.mode === "writing";

    // Mode opacity multiplier per design.md & polish prompt:
    // lattice: visible in margins at 12 to 20% opacity (0.16)
    // footer: fade to low density (0.14)
    // writing: 0.40
    // contours: 0.65
    // burst: 0.85
    // llms: 0.35
    let modeMultiplier = 0.85;
    if (this.mode === "lattice") modeMultiplier = 0.16;
    else if (this.mode === "footer") modeMultiplier = 0.14;
    else if (this.mode === "writing") modeMultiplier = 0.40;
    else if (this.mode === "contours") modeMultiplier = 0.65;
    else if (this.mode === "llms") modeMultiplier = 0.35;

    let lastColorIdx = -1;
    let lastAlpha = -1;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (!this.reducedMotion) {
        // Spring toward target
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * SPRING;
        p.vy += dy * SPRING;

        // Cursor repel
        const cdx = p.x - this.cx;
        const cdy = p.y - this.cy;
        const cd2 = cdx * cdx + cdy * cdy;
        if (cd2 < REPEL_R * REPEL_R && cd2 > 0) {
          const cd = Math.sqrt(cd2);
          const strength = (1 - cd / REPEL_R) * REPEL_F;
          p.vx += (cdx / cd) * strength;
          p.vy += (cdy / cd) * strength;
        }

        // Damp + integrate
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Fast text-aware dimming: skip hypot if dx or dy >= 46
      let minDist = 46;
      for (let rIdx = 0; rIdx < this.rects.length; rIdx++) {
        const rc = this.rects[rIdx].cached;
        if (!rc) continue;
        const rdx = p.x < rc.left ? rc.left - p.x : p.x > rc.right ? p.x - rc.right : 0;
        if (rdx >= 46) continue;
        const rdy = p.y < rc.top ? rc.top - p.y : p.y > rc.bottom ? p.y - rc.bottom : 0;
        if (rdy >= 46) continue;
        const d = Math.hypot(rdx, rdy);
        if (d < minDist) minDist = d;
      }
      const dimFactor = minDist < 46 ? 0.05 + (minDist / 46) * 0.95 : 1;
      p.opacity = p.baseOpacity * dimFactor * modeMultiplier;

      // Batch fillStyle and globalAlpha updates
      if (p.colorIdx !== lastColorIdx) {
        this.ctx.fillStyle = palette[p.colorIdx];
        lastColorIdx = p.colorIdx;
      }
      // Round opacity slightly to avoid redundant alpha context switches
      const quantAlpha = Math.round(p.opacity * 50) / 50;
      if (quantAlpha !== lastAlpha) {
        this.ctx.globalAlpha = quantAlpha;
        lastAlpha = quantAlpha;
      }

      if (isWriting) {
        // Dashes for writing mode
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.dashAngle);
        this.ctx.fillRect(-p.dashLen / 2, -p.size / 2, p.dashLen, p.size);
        this.ctx.restore();
      } else {
        // Square dots (design.md §Particle properties)
        this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }

    this.ctx.globalAlpha = 1;
  }

  // ── Burst helper ─────────────────────────────────────────────────────────────

  private applyBurst(bx: number, by: number, radius: number, force: number) {
    this.particles.forEach((p) => {
      const dx = p.x - bx;
      const dy = p.y - by;
      const d2 = dx * dx + dy * dy;
      if (d2 < radius * radius && d2 > 0) {
        const d = Math.sqrt(d2);
        const strength = (1 - d / radius) * force;
        p.vx += (dx / d) * strength;
        p.vy += (dy / d) * strength;
      }
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gaussianRandom() {
  // Box-Muller
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function dist2(x1: number, y1: number, x2: number, y2: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}
