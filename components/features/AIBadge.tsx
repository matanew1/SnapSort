import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Sparkles, TrendingUp, Zap } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface AIBadgeProps {
  qualityScore: number;
  isBlurry?: boolean;
  isDark?: boolean;
  isBurst?: boolean;
  suggestDelete?: boolean;
  reason?: string;
}

export function AIBadge({
  qualityScore,
  isBlurry,
  isDark,
  isBurst,
  suggestDelete,
  reason,
}: AIBadgeProps) {
  const isDark_ = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark_);

  // Determine badge color based on quality
  let badgeColor = Colors.success;
  let badgeLabel = "Good";
  let icon = <TrendingUp size={12} color="#fff" />;

  if (suggestDelete) {
    badgeColor = Colors.danger;
    badgeLabel = "Delete";
    icon = <AlertTriangle size={12} color="#fff" />;
  } else if (qualityScore >= 70) {
    badgeColor = Colors.success;
    badgeLabel = "Excellent";
    icon = <Sparkles size={12} color="#fff" />;
  } else if (qualityScore >= 50) {
    badgeColor = Colors.warning ?? "#FFB800";
    badgeLabel = "Fair";
    icon = <TrendingUp size={12} color="#fff" />;
  } else {
    badgeColor = Colors.danger;
    badgeLabel = "Poor";
    icon = <AlertTriangle size={12} color="#fff" />;
  }

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <LinearGradient
        colors={[badgeColor, badgeColor + "CC"]}
        style={styles.badge}
        start={[0, 0]}
        end={[1, 1]}
      >
        {icon}
        <Text style={styles.badgeText}>{badgeLabel}</Text>
        <Text style={styles.scoreText}>{qualityScore}%</Text>
      </LinearGradient>

      {/* Issues indicator */}
      {(isBlurry || isDark || isBurst) && (
        <View style={[styles.issueRow, { backgroundColor: Colors.surfaceLight }]}>
          {isBlurry && (
            <View style={[styles.issueBadge, { backgroundColor: Colors.deleteLight }]}>
              <Text style={[styles.issueText, { color: Colors.delete }]}>Blurry</Text>
            </View>
          )}
          {isDark && (
            <View style={[styles.issueBadge, { backgroundColor: Colors.deleteLight }]}>
              <Text style={[styles.issueText, { color: Colors.delete }]}>Dark</Text>
            </View>
          )}
          {isBurst && (
            <View style={[styles.issueBadge, { backgroundColor: Colors.accentLight }]}>
              <Text style={[styles.issueText, { color: Colors.accent }]}>Burst</Text>
            </View>
          )}
        </View>
      )}

      {/* Reason text */}
      {reason && (
        <Text style={[styles.reasonText, { color: Colors.textSecondary }]}>
          {reason}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  scoreText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  issueRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  issueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  issueText: {
    fontSize: 10,
    fontWeight: "700",
  },
  reasonText: {
    fontSize: 11,
    marginTop: Spacing.xs,
    fontWeight: "500",
  },
});
