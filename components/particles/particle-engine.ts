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

export type ParticleMode =
  | "burst"
  | "lattice"
  | "contours"
  | "writing"
  | "footer"
  | "wordmark"
  | "llms"
  | "takes";
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

interface WordmarkPoint {
  x: number;
  y: number;
  colorIdx: number;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE_LIGHT = [
  "#9d8df5",
  "#c58cec",
  "#f08fc6",
  "#7fd2e6",
  "#b5a6ff",
  "#f7a6d1",
];
const PALETTE_DARK = [
  "#b3a6ff",
  "#d5b0f5",
  "#ffb3dc",
  "#a6e6f2",
  "#c9c0ff",
  "#fcc4e3",
];

// ─── Physics constants (design.md §Physics) ───────────────────────────────────

const SPRING = 0.018; // toward target
const DAMPING = 0.86; // per frame
const REPEL_R = 90; // cursor repel radius px
const REPEL_F = 1.6; // cursor repel force
const CLICK_R = 260; // click burst radius px
const CLICK_F = 14; // click burst force

// Hysteresis thresholds for scroll morph (plan.md §Phase 2)
const S_TO_LATTICE = 0.45;
const S_TO_BURST = 0.4;

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
    burst: [0.5, 0.42],
    lattice: [0.5, 0.5],
    contours: [0.5, 0.5],
    writing: [0.5, 0.5],
    footer: [0.5, 0.85],
    wordmark: [0.5, 0.85],
    llms: [0.5, 0.5],
    takes: [0.5, 0.5],
  };

  private particleCount = 0;
  private dpr = 1;
  private palette = PALETTE_LIGHT;
  private guideColor = "rgba(0, 0, 0, 0.16)";

  // Footer wordmark state. Targets remain local; only the cached origin moves.
  private wordmarkElement: HTMLElement | null = null;
  private wordmarkTargets: WordmarkPoint[] = [];
  private wordmarkOrigin = { x: 0, y: 0 };
  private wordmarkSize = { width: 0, height: 0 };
  private wordmarkGuides: number[] = [];
  private wordmarkResizeTimer = 0;
  private lastWordmarkPointerAt = 0;
  private readonly coarsePointer = window.matchMedia("(hover: none)").matches;
  private readonly handleResize = () => this.resize();
  private readonly handleVisibilityChange = () => {
    this.paused = document.hidden;
    if (!this.paused && !this.rafId) this.start();
  };

  // Takes mode physics & interactive states
  private takesDriftVx = 0;
  private accentPoint: { x: number; y: number } | null = null;
  private glyphActive = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    this.theme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    this.refreshThemeTokens();
    this.init();
  }

  // ── Initialise / resize ─────────────────────────────────────────────────────

  private init() {
    this.resize();
    window.addEventListener("resize", this.handleResize, { passive: true });

    // Visibility: pause when hidden
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

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

    this.canvas.width = W * this.dpr;
    this.canvas.height = H * this.dpr;
    this.canvas.style.width = W + "px";
    this.canvas.style.height = H + "px";

    this.ctx.scale(this.dpr, this.dpr);

    // Scale particle count: ~1000-1250 at 1920×1080, down to 450 on mobile for fluid 60-120fps on all systems
    const area = W * H;
    const base = Math.round(1150 * (area / (1920 * 1080)));
    this.particleCount = Math.max(450, Math.min(1250, base));

    // Rebuild if count changed significantly
    if (
      this.mode !== "wordmark" &&
      Math.abs(this.particles.length - this.particleCount) > 80
    ) {
      this.buildParticles();
      this.retarget(this.mode);
    }

    if (this.wordmarkElement) {
      window.clearTimeout(this.wordmarkResizeTimer);
      this.wordmarkResizeTimer = window.setTimeout(() => {
        this.sampleWordmark();
        if (this.mode === "wordmark") {
          this.targetWordmark();
          if (this.reducedMotion) this.drawFrame();
        }
      }, 150);
    }
  }

  private buildParticles() {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const n = this.particleCount;
    this.particles = Array.from({ length: n }, (_, i) =>
      this.createParticle(i / n, W, H)
    );
    // Sort by colorIdx so canvas fillStyle switches are minimized to at most 6 per frame
    this.particles.sort((a, b) => a.colorIdx - b.colorIdx);
  }

  private createParticle(xFrac: number, W: number, H: number): Particle {
    const colorIdx = Math.max(
      0,
      Math.min(5, Math.floor(xFrac * 6 + gaussianRandom() * 0.3))
    );

    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: 0,
      vy: 0,
      tx: Math.random() * W,
      ty: Math.random() * H,
      relTx: 0,
      relTy: 0,
      size: 1 + Math.random() * 0.9,
      colorIdx,
      baseOpacity:
        this.theme === "light"
          ? 0.8 + Math.random() * 0.1
          : 0.85 + Math.random() * 0.1,
      opacity: 0,
      dashLen: 4 + Math.random() * 8,
      dashAngle: Math.random() * Math.PI * 2,
    };
  }

  private ensureParticleCount(count: number) {
    const W = window.innerWidth;
    const H = window.innerHeight;

    if (this.particles.length > count) {
      const source = this.particles;
      const stride = source.length / count;
      this.particles = Array.from(
        { length: count },
        (_, index) => source[Math.floor(index * stride)]
      );
      return;
    }

    const start = this.particles.length;
    for (let i = start; i < count; i++) {
      this.particles.push(this.createParticle(i / count, W, H));
    }
  }

  // ── Targeting ───────────────────────────────────────────────────────────────

  private retarget(mode: ParticleMode) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const [cx, cy] = this.modeCenter[mode].map((p, i) => p * (i === 0 ? W : H));

    switch (mode) {
      case "burst":
        this.targetBurst(cx, cy, W, H);
        break;
      case "lattice":
        this.targetLattice(cx, cy, W, H);
        break;
      case "contours":
        this.targetContours(W, H);
        break;
      case "writing":
        this.targetWriting(W, H);
        break;
      case "footer":
        this.targetFooter(W, H);
        break;
      case "wordmark":
        this.targetWordmark();
        break;
      case "llms":
        this.targetContours(W, H);
        break; // same as contours, dimmed
      case "takes":
        this.targetTakes(W, H);
        break;
    }
  }

  private targetBurst(cx: number, cy: number, W: number, H: number) {
    const n = this.particles.length;
    const coreCount = Math.floor(n * 0.35); // Dense core
    const rayCount = n - coreCount;
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

  private targetWordmark() {
    if (!this.wordmarkTargets.length) {
      this.sampleWordmark();
    }

    if (!this.wordmarkTargets.length) {
      this.targetFooter(window.innerWidth, window.innerHeight);
      return;
    }

    this.ensureParticleCount(this.wordmarkTargets.length);
    this.particles.forEach((particle, index) => {
      const target = this.wordmarkTargets[index];
      particle.tx = this.wordmarkOrigin.x + target.x;
      particle.ty = this.wordmarkOrigin.y + target.y;
      particle.colorIdx = target.colorIdx;
      particle.baseOpacity =
        this.theme === "dark"
          ? 0.88 + Math.random() * 0.04
          : 0.83 + Math.random() * 0.04;
      if (this.reducedMotion) {
        particle.x = particle.tx;
        particle.y = particle.ty;
        particle.vx = 0;
        particle.vy = 0;
      }
    });
    this.particles.sort((a, b) => a.colorIdx - b.colorIdx);
  }

  private sampleWordmark() {
    const element = this.wordmarkElement;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    if (width < 40 || height < 40) return;

    const text = element.dataset.wordmark || "BEEBOMBSHELL";
    const styles = window.getComputedStyle(element);
    const family = styles.fontFamily || "monospace";
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    const characters = Array.from(text);
    const trackingRatio = -0.06;
    const measureWidth = (fontSize: number) => {
      context.font = `500 ${fontSize}px ${family}`;
      const glyphWidth = characters.reduce(
        (total, character) => total + context.measureText(character).width,
        0
      );
      return glyphWidth + trackingRatio * fontSize * (characters.length - 1);
    };

    const widthAt100 = measureWidth(100);
    let fontSize = ((width - 6) / widthAt100) * 100;
    context.font = `500 ${fontSize}px ${family}`;

    const initialMetrics = context.measureText("H");
    const initialHeight =
      initialMetrics.actualBoundingBoxAscent +
        initialMetrics.actualBoundingBoxDescent || fontSize;
    fontSize = Math.min(fontSize, (fontSize * (height - 16)) / initialHeight);

    context.font = `500 ${fontSize}px ${family}`;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.lineJoin = "round";
    context.lineCap = "round";
    context.strokeStyle = "#fff";
    context.lineWidth = Math.max(1.6, 0.014 * fontSize);

    const hMetrics = context.measureText("H");
    const xMetrics = context.measureText("x");
    const ascent = hMetrics.actualBoundingBoxAscent || fontSize * 0.72;
    const descent = hMetrics.actualBoundingBoxDescent || fontSize * 0.04;
    const xHeight = xMetrics.actualBoundingBoxAscent || ascent * 0.7;
    const baseline = (height + ascent - descent) / 2;
    const totalWidth = measureWidth(fontSize);
    let cursorX = (width - totalWidth) / 2;

    for (const character of characters) {
      context.strokeText(character, cursorX, baseline);
      cursorX +=
        context.measureText(character).width + trackingRatio * fontSize;
    }

    const pixels = context.getImageData(0, 0, width, height).data;
    const step = width < 640 ? 2.7 : 2.6;
    const points: WordmarkPoint[] = [];

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const pixelX = Math.min(width - 1, Math.round(x));
        const pixelY = Math.min(height - 1, Math.round(y));
        if (pixels[(pixelY * width + pixelX) * 4 + 3] < 48) continue;

        const jitteredX = x + (Math.random() - 0.5) * 0.8;
        const colorIdx = Math.max(
          0,
          Math.min(
            5,
            Math.floor((jitteredX / width) * 6 + gaussianRandom() * 0.3)
          )
        );
        points.push({
          x: jitteredX,
          y: y + (Math.random() - 0.5) * 0.8,
          colorIdx,
        });
      }
    }

    const cap =
      width < 640
        ? Math.max(700, Math.round(width * 2.2))
        : Math.min(2600, Math.round(width * 2.7));
    for (let i = points.length - 1; i > 0; i--) {
      const swapIndex = Math.floor(Math.random() * (i + 1));
      [points[i], points[swapIndex]] = [points[swapIndex], points[i]];
    }

    this.wordmarkTargets = points.slice(0, cap);
    this.wordmarkOrigin = { x: rect.left, y: rect.top };
    this.wordmarkSize = { width: rect.width, height: rect.height };
    this.wordmarkGuides = [baseline, baseline - xHeight, baseline - ascent];
  }

  private targetLattice(cx: number, cy: number, W: number, H: number) {
    // Isometric lattice: axes (34,19), (-34,19), (0,-38), cell 34×19
    const ax1x = 34,
      ax1y = 19;
    const ax2x = -34,
      ax2y = 19;

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
      const baseY = line * lineSpacing + lineSpacing / 2;
      const xPos = Math.random() * W;
      // Two sine displacements
      const dy =
        Math.sin(xPos * 0.012 + line * 1.1) * 16 +
        Math.sin(xPos * 0.024 + line * 2.3) * 12;
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

  private targetTakes(W: number, H: number) {
    // Editorial field: quiet vertical guide columns with slight contour drift,
    // leaving the middle clear so the selected take feels anchored.
    const columns = [0.14, 0.26, 0.38, 0.64, 0.76, 0.88];
    const groupCount = columns.length;
    const pointsPerGroup = Math.ceil(this.particles.length / groupCount);

    this.particles.forEach((p, i) => {
      const group = i % groupCount;
      const positionInGroup = Math.floor(i / groupCount);
      const yBase = ((positionInGroup + 0.5) / pointsPerGroup) * H;
      const xBase = columns[group] * W;
      const wave = Math.sin((yBase / H) * Math.PI * 2.8 + group * 0.9) * 24;
      const xJitter = gaussianRandom() * 14;
      const yJitter = gaussianRandom() * 12;

      p.tx = Math.max(10, Math.min(W - 10, xBase + wave + xJitter));
      p.ty = Math.max(10, Math.min(H - 10, yBase + yJitter));
      p.relTx = p.tx;
      p.relTy = p.ty;
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Switch particle mode. The particles will spring to new targets. */
  morphTo(mode: ParticleMode) {
    if (mode === this.mode) return;
    const leavingWordmark = this.mode === "wordmark" && mode !== "wordmark";
    this.mode = mode;
    if (leavingWordmark) {
      this.ensureParticleCount(this.particleCount);
    }
    this.retarget(mode);
    if (this.reducedMotion) this.drawFrame();
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
    this.refreshThemeTokens();
    const isDark = theme === "dark";
    this.particles.forEach((p) => {
      p.baseOpacity = isDark
        ? 0.85 + Math.random() * 0.1
        : 0.8 + Math.random() * 0.1;
    });
    if (this.reducedMotion) this.drawFrame();
  }

  private refreshThemeTokens() {
    const styles = window.getComputedStyle(document.documentElement);
    const fallback = this.theme === "dark" ? PALETTE_DARK : PALETTE_LIGHT;
    this.palette = fallback.map(
      (color, index) => styles.getPropertyValue(`--p${index}`).trim() || color
    );
    this.guideColor =
      styles.getPropertyValue("--line").trim() || this.guideColor;
  }

  /** Update cursor position in viewport coordinates. */
  setCursor(x: number, y: number) {
    this.cx = x;
    this.cy = y;
    if (
      this.mode === "wordmark" &&
      x >= this.wordmarkOrigin.x &&
      x <= this.wordmarkOrigin.x + this.wordmarkSize.width &&
      y >= this.wordmarkOrigin.y &&
      y <= this.wordmarkOrigin.y + this.wordmarkSize.height
    ) {
      this.lastWordmarkPointerAt = performance.now();
    }
  }

  /** Click burst at a point (called externally for canvas clicks). */
  clickBurst(x: number, y: number) {
    if (
      this.mode === "wordmark" &&
      (x < this.wordmarkOrigin.x ||
        x > this.wordmarkOrigin.x + this.wordmarkSize.width ||
        y < this.wordmarkOrigin.y ||
        y > this.wordmarkOrigin.y + this.wordmarkSize.height)
    ) {
      return;
    }
    this.applyBurst(x, y, CLICK_R, CLICK_F);
  }

  /** Attach the decorative footer target sampled by the shared canvas. */
  setWordmarkElement(element: HTMLElement | null) {
    document.fonts.removeEventListener("loadingdone", this.handleFontsLoaded);
    this.wordmarkElement = element;

    if (!element) {
      this.wordmarkTargets = [];
      this.wordmarkGuides = [];
      return;
    }

    this.sampleWordmark();
    if (this.mode === "wordmark") {
      this.targetWordmark();
      if (this.reducedMotion) this.drawFrame();
    }
    void document.fonts.ready.then(() => {
      if (this.wordmarkElement !== element) return;
      this.sampleWordmark();
      if (this.mode === "wordmark") {
        this.targetWordmark();
        if (this.reducedMotion) this.drawFrame();
      }
    });
    document.fonts.addEventListener("loadingdone", this.handleFontsLoaded);
  }

  /** Update cached viewport coordinates during scroll without resampling pixels. */
  syncWordmarkPosition() {
    if (!this.wordmarkElement || this.mode !== "wordmark") return;
    const rect = this.wordmarkElement.getBoundingClientRect();
    const dx = rect.left - this.wordmarkOrigin.x;
    const dy = rect.top - this.wordmarkOrigin.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return;

    this.wordmarkOrigin = { x: rect.left, y: rect.top };
    for (const particle of this.particles) {
      particle.tx += dx;
      particle.ty += dy;
    }
    if (this.reducedMotion) this.drawFrame();
  }

  private readonly handleFontsLoaded = () => {
    this.sampleWordmark();
    if (this.mode === "wordmark") {
      this.targetWordmark();
      if (this.reducedMotion) this.drawFrame();
    }
  };

  /** Dragging carousel shears field by drag velocity scaled down (~0.15). */
  shearTakes(vx: number) {
    if (this.reducedMotion || this.mode !== "takes") return;
    const shear = vx * 0.15;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].vx += shear;
    }
  }

  /** One-off impulse on slide change (6 to 10 in direction of travel, decaying via 0.86 damping). */
  slideImpulse(direction: 1 | -1) {
    if (this.reducedMotion || this.mode !== "takes") return;
    const force = direction * 8;
    this.takesDriftVx = direction * 0.8;
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].vx += force;
    }
  }

  /** Accent target for hovered or focused UI within takes mode. */
  setAccentTarget(point: { x: number; y: number } | null) {
    this.accentPoint = point;
  }

  /** Retarget ~100-150 particles to ↗ arrow glyph on link hover/focus. */
  setGlyphTarget(rect: DOMRect | null) {
    if (!rect) {
      if (this.glyphActive) {
        this.glyphActive = false;
        if (this.mode === "takes") {
          this.targetTakes(window.innerWidth, window.innerHeight);
        }
      }
      return;
    }

    this.glyphActive = true;
    const gx = rect.right + 10;
    const gy = rect.top + rect.height / 2;
    const size = 14;
    const count = Math.min(120, this.particles.length);

    for (let i = 0; i < count; i++) {
      const p = this.particles[i];
      const frac = i / count;
      if (frac < 0.45) {
        // Main diagonal arrow stem
        const s = frac / 0.45;
        p.tx = gx - size / 2 + s * size + (Math.random() - 0.5) * 1.5;
        p.ty = gy + size / 2 - s * size + (Math.random() - 0.5) * 1.5;
      } else if (frac < 0.72) {
        // Horizontal top bar
        const s = (frac - 0.45) / 0.27;
        p.tx = gx + size / 2 - s * (size * 0.55) + (Math.random() - 0.5) * 1.5;
        p.ty = gy - size / 2 + (Math.random() - 0.5) * 1.5;
      } else {
        // Vertical right bar
        const s = (frac - 0.72) / 0.28;
        p.tx = gx + size / 2 + (Math.random() - 0.5) * 1.5;
        p.ty = gy - size / 2 + s * (size * 0.55) + (Math.random() - 0.5) * 1.5;
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.clearTimeout(this.wordmarkResizeTimer);
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
    document.fonts.removeEventListener("loadingdone", this.handleFontsLoaded);
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
    const palette = this.palette;
    const now = performance.now();

    // Refresh registered rects every ~20 frames
    if (this.frameCount % 20 === 0) {
      this.rects.forEach((r) => {
        if (now - r.lastRefresh > 300) {
          r.cached = r.getRect();
          r.lastRefresh = now;
        }
      });
    }
    this.frameCount++;

    this.ctx.clearRect(0, 0, W, H);

    if (this.mode === "wordmark" && this.wordmarkGuides.length) {
      this.ctx.save();
      this.ctx.globalAlpha = 1;
      this.ctx.strokeStyle = this.guideColor;
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([3, 4]);
      for (const guideY of this.wordmarkGuides) {
        const y = this.wordmarkOrigin.y + guideY;
        this.ctx.beginPath();
        this.ctx.moveTo(this.wordmarkOrigin.x, y);
        this.ctx.lineTo(this.wordmarkOrigin.x + this.wordmarkSize.width, y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

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
    else if (this.mode === "writing") modeMultiplier = 0.4;
    else if (this.mode === "contours") modeMultiplier = 0.65;
    else if (this.mode === "llms") modeMultiplier = 0.35;
    else if (this.mode === "wordmark") modeMultiplier = 1;
    else if (this.mode === "takes") {
      modeMultiplier = this.theme === "dark" ? 0.38 : 0.44;
      if (!this.reducedMotion && Math.abs(this.takesDriftVx) > 0.001) {
        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];
          p.tx = (p.tx + this.takesDriftVx + W) % W;
        }
        this.takesDriftVx *= 0.96;
      }
    }

    let lastColorIdx = -1;
    let lastAlpha = -1;
    let repelX = this.cx;
    let repelY = this.cy;
    let isVirtualCursor = false;

    if (
      this.mode === "wordmark" &&
      (this.coarsePointer || now - this.lastWordmarkPointerAt > 1200)
    ) {
      isVirtualCursor = true;
      const phase = (now / 2100) * Math.PI * 2;
      repelX =
        this.wordmarkOrigin.x +
        this.wordmarkSize.width * (0.5 + Math.sin(phase) * 0.46);
      repelY =
        this.wordmarkOrigin.y +
        this.wordmarkSize.height * (0.5 + Math.sin(phase * 0.55) * 0.12);
    }
    const repelRadius = isVirtualCursor ? 52 : REPEL_R;
    const repelForce = isVirtualCursor ? 0.22 : REPEL_F;
    const repelRadiusSquared = repelRadius * repelRadius;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (!this.reducedMotion) {
        // Spring toward target
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * SPRING;
        p.vy += dy * SPRING;

        // Cursor repel
        const cdx = p.x - repelX;
        const cdy = p.y - repelY;
        const cd2 = cdx * cdx + cdy * cdy;
        if (cd2 < repelRadiusSquared && cd2 > 0) {
          const cd = Math.sqrt(cd2);
          const strength = (1 - cd / repelRadius) * repelForce;
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
        const rdx =
          p.x < rc.left ? rc.left - p.x : p.x > rc.right ? p.x - rc.right : 0;
        if (rdx >= 46) continue;
        const rdy =
          p.y < rc.top ? rc.top - p.y : p.y > rc.bottom ? p.y - rc.bottom : 0;
        if (rdy >= 46) continue;
        const d = Math.hypot(rdx, rdy);
        if (d < minDist) minDist = d;
      }
      const dimFactor = minDist < 46 ? 0.05 + (minDist / 46) * 0.95 : 1;
      p.opacity = p.baseOpacity * dimFactor * modeMultiplier;

      let accentBoost = 1;

      // Accent target: around hovered/focused UI, push one palette step and brighten.
      let effColorIdx = p.colorIdx;
      if (this.accentPoint) {
        const tdx = p.x - this.accentPoint.x;
        const tdy = p.y - this.accentPoint.y;
        if (tdx * tdx + tdy * tdy < 160 * 160) {
          effColorIdx = (effColorIdx + 1) % 6;
          accentBoost = 1.55;
        }
      }

      p.opacity *= accentBoost;

      // Batch fillStyle and globalAlpha updates
      if (effColorIdx !== lastColorIdx) {
        this.ctx.fillStyle = palette[effColorIdx];
        lastColorIdx = effColorIdx;
      }
      // Round opacity slightly to avoid redundant alpha context switches
      const quantAlpha = Math.min(1, Math.round(p.opacity * 50) / 50);
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
        const drawSize =
          this.mode === "takes" ? p.size * 1.35 * accentBoost : p.size;
        this.ctx.fillRect(
          p.x - drawSize / 2,
          p.y - drawSize / 2,
          drawSize,
          drawSize
        );
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
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function dist2(x1: number, y1: number, x2: number, y2: number) {
  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}
