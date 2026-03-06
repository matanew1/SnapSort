import {
    scale
} from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { Lightbulb, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeOut, SlideInUp } from "react-native-reanimated";

interface AISuggestionsProps {
  suggestions: {
    suggestion: string;
    photoIds: string[];
    priority: "high" | "medium" | "low";
  }[];
  onApplySuggestion?: (photoIds: string[]) => void;
  onDismiss?: () => void;
}

export function AISuggestions({
  suggestions,
  onApplySuggestion,
  onDismiss,
}: AISuggestionsProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || suggestions.length === 0) return null;

  const topSuggestion = suggestions[0];
  const priorityColor =
    topSuggestion.priority === "high"
      ? Colors.danger
      : topSuggestion.priority === "medium"
        ? (Colors.warning ?? "#FFB800")
        : (Colors.info ?? Colors.secondary ?? Colors.accent);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleApply = () => {
    onApplySuggestion?.(topSuggestion.photoIds);
    setDismissed(true);
  };

  return (
    <Animated.View
      entering={SlideInUp}
      exiting={FadeOut}
      style={styles.container}
    >
      <LinearGradient
        colors={[priorityColor + "15", priorityColor + "08"]}
        style={[
          styles.card,
          {
            backgroundColor: Colors.surfaceLight,
            borderColor: priorityColor + "40",
          },
        ]}
        start={[0, 0]}
        end={[1, 1]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[styles.iconBg, { backgroundColor: priorityColor + "20" }]}
          >
            <Lightbulb size={16} color={priorityColor} />
          </View>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: Colors.text }]}>
              AI Suggestion
            </Text>
            <Text style={[styles.priority, { color: priorityColor }]}>
              {topSuggestion.priority.toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <X size={16} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Suggestion text */}
        <Text style={[styles.suggestion, { color: Colors.textSecondary }]}>
          {topSuggestion.suggestion}
        </Text>

        {/* Count badge */}
        <View style={styles.countRow}>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: priorityColor + "20",
                borderColor: priorityColor + "40",
              },
            ]}
          >
            <Trash2 size={12} color={priorityColor} />
            <Text style={[styles.countText, { color: priorityColor }]}>
              {topSuggestion.photoIds.length} photo
              {topSuggestion.photoIds.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.dismissBtn, { borderColor: Colors.border }]}
            onPress={handleDismiss}
          >
            <Text style={[styles.dismissText, { color: Colors.textSecondary }]}>
              Dismiss
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtnWrapper}
            onPress={handleApply}
          >
            <LinearGradient
              colors={[priorityColor, priorityColor + "CC"]}
              style={styles.applyBtn}
              start={[0, 0]}
              end={[1, 0]}
            >
              <Trash2 size={14} color="#fff" />
              <Text style={styles.applyText}>Delete These</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* More suggestions indicator */}
        {suggestions.length > 1 && (
          <Text style={[styles.moreText, { color: Colors.textMuted }]}>
            +{suggestions.length - 1} more suggestion
            {suggestions.length - 1 !== 1 ? "s" : ""}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  iconBg: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(8),
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: scale(14),
    fontWeight: "700",
  },
  priority: {
    fontSize: scale(10),
    fontWeight: "700",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestion: {
    fontSize: scale(13),
    fontWeight: "500",
    lineHeight: scale(18),
    marginBottom: Spacing.sm,
  },
  countRow: {
    marginBottom: Spacing.md,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  countText: {
    fontSize: scale(12),
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissText: {
    fontSize: scale(13),
    fontWeight: "700",
  },
  applyBtnWrapper: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  applyText: {
    fontSize: scale(13),
    fontWeight: "700",
    color: "#fff",
  },
  moreText: {
    fontSize: 11,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
});
