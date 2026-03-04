import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import {
  Linking,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useAppStore } from "@/store";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const toggleDark = useAppStore((s) => s.toggleDarkMode);
  const Colors = getColors(isDark);

  const { permissionDenied, permissionUndetermined, refetch } =
    useMediaLibrary();

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      start={[0, 0]}
      end={[1, 1]}
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: Colors.background },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: Colors.surface }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>
          Permissions
        </Text>
        <View
          style={[
            styles.row,
            { backgroundColor: Colors.surface, borderColor: Colors.border },
          ]}
        >
          <Text style={[styles.rowText, { color: Colors.text }]}>
            Photo Access
          </Text>
          <View style={styles.rowRight}>
            <Text
              style={{
                color: permissionDenied ? Colors.delete : Colors.textSecondary,
              }}
            >
              {permissionUndetermined
                ? "Unknown"
                : permissionDenied
                  ? "Denied"
                  : "Granted"}
            </Text>
            <TouchableOpacity
              style={[styles.rowButton, { backgroundColor: Colors.accent }]}
              onPress={() => {
                if (permissionDenied) {
                  Linking.openSettings();
                } else {
                  refetch();
                }
              }}
            >
              <Text style={{ color: Colors.white }}>Manage</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.row,
            { backgroundColor: Colors.surface, borderColor: Colors.border },
          ]}
        >
          <Text style={[styles.rowText, { color: Colors.text }]}>
            Dark Mode
          </Text>
          <Switch value={isDark} onValueChange={toggleDark} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: Colors.text }]}>More</Text>
        <View
          style={[
            styles.row,
            { backgroundColor: Colors.surface, borderColor: Colors.border },
          ]}
        >
          <Text style={[styles.rowText, { color: Colors.text }]}>
            Reset App State
          </Text>
          <TouchableOpacity
            style={[styles.rowButton, { backgroundColor: Colors.delete }]}
            onPress={() => {
              // reset via store
              const reset = useAppStore.getState().resetAppState;
              reset();
            }}
          >
            <Text style={{ color: Colors.white }}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: Colors.textSecondary }]}>
          Version {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  rowText: {
    fontSize: 16,
    fontWeight: "600",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  rowButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  versionContainer: {
    marginTop: Spacing.xl * 2,
    alignItems: "center",
    paddingBottom: Spacing.xl,
  },
  versionText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
