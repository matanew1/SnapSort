/**
 * SnapSort Native — Dark premium theme
 */

export const Colors = {
  // Base colors
  background: "#0B1020",
  surface: "#0F1724",
  surfaceLight: "#111827",
  card: "#0F1724",

  // Text colors
  text: "#F0F0F5",
  textSecondary: "#8888A0",
  textMuted: "#55556A",

  // Action colors (SnapSort specific)
  keep: "#10B981",
  keepLight: "rgba(16, 185, 129, 0.12)",
  keepGlow: "rgba(16, 185, 129, 0.36)",

  delete: "#FB6F66",
  deleteLight: "rgba(251, 111, 102, 0.12)",
  deleteGlow: "rgba(251, 111, 102, 0.36)",

  // Component colors
  primary: "#7C3AED",
  secondary: "#06B6D4",
  danger: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
  disabled: "#3F3F4A",

  // Supporting colors
  accent: "#7C3AED",
  accentLight: "rgba(124, 58, 237, 0.12)",

  // Gradient presets
  gradientStart: "#070409",
  gradientEnd: "#582da3",
  gradientAltStart: "#FB6F66",
  gradientAltEnd: "#F97316",

  // UI colors
  border: "rgba(255, 255, 255, 0.06)",
  overlay: "rgba(0, 0, 0, 0.7)",

  white: "#FFFFFF",
  black: "#000000",
};

export const LightColors = {
  // Base colors
  background: "#F7F9FC",
  surface: "#FFFFFF",
  surfaceLight: "#F3F4F6",
  card: "#FFFFFF",

  // Text colors
  text: "#0B1220",
  textSecondary: "#475569",
  textMuted: "#6B7280",

  // Action colors
  keep: "#059669",
  keepLight: "rgba(5,150,105,0.12)",
  keepGlow: "rgba(5,150,105,0.28)",

  delete: "#DC2626",
  deleteLight: "rgba(220,38,38,0.10)",
  deleteGlow: "rgba(220,38,38,0.22)",

  // Component colors
  primary: "#5B21B6",
  secondary: "#0891B2",
  danger: "#DC2626",
  success: "#059669",
  warning: "#B45309",
  disabled: "#9CA3AF",

  // Supporting colors
  accent: "#5B21B6",
  accentLight: "rgba(91,33,182,0.12)",

  // Gradient presets
  gradientStart: "#5B21B6",
  gradientEnd: "#0891B2",
  gradientAltStart: "#DC2626",
  gradientAltEnd: "#FB923C",

  // UI colors
  border: "rgba(2,6,23,0.06)",
  overlay: "rgba(0,0,0,0.05)",

  white: "#FFFFFF",
  black: "#000000",
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
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
};
