/**
 * SnapSort Native — Modern Professional Theme v3.0
 * Clean dark theme, subtle accents, professional appearance
 */

export const Colors = {
  // Base — clean dark, professional
  background: "#0F1419",
  surface: "#1A1F2E",
  surfaceLight: "#242C3D",
  surfaceGlass: "rgba(26, 31, 46, 0.8)",
  card: "#1A1F2E",

  // Text — crisp and accessible
  text: "#E8EAED",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  textInverse: "#0F1419",

  // Action colors — muted but clear
  keep: "#10B981",
  keepLight: "rgba(16, 185, 129, 0.12)",
  keepGlow: "rgba(16, 185, 129, 0.25)",
  keepDark: "#059669",

  delete: "#EF4444",
  deleteLight: "rgba(239, 68, 68, 0.12)",
  deleteGlow: "rgba(239, 68, 68, 0.25)",
  deleteDark: "#DC2626",

  // Brand colors — subtle
  primary: "#3B82F6",
  primaryLight: "rgba(59, 130, 246, 0.12)",
  primaryGlow: "rgba(59, 130, 246, 0.25)",
  secondary: "#06B6D4",
  secondaryLight: "rgba(6, 182, 212, 0.12)",

  // Semantic
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#06B6D4",
  disabled: "#374151",

  // Accent
  accent: "#3B82F6",
  accentLight: "rgba(59, 130, 246, 0.12)",
  accentSecondary: "#EC4899",

  // Gradients — subtle
  gradientStart: "#0F1419",
  gradientEnd: "#1A1F2E",
  gradientAltStart: "#EF4444",
  gradientAltEnd: "#F97316",

  // Glass & borders
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  borderGlow: "rgba(59, 130, 246, 0.2)",
  overlay: "rgba(15, 20, 25, 0.9)",
  glassLight: "rgba(255, 255, 255, 0.05)",
  glassMedium: "rgba(255, 255, 255, 0.08)",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Palette
  neonPurple: "#3B82F6",
  neonCyan: "#06B6D4",
  neonGreen: "#10B981",
  neonPink: "#EC4899",
  neonOrange: "#F97316",
};

export const LightColors = {
  // Base — clean white with depth
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceLight: "#F1F5F9",
  surfaceGlass: "rgba(255, 255, 255, 0.9)",
  card: "#FFFFFF",

  // Text
  text: "#0F1419",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  textInverse: "#E8EAED",

  // Action colors
  keep: "#059669",
  keepLight: "rgba(5, 150, 105, 0.1)",
  keepGlow: "rgba(5, 150, 105, 0.25)",
  keepDark: "#047857",

  delete: "#DC2626",
  deleteLight: "rgba(220, 38, 38, 0.1)",
  deleteGlow: "rgba(220, 38, 38, 0.25)",
  deleteDark: "#B91C1C",

  // Brand
  primary: "#2563EB",
  primaryLight: "rgba(37, 99, 235, 0.1)",
  primaryGlow: "rgba(37, 99, 235, 0.25)",
  secondary: "#0891B2",
  secondaryLight: "rgba(8, 145, 178, 0.1)",

  // Semantic
  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
  info: "#0891B2",
  disabled: "#E2E8F0",

  // Accent
  accent: "#2563EB",
  accentLight: "rgba(37, 99, 235, 0.1)",
  accentSecondary: "#DB2777",

  // Gradients
  gradientStart: "#F8FAFC",
  gradientEnd: "#F1F5F9",
  gradientAltStart: "#DC2626",
  gradientAltEnd: "#EA580C",

  // Glass & borders
  border: "rgba(0, 0, 0, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.12)",
  borderGlow: "rgba(37, 99, 235, 0.2)",
  overlay: "rgba(0, 0, 0, 0.5)",
  glassLight: "rgba(0, 0, 0, 0.02)",
  glassMedium: "rgba(0, 0, 0, 0.05)",

  // Base
  white: "#FFFFFF",
  black: "#000000",

  // Palette
  neonPurple: "#2563EB",
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
