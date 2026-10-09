/**
 * foil.ts
 * Computes dynamic foil shader styles:
 * 1. 7-lobe blob shape path
 * 2. Three-layer foil blob (gloss highlight, pink glow, rotating conic gradient)
 * 3. Animated metallic name gradient
 * 4. Specular glare band across the card surface
 */

export interface FoilState {
  blobConicAngleDeg: number;
  blobGlossX: number;
  blobGlossY: number;
  nameGradPercent: number;
  glareBandPercent: number;
}

export function computeFoilState(thetaDeg: number, tiltDeg: number): FoilState {
  // Foil blob conic gradient rotated by 40 + θ°·5 + tilt·4 degrees
  const blobConicAngleDeg = 40 + thetaDeg * 5 + tiltDeg * 4;

  // Gloss highlight at (50 + tilt·1.1%, 28 + θ°·0.6%)
  const blobGlossX = 50 + tiltDeg * 1.1;
  const blobGlossY = 28 + thetaDeg * 0.6;

  // Name gradient position: 50 + θ°·3 + tilt·2%
  const nameGradPercent = 50 + thetaDeg * 3 + tiltDeg * 2;

  // Glare band position: 50 - tilt·3 - θ°·2%, blended with screen
  const glareBandPercent = 50 - tiltDeg * 3 - thetaDeg * 2;

  return {
    blobConicAngleDeg,
    blobGlossX,
    blobGlossY,
    nameGradPercent,
    glareBandPercent,
  };
}

/**
 * Generate 7-lobe blob SVG path
 * Formula: radius = size * (0.34 + 0.07·cos(7θ))
 */
export function generate7LobeBlobPath(size = 134, points = 80): string {
  const center = size / 2;
  const pathParts: string[] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // 7 lobes
    const r = size * (0.34 + 0.07 * Math.cos(7 * angle));
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);

    if (i === 0) {
      pathParts.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`);
    } else {
      pathParts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }

  pathParts.push("Z");
  return pathParts.join(" ");
}
