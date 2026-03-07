import {
  EmptyState,
  FilterModal,
  FinishedState,
  LoadingState,
  ScreenBackground,
  SwipeCard,
  SwipeTutorial,
} from "@/components";
import {
  dimensions,
  scale,
  scaleFont,
  verticalScale,
} from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import {
  useAIAnalysis,
  useAppPreferences,
  useHaptics,
  useMediaLibrary,
} from "@/hooks";
import { useAppStore } from "@/store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  Heart,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Trash2,
  Wand2,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Year", value: "thisYear" },
  { label: "Older", value: "older" },
];

type StreakType = "keep" | "delete" | null;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const router = useRouter();
  const params = useLocalSearchParams<{ deletedCount?: string }>();

  const { triggerSwipeFeedback } = useHaptics();
  const { hasSeenTutorial, setHasSeenTutorial } = useAppPreferences();
  const [showTutorial, setShowTutorial] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // ─── streak state ────────────────────────────────────────────────
  const [streakType, setStreakType] = useState<StreakType>(null);
  const [streakCount, setStreakCount] = useState(0);
  const streakAnim = useRef(new Animated.Value(0)).current;

  // ─── header / progress / delete-badge anims ──────────────────────
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const deleteButtonAnim = useRef(new Animated.Value(1)).current;

  // ─── background card parallax ────────────────────────────────────
  const dragProgressAnim = useRef(new Animated.Value(0)).current;

  // Interpolated values for bg card 2
  const bgCard2Scale = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.0],
  });
  const bgCard2TranslateY = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [verticalScale(10), verticalScale(2)],
  });
  const bgCard2Opacity = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0.92],
  });

  // Interpolated values for bg card 3
  const bgCard3Scale = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 0.97],
  });
  const bgCard3TranslateY = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [verticalScale(20), verticalScale(10)],
  });
  const bgCard3Opacity = dragProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.62],
  });

  const handleDragProgress = useCallback(
    (progress: number) => {
      // abs value: both keep and delete directions lift the bg cards
      dragProgressAnim.setValue(Math.abs(progress));
    },
    [dragProgressAnim],
  );

  // ─── tutorial ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSeenTutorial) setShowTutorial(true);
  }, [hasSeenTutorial]);

  // ─── header entrance ─────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  }, [setHasSeenTutorial]);

  // ─── media library ───────────────────────────────────────────────
  const {
    photos,
    loading,
    permissionDenied,
    permissionUndetermined,
    refetch,
    albums,
    selectedAlbumId,
    setSelectedAlbumId,
    selectedDateRange,
    setSelectedDateRange,
  } = useMediaLibrary();

  const aiAnalysis = useAIAnalysis(photos);

  // ─── store ───────────────────────────────────────────────────────
  const {
    currentPhotoIndex,
    setCurrentPhotoIndex,
    sortingHistory,
    addToHistory,
    undoLastAction,
    selectedPhotosForDelete,
    addPhotoToDelete,
    removePhotoFromDelete,
    clearPhotosToDelete,
  } = useAppStore();

  const deletedPhotos = useMemo(
    () => photos.filter((p) => selectedPhotosForDelete.includes(p.id)),
    [photos, selectedPhotosForDelete],
  );

  const currentPhotoAnalysis = useMemo(
    () => aiAnalysis.analyses[currentPhotoIndex],
    [aiAnalysis.analyses, currentPhotoIndex],
  );

  // ─── progress bar ────────────────────────────────────────────────
  useEffect(() => {
    const progress = photos.length > 0 ? currentPhotoIndex / photos.length : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [currentPhotoIndex, photos.length]);

  // ─── delete badge pulse ──────────────────────────────────────────
  useEffect(() => {
    if (deletedPhotos.length > 0) {
      Animated.sequence([
        Animated.timing(deleteButtonAnim, {
          toValue: 1.15,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(deleteButtonAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [deletedPhotos.length]);

  // ─── streak pulse animation ──────────────────────────────────────
  useEffect(() => {
    if (streakCount >= 3) {
      streakAnim.setValue(0);
      Animated.sequence([
        Animated.spring(streakAnim, {
          toValue: 1,
          tension: 90,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(streakAnim, {
          toValue: 0.85,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [streakCount]);

  // ─── handle focus / back from review ────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (params.deletedCount) {
        const deletedCount = parseInt(params.deletedCount, 10);
        setCurrentPhotoIndex(0);
        clearPhotosToDelete();
        refetch(deletedCount);
        router.setParams({ deletedCount: undefined });
        setStreakType(null);
        setStreakCount(0);
      }
    }, [
      params.deletedCount,
      refetch,
      router,
      setCurrentPhotoIndex,
      clearPhotosToDelete,
    ]),
  );

  const isFinished =
    currentPhotoIndex >= photos.length && photos.length > 0;

  // ─── handleSwipe ─────────────────────────────────────────────────
  const handleSwipe = useCallback(
    (direction: "keep" | "delete") => {
      const photo = photos[currentPhotoIndex];
      if (!photo) return;
      triggerSwipeFeedback(direction);
      if (direction === "delete") addPhotoToDelete(photo.id);
      addToHistory({
        index: currentPhotoIndex,
        action: direction,
        timestamp: Date.now(),
      });
      setCurrentPhotoIndex(currentPhotoIndex + 1);

      // Update streak
      setStreakType((prev) => {
        const newType = direction === "keep" ? "keep" : "delete";
        if (prev === newType) {
          setStreakCount((c) => c + 1);
        } else {
          setStreakCount(1);
        }
        return newType;
      });

      // Reset drag progress
      dragProgressAnim.setValue(0);
    },
    [
      currentPhotoIndex,
      photos,
      addPhotoToDelete,
      addToHistory,
      setCurrentPhotoIndex,
      triggerSwipeFeedback,
      dragProgressAnim,
    ],
  );

  // ─── handleUndo ──────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    if (sortingHistory.length === 0) return;
    const lastAction = undoLastAction();
    if (!lastAction) return;
    setCurrentPhotoIndex(lastAction.index);
    if (lastAction.action === "delete") {
      const photo = photos[lastAction.index];
      if (photo) removePhotoFromDelete(photo.id);
    }
    setStreakCount((c) => Math.max(0, c - 1));
    dragProgressAnim.setValue(0);
  }, [
    sortingHistory.length,
    undoLastAction,
    setCurrentPhotoIndex,
    removePhotoFromDelete,
    photos,
    dragProgressAnim,
  ]);

  // ─── review ──────────────────────────────────────────────────────
  const handleReview = useCallback(() => {
    router.push({
      pathname: "/review",
      params: {
        assetIds: deletedPhotos.map((p) => p.id).join(","),
        assetUris: deletedPhotos.map((p) => p.uri).join(","),
      },
    });
  }, [deletedPhotos, router]);

  const hasActiveFilter =
    selectedAlbumId !== null || selectedDateRange !== "all";

  const getCurrentFilterName = useCallback(() => {
    if (selectedAlbumId) {
      const album = albums.find((a) => a.id === selectedAlbumId);
      return album?.title || "Album";
    }
    if (selectedDateRange !== "all") {
      const option = DATE_RANGE_OPTIONS.find(
        (o) => o.value === selectedDateRange,
      );
      return option?.label || "Date";
    }
    return "Filter";
  }, [selectedAlbumId, selectedDateRange, albums]);

  const handleApplyFilters = useCallback(() => {
    setShowFilterModal(false);
    setCurrentPhotoIndex(0);
    clearPhotosToDelete();
    refetch();
  }, [setCurrentPhotoIndex, clearPhotosToDelete, refetch]);

  const handleClearFilters = useCallback(() => {
    setSelectedAlbumId(null);
    setSelectedDateRange("all");
  }, [setSelectedAlbumId, setSelectedDateRange]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  // ─── card stack content ──────────────────────────────────────────
  const renderMainContent = () => {
    if (loading) return <LoadingState />;
    if (permissionDenied)
      return (
        <EmptyState
          type="no-permission"
          onRequestPermission={() => refetch()}
        />
      );
    if (permissionUndetermined)
      return <EmptyState type="permission-undetermined" />;
    if (photos.length === 0)
      return (
        <EmptyState
          type="no-photos-in-filter"
          onFilterPress={() => setShowFilterModal(true)}
          hasActiveFilter={hasActiveFilter}
          filterName={
            hasActiveFilter ? getCurrentFilterName() : undefined
          }
        />
      );
    if (isFinished)
      return (
        <FinishedState
          totalPhotos={photos.length}
          deletedCount={deletedPhotos.length}
          onReview={deletedPhotos.length > 0 ? handleReview : undefined}
          onUndo={sortingHistory.length > 0 ? handleUndo : undefined}
        />
      );
    return null;
  };

  const mainContent = renderMainContent();

  // ─── current photo metadata for SwipeCard ────────────────────────
  const currentPhoto = photos[currentPhotoIndex];
  const currentMetadata = currentPhoto
    ? {
        filename: currentPhoto.filename,
        creationTime: currentPhoto.creationTime,
        megapixels: currentPhotoAnalysis?.megapixels,
        fileSizeKB: currentPhotoAnalysis?.fileSizeKB,
      }
    : undefined;

  const bgCardDimStyle = {
    width: dimensions.width - scale(32),
    height: dimensions.isTablet
      ? verticalScale(550)
      : dimensions.height * 0.68,
    borderRadius: BorderRadius.xxl,
    position: "absolute" as const,
  };

  return (
    <ScreenBackground>
      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/ios/AppIcon~ios-marketing.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
          <View>
            <Text style={[styles.title, { color: Colors.text }]}>
              SnapSort
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              {photos.length > 0
                ? `${photos.length - currentPhotoIndex} remaining`
                : "Ready to sort"}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* ✨ Batch Cleanup */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/batch")}
          >
            <Wand2
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Filter */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: hasActiveFilter
                  ? Colors.accentLight
                  : Colors.surfaceLight,
                borderColor: hasActiveFilter
                  ? Colors.accent
                  : Colors.border,
              },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <SlidersHorizontal
              size={18}
              color={
                hasActiveFilter ? Colors.accent : Colors.textSecondary
              }
            />
          </TouchableOpacity>

          {/* Settings */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/settings")}
          >
            <Settings size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Progress bar ── */}
      {photos.length > 0 && !isFinished && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Animated.View
              style={[styles.progressFill, { width: progressWidth }]}
            >
              <LinearGradient
                colors={[
                  Colors.accent,
                  Colors.accentSecondary ?? Colors.accent,
                ]}
                start={[0, 0]}
                end={[1, 0]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text
            style={[styles.progressLabel, { color: Colors.textMuted }]}
          >
            {Math.round((currentPhotoIndex / photos.length) * 100)}%
          </Text>
        </View>
      )}

      {/* ── Streak indicator ── */}
      {streakCount >= 3 && !mainContent && (
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [
                {
                  scale: streakAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor:
                  streakType === "keep"
                    ? Colors.keepLight
                    : Colors.deleteLight,
                borderColor:
                  streakType === "keep"
                    ? Colors.keep + "45"
                    : Colors.delete + "45",
              },
            ]}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text
              style={[
                styles.streakText,
                {
                  color:
                    streakType === "keep" ? Colors.keep : Colors.delete,
                },
              ]}
            >
              {streakCount} {streakType === "keep" ? "kept" : "deleted"}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* ── Card stack ── */}
      <View style={styles.cardStack}>
        {mainContent ? (
          mainContent
        ) : (
          <>
            {/* Background card 3 (deepest) */}
            {photos[currentPhotoIndex + 2] && (
              <Animated.View
                style={[
                  bgCardDimStyle,
                  {
                    backgroundColor: Colors.surface,
                    transform: [
                      { scale: bgCard3Scale },
                      { translateY: bgCard3TranslateY },
                    ],
                    opacity: bgCard3Opacity,
                  },
                ]}
              />
            )}
            {/* Background card 2 */}
            {photos[currentPhotoIndex + 1] && (
              <Animated.View
                style={[
                  bgCardDimStyle,
                  {
                    backgroundColor: Colors.surfaceLight,
                    transform: [
                      { scale: bgCard2Scale },
                      { translateY: bgCard2TranslateY },
                    ],
                    opacity: bgCard2Opacity,
                  },
                ]}
              />
            )}
            {/* Active card */}
            {currentPhoto && (
              <View style={styles.cardContainer}>
                <SwipeCard
                  key={currentPhotoIndex}
                  uri={currentPhoto.uri}
                  onSwipe={handleSwipe}
                  index={currentPhotoIndex}
                  onDragProgress={handleDragProgress}
                  qualityScore={currentPhotoAnalysis?.qualityScore}
                  metadata={currentMetadata}
                />
              </View>
            )}
          </>
        )}
      </View>

      {/* ── Bottom controls ── */}
      {!mainContent && (
        <View
          style={[
            styles.controls,
            {
              paddingBottom:
                insets.bottom > 0 ? 0 : Spacing.md,
            },
          ]}
        >
          {/* Undo */}
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.undoButton,
              {
                backgroundColor: Colors.surfaceLight,
                borderColor: Colors.border,
                opacity: sortingHistory.length === 0 ? 0.4 : 1,
              },
            ]}
            onPress={handleUndo}
            disabled={sortingHistory.length === 0}
          >
            <RotateCcw size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* Swipe hints */}
          <View style={styles.swipeHints}>
            <View style={styles.hintItem}>
              <Trash2 size={13} color={Colors.delete} />
              <Text style={[styles.hintText, { color: Colors.delete }]}>
                DELETE
              </Text>
            </View>
            <View
              style={[
                styles.hintDivider,
                { backgroundColor: Colors.textMuted },
              ]}
            />
            <View style={styles.hintItem}>
              <Text style={[styles.hintText, { color: Colors.keep }]}>
                KEEP
              </Text>
              <Heart size={13} color={Colors.keep} fill={Colors.keep} />
            </View>
          </View>

          {/* Delete badge */}
          <Animated.View
            style={{ transform: [{ scale: deleteButtonAnim }] }}
          >
            <TouchableOpacity
              onPress={() => {
                if (deletedPhotos.length > 0) {
                  router.push({
                    pathname: "/review",
                    params: {
                      assetIds: deletedPhotos
                        .map((p) => p.id)
                        .join(","),
                      assetUris: deletedPhotos
                        .map((p) => p.uri)
                        .join(","),
                    },
                  });
                }
              }}
              disabled={deletedPhotos.length === 0}
              style={[
                styles.deleteBadge,
                { opacity: deletedPhotos.length === 0 ? 0.4 : 1 },
              ]}
            >
              <LinearGradient
                colors={[Colors.gradientAltStart, Colors.gradientAltEnd]}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.deleteBadgeGradient}
              >
                <Trash2 size={16} color={Colors.white} />
                <Text style={styles.deleteBadgeCount}>
                  {deletedPhotos.length}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* ── Modals ── */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        selectedDateRange={selectedDateRange as any}
        onSelectAlbum={setSelectedAlbumId}
        onSelectDateRange={setSelectedDateRange as any}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      <SwipeTutorial
        visible={showTutorial}
        onComplete={handleTutorialComplete}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoImage: {
    width: scale(38),
    height: scale(38),
    borderRadius: scale(10),
    backgroundColor: "#000",
  },
  title: {
    fontSize: scaleFont(22),
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: scaleFont(12),
    fontWeight: "500",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    position: "relative",
    overflow: "visible",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "700",
    minWidth: 32,
    textAlign: "right",
  },
  streakContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  streakEmoji: { fontSize: scaleFont(13) },
  streakText: {
    fontSize: scaleFont(12),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  controlButton: {
    width: scale(50),
    height: scale(50),
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  undoButton: { borderWidth: 1 },
  swipeHints: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  hintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hintText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  hintDivider: { width: 1, height: 12, opacity: 0.4 },
  deleteBadge: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  deleteBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  deleteBadgeCount: { fontSize: 15, fontWeight: "800", color: "#fff" },
});