import { getColors, Colors as StaticColors } from "@/constants/theme";
import { useAppStore } from "@/store";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: Colors.background }] }>
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
      <StatusBar style={isDark ? "light" : "dark"} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: StaticColors.background,
  },
});
