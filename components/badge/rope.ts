export interface RopeNode {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  isPinned: boolean;
}

export interface Constraint {
  nodeA: number;
  nodeB: number;
  length: number;
}

export interface RopeConfig {
  gravity?: number;
  damping?: number;
  iterations?: number;
  strandSegmentLength?: number;
  stemSegmentLength?: number;
  cardLength?: number;
  minBendDistance?: number;
  anchorSpacing?: number;
}

export class RopeSimulation {
  nodes: RopeNode[] = [];
  constraints: Constraint[] = [];
  
  gravity = 0.55;
  damping = 0.992;
  iterations = 18;
  maxVelocity = 30;
  maxAnchorDelta = 90;
  
  strandLen = 36;
  stemLen = 34;
  cardLen = 190;
  minBendDist = 205;
  anchorHalfSpacing = 34;

  // Node Indices
  // 0: Left Anchor, 1: Right Anchor
  // 2, 3, 4: Left strand free nodes
  // 5, 6, 7: Right strand free nodes
  // 8: Junction
  // 9: Stem node 1
  // 10: Stem node 2
  // 11: Hook node (top of card)
  // 12: Badge bottom node (bottom of card)
  idxAnchorL = 0;
  idxAnchorR = 1;
  idxStrandL = [2, 3, 4];
  idxStrandR = [5, 6, 7];
  idxJunction = 8;
  idxStem = [9, 10];
  idxHook = 11;
  idxBadgeBottom = 12;

  // Drag state
  isDragging = false;
  dragTargetX = 0;
  dragTargetY = 0;

  // Previous anchor Y for clamping large scroll jumps
  lastAnchorY = 0;

  constructor(centerX: number, startY: number, isMobile = false) {
    if (isMobile) {
      this.iterations = 10;
    }
    this.lastAnchorY = startY;
    this.init(centerX, startY);
  }

  init(centerX: number, startY: number) {
    this.nodes = [];
    this.constraints = [];

    const createNode = (x: number, y: number, isPinned = false): RopeNode => ({
      x,
      y,
      prevX: x,
      prevY: y,
      isPinned,
    });

    const anchorLX = centerX - this.anchorHalfSpacing;
    const anchorRX = centerX + this.anchorHalfSpacing;

    // 0: Anchor Left (pinned)
    this.nodes.push(createNode(anchorLX, startY, true));
    // 1: Anchor Right (pinned)
    this.nodes.push(createNode(anchorRX, startY, true));

    // Left strand (3 nodes)
    let curYL = startY;
    for (let i = 1; i <= 3; i++) {
      curYL += this.strandLen * 0.9;
      const t = i / 4;
      const x = anchorLX * (1 - t) + centerX * t;
      this.nodes.push(createNode(x, curYL));
    }

    // Right strand (3 nodes)
    let curYR = startY;
    for (let i = 1; i <= 3; i++) {
      curYR += this.strandLen * 0.9;
      const t = i / 4;
      const x = anchorRX * (1 - t) + centerX * t;
      this.nodes.push(createNode(x, curYR));
    }

    // 8: Junction
    const junctionY = Math.max(curYL, curYR) + this.strandLen * 0.8;
    this.nodes.push(createNode(centerX, junctionY));

    // 9, 10: Stem nodes
    let stemY = junctionY;
    for (let i = 0; i < 2; i++) {
      stemY += this.stemLen;
      this.nodes.push(createNode(centerX, stemY));
    }

    // 11: Hook node
    stemY += this.stemLen;
    this.nodes.push(createNode(centerX, stemY));

    // 12: Badge bottom node
    const badgeBottomY = stemY + this.cardLen;
    this.nodes.push(createNode(centerX, badgeBottomY));

    // Constraints setup
    // Left strand
    this.constraints.push({ nodeA: 0, nodeB: 2, length: this.strandLen });
    this.constraints.push({ nodeA: 2, nodeB: 3, length: this.strandLen });
    this.constraints.push({ nodeA: 3, nodeB: 4, length: this.strandLen });
    this.constraints.push({ nodeA: 4, nodeB: 8, length: this.strandLen });

    // Right strand
    this.constraints.push({ nodeA: 1, nodeB: 5, length: this.strandLen });
    this.constraints.push({ nodeA: 5, nodeB: 6, length: this.strandLen });
    this.constraints.push({ nodeA: 6, nodeB: 7, length: this.strandLen });
    this.constraints.push({ nodeA: 7, nodeB: 8, length: this.strandLen });

    // Stem
    this.constraints.push({ nodeA: 8, nodeB: 9, length: this.stemLen });
    this.constraints.push({ nodeA: 9, nodeB: 10, length: this.stemLen });
    this.constraints.push({ nodeA: 10, nodeB: 11, length: this.stemLen });

    // Card rigid length (Hook to Badge Bottom)
    this.constraints.push({ nodeA: 11, nodeB: 12, length: this.cardLen });
  }

  setAnchorPosition(centerX: number, targetY: number) {
    // Clamp anchor delta per frame to 40px to survive anchor-link jumps
    const deltaY = targetY - this.lastAnchorY;
    const clampedDelta = Math.max(-this.maxAnchorDelta, Math.min(this.maxAnchorDelta, deltaY));
    const effectiveY = this.lastAnchorY + clampedDelta;
    this.lastAnchorY = effectiveY;

    this.nodes[this.idxAnchorL].x = centerX - this.anchorHalfSpacing;
    this.nodes[this.idxAnchorL].y = effectiveY;
    this.nodes[this.idxAnchorR].x = centerX + this.anchorHalfSpacing;
    this.nodes[this.idxAnchorR].y = effectiveY;
  }

  startDrag(x: number, y: number) {
    this.isDragging = true;
    this.dragTargetX = x;
    this.dragTargetY = y;
  }

  updateDrag(x: number, y: number) {
    if (this.isDragging) {
      this.dragTargetX = x;
      this.dragTargetY = y;
    }
  }

  endDrag(flingVx = 0, flingVy = 0) {
    if (this.isDragging) {
      this.isDragging = false;
      const bottom = this.nodes[this.idxBadgeBottom];
      // Apply fling velocity by offsetting prevX / prevY
      bottom.prevX = bottom.x - Math.max(-this.maxVelocity, Math.min(this.maxVelocity, flingVx));
      bottom.prevY = bottom.y - Math.max(-this.maxVelocity, Math.min(this.maxVelocity, flingVy));
    }
  }

  step() {
    // 1. Verlet Integration for free nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.isPinned) continue;

      if (this.isDragging && i === this.idxBadgeBottom) {
        node.prevX = node.x;
        node.prevY = node.y;
        node.x = this.dragTargetX;
        node.y = this.dragTargetY;
        continue;
      }

      let vx = (node.x - node.prevX) * this.damping;
      let vy = (node.y - node.prevY) * this.damping;

      // Velocity clamp
      vx = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, vx));
      vy = Math.max(-this.maxVelocity, Math.min(this.maxVelocity, vy));

      node.prevX = node.x;
      node.prevY = node.y;

      node.x += vx;
      node.y += vy + this.gravity;
    }

    // 2. Solve Distance Constraints over iterations
    for (let iter = 0; iter < this.iterations; iter++) {
      for (const c of this.constraints) {
        const a = this.nodes[c.nodeA];
        const b = this.nodes[c.nodeB];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist === 0) continue;

        const diff = (dist - c.length) / dist;

        const aIsFixed = a.isPinned;
        const bIsFixed = b.isPinned || (this.isDragging && c.nodeB === this.idxBadgeBottom);

        if (aIsFixed && !bIsFixed) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else if (!aIsFixed && bIsFixed) {
          a.x += dx * diff;
          a.y += dy * diff;
        } else if (!aIsFixed && !bIsFixed) {
          a.x += dx * 0.5 * diff;
          a.y += dy * 0.5 * diff;
          b.x -= dx * 0.5 * diff;
          b.y -= dy * 0.5 * diff;
        }
      }

      // One-sided bend limit: distance from Junction (node 8) to BadgeBottom (node 12) >= minBendDist
      const j = this.nodes[this.idxJunction];
      const bottom = this.nodes[this.idxBadgeBottom];
      const jDx = bottom.x - j.x;
      const jDy = bottom.y - j.y;
      const jDist = Math.hypot(jDx, jDy);
      if (jDist < this.minBendDist && jDist > 0) {
        const jDiff = (jDist - this.minBendDist) / jDist;
        if (!this.isDragging) {
          bottom.x -= jDx * jDiff;
          bottom.y -= jDy * jDiff;
        }
      }
    }
  }

  /**
   * Derive card orientation and physics parameters
   */
  getCardState() {
    const hook = this.nodes[this.idxHook];
    const bottom = this.nodes[this.idxBadgeBottom];

    const dx = bottom.x - hook.x;
    const dy = bottom.y - hook.y;
    // theta is the angle from vertical down (0 = hanging straight down)
    const theta = Math.atan2(dx, dy);
    const thetaDeg = (theta * 180) / Math.PI;

    // Horizontal velocity of the badge card
    const vx = bottom.x - bottom.prevX;
    // Tilt angle in degrees: clamp(vx * 4.5, -38°, 38°)
    const tiltDeg = Math.max(-38, Math.min(38, vx * 4.5));

    // Card center position
    const centerX = (hook.x + bottom.x) / 2;
    const centerY = (hook.y + bottom.y) / 2;

    return {
      hookX: hook.x,
      hookY: hook.y,
      bottomX: bottom.x,
      bottomY: bottom.y,
      centerX,
      centerY,
      theta,
      thetaDeg,
      vx,
      tiltDeg,
      isDragging: this.isDragging,
    };
  }

  /** Return array of point coordinates for left strand: AnchorL -> L1 -> L2 -> L3 -> Junction */
  getLeftStrandPoints() {
    return [
      this.nodes[this.idxAnchorL],
      ...this.idxStrandL.map((i) => this.nodes[i]),
      this.nodes[this.idxJunction],
    ];
  }

  /** Return array of point coordinates for right strand: AnchorR -> R1 -> R2 -> R3 -> Junction */
  getRightStrandPoints() {
    return [
      this.nodes[this.idxAnchorR],
      ...this.idxStrandR.map((i) => this.nodes[i]),
      this.nodes[this.idxJunction],
    ];
  }

  /** Return array of point coordinates for stem: Junction -> S1 -> S2 -> Hook */
  getStemPoints() {
    return [
      this.nodes[this.idxJunction],
      ...this.idxStem.map((i) => this.nodes[i]),
      this.nodes[this.idxHook],
    ];
  }

  getJunctionPoint() {
    return this.nodes[this.idxJunction];
  }

  getHookPoint() {
    return this.nodes[this.idxHook];
  }
}
