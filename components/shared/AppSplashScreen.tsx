import { scale, scaleFont, verticalScale } from "@/constants/responsive";
import { getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import Constants from "expo-constants";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export function AppSplashScreen() {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop progress bar simulation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progressAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, [fadeAnim, progressAnim, scaleAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/ios/AppIcon~ios-marketing.png")}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        <Text style={[styles.title, { color: Colors.text }]}>SnapSort</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
          Organizing your memories...
        </Text>

        <View
          style={[
            styles.progressContainer,
            { backgroundColor: Colors.surfaceLight },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: Colors.accent,
              },
            ]}
          />
        </View>
      </Animated.View>

      <Text style={[styles.footer, { color: Colors.textMuted }]}>
        SnapSort v{Constants.expoConfig?.version ?? "1.0.0"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  content: {
    alignItems: "center",
    width: "80%",
  },
  logoContainer: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(24),
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: scaleFont(32),
    fontWeight: "800",
    letterSpacing: -1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: scaleFont(16),
    fontWeight: "500",
    marginBottom: Spacing.xxl,
  },
  progressContainer: {
    width: scale(200),
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  footer: {
    position: "absolute",
    bottom: verticalScale(50),
    fontSize: scaleFont(12),
    fontWeight: "600",
    letterSpacing: 1,
  },
});
