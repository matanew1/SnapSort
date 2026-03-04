import { getColors } from "@/constants/theme";
import { useAppStore } from "@/store";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenBackgroundProps {
  children: React.ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
  withGradient?: boolean;
}

export function ScreenBackground({
  children,
  edges = ["top", "bottom", "left", "right"],
  withGradient = true,
}: ScreenBackgroundProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <View style={[styles.root, { backgroundColor: Colors.background }]}>
      {withGradient && isDark && (
        <>
          {/* Ambient top glow */}
          <View
            style={[
              styles.ambientGlow,
              styles.ambientGlowTop,
              { backgroundColor: Colors.primaryGlow ?? "rgba(108,99,255,0.08)" },
            ]}
            pointerEvents="none"
          />
          {/* Ambient bottom glow */}
          <View
            style={[
              styles.ambientGlow,
              styles.ambientGlowBottom,
              { backgroundColor: Colors.deleteGlow ?? "rgba(255,77,109,0.06)" },
            ]}
            pointerEvents="none"
          />
        </>
      )}
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  safe: {
    flex: 1,
  },
  ambientGlow: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
  },
  ambientGlowTop: {
    top: -100,
    left: -50,
  },
  ambientGlowBottom: {
    bottom: -100,
    right: -50,
  },
});
