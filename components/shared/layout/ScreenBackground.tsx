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
      {/* Clean, minimal background - no colorful gradients */}
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
});
