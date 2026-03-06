import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { scaleFont } from "@/constants/responsive";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";

type Size = "sm" | "md" | "lg";

interface GradientButtonProps {
  label: string;
  onPress?: () => void;
  gradientColors?: [string, string];
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  size?: Size;
}

const PADDING_V: Record<Size, number> = { sm: Spacing.sm, md: Spacing.md, lg: Spacing.lg };
const FONT_SIZE: Record<Size, number> = { sm: scaleFont(13), md: scaleFont(16), lg: scaleFont(18) };

export function GradientButton({ label, onPress, gradientColors, disabled = false, loading = false, icon, style, size = "md" }: GradientButtonProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const colors = gradientColors ?? [Colors.accent, Colors.accentSecondary ?? Colors.accent];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}
      style={[styles.wrapper, { opacity: disabled && !loading ? 0.45 : 1 }, style]}>
      <LinearGradient colors={colors as any} start={[0, 0]} end={[1, 0]}
        style={[styles.gradient, { paddingVertical: PADDING_V[size] }]}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : (
          <>{icon}<Text style={[styles.label, { fontSize: FONT_SIZE[size] }]}>{label}</Text></>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: BorderRadius.full, overflow: "hidden" },
  gradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.full },
  label: { color: "#fff", fontWeight: "700" },
});