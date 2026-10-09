/**
 * hardware.ts
 * Renders metal hardware: crimp at junction, split ring, swivel hook,
 * with brushed chrome/metal gradients and outlines.
 */

export interface HardwareTheme {
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  outlineDark: string;
  outlineLight: string;
}

export const HARDWARE_THEME: HardwareTheme = {
  gradientStart: "#f3f3f6",
  gradientMid: "#a9a9b2",
  gradientEnd: "#e0e0e5",
  outlineDark: "#7d7d86",
  outlineLight: "#c4c4cb",
};

/**
 * Draw metallic crimp sleeve at the lanyard junction
 * Size: 24×36, radius 5
 */
export function drawCrimp(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad = 0,
  theme = HARDWARE_THEME
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  const w = 24;
  const h = 36;
  const r = 5;

  // Metal vertical gradient
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, -h / 2);
  grad.addColorStop(0, theme.gradientStart);
  grad.addColorStop(0.35, theme.gradientMid);
  grad.addColorStop(0.7, theme.gradientEnd);
  grad.addColorStop(1, theme.gradientMid);

  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle metallic bevel / highlights
  ctx.strokeStyle = theme.outlineDark;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Two horizontal indented crimp grooves
  ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 2, -6);
  ctx.lineTo(w / 2 - 2, -6);
  ctx.moveTo(-w / 2 + 2, 6);
  ctx.lineTo(w / 2 - 2, 6);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 2, -4.5);
  ctx.lineTo(w / 2 - 2, -4.5);
  ctx.moveTo(-w / 2 + 2, 7.5);
  ctx.lineTo(w / 2 - 2, 7.5);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw swivel hook & split ring connecting stem to card slot
 */
export function drawSwivelHook(
  ctx: CanvasRenderingContext2D,
  topX: number,
  topY: number,
  bottomX: number,
  bottomY: number,
  theme = HARDWARE_THEME
) {
  ctx.save();
  const dx = bottomX - topX;
  const dy = bottomY - topY;
  const angle = Math.atan2(dx, dy);
  const length = Math.hypot(dx, dy);

  ctx.translate(topX, topY);
  ctx.rotate(-angle);

  // 1. Top split ring (radius 6 with 2.5px stroke)
  ctx.beginPath();
  ctx.arc(0, 4, 6, 0, Math.PI * 2);
  ctx.strokeStyle = theme.outlineLight;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = theme.outlineDark;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 2. Swivel cylinder
  const swGrad = ctx.createLinearGradient(-4, 0, 4, 0);
  swGrad.addColorStop(0, theme.gradientStart);
  swGrad.addColorStop(0.5, theme.gradientMid);
  swGrad.addColorStop(1, theme.gradientEnd);

  ctx.fillStyle = swGrad;
  ctx.beginPath();
  ctx.roundRect(-4, 10, 8, 10, 2);
  ctx.fill();
  ctx.strokeStyle = theme.outlineDark;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // 3. Hook clasp body (length about node spacing + 10)
  const hookLen = Math.max(22, length - 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = theme.gradientMid;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, hookLen);
  ctx.stroke();

  // Hook curve & clasp latch
  ctx.beginPath();
  ctx.arc(2, hookLen - 4, 5, -Math.PI / 2, Math.PI / 2);
  ctx.strokeStyle = theme.outlineDark;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Lower ring through badge slot (13×21 ring with 2.5px border)
  ctx.beginPath();
  ctx.ellipse(0, hookLen + 4, 6.5, 10.5, 0, 0, Math.PI * 2);
  ctx.strokeStyle = theme.outlineLight;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = theme.outlineDark;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.restore();
}
