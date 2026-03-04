import { AppSplashScreen } from "@/components";
import { ErrorBoundary } from "@/components/common";
import { getColors } from "@/constants/theme";
import { useAppStore } from "@/store";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Here you can load fonts, check auth, or wait for store hydration
        // Since we use persist, it takes a few ms to hydrate
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide native splash screen
        await SplashScreen.hideAsync();
        // Give a small fade out time for our custom splash
        setTimeout(() => setShowApp(true), 2000); // 2s total of our custom splash
      }
    }

    prepare();
  }, []);

  if (!showApp) {
    return (
      <GestureHandlerRootView
        style={[styles.root, { backgroundColor: Colors.background }]}
      >
        <AppSplashScreen />
        <StatusBar style={isDark ? "light" : "dark"} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView
      style={[styles.root, { backgroundColor: Colors.background }]}
    >
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="review"
            options={{
              animation: "slide_from_bottom",
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="settings" />
        </Stack>
      </ErrorBoundary>
      <StatusBar style={isDark ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
