/**
 * blob.ts
 * 7-lobe mascot SVG shape points and helper constants.
 * Conforms to badge-agent-prompt.md specification.
 */

// 7-lobe shape in a 134x134 viewBox, center (67,67)
// Symmetrically oriented with a lobe pointing straight up
export const BLOB_POINTS = Array.from({ length: 140 }, (_, a) => {
  const t = (a / 140) * Math.PI * 2;
  const r = 0.36 + 0.075 * Math.cos(7 * t);
  const angle = t - Math.PI / 2;
  return `${(67 + Math.cos(angle) * r * 134).toFixed(1)},${(67 + Math.sin(angle) * r * 134).toFixed(1)}`;
}).join(" ");
