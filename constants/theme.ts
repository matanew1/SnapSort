import { moderateScale, scaleFont } from "./responsive";

// ─── Dark Palette ──────────────────────────────────────────────────────────────
export const Colors = {
  // Canvas
  background: "#080B14",
  backgroundElevated: "#0D1117",
  surface: "#13192B",
  surfaceRaised: "#1A2236",
  surfaceLight: "#1F2A3C",
  surfaceGlass: "rgba(19, 25, 43, 0.85)",
  card: "#13192B",

  // Text
  text: "#EDF2FF",
  textSecondary: "#8B95A8",
  textMuted: "#566070",
  textDisabled: "#3A4454",
  textInverse: "#080B14",

  // Keep / Delete — vivid, accessible
  keep: "#00E5A0",
  keepLight: "rgba(0, 229, 160, 0.10)",
  keepGlow: "rgba(0, 229, 160, 0.22)",
  keepDark: "#00B87A",

  delete: "#FF4D6D",
  deleteLight: "rgba(255, 77, 109, 0.10)",
  deleteGlow: "rgba(255, 77, 109, 0.22)",
  deleteDark: "#D63756",

  // Brand
  primary: "#6C63FF",
  primaryLight: "rgba(108, 99, 255, 0.12)",
  primaryGlow: "rgba(108, 99, 255, 0.28)",
  secondary: "#00D4FF",
  secondaryLight: "rgba(0, 212, 255, 0.12)",

  // Accent
  accent: "#6C63FF",
  accentLight: "rgba(108, 99, 255, 0.12)",
  accentSecondary: "#FF6B9D",
  accentTertiary: "#00E5A0",

  // Semantic
  danger: "#FF4D6D",
  success: "#00E5A0",
  warning: "#FFB800",
  info: "#00D4FF",
  disabled: "#2A3347",

  // Gradients
  gradientStart: "#080B14",
  gradientEnd: "#13192B",
  gradientAltStart: "#FF4D6D",
  gradientAltEnd: "#FF8E53",
  gradientProStart: "#6C63FF",
  gradientProEnd: "#FF6B9D",
  gradientGoldStart: "#FFB800",
  gradientGoldEnd: "#FF8E53",

  // Borders & Glass
  border: "rgba(255, 255, 255, 0.06)",
  borderLight: "rgba(255, 255, 255, 0.10)",
  borderGlow: "rgba(108, 99, 255, 0.25)",
  borderKeep: "rgba(0, 229, 160, 0.30)",
  borderDelete: "rgba(255, 77, 109, 0.30)",
  overlay: "rgba(8, 11, 20, 0.92)",
  glassLight: "rgba(255, 255, 255, 0.04)",
  glassMedium: "rgba(255, 255, 255, 0.07)",

  // Pro / Premium
  pro: "#FFB800",
  proLight: "rgba(255, 184, 0, 0.12)",
  proGradientStart: "#FFB800",
  proGradientEnd: "#FF8E53",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Neon palette
  neonPurple: "#6C63FF",
  neonCyan: "#00D4FF",
  neonGreen: "#00E5A0",
  neonPink: "#FF6B9D",
  neonOrange: "#FF8E53",
  neonGold: "#FFB800",
};

// ─── Light Palette ────────────────────────────────────────────────────────────
export const LightColors = {
  background: "#F4F7FF",
  backgroundElevated: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceRaised: "#F8FAFF",
  surfaceLight: "#EEF2FF",
  surfaceGlass: "rgba(255, 255, 255, 0.92)",
  card: "#FFFFFF",

  text: "#0A0E1A",
  textSecondary: "#5B6680",
  textMuted: "#8A95AA",
  textDisabled: "#BFC7D6",
  textInverse: "#EDF2FF",

  keep: "#00A876",
  keepLight: "rgba(0, 168, 118, 0.10)",
  keepGlow: "rgba(0, 168, 118, 0.20)",
  keepDark: "#007F59",

  delete: "#E03050",
  deleteLight: "rgba(224, 48, 80, 0.10)",
  deleteGlow: "rgba(224, 48, 80, 0.20)",
  deleteDark: "#B82442",

  primary: "#5A52E8",
  primaryLight: "rgba(90, 82, 232, 0.10)",
  primaryGlow: "rgba(90, 82, 232, 0.22)",
  secondary: "#0099CC",
  secondaryLight: "rgba(0, 153, 204, 0.10)",

  accent: "#5A52E8",
  accentLight: "rgba(90, 82, 232, 0.10)",
  accentSecondary: "#E83880",
  accentTertiary: "#00A876",

  danger: "#E03050",
  success: "#00A876",
  warning: "#E09000",
  info: "#0099CC",
  disabled: "#E2E8F0",

  gradientStart: "#F4F7FF",
  gradientEnd: "#EEF2FF",
  gradientAltStart: "#E03050",
  gradientAltEnd: "#EA6030",
  gradientProStart: "#5A52E8",
  gradientProEnd: "#E83880",
  gradientGoldStart: "#E09000",
  gradientGoldEnd: "#EA6030",

  border: "rgba(0, 0, 0, 0.07)",
  borderLight: "rgba(0, 0, 0, 0.11)",
  borderGlow: "rgba(90, 82, 232, 0.20)",
  borderKeep: "rgba(0, 168, 118, 0.28)",
  borderDelete: "rgba(224, 48, 80, 0.28)",
  overlay: "rgba(0, 0, 0, 0.52)",
  glassLight: "rgba(0, 0, 0, 0.02)",
  glassMedium: "rgba(0, 0, 0, 0.05)",

  pro: "#E09000",
  proLight: "rgba(224, 144, 0, 0.12)",
  proGradientStart: "#E09000",
  proGradientEnd: "#EA6030",

  white: "#FFFFFF",
  black: "#000000",

  neonPurple: "#5A52E8",
  neonCyan: "#0099CC",
  neonGreen: "#00A876",
  neonPink: "#E83880",
  neonOrange: "#EA6030",
  neonGold: "#E09000",
};

export function getColors(isDark: boolean) {
  return isDark ? Colors : LightColors;
}

export const Spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
  xxxl: moderateScale(64),
};

export const BorderRadius = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  xxxl: moderateScale(40),
  full: 9999,
};

export const Typography = {
  hero: { fontSize: scaleFont(40), fontWeight: "900" as const, letterSpacing: -1.5 },
  h1: { fontSize: scaleFont(32), fontWeight: "800" as const, letterSpacing: -1 },
  h2: { fontSize: scaleFont(24), fontWeight: "700" as const, letterSpacing: -0.5 },
  h3: { fontSize: scaleFont(20), fontWeight: "700" as const, letterSpacing: -0.3 },
  h4: { fontSize: scaleFont(17), fontWeight: "600" as const },
  body: { fontSize: scaleFont(15), fontWeight: "400" as const, lineHeight: scaleFont(22) },
  bodyBold: { fontSize: scaleFont(15), fontWeight: "600" as const },
  caption: { fontSize: scaleFont(13), fontWeight: "500" as const },
  label: { fontSize: scaleFont(11), fontWeight: "700" as const, letterSpacing: 1.2 },
  micro: { fontSize: scaleFont(10), fontWeight: "600" as const, letterSpacing: 0.5 },
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 16,
  },
  accent: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  }),
};