import { dimensions, scale, scaleFont } from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Check,
  FolderOpen,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = dimensions;

export type DateRange =
  | "all"
  | "today"
  | "thisWeek"
  | "thisMonth"
  | "thisYear"
  | "older";

export const DATE_RANGE_OPTIONS: {
  label: string;
  value: DateRange;
  icon: string;
}[] = [
  { label: "All Time", value: "all", icon: "∞" },
  { label: "Today", value: "today", icon: "24h" },
  { label: "This Week", value: "thisWeek", icon: "7d" },
  { label: "This Month", value: "thisMonth", icon: "30d" },
  { label: "This Year", value: "thisYear", icon: "1y" },
  { label: "Older", value: "older", icon: "Old" },
];

interface Album {
  id: string;
  title: string;
  assetCount?: number;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  albums: Album[];
  selectedAlbumId: string | null;
  selectedDateRange: DateRange;
  onSelectAlbum: (id: string | null) => void;
  onSelectDateRange: (range: DateRange) => void;
  onClearFilters: () => void;
  onApplyFilters: () => void;
}

export function FilterModal({
  visible,
  onClose,
  albums,
  selectedAlbumId,
  selectedDateRange,
  onSelectAlbum,
  onSelectDateRange,
  onClearFilters,
  onApplyFilters,
}: FilterModalProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const hasActiveFilter =
    selectedAlbumId !== null || selectedDateRange !== "all";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <BlurView
          intensity={isDark ? 60 : 80}
          tint={isDark ? "dark" : "light"}
          style={styles.sheetBlur}
        >
          <View
            style={[
              styles.sheetInner,
              {
                backgroundColor: isDark
                  ? "rgba(13,17,23,0.92)"
                  : "rgba(248,250,255,0.95)",
              },
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: Colors.border }]} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <SlidersHorizontal size={20} color={Colors.accent} />
                <Text style={[styles.headerTitle, { color: Colors.text }]}>
                  Filters
                </Text>
              </View>
              <View style={styles.headerRight}>
                {hasActiveFilter && (
                  <TouchableOpacity
                    style={[
                      styles.clearButton,
                      { borderColor: Colors.borderLight },
                    ]}
                    onPress={onClearFilters}
                  >
                    <Text
                      style={[
                        styles.clearText,
                        { color: Colors.textSecondary },
                      ]}
                    >
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.closeButton,
                    { backgroundColor: Colors.surfaceLight },
                  ]}
                  onPress={onClose}
                >
                  <X size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Date Range Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={16} color={Colors.accent} />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: Colors.textSecondary },
                    ]}
                  >
                    DATE RANGE
                  </Text>
                </View>
                <View style={styles.chipRow}>
                  {DATE_RANGE_OPTIONS.map((option) => {
                    const isSelected = selectedDateRange === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => onSelectDateRange(option.value)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected
                              ? Colors.accentLight
                              : Colors.surfaceLight,
                            borderColor: isSelected
                              ? Colors.accent
                              : Colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipBadge,
                            {
                              color: isSelected
                                ? Colors.accent
                                : Colors.textMuted,
                            },
                          ]}
                        >
                          {option.icon}
                        </Text>
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected
                                ? Colors.accent
                                : Colors.textSecondary,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Albums Section */}
              {albums.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <FolderOpen size={16} color={Colors.accent} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: Colors.textSecondary },
                      ]}
                    >
                      ALBUMS
                    </Text>
                  </View>
                  <View style={styles.albumList}>
                    {/* All Photos option */}
                    <TouchableOpacity
                      style={[
                        styles.albumRow,
                        {
                          backgroundColor:
                            selectedAlbumId === null
                              ? Colors.accentLight
                              : Colors.surfaceLight,
                          borderColor:
                            selectedAlbumId === null
                              ? Colors.accent
                              : Colors.border,
                        },
                      ]}
                      onPress={() => onSelectAlbum(null)}
                    >
                      <View style={styles.albumIcon}>
                        <FolderOpen
                          size={18}
                          color={
                            selectedAlbumId === null
                              ? Colors.accent
                              : Colors.textSecondary
                          }
                        />
                      </View>
                      <Text
                        style={[
                          styles.albumName,
                          {
                            color:
                              selectedAlbumId === null
                                ? Colors.accent
                                : Colors.text,
                          },
                        ]}
                      >
                        All Photos
                      </Text>
                      {selectedAlbumId === null && (
                        <Check size={16} color={Colors.accent} />
                      )}
                    </TouchableOpacity>

                    {albums.map((album) => {
                      const isSelected = selectedAlbumId === album.id;
                      return (
                        <TouchableOpacity
                          key={album.id}
                          style={[
                            styles.albumRow,
                            {
                              backgroundColor: isSelected
                                ? Colors.accentLight
                                : Colors.surfaceLight,
                              borderColor: isSelected
                                ? Colors.accent
                                : Colors.border,
                            },
                          ]}
                          onPress={() => onSelectAlbum(album.id)}
                        >
                          <View style={styles.albumIcon}>
                            <FolderOpen
                              size={18}
                              color={
                                isSelected
                                  ? Colors.accent
                                  : Colors.textSecondary
                              }
                            />
                          </View>
                          <View style={styles.albumInfo}>
                            <Text
                              style={[
                                styles.albumName,
                                {
                                  color: isSelected
                                    ? Colors.accent
                                    : Colors.text,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {album.title}
                            </Text>
                            {album.assetCount !== undefined && (
                              <Text
                                style={[
                                  styles.albumCount,
                                  { color: Colors.textMuted },
                                ]}
                              >
                                {album.assetCount} photos
                              </Text>
                            )}
                          </View>
                          {isSelected && (
                            <Check size={16} color={Colors.accent} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Apply Button */}
            <View
              style={[
                styles.footer,
                {
                  paddingBottom:
                    Math.max(insets.bottom, Spacing.lg) + Spacing.sm,
                },
              ]}
            >
              <BlurView
                intensity={isDark ? 80 : 95}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
              <TouchableOpacity
                onPress={onApplyFilters}
                style={styles.applyWrapper}
              >
                <LinearGradient
                  colors={[
                    Colors.accent,
                    Colors.accentSecondary ?? Colors.accent,
                  ]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.applyButton}
                >
                  <Text style={[styles.applyText, { color: Colors.white }]}>
                    Apply Filters
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    position: "absolute",
    bottom: dimensions.isTablet ? Spacing.xl : 0,
    left: dimensions.isTablet ? (dimensions.width - scale(500)) / 2 : 0,
    right: dimensions.isTablet ? (dimensions.width - scale(500)) / 2 : 0,
    width: dimensions.isTablet ? scale(500) : "100%",
    height: SCREEN_HEIGHT * 0.85,
    borderRadius: dimensions.isTablet ? BorderRadius.xxl : 0,
    borderTopLeftRadius: BorderRadius.xxxl,
    borderTopRightRadius: BorderRadius.xxxl,
    overflow: "hidden",
  },
  sheetBlur: {
    flex: 1,
    borderRadius: dimensions.isTablet ? BorderRadius.xxl : 0,
    borderTopLeftRadius: BorderRadius.xxxl,
    borderTopRightRadius: BorderRadius.xxxl,
    overflow: "hidden",
  },
  sheetInner: {
    flex: 1,
    borderRadius: dimensions.isTablet ? BorderRadius.xxl : 0,
    borderTopLeftRadius: BorderRadius.xxxl,
    borderTopRightRadius: BorderRadius.xxxl,
  },
  handle: {
    width: scale(40),
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: scaleFont(20),
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  clearText: {
    fontSize: scaleFont(13),
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl * 4, // Massive padding to ensure it clears the absolute footer
  },
  section: {
    paddingHorizontal: Spacing.lg * 2,
    marginBottom: Spacing.lg * 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: scaleFont(11),
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipBadge: {
    fontSize: scaleFont(11),
    fontWeight: "700",
  },
  chipText: {
    fontSize: scaleFont(13),
    fontWeight: "600",
  },
  albumList: {
    gap: Spacing.sm,
  },
  albumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  albumIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  albumInfo: {
    flex: 1,
  },
  albumName: {
    fontSize: scaleFont(15),
    fontWeight: "600",
  },
  albumCount: {
    fontSize: scaleFont(12),
    marginTop: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  applyWrapper: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  applyButton: {
    paddingVertical: Spacing.md + 2,
    alignItems: "center",
    borderRadius: BorderRadius.full,
  },
  applyText: {
    fontSize: scaleFont(16),
    fontWeight: "700",
  },
});

// End of FilterModal
