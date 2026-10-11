/**
 * ribbon.ts
 * Catmull-Rom spline smoothing, twisted ribbon renderer,
 * and hardware drawing (crimp, ring, swivel hook).
 * Conforms to badge-agent-prompt.md specification.
 */

export type V = { x: number; y: number };

export interface RibbonTheme {
  front: string;
  back: string;
  print: string;
  stitching: string;
}

export const RIBBON_THEMES = {
  light: {
    front: "#121212",
    back: "#2c2c31",
    print: "rgba(246,245,241,.88)",
    stitching: "rgba(255,255,255,.35)",
  },
  dark: {
    front: "#eeece6",
    back: "#cfcdc6",
    print: "rgba(18,18,18,.88)",
    stitching: "rgba(0,0,0,.3)",
  },
};

/**
 * Smooth polyline using Catmull-Rom spline with n samples per segment
 */
export function catmull(P: V[], n = 8): V[] {
  const out: V[] = [];
  const L = P.length;
  if (L < 2) return [...P];

  for (let s = 0; s < L - 1; s++) {
    const p0 = P[Math.max(0, s - 1)];
    const p1 = P[s];
    const p2 = P[s + 1];
    const p3 = P[Math.min(L - 1, s + 2)];
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push({
        x:
          0.5 *
          (2 * p1.x +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y:
          0.5 *
          (2 * p1.y +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push({ ...P[L - 1] });
  return out;
}

/**
 * Draw a twisting flat ribbon with stitched edges and printed text along path
 */
export function drawRibbon(
  ctx: CanvasRenderingContext2D,
  poly: V[],
  o: {
    width: number;
    twist: (u: number) => number;
    front: string;
    back: string;
    stitching?: string;
    print?: { text: string; phase: number; color: string; font: string };
  }
) {
  const n = poly.length;
  if (n < 2) return;

  const s = [0];
  for (let i = 1; i < n; i++) {
    s.push(s[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  }
  const total = s[n - 1] || 1;

  const tx: number[] = [];
  const ty: number[] = [];
  const nx: number[] = [];
  const ny: number[] = [];
  const c: number[] = [];

  for (let i = 0; i < n; i++) {
    const a = poly[Math.max(0, i - 1)];
    const b = poly[Math.min(n - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    tx.push(dx / l);
    ty.push(dy / l);
    nx.push(-dy / l);
    ny.push(dx / l);
    c.push(Math.cos(o.twist(s[i] / total))); // cos of the twist angle at this sample
  }

  for (let i = 0; i < n - 1; i++) {
    const c1 = c[i];
    const c2 = c[i + 1];
    const h1 = (o.width / 2) * Math.max(0.12, Math.abs(c1));
    const h2 = (o.width / 2) * Math.max(0.12, Math.abs(c2));

    ctx.fillStyle = ctx.strokeStyle = c1 + c2 >= 0 ? o.front : o.back;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(poly[i].x + nx[i] * h1, poly[i].y + ny[i] * h1);
    ctx.lineTo(poly[i + 1].x + nx[i + 1] * h2, poly[i + 1].y + ny[i + 1] * h2);
    ctx.lineTo(poly[i + 1].x - nx[i + 1] * h2, poly[i + 1].y - ny[i + 1] * h2);
    ctx.lineTo(poly[i].x - nx[i] * h1, poly[i].y - ny[i] * h1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Stitching on both edges when face is forward
    if (c1 + c2 > 0.7 && i % 2 === 0) {
      ctx.strokeStyle = o.stitching || "rgba(255,255,255,.35)";
      ctx.lineWidth = 1;
      for (const sg of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(poly[i].x + sg * nx[i] * h1 * 0.78, poly[i].y + sg * ny[i] * h1 * 0.78);
        ctx.lineTo(poly[i + 1].x + sg * nx[i + 1] * h2 * 0.78, poly[i + 1].y + sg * ny[i + 1] * h2 * 0.78);
        ctx.stroke();
      }
    }
  }

const CHAR_WIDTH_CACHE = new Map<string, number>();

function getCharWidth(ctx: CanvasRenderingContext2D, ch: string, font: string): number {
  const key = `${font}_${ch}`;
  let w = CHAR_WIDTH_CACHE.get(key);
  if (w === undefined) {
    w = ctx.measureText(ch).width + 1.4;
    CHAR_WIDTH_CACHE.set(key, w);
  }
  return w;
}

  // Text printed along the strap by arc length
  if (o.print) {
    ctx.font = o.print.font;
    ctx.textBaseline = "middle";
    let d = o.print.phase;
    let k = 0;
    const T = o.print.text;

    while (d < total - 8) {
      const ch = T[k % T.length];
      const w = getCharWidth(ctx, ch, o.print.font);
      let j = 0;
      while (j < n - 2 && s[j + 1] < d) j++;
      const f = (d - s[j]) / (s[j + 1] - s[j] || 1);
      const px = poly[j].x + (poly[j + 1].x - poly[j].x) * f;
      const py = poly[j].y + (poly[j + 1].y - poly[j].y) * f;

      if (c[j] > 0.3 && d > 14) {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(Math.atan2(ty[j], tx[j]));
        ctx.scale(1, Math.abs(c[j]));
        ctx.fillStyle = o.print.color;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      }

      d += w;
      k++;
    }
  }
}

/**
 * Metal hardware drawer (brushed gradient with bevel border)
 */
export function metal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  angle = 0
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, "#f3f3f6");
  grad.addColorStop(0.45, "#a9a9b2");
  grad.addColorStop(1, "#e0e0e5");

  ctx.fillStyle = grad;
  ctx.strokeStyle = "#7d7d86";
  ctx.lineWidth = 1;
  ctx.beginPath();

  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(-w / 2, -h / 2, w, h, r);
  } else {
    const hw = w / 2;
    const hh = h / 2;
    ctx.moveTo(-hw + r, -hh);
    ctx.lineTo(hw - r, -hh);
    ctx.quadraticCurveTo(hw, -hh, hw, -hh + r);
    ctx.lineTo(hw, hh - r);
    ctx.quadraticCurveTo(hw, hh, hw - r, hh);
    ctx.lineTo(-hw + r, hh);
    ctx.quadraticCurveTo(-hw, hh, -hw, hh - r);
    ctx.lineTo(-hw, -hh + r);
    ctx.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  }

  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
