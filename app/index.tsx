import {
  EmptyState,
  FilterModal,
  FinishedState,
  LoadingState,
  ScreenBackground,
  SwipeCard,
  SwipeTutorial,
} from "@/components";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import {
  useAppPreferences,
  useHaptics,
  useMediaLibrary,
} from "@/hooks";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import {
  Heart,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Trash2,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const DATE_RANGE_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "thisWeek" },
  { label: "This Month", value: "thisMonth" },
  { label: "This Year", value: "thisYear" },
  { label: "Older", value: "older" },
];

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

  // Animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const deleteButtonAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!hasSeenTutorial) setShowTutorial(true);
  }, [hasSeenTutorial]);

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

  const {
    currentPhotoIndex,
    setCurrentPhotoIndex,
    sortingHistory,
    addToHistory,
    undoLastAction,
    selectedPhotosForDelete,
    addPhotoToDelete,
    removePhotoFromDelete,
  } = useAppStore();

  const deletedPhotos = useMemo(
    () => photos.filter((p) => selectedPhotosForDelete.includes(p.id)),
    [photos, selectedPhotosForDelete]
  );

  // Animate progress bar
  useEffect(() => {
    const progress = photos.length > 0 ? currentPhotoIndex / photos.length : 0;
    Animated.spring(progressAnim, {
      toValue: progress,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [currentPhotoIndex, photos.length]);

  // Pulse delete badge when count increases
  useEffect(() => {
    if (deletedPhotos.length > 0) {
      Animated.sequence([
        Animated.timing(deleteButtonAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
        Animated.spring(deleteButtonAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [deletedPhotos.length]);

  useFocusEffect(
    useCallback(() => {
      if (params.deletedCount) {
        const deletedCount = parseInt(params.deletedCount, 10);
        setCurrentPhotoIndex(0);
        removePhotoFromDelete("");
        refetch(deletedCount);
        router.setParams({ deletedCount: undefined });
      }
    }, [params.deletedCount, refetch, router, setCurrentPhotoIndex, removePhotoFromDelete])
  );

  const isFinished = currentPhotoIndex >= photos.length && photos.length > 0;

  const handleSwipe = useCallback(
    (direction: "keep" | "delete") => {
      const photo = photos[currentPhotoIndex];
      if (!photo) return;
      triggerSwipeFeedback(direction);
      if (direction === "delete") addPhotoToDelete(photo.id);
      addToHistory({ index: currentPhotoIndex, action: direction, timestamp: Date.now() });
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    },
    [currentPhotoIndex, photos, addPhotoToDelete, addToHistory, setCurrentPhotoIndex, triggerSwipeFeedback]
  );

  const handleUndo = useCallback(() => {
    if (sortingHistory.length === 0) return;
    const lastAction = undoLastAction();
    if (!lastAction) return;
    setCurrentPhotoIndex(lastAction.index);
    if (lastAction.action === "delete") {
      const photo = photos[lastAction.index];
      if (photo) removePhotoFromDelete(photo.id);
    }
  }, [sortingHistory.length, undoLastAction, setCurrentPhotoIndex, removePhotoFromDelete, photos]);

  const handleReview = useCallback(() => {
    router.push({
      pathname: "/review",
      params: {
        assetIds: deletedPhotos.map((p) => p.id).join(","),
        assetUris: deletedPhotos.map((p) => p.uri).join(","),
      },
    });
  }, [deletedPhotos, router]);

  const hasActiveFilter = selectedAlbumId !== null || selectedDateRange !== "all";

  const getCurrentFilterName = useCallback(() => {
    if (selectedAlbumId) {
      const album = albums.find((a) => a.id === selectedAlbumId);
      return album?.title || "Album";
    }
    if (selectedDateRange !== "all") {
      const option = DATE_RANGE_OPTIONS.find((o) => o.value === selectedDateRange);
      return option?.label || "Date";
    }
    return "Filter";
  }, [selectedAlbumId, selectedDateRange, albums]);

  const handleApplyFilters = useCallback(() => {
    setShowFilterModal(false);
    setCurrentPhotoIndex(0);
    removePhotoFromDelete("");
    refetch();
  }, [setCurrentPhotoIndex, removePhotoFromDelete, refetch]);

  const handleClearFilters = useCallback(() => {
    setSelectedAlbumId(null);
    setSelectedDateRange("all");
  }, [setSelectedAlbumId, setSelectedDateRange]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
          filterName={hasActiveFilter ? getCurrentFilterName() : undefined}
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

  return (
    <ScreenBackground>
      {/* Header */}
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
        {/* Logo & Title */}
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentSecondary ?? Colors.accent]}
            style={styles.logoGradient}
          >
            <Zap size={18} color={Colors.white} fill={Colors.white} />
          </LinearGradient>
          <View>
            <Text style={[styles.title, { color: Colors.text }]}>SnapSort</Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              {photos.length > 0
                ? `${photos.length - currentPhotoIndex} remaining`
                : "Ready to sort"}
            </Text>
          </View>
        </View>

        {/* Header Right */}
        <View style={styles.headerRight}>
          {/* Photo counter */}
          {photos.length > 0 && !isFinished && (
            <View
              style={[
                styles.counter,
                { backgroundColor: Colors.surfaceLight, borderColor: Colors.border },
              ]}
            >
              <Text style={[styles.counterText, { color: Colors.accent }]}>
                {currentPhotoIndex + 1}
              </Text>
              <Text style={[styles.counterTotal, { color: Colors.textMuted }]}>
                /{photos.length}
              </Text>
            </View>
          )}

          {/* Filter button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: hasActiveFilter
                  ? Colors.accentLight
                  : Colors.surfaceLight,
                borderColor: hasActiveFilter ? Colors.accent : Colors.border,
              },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <SlidersHorizontal
              size={18}
              color={hasActiveFilter ? Colors.accent : Colors.textSecondary}
            />
          </TouchableOpacity>

          {/* Settings button */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: Colors.surfaceLight, borderColor: Colors.border },
            ]}
            onPress={() => router.push("/settings")}
          >
            <Settings size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Progress bar */}
      {photos.length > 0 && !isFinished && (
        <View style={[styles.progressContainer]}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: Colors.surfaceLight },
            ]}
          >
            <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
              <LinearGradient
                colors={[Colors.accent, Colors.accentSecondary ?? Colors.accent]}
                start={[0, 0]}
                end={[1, 0]}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressLabel, { color: Colors.textMuted }]}>
            {Math.round((currentPhotoIndex / photos.length) * 100)}%
          </Text>
        </View>
      )}

      {/* Card Stack */}
      <View style={styles.cardStack}>
        {mainContent ? (
          mainContent
        ) : (
          <>
            {/* Background cards for depth effect */}
            {photos[currentPhotoIndex + 2] && (
              <View style={[styles.bgCard, styles.bgCard3, { backgroundColor: Colors.surface }]} />
            )}
            {photos[currentPhotoIndex + 1] && (
              <View style={[styles.bgCard, styles.bgCard2, { backgroundColor: Colors.surfaceLight }]} />
            )}
            {photos[currentPhotoIndex] && (
              <SwipeCard
                key={currentPhotoIndex}
                uri={photos[currentPhotoIndex].uri}
                onSwipe={handleSwipe}
                onFilterPress={() => setShowFilterModal(true)}
                hasActiveFilter={hasActiveFilter}
                getCurrentFilterName={getCurrentFilterName}
                index={currentPhotoIndex}
              />
            )}
          </>
        )}
      </View>

      {/* Bottom Controls */}
      {!mainContent && (
        <View style={[styles.controls, { paddingBottom: insets.bottom > 0 ? 0 : Spacing.md }]}>
          {/* Undo button */}
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

          {/* Center swipe hints */}
          <View style={styles.swipeHints}>
            <View style={styles.hintItem}>
              <Trash2 size={13} color={Colors.delete} />
              <Text style={[styles.hintText, { color: Colors.delete }]}>DELETE</Text>
            </View>
            <View style={[styles.hintDivider, { backgroundColor: Colors.textMuted }]} />
            <View style={styles.hintItem}>
              <Text style={[styles.hintText, { color: Colors.keep }]}>KEEP</Text>
              <Heart size={13} color={Colors.keep} fill={Colors.keep} />
            </View>
          </View>

          {/* Delete review badge */}
          <Animated.View style={{ transform: [{ scale: deleteButtonAnim }] }}>
            <TouchableOpacity
              onPress={() => {
                if (deletedPhotos.length > 0) {
                  router.push({
                    pathname: "/review",
                    params: {
                      assetIds: deletedPhotos.map((p) => p.id).join(","),
                      assetUris: deletedPhotos.map((p) => p.uri).join(","),
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
                <Text style={styles.deleteBadgeCount}>{deletedPhotos.length}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Filter Modal */}
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

      {/* Tutorial */}
      <SwipeTutorial visible={showTutorial} onComplete={handleTutorialComplete} />
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
  logoGradient: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  counter: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 15,
    fontWeight: "800",
  },
  counterTotal: {
    fontSize: 13,
    fontWeight: "500",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
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
  cardStack: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bgCard: {
    position: "absolute",
    width: Dimensions.get("window").width - 32,
    height: Dimensions.get("window").height * 0.68,
    borderRadius: BorderRadius.xxl,
  },
  bgCard2: {
    transform: [{ scale: 0.95 }, { translateY: 10 }],
    opacity: 0.6,
  },
  bgCard3: {
    transform: [{ scale: 0.9 }, { translateY: 20 }],
    opacity: 0.3,
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
    width: 50,
    height: 50,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  undoButton: {
    borderWidth: 1,
  },
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
  hintDivider: {
    width: 1,
    height: 12,
    opacity: 0.4,
  },
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
  deleteBadgeCount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});
