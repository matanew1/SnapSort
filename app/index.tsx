import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Heart, Settings, Trash2, Undo2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  DATE_RANGE_OPTIONS,
  EmptyState,
  FilterModal,
  FinishedState,
  LoadingState,
  ScreenBackground,
  SwipeCard,
  SwipeTutorial,
} from "@/components";
import { BorderRadius, Colors, getColors, Spacing } from "@/constants/theme";
import {
  useAppPreferences,
  useHaptics,
  useMediaLibrary
} from "@/hooks";
import { useAppStore } from "@/store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const router = useRouter();
  const params = useLocalSearchParams<{ deletedCount?: string }>();

  // Haptics
  const { triggerSwipeFeedback } = useHaptics();

  // Preferences & Tutorial
  const { hasSeenTutorial, setHasSeenTutorial } = useAppPreferences();

  // Tutorial visibility state
  const [showTutorial, setShowTutorial] = useState(false);

  // Show tutorial on first launch
  useEffect(() => {
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hasSeenTutorial]);

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

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Store hooks
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

  // Derived state: deleted photos as PhotoAsset objects
  const deletedPhotos = useMemo(() => {
    return photos.filter((p) => selectedPhotosForDelete.includes(p.id));
  }, [photos, selectedPhotosForDelete]);

  // Refetch photos when returning from review screen after deletion
  useFocusEffect(
    useCallback(() => {
      if (params.deletedCount) {
        const deletedCount = parseInt(params.deletedCount, 10);
        // Reset state and refetch with deletion count
        setCurrentPhotoIndex(0);
        removePhotoFromDelete(""); // Clear all deletions by resetting
        refetch(deletedCount);
        // Clear the param
        router.setParams({ deletedCount: undefined });
      }
    }, [
      params.deletedCount,
      refetch,
      router,
      setCurrentPhotoIndex,
      removePhotoFromDelete,
    ]),
  );

  const isFinished = currentPhotoIndex >= photos.length && photos.length > 0;

  const handleSwipe = useCallback(
    (direction: "keep" | "delete") => {
      const photo = photos[currentPhotoIndex];
      if (!photo) return;

      // Trigger haptic feedback
      triggerSwipeFeedback(direction);

      if (direction === "delete") {
        addPhotoToDelete(photo.id);
      }

      addToHistory({
        index: currentPhotoIndex,
        action: direction,
        timestamp: Date.now(),
      });
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    },
    [
      currentPhotoIndex,
      photos,
      addPhotoToDelete,
      addToHistory,
      setCurrentPhotoIndex,
      triggerSwipeFeedback,
    ],
  );

  const handleUndo = useCallback(() => {
    if (sortingHistory.length === 0) return;

    const lastAction = undoLastAction();
    if (!lastAction) return;

    setCurrentPhotoIndex(lastAction.index);

    if (lastAction.action === "delete") {
      const photo = photos[lastAction.index];
      if (photo) {
        removePhotoFromDelete(photo.id);
      }
    }
  }, [
    sortingHistory.length,
    undoLastAction,
    setCurrentPhotoIndex,
    removePhotoFromDelete,
    photos,
  ]);

  const handleReview = useCallback(() => {
    router.push({
      pathname: "/review",
      params: {
        assetIds: deletedPhotos.map((p) => p.id).join(","),
        assetUris: deletedPhotos.map((p) => p.uri).join(","),
      },
    });
  }, [deletedPhotos, router]);

  // Check if any filter is active
  const hasActiveFilter =
    selectedAlbumId !== null || selectedDateRange !== "all";

  // Get current filter display name - memoized
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
    removePhotoFromDelete("");
    refetch();
  }, [setCurrentPhotoIndex, removePhotoFromDelete, refetch]);

  const handleClearFilters = useCallback(() => {
    setSelectedAlbumId(null);
    setSelectedDateRange("all");
  }, [setSelectedAlbumId, setSelectedDateRange]);

  const progress = useMemo(() => {
    if (photos.length === 0) return 0;
    return Math.min(currentPhotoIndex / photos.length, 1);
  }, [currentPhotoIndex, photos.length]);

  // --- Permission denied ---
  if (permissionDenied) {
    return (
      <ScreenBackground centered>
        <EmptyState type="permission" onRetry={() => refetch()} />
      </ScreenBackground>
    );
  }

  // --- Permission undetermined ---
  if (permissionUndetermined) {
    return (
      <ScreenBackground centered>
        <EmptyState type="permission" onRetry={() => refetch()} />
      </ScreenBackground>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <ScreenBackground centered>
        <LoadingState message="Loading your photos..." />
      </ScreenBackground>
    );
  }

  // --- No photos ---
  if (photos.length === 0) {
    return (
      <ScreenBackground centered>
        {hasActiveFilter ? (
          <EmptyState
            type="no-results"
            hasActiveFilter={hasActiveFilter}
            filterName={getCurrentFilterName()}
            onFilterPress={() => setShowFilterModal(true)}
          />
        ) : (
          <EmptyState type="no-photos" />
        )}

        {/* Filter Modal */}
        <FilterModal
          visible={showFilterModal}
          onClose={() => setShowFilterModal(false)}
          albums={albums}
          selectedAlbumId={selectedAlbumId}
          selectedDateRange={selectedDateRange}
          onSelectAlbum={setSelectedAlbumId}
          onSelectDateRange={setSelectedDateRange}
          onClearFilters={handleClearFilters}
          onApplyFilters={handleApplyFilters}
        />
      </ScreenBackground>
    );
  }

  // --- Finished swiping ---
  if (isFinished) {
    return (
      <ScreenBackground centered>
        <FinishedState
          totalPhotos={photos.length}
          deletedCount={deletedPhotos.length}
          onReview={deletedPhotos.length > 0 ? handleReview : undefined}
          onUndo={sortingHistory.length > 0 ? handleUndo : undefined}
        />
      </ScreenBackground>
    );
  }

  // --- Main swipe view ---
  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: Colors.text }]}>SnapSort</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
            Swipe to sort your photos
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.counter, { borderColor: Colors.border }]}>
            <Text style={[styles.counterText, { color: Colors.text }]}>
              {currentPhotoIndex + 1}
              <Text
                style={[styles.counterTotal, { color: Colors.textSecondary }]}
              >
                {" "}
                / {photos.length}
              </Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { borderColor: Colors.border }]}
            onPress={() => router.push("/settings")}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Settings size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      {/* Card stack */}
      <View style={styles.cardStack}>
        {/* Render up to 2 cards for the stacked effect */}
        {photos
          .slice(currentPhotoIndex, currentPhotoIndex + 2)
          .reverse()
          .map((photo, i, arr) => {
            const isTop = i === arr.length - 1;
            return (
              <SwipeCard
                key={`${photo.id}`}
                uri={photo.uri}
                onSwipe={handleSwipe}
                isTop={isTop}
                hasActiveFilter={hasActiveFilter}
                getCurrentFilterName={getCurrentFilterName}
                onFilterPress={() => setShowFilterModal(true)}
                onGoBack={() => setShowFilterModal(false)}
              />
            );
          })}
      </View>

      {/* Bottom controls */}
      <View
        style={[styles.controls, { paddingBottom: insets.bottom + Spacing.md }]}
      >
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.undoButton,
            { borderColor: Colors.border },
          ]}
          onPress={handleUndo}
          disabled={sortingHistory.length === 0}
          accessibilityLabel="Undo last action"
          accessibilityRole="button"
        >
          <Undo2
            size={24}
            color={sortingHistory.length === 0 ? Colors.textMuted : Colors.text}
          />
        </TouchableOpacity>

        <View style={styles.swipeHints}>
          <View style={styles.hintItem}>
            <Trash2 size={14} color={Colors.delete} />
            <Text style={[styles.hintText, { color: Colors.delete }]}>
              DELETE
            </Text>
          </View>
          <View style={styles.hintDivider} />
          <View style={styles.hintItem}>
            <Text style={[styles.hintText, { color: Colors.keep }]}>KEEP</Text>
            <Heart size={14} color={Colors.keep} fill={Colors.keep} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.deletedBadge}
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
          accessibilityLabel={`Review ${deletedPhotos.length} photos to delete`}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[Colors.gradientAltStart, Colors.gradientAltEnd]}
            start={[0, 0]}
            end={[1, 1]}
            style={styles.deletedBadgeGradient}
          >
            <Trash2 size={16} color={Colors.white} />
            <Text style={styles.deletedCount}>{deletedPhotos.length}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        selectedDateRange={selectedDateRange}
        onSelectAlbum={setSelectedAlbumId}
        onSelectDateRange={setSelectedDateRange}
        onClearFilters={handleClearFilters}
        onApplyFilters={handleApplyFilters}
      />

      {/* Tutorial Modal */}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  counter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterText: {
    fontSize: 16,
    fontWeight: "700",
  },
  counterTotal: {
    color: Colors.textMuted,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingsButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  cardStack: {
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
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  undoButton: {
    borderWidth: 1,
    borderColor: Colors.border,
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
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  hintDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.textMuted,
    opacity: 0.4,
  },
  deletedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "transparent",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 0,
    borderColor: "transparent",
  },
  deletedCount: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },
  deletedBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
});
