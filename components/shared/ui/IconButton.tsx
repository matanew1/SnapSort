import { BorderRadius, getColors } from "@/constants/theme";
import { scale } from "@/constants/responsive";
import { useAppStore } from "@/store";
import React from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";

type Variant = "default" | "accent" | "danger" | "ghost" | "surface";
type Size = "sm" | "md" | "lg";

interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  rounded?: boolean;
}

const SIZES: Record<Size, number> = { sm: scale(32), md: scale(42), lg: scale(52) };

export function IconButton({ icon, onPress, disabled = false, active = false, variant = "default", size = "md", style, rounded = true }: IconButtonProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const dim = SIZES[size];

  const bgMap: Record<Variant, string> = {
    default: active ? Colors.accentLight : Colors.surfaceLight,
    accent: Colors.accent, danger: Colors.delete,
    ghost: "transparent", surface: Colors.surface,
  };
  const borderMap: Record<Variant, string> = {
    default: active ? Colors.accent : Colors.border,
    accent: "transparent", danger: "transparent",
    ghost: Colors.border, surface: Colors.border,
  };

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}
      style={[styles.base, {
        width: dim, height: dim,
        borderRadius: rounded ? dim / 2 : BorderRadius.md,
        backgroundColor: bgMap[variant],
        borderColor: borderMap[variant],
        opacity: disabled ? 0.4 : 1,
      }, style]}>
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({ base: { justifyContent: "center", alignItems: "center", borderWidth: 1 } });