import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";

interface ScreenBackgroundProps {
  children: React.ReactNode;
  centered?: boolean;
}

export const ScreenBackground: React.FC<ScreenBackgroundProps> = ({
  children,
  centered,
}) => {
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      start={[0, 0]}
      end={[1, 1]}
      style={
        centered
          ? [
              styles.centered,
              { paddingTop: insets.top, backgroundColor: Colors.background },
            ]
          : [
              styles.container,
              { paddingTop: insets.top, backgroundColor: Colors.background },
            ]
      }
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
});
