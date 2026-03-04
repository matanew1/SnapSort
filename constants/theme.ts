/**
 * SnapSort Native — Next-Level Modern Theme v2.0
 * Premium glassmorphism, neon accents, and cinematic gradients
 */

export const Colors = {
  // Base — deep space dark
  background: "#050810",
  surface: "#0D1117",
  surfaceLight: "#161B27",
  surfaceGlass: "rgba(22, 27, 39, 0.7)",
  card: "#0D1117",

  // Text — crisp and accessible
  text: "#F0F6FF",
  textSecondary: "#8B9EC4",
  textMuted: "#4A5568",
  textInverse: "#050810",

  // Action colors — vivid neon
  keep: "#00E5A0",
  keepLight: "rgba(0, 229, 160, 0.12)",
  keepGlow: "rgba(0, 229, 160, 0.45)",
  keepDark: "#00B87A",

  delete: "#FF4D6D",
  deleteLight: "rgba(255, 77, 109, 0.12)",
  deleteGlow: "rgba(255, 77, 109, 0.45)",
  deleteDark: "#CC2244",

  // Brand colors
  primary: "#6C63FF",
  primaryLight: "rgba(108, 99, 255, 0.15)",
  primaryGlow: "rgba(108, 99, 255, 0.5)",
  secondary: "#00D4FF",
  secondaryLight: "rgba(0, 212, 255, 0.12)",

  // Semantic
  danger: "#FF4D6D",
  success: "#00E5A0",
  warning: "#FFB800",
  info: "#00D4FF",
  disabled: "#1E2535",

  // Accent
  accent: "#6C63FF",
  accentLight: "rgba(108, 99, 255, 0.15)",
  accentSecondary: "#FF6B9D",

  // Gradients
  gradientStart: "#050810",
  gradientEnd: "#0D1117",
  gradientAltStart: "#FF4D6D",
  gradientAltEnd: "#FF8E53",

  // Glass & borders
  border: "rgba(255, 255, 255, 0.06)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  borderGlow: "rgba(108, 99, 255, 0.3)",
  overlay: "rgba(5, 8, 16, 0.85)",
  glassLight: "rgba(255, 255, 255, 0.04)",
  glassMedium: "rgba(255, 255, 255, 0.08)",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Neon palette
  neonPurple: "#6C63FF",
  neonCyan: "#00D4FF",
  neonGreen: "#00E5A0",
  neonPink: "#FF6B9D",
  neonOrange: "#FF8E53",
};

export const LightColors = {
  // Base — clean white with depth
  background: "#F8FAFF",
  surface: "#FFFFFF",
  surfaceLight: "#EEF2FF",
  surfaceGlass: "rgba(255, 255, 255, 0.85)",
  card: "#FFFFFF",

  // Text
  text: "#0A0E1A",
  textSecondary: "#4B5563",
  textMuted: "#9CA3AF",
  textInverse: "#F0F6FF",

  // Action colors
  keep: "#059669",
  keepLight: "rgba(5, 150, 105, 0.1)",
  keepGlow: "rgba(5, 150, 105, 0.3)",
  keepDark: "#047857",

  delete: "#DC2626",
  deleteLight: "rgba(220, 38, 38, 0.1)",
  deleteGlow: "rgba(220, 38, 38, 0.3)",
  deleteDark: "#B91C1C",

  // Brand
  primary: "#4F46E5",
  primaryLight: "rgba(79, 70, 229, 0.1)",
  primaryGlow: "rgba(79, 70, 229, 0.3)",
  secondary: "#0891B2",
  secondaryLight: "rgba(8, 145, 178, 0.1)",

  // Semantic
  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
  info: "#0891B2",
  disabled: "#E5E7EB",

  // Accent
  accent: "#4F46E5",
  accentLight: "rgba(79, 70, 229, 0.1)",
  accentSecondary: "#DB2777",

  // Gradients
  gradientStart: "#F8FAFF",
  gradientEnd: "#EEF2FF",
  gradientAltStart: "#DC2626",
  gradientAltEnd: "#EA580C",

  // Glass & borders
  border: "rgba(0, 0, 0, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.15)",
  borderGlow: "rgba(79, 70, 229, 0.3)",
  overlay: "rgba(0, 0, 0, 0.5)",
  glassLight: "rgba(0, 0, 0, 0.02)",
  glassMedium: "rgba(0, 0, 0, 0.05)",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Neon palette (muted for light mode)
  neonPurple: "#4F46E5",
  neonCyan: "#0891B2",
  neonGreen: "#059669",
  neonPink: "#DB2777",
  neonOrange: "#EA580C",
};

export function getColors(isDark: boolean) {
  return isDark ? Colors : LightColors;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  full: 9999,
};

export const Typography = {
  hero: { fontSize: 40, fontWeight: "900" as const, letterSpacing: -1.5 },
  h1: { fontSize: 32, fontWeight: "800" as const, letterSpacing: -1 },
  h2: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: "700" as const, letterSpacing: -0.3 },
  h4: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodyBold: { fontSize: 15, fontWeight: "600" as const },
  caption: { fontSize: 13, fontWeight: "500" as const },
  label: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2 },
  micro: { fontSize: 10, fontWeight: "600" as const, letterSpacing: 0.5 },
};
