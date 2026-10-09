/**
 * rope.ts
 * 11-node Verlet physics simulation for the lanyard and card.
 * Pure functions matching badge-agent-prompt.md specification.
 */

export type RopeNode = {
  x: number;
  y: number;
  ox: number;
  oy: number;
  pin: boolean;
};

export type Constraint = [number, number, number, boolean?];

export const GRAVITY = 0.55;
export const DAMPING = 0.992;
export const VMAX = 30;

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Build 11-node rope layout in stage coordinates.
 * origin top-left of stage, ax = stageWidth / 2.
 *
 * 0: ax-34, -50  pinned      // left anchor, above the viewport
 * 1: ax-23, -10
 * 2: ax-11,  30
 * 3: ax,     70              // junction
 * 4: ax+34, -50  pinned      // right anchor
 * 5: ax+23, -10
 * 6: ax+11,  30
 * 7: ax,    100              // stem
 * 8: ax,    130
 * 9: ax,    160              // clip (top center of the card)
 * 10: ax,   540              // card bottom center (start at ax+60 so the card swings in on mount)
 */
export function createRopeNodes(ax: number, cardHeight = 380, anchorOffsetY = 0): RopeNode[] {
  const y0 = -50 + anchorOffsetY;
  return [
    { x: ax - 34, y: y0, ox: ax - 34, oy: y0, pin: true },
    { x: ax - 23, y: -10, ox: ax - 23, oy: -10, pin: false },
    { x: ax - 11, y: 30, ox: ax - 11, oy: 30, pin: false },
    { x: ax, y: 70, ox: ax, oy: 70, pin: false },
    { x: ax + 34, y: y0, ox: ax + 34, oy: y0, pin: true },
    { x: ax + 23, y: -10, ox: ax + 23, oy: -10, pin: false },
    { x: ax + 11, y: 30, ox: ax + 11, oy: 30, pin: false },
    { x: ax, y: 100, ox: ax, oy: 100, pin: false },
    { x: ax, y: 130, ox: ax, oy: 130, pin: false },
    { x: ax, y: 160, ox: ax, oy: 160, pin: false },
    { x: ax + 60, y: 160 + cardHeight, ox: ax + 60, oy: 160 + cardHeight, pin: false },
  ];
}

/**
 * Constraints: [a, b, length, minOnly?]
 */
export function createRopeConstraints(cardHeight = 380): Constraint[] {
  return [
    [0, 1, 44],
    [1, 2, 44],
    [2, 3, 44],
    [4, 5, 44],
    [5, 6, 44],
    [6, 3, 44],
    [3, 7, 30],
    [7, 8, 30],
    [8, 9, 30],
    [9, 10, cardHeight],
    [8, 10, cardHeight + 15, true],
  ];
}

/**
 * Step Verlet physics simulation
 */
export function step(
  nodes: RopeNode[],
  cons: Constraint[],
  drag: { active: boolean; target: { x: number; y: number } },
  iterations = 18
) {
  // 1. Verlet integration for free nodes
  for (const p of nodes) {
    if (p.pin) continue;
    const vx = (p.x - p.ox) * DAMPING;
    const vy = (p.y - p.oy) * DAMPING;
    p.ox = p.x;
    p.oy = p.y;
    p.x += clamp(vx, -VMAX, VMAX);
    p.y += clamp(vy, -VMAX, VMAX) + GRAVITY;
  }

  // 2. Drag target on card bottom
  const bottom = nodes[10];
  if (drag.active) {
    bottom.x = drag.target.x;
    bottom.y = drag.target.y;
    bottom.ox = bottom.x - (bottom.x - bottom.ox) * 0.5; // keep half velocity so release flings
    bottom.oy = bottom.y - (bottom.y - bottom.oy) * 0.5;
  }

  // 3. Relax constraints
  for (let it = 0; it < iterations; it++) {
    for (const [ia, ib, len, minOnly] of cons) {
      const a = nodes[ia];
      const b = nodes[ib];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      if (minOnly && d >= len) continue;
      const diff = (d - len) / d;
      const ma = a.pin || (drag.active && ia === 10) ? 0 : 1;
      const mb = b.pin || (drag.active && ib === 10) ? 0 : 1;
      const t = ma + mb;
      if (!t) continue;
      a.x += (dx * diff * ma) / t;
      a.y += (dy * diff * ma) / t;
      b.x -= (dx * diff * mb) / t;
      b.y -= (dy * diff * mb) / t;
    }
  }
}

/** Backwards-compatible class wrapper if needed */
export class RopeSimulation {
  nodes: RopeNode[] = [];
  cons: Constraint[] = [];
  drag = { active: false, target: { x: 0, y: 0 } };
  cardHeight = 380;
  iterations = 18;

  constructor(centerX: number, startY = -50, isMobile = false) {
    this.cardHeight = isMobile ? 320 : 380;
    this.iterations = isMobile ? 10 : 18;
    this.nodes = createRopeNodes(centerX, this.cardHeight, startY - -50);
    this.cons = createRopeConstraints(this.cardHeight);
  }

  setAnchorPosition(centerX: number, anchorY: number) {
    this.nodes[0].x = centerX - 34;
    this.nodes[0].y = anchorY;
    this.nodes[4].x = centerX + 34;
    this.nodes[4].y = anchorY;
  }

  startDrag(x: number, y: number) {
    this.drag.active = true;
    this.drag.target.x = x;
    this.drag.target.y = y;
  }

  updateDrag(x: number, y: number) {
    if (this.drag.active) {
      this.drag.target.x = x;
      this.drag.target.y = y;
    }
  }

  endDrag() {
    this.drag.active = false;
  }

  step() {
    step(this.nodes, this.cons, this.drag, this.iterations);
  }
}
