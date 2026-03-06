import { ScreenBackground } from "@/components";
import {
  scale
} from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useMediaLibrary } from "@/hooks";
import { useAppStore } from "@/store";
import Constants from "expo-constants";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Github,
  Moon,
  RotateCcw,
  Shield,
  Sun,
} from "lucide-react-native";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  isDanger?: boolean;
}

function SettingsRow({
  icon,
  iconBg,
  label,
  sublabel,
  right,
  onPress,
  isFirst,
  isLast,
  isDanger,
}: SettingsRowProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
          borderTopLeftRadius: isFirst ? BorderRadius.lg : 0,
          borderTopRightRadius: isFirst ? BorderRadius.lg : 0,
          borderBottomLeftRadius: isLast ? BorderRadius.lg : 0,
          borderBottomRightRadius: isLast ? BorderRadius.lg : 0,
          borderBottomWidth: isLast ? 1 : 0,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            { color: isDanger ? Colors.delete : Colors.text },
          ]}
        >
          {label}
        </Text>
        {sublabel && (
          <Text style={[styles.rowSublabel, { color: Colors.textMuted }]}>
            {sublabel}
          </Text>
        )}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
      {onPress && !right && <ChevronRight size={16} color={Colors.textMuted} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const toggleDark = useAppStore((s) => s.toggleDarkMode);
  const Colors = getColors(isDark);
  const { permissionDenied, permissionUndetermined, refetch } =
    useMediaLibrary();

  const permissionStatus = permissionUndetermined
    ? "Unknown"
    : permissionDenied
      ? "Denied"
      : "Granted";

  const handleReset = () => {
    Alert.alert(
      "Reset App State",
      "This will clear all sorting history and progress. Your photos will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            const reset = useAppStore.getState().resetAppState;
            reset();
          },
        },
      ],
    );
  };

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: Colors.surfaceLight,
              borderColor: Colors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>
          Settings
        </Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App identity card */}
        <View style={styles.appCard}>
          <Image
            source={require("@/assets/ios/AppIcon~ios-marketing.png")}
            style={styles.appNameIcon}
            contentFit="contain"
          />
          <View>
            <Text style={[styles.appName, { color: Colors.text }]}>
              SnapSort
            </Text>
            <Text style={[styles.appVersion, { color: Colors.textSecondary }]}>
              Version {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>
            APPEARANCE
          </Text>
          <View style={[styles.group, { borderColor: Colors.border }]}>
            <SettingsRow
              icon={
                isDark ? (
                  <Moon size={16} color="#fff" />
                ) : (
                  <Sun size={16} color="#fff" />
                )
              }
              iconBg={isDark ? Colors.accent : "#F59E0B"}
              label="Dark Mode"
              sublabel={isDark ? "Currently dark" : "Currently light"}
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleDark}
                  trackColor={{ false: Colors.disabled, true: Colors.accent }}
                  thumbColor={Colors.white}
                />
              }
              isFirst
              isLast
            />
          </View>
        </View>

        {/* Permissions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>
            PERMISSIONS
          </Text>
          <View style={[styles.group, { borderColor: Colors.border }]}>
            <SettingsRow
              icon={<Camera size={16} color="#fff" />}
              iconBg={Colors.secondary ?? Colors.accent}
              label="Photo Library Access"
              sublabel={permissionStatus}
              right={
                <TouchableOpacity
                  style={[
                    styles.smallButton,
                    {
                      backgroundColor: permissionDenied
                        ? Colors.deleteLight
                        : Colors.accentLight,
                      borderColor: permissionDenied
                        ? Colors.delete
                        : Colors.accent,
                    },
                  ]}
                  onPress={() => {
                    if (permissionDenied) Linking.openSettings();
                    else refetch();
                  }}
                >
                  <Text
                    style={[
                      styles.smallButtonText,
                      {
                        color: permissionDenied ? Colors.delete : Colors.accent,
                      },
                    ]}
                  >
                    {permissionDenied ? "Open Settings" : "Refresh"}
                  </Text>
                </TouchableOpacity>
              }
              isFirst
              isLast
            />
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>
            DATA
          </Text>
          <View style={[styles.group, { borderColor: Colors.border }]}>
            <SettingsRow
              icon={<RotateCcw size={16} color="#fff" />}
              iconBg={Colors.warning ?? "#F59E0B"}
              label="Reset App State"
              sublabel="Clear sorting history and progress"
              onPress={handleReset}
              isFirst
              isLast
              isDanger
            />
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: Colors.textMuted }]}>
            ABOUT
          </Text>
          <View style={[styles.group, { borderColor: Colors.border }]}>
            <SettingsRow
              icon={<Github size={16} color="#fff" />}
              iconBg="#24292E"
              label="View on GitHub"
              sublabel="Source code and contributions"
              onPress={() =>
                Linking.openURL("https://github.com/matanew1/SnapSort")
              }
              isFirst
            />
            <View
              style={[styles.rowDivider, { backgroundColor: Colors.border }]}
            />
            <SettingsRow
              icon={<Shield size={16} color="#fff" />}
              iconBg={Colors.info ?? Colors.secondary ?? Colors.accent}
              label="Privacy"
              sublabel="All processing happens on-device"
              isLast
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors.textMuted }]}>
            Made with ❤️ for photo lovers
          </Text>
          <Text style={[styles.footerVersion, { color: Colors.textMuted }]}>
            SnapSort v{Constants.expoConfig?.version ?? "1.0.0"}
          </Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: scale(42),
    height: scale(42),
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: scale(18),
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  appNameIcon: {
    width: scale(60),
    height: scale(60),
    borderRadius: scale(18),
    backgroundColor: "#000",
  },
  appName: {
    fontSize: scale(22),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  appVersion: {
    fontSize: scale(13),
    fontWeight: "500",
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionLabel: {
    fontSize: scale(11),
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginLeft: 4,
  },
  group: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderTopWidth: 1,
  },
  rowIcon: {
    width: scale(34),
    height: scale(34),
    borderRadius: scale(10),
    justifyContent: "center",
    alignItems: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: scale(15),
    fontWeight: "600",
  },
  rowSublabel: {
    fontSize: scale(12),
    marginTop: 2,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  rowDivider: {
    height: 1,
    marginLeft: 62,
  },
  smallButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  smallButtonText: {
    fontSize: scale(12),
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    paddingTop: Spacing.xl,
    gap: 4,
  },
  footerText: {
    fontSize: scale(13),
    fontWeight: "500",
  },
  footerVersion: {
    fontSize: scale(12),
  },
});
