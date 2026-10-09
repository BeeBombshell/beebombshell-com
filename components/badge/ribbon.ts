export interface RibbonTheme {
  front: string;
  back: string;
  print: string;
  stitching: string;
}

export const RIBBON_THEMES: { light: RibbonTheme; dark: RibbonTheme } = {
  light: {
    front: "#121212",
    back: "#2c2c31",
    print: "rgba(246, 245, 241, 0.88)",
    stitching: "rgba(255, 255, 255, 0.35)",
  },
  dark: {
    front: "#eeece6",
    back: "#cfcdc6",
    print: "rgba(18, 18, 18, 0.88)",
    stitching: "rgba(0, 0, 0, 0.3)",
  },
};

interface SplineSample {
  x: number;
  y: number;
  nx: number;
  ny: number;
  angle: number;
  arcLength: number;
  u: number;
  phi: number;
  cosPhi: number;
  halfWidth: number;
}

/** Catmull-Rom point and derivative evaluation */
function catmullRom(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
) {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom matrix coefficients
  const x =
    0.5 *
    (2 * p1.x +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

  const y =
    0.5 *
    (2 * p1.y +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  const dx =
    0.5 *
    (-p0.x +
      p2.x +
      2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
      3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2);

  const dy =
    0.5 *
    (-p0.y +
      p2.y +
      2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t +
      3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2);

  return { x, y, dx, dy };
}

/**
 * Sample a spline curve through rope nodes with 8 samples per segment
 */
export function sampleStrandSpline(
  nodes: { x: number; y: number }[],
  baseWidth: number,
  theta: number,
  vx: number,
  flipRadians: number,
  k: number,
  phase: number,
  timeMs: number
): SplineSample[] {
  if (nodes.length < 2) return [];

  // Pad endpoints for Catmull-Rom
  const pts = [
    {
      x: nodes[0].x - (nodes[1].x - nodes[0].x),
      y: nodes[0].y - (nodes[1].y - nodes[0].y),
    },
    ...nodes,
    {
      x: nodes[nodes.length - 1].x + (nodes[nodes.length - 1].x - nodes[nodes.length - 2].x),
      y: nodes[nodes.length - 1].y + (nodes[nodes.length - 1].y - nodes[nodes.length - 2].y),
    },
  ];

  const samples: SplineSample[] = [];
  const segments = nodes.length - 1;
  const samplesPerSeg = 8;
  const totalSamples = segments * samplesPerSeg;

  let cumulativeLength = 0;
  let prevX = nodes[0].x;
  let prevY = nodes[0].y;

  for (let seg = 0; seg < segments; seg++) {
    const p0 = pts[seg];
    const p1 = pts[seg + 1];
    const p2 = pts[seg + 2];
    const p3 = pts[seg + 3];

    for (let s = 0; s < samplesPerSeg; s++) {
      const segT = s / samplesPerSeg;
      const globalU = (seg * samplesPerSeg + s) / totalSamples;

      const evalResult = catmullRom(p0, p1, p2, p3, segT);
      const x = evalResult.x;
      const y = evalResult.y;

      const dist = Math.hypot(x - prevX, y - prevY);
      cumulativeLength += dist;
      prevX = x;
      prevY = y;

      const len = Math.hypot(evalResult.dx, evalResult.dy) || 1;
      const nx = -evalResult.dy / len;
      const ny = evalResult.dx / len;
      const angle = Math.atan2(evalResult.dy, evalResult.dx);

      // Twist formula from design.md:
      // φ(u) = (θ·2.2 + vx·0.1)·u + flipRadians·k·u + 0.3·sin(t/900 + 4u + phase)
      const phi =
        (theta * 2.2 + vx * 0.1) * globalU +
        flipRadians * k * globalU +
        0.3 * Math.sin(timeMs / 900 + 4 * globalU + phase);

      const cosPhi = Math.cos(phi);
      // Half-width = width/2 · max(0.12, |cos φ|)
      const halfWidth = (baseWidth / 2) * Math.max(0.12, Math.abs(cosPhi));

      samples.push({
        x,
        y,
        nx,
        ny,
        angle,
        arcLength: cumulativeLength,
        u: globalU,
        phi,
        cosPhi,
        halfWidth,
      });
    }
  }

  return samples;
}

const STRAP_TEXT = "BHAVYA VERMA · PRODUCT ENGINEER · ";

/**
 * Render ribbon strand with Catmull-Rom smoothing, dynamic twist,
 * stitched edges, weave texture, and printed text along path.
 */
export function drawRibbon(
  ctx: CanvasRenderingContext2D,
  samples: SplineSample[],
  theme: RibbonTheme,
  showPrint = true
) {
  if (samples.length < 2) return;

  // 1. Draw ribbon quad segments with front / back faces
  for (let i = 0; i < samples.length - 1; i++) {
    const s0 = samples[i];
    const s1 = samples[i + 1];

    const isFront = s0.cosPhi >= 0;
    ctx.fillStyle = isFront ? theme.front : theme.back;

    ctx.beginPath();
    ctx.moveTo(s0.x + s0.nx * s0.halfWidth, s0.y + s0.ny * s0.halfWidth);
    ctx.lineTo(s1.x + s1.nx * s1.halfWidth, s1.y + s1.ny * s1.halfWidth);
    ctx.lineTo(s1.x - s1.nx * s1.halfWidth, s1.y - s1.ny * s1.halfWidth);
    ctx.lineTo(s0.x - s0.nx * s0.halfWidth, s0.y - s0.ny * s0.halfWidth);
    ctx.closePath();
    ctx.fill();

    // Subtle edge boundary line
    ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 2. Weave ticks at 0.5 of half-width, alpha 0.06
    if (i % 2 === 0) {
      ctx.strokeStyle = isFront
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(s0.x + s0.nx * s0.halfWidth * 0.5, s0.y + s0.ny * s0.halfWidth * 0.5);
      ctx.lineTo(s0.x - s0.nx * s0.halfWidth * 0.5, s0.y - s0.ny * s0.halfWidth * 0.5);
      ctx.stroke();
    }
  }

  // 3. Stitches at 0.78 of half-width on both edges
  // (drawn on alternate samples, only when face is clearly forward)
  ctx.strokeStyle = theme.stitching;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < samples.length - 1; i += 2) {
    const s0 = samples[i];
    const s1 = samples[i + 1];
    if (Math.abs(s0.cosPhi) >= 0.35) {
      // Left stitch
      ctx.beginPath();
      ctx.moveTo(s0.x + s0.nx * s0.halfWidth * 0.78, s0.y + s0.ny * s0.halfWidth * 0.78);
      ctx.lineTo(s1.x + s1.nx * s1.halfWidth * 0.78, s1.y + s1.ny * s1.halfWidth * 0.78);
      ctx.stroke();

      // Right stitch
      ctx.beginPath();
      ctx.moveTo(s0.x - s0.nx * s0.halfWidth * 0.78, s0.y - s0.ny * s0.halfWidth * 0.78);
      ctx.lineTo(s1.x - s1.nx * s1.halfWidth * 0.78, s1.y - s1.ny * s1.halfWidth * 0.78);
      ctx.stroke();
    }
  }

  // 4. Printed text along the strap
  // "11px mono, weight 500, uppercase, +1.4px tracking: BHAVYA VERMA · PRODUCT ENGINEER ·"
  // Squashed by |cos φ|, and hidden below 0.3
  if (showPrint && samples.length > 5) {
    ctx.save();
    ctx.font = "500 11px var(--font-mono), monospace";
    ctx.fillStyle = theme.print;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    const totalLen = samples[samples.length - 1].arcLength;
    const charSpacing = 8.5; // pixel spacing between characters
    const textLen = STRAP_TEXT.length;

    let textIdx = 0;
    for (let targetDist = 18; targetDist < totalLen - 20; targetDist += charSpacing) {
      // Find sample corresponding to targetDist
      const sample = samples.find((s) => s.arcLength >= targetDist);
      if (!sample) continue;

      const cosVal = Math.abs(sample.cosPhi);
      // Hide print when cos φ is below 0.3 per design.md
      if (cosVal >= 0.3 && sample.cosPhi > 0) {
        const char = STRAP_TEXT[textIdx % textLen];
        ctx.save();
        ctx.translate(sample.x, sample.y);
        ctx.rotate(sample.angle);
        // Squash across the ribbon by cosPhi
        ctx.scale(1, cosVal);
        ctx.fillText(char, 0, 0);
        ctx.restore();
      }

      textIdx++;
    }
    ctx.restore();
  }
}
