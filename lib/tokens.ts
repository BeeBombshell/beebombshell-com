/**
 * Design tokens implementing design.md specifications
 */

export const COLOR_TOKENS = {
  light: {
    bg: "#f6f5f1",
    fg: "#121212",
    mut: "#6f6e69",
    line: "rgba(0, 0, 0, 0.16)",
  },
  dark: {
    bg: "#0d0d0c",
    fg: "#eeece6",
    mut: "#a2a19b",
    line: "rgba(255, 255, 255, 0.18)",
  },
} as const;

export const PARTICLE_PALETTE = {
  light: [
    "#9d8df5", // 0
    "#c58cec", // 1
    "#f08fc6", // 2
    "#7fd2e6", // 3
    "#b5a6ff", // 4
    "#f7a6d1", // 5
  ],
  dark: [
    "#b3a6ff", // 0
    "#d5b0f5", // 1
    "#ffb3dc", // 2
    "#a6e6f2", // 3
    "#c9c0ff", // 4
    "#fcc4e3", // 5
  ],
} as const;

export const PARTICLE_PHYSICS = {
  springTarget: 0.018,
  velocityDamping: 0.86,
  cursorRepelRadius: 90,
  cursorRepelForce: 1.6,
  clickBurstRadius: 260,
  clickBurstForce: 14,
  restingOpacityLight: 0.85,
  restingOpacityDark: 0.9,
  minSize: 1.5,
  maxSize: 2.7,
} as const;

export const MOTION_TOKENS = {
  spring: {
    type: "spring",
    stiffness: 260,
    damping: 28,
  },
  cardExpansion: {
    duration: 0.65,
    ease: [0.22, 1, 0.36, 1] as const,
  },
  cardContentFade: {
    duration: 0.45,
    delay: 0.25,
  },
  themeTransitionDuration: 500, // ms
} as const;

export const LAYOUT_TOKENS = {
  padding: {
    desktop: "32px",
    mobile: "20px",
  },
  readingColumnMax: "65ch",
  radii: {
    notch: "22px",
    card: "14px",
  },
} as const;
