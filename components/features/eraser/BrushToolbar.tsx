import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { scale, scaleFont } from "@/constants/responsive";
import { useAppStore } from "@/store";
import { RotateCcw, Trash2 } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export const BRUSH_SIZES = [15, 30, 50] as const;
export type BrushSizeValue = (typeof BRUSH_SIZES)[number];

interface BrushToolbarProps {
  brushSize: number;
  onBrushSizeChange: (size: BrushSizeValue) => void;
  onUndo: () => void;
  onClear: () => void;
  strokeCount: number;
}

const BRUSH_LABELS = ["S", "M", "L"];
const DOT_PREVIEW_SIZES = [8, 14, 22];

export function BrushToolbar({ brushSize, onBrushSizeChange, onUndo, onClear, strokeCount }: BrushToolbarProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const canUndo = strokeCount > 0;
  const canClear = strokeCount > 0;

  return (
    <View style={[styles.container, { backgroundColor: Colors.surface, borderTopColor: Colors.border }]}>
      {strokeCount > 0 && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}
          style={[styles.strokeBadge, { backgroundColor: Colors.accentLight, borderColor: Colors.accent + "40" }]}>
          <Text style={[styles.strokeBadgeText, { color: Colors.accent }]}>
            {strokeCount} stroke{strokeCount !== 1 ? "s" : ""}
          </Text>
        </Animated.View>
      )}
      <View style={styles.row}>
        <View style={[styles.sizeGroup, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border }]}>
          {BRUSH_SIZES.map((size, i) => {
            const isActive = brushSize === size;
            return (
              <TouchableOpacity key={size} onPress={() => onBrushSizeChange(size)}
                style={[styles.sizeBtn, isActive && { backgroundColor: Colors.accent, borderRadius: BorderRadius.sm }]}
                activeOpacity={0.7}>
                <View style={[styles.dotPreview, {
                  width: DOT_PREVIEW_SIZES[i], height: DOT_PREVIEW_SIZES[i],
                  borderRadius: DOT_PREVIEW_SIZES[i] / 2,
                  backgroundColor: isActive ? "#fff" : Colors.textSecondary,
                }]} />
                <Text style={[styles.sizeLabel, { color: isActive ? "#fff" : Colors.textMuted }]}>
                  {BRUSH_LABELS[i]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.flex} />
        <TouchableOpacity onPress={onUndo} disabled={!canUndo}
          style={[styles.actionBtn, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border, opacity: canUndo ? 1 : 0.35 }]}
          activeOpacity={0.7}>
          <RotateCcw size={scale(16)} color={Colors.text} />
          <Text style={[styles.actionLabel, { color: Colors.text }]}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClear} disabled={!canClear}
          style={[styles.actionBtn, {
            backgroundColor: canClear ? Colors.deleteLight : Colors.surfaceLight,
            borderColor: canClear ? Colors.delete + "40" : Colors.border,
            opacity: canClear ? 1 : 0.35,
          }]}
          activeOpacity={0.7}>
          <Trash2 size={scale(16)} color={canClear ? Colors.delete : Colors.textMuted} />
          <Text style={[styles.actionLabel, { color: canClear ? Colors.delete : Colors.textMuted }]}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm, borderTopWidth: 1, gap: Spacing.sm },
  strokeBadge: { alignSelf: "center", paddingHorizontal: Spacing.md, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  strokeBadgeText: { fontSize: scaleFont(11), fontWeight: "700", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  flex: { flex: 1 },
  sizeGroup: { flexDirection: "row", borderRadius: BorderRadius.md, borderWidth: 1, padding: 3, gap: 2 },
  sizeBtn: { width: scale(46), height: scale(40), alignItems: "center", justifyContent: "center", gap: 3 },
  dotPreview: {},
  sizeLabel: { fontSize: scaleFont(9), fontWeight: "700", letterSpacing: 0.5 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1 },
  actionLabel: { fontSize: scaleFont(13), fontWeight: "600" },
});