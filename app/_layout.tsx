import { AppSplashScreen } from "@/components";
import { ErrorBoundary } from "@/components/common";
import { getColors } from "@/constants/theme";
import { useAppStore } from "@/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [showApp, setShowApp] = useState(false);
  const splashHidden = useRef(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        if (!splashHidden.current) {
          try {
            await SplashScreen.hideAsync();
            splashHidden.current = true;
          } catch (e) {
            console.log("Splash hide error (safe to ignore):", e);
          }
        }
        setTimeout(() => setShowApp(true), 1500);
      }
    }
    prepare();
  }, []);

  if (!showApp) {
    return (
      <GestureHandlerRootView style={[styles.root, { backgroundColor: Colors.background }]}>
        <AppSplashScreen />
        <StatusBar style={isDark ? "light" : "dark"} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: Colors.background }]}>
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="review" options={{ animation: "slide_from_bottom", gestureEnabled: false }} />
          <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
        </Stack>
      </ErrorBoundary>
      <StatusBar style={isDark ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });