/**
 * SnapSort Native — Modern Theme
 */

export const Colors = {
  // Base colors - Deep navy with warm undertones
  background: "#0A0E1A",
  surface: "#131720",
  surfaceLight: "#1A1F2E",
  card: "#131720",

  // Text colors - High contrast for readability
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",

  // Action colors (SnapSort specific) - Vibrant and energetic
  keep: "#06D6A0",
  keepLight: "rgba(6, 214, 160, 0.15)",
  keepGlow: "rgba(6, 214, 160, 0.4)",

  delete: "#FF6B6B",
  deleteLight: "rgba(255, 107, 107, 0.15)",
  deleteGlow: "rgba(255, 107, 107, 0.4)",

  // Component colors - Modern and accessible
  primary: "#3B82F6",
  secondary: "#14B8A6",
  danger: "#EF4444",
  success: "#10B981",
  warning: "#F59E0B",
  disabled: "#334155",

  // Supporting colors - Bright blue accent
  accent: "#3B82F6",
  accentLight: "rgba(59, 130, 246, 0.15)",

  // Gradient presets - Sophisticated and modern
  gradientStart: "#0A0E1A",
  gradientEnd: "#1E293B",
  gradientAltStart: "#FF6B6B",
  gradientAltEnd: "#FF8E53",

  // UI colors
  border: "rgba(255, 255, 255, 0.08)",
  overlay: "rgba(0, 0, 0, 0.75)",

  white: "#FFFFFF",
  black: "#000000",
};

export const LightColors = {
  // Base colors - Clean white background with black text
  background: "#FFFFFF",
  surface: "#F8FAFC",
  surfaceLight: "#F1F5F9",
  card: "#FFFFFF",

  // Text colors - Pure black for maximum contrast on white
  text: "#000000",
  textSecondary: "#475569",
  textMuted: "#64748B",

  // Action colors - Vibrant but pleasant
  keep: "#059669",
  keepLight: "rgba(5, 150, 105, 0.1)",
  keepGlow: "rgba(5, 150, 105, 0.25)",

  delete: "#EF4444",
  deleteLight: "rgba(239, 68, 68, 0.1)",
  deleteGlow: "rgba(239, 68, 68, 0.25)",

  // Component colors
  primary: "#2563EB",
  secondary: "#0D9488",
  danger: "#DC2626",
  success: "#059669",
  warning: "#D97706",
  disabled: "#CBD5E1",

  // Supporting colors
  accent: "#2563EB",
  accentLight: "rgba(37, 99, 235, 0.1)",

  // Gradient presets - White-based for light mode
  gradientStart: "#FFFFFF",
  gradientEnd: "#F1F5F9",
  gradientAltStart: "#EF4444",
  gradientAltEnd: "#FB923C",

  // UI colors
  border: "rgba(0, 0, 0, 0.08)",
  overlay: "rgba(0, 0, 0, 0.1)",

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
