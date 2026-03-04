import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowRight,
  FolderOpen,
  Heart,
  ImageOff,
  Settings,
  Trash2,
  Undo2,
  X
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SwipeCard } from "@/components/shared/features";
import { BorderRadius, Colors, getColors, Spacing } from "@/constants/theme";
import { DateRangeFilter, useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useAppStore } from "@/store";

// Date range options
const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "thisWeek", label: "This Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "thisYear", label: "This Year" },
  { value: "older", label: "Older" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const router = useRouter();
  const params = useLocalSearchParams<{ deletedCount?: string }>();
  const {
    photos,
    loading,
    permissionDenied,
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

  // Local state for card key animation
  const [cardKey, setCardKey] = useState(0);

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
        setCardKey((prev) => prev + 1);
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

      if (direction === "delete") {
        addPhotoToDelete(photo.id);
      }

      addToHistory({
        index: currentPhotoIndex,
        action: direction,
        timestamp: Date.now(),
      });
      setCurrentPhotoIndex(currentPhotoIndex + 1);
      setCardKey((prev) => prev + 1);
    },
    [
      currentPhotoIndex,
      photos,
      addPhotoToDelete,
      addToHistory,
      setCurrentPhotoIndex,
    ],
  );

  const handleUndo = useCallback(() => {
    if (sortingHistory.length === 0) return;

    const lastAction = undoLastAction();
    if (!lastAction) return;

    setCurrentPhotoIndex(lastAction.index);
    setCardKey((prev) => prev + 1);

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
  const hasActiveFilter = selectedAlbumId !== null || selectedDateRange !== "all";

  // Get current filter display name
  const getCurrentFilterName = () => {
    if (selectedAlbumId) {
      const album = albums.find(a => a.id === selectedAlbumId);
      return album?.title || "Album";
    }
    if (selectedDateRange !== "all") {
      const option = DATE_RANGE_OPTIONS.find(o => o.value === selectedDateRange);
      return option?.label || "Date";
    }
    return "Filter";
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    setCurrentPhotoIndex(0);
    removePhotoFromDelete("");
    refetch();
  };

  const handleClearFilters = () => {
    setSelectedAlbumId(null);
    setSelectedDateRange("all");
  };

  const progress = useMemo(() => {
    if (photos.length === 0) return 0;
    return Math.min(currentPhotoIndex / photos.length, 1);
  }, [currentPhotoIndex, photos.length]);

  const ScreenBackground: React.FC<{
    children: React.ReactNode;
    centered?: boolean;
  }> = ({ children, centered }) => {
    return (
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={[0, 0]}
        end={[1, 1]}
        style={
          centered
            ? [styles.centered, { paddingTop: insets.top }]
            : [styles.container, { paddingTop: insets.top }]
        }
      >
        {children}
      </LinearGradient>
    );
  };

  // --- Permission denied ---
  if (permissionDenied) {
    return (
      <ScreenBackground centered>
        <ImageOff size={64} color={Colors.textMuted} />
        <Text style={styles.emptyTitle}>Photo Access Required</Text>
        <Text style={styles.emptySubtitle}>
          SnapSort needs access to your photo library to help you clean up your
          gallery.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </ScreenBackground>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <ScreenBackground centered>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading your photos...</Text>
      </ScreenBackground>
    );
  }

  // --- No photos ---
  if (photos.length === 0) {
    return (
      <ScreenBackground centered>
        <ImageOff size={64} color={Colors.textMuted} />
        <Text style={[styles.emptyTitle, {
          color: Colors.text,
        }]}>No Photos Found</Text>
        <Text style={styles.emptySubtitle}>
          {hasActiveFilter 
            ? `No photos match your current filter "${getCurrentFilterName()}". \nTry a different filter!`
            : "Your gallery appears to be empty. Take some photos and come back!"
          }
        </Text>
        
        {/* Filter button for no photos state */}
        <TouchableOpacity 
          style={[styles.noPhotosFilterButton, { borderColor: Colors.border }]}
          onPress={() => setShowFilterModal(true)}
        >
          <FolderOpen size={18} color={hasActiveFilter ? Colors.accent : Colors.textSecondary} />
          <Text style={[
            styles.noPhotosFilterText, 
            { color: hasActiveFilter ? Colors.accent : Colors.textSecondary }
          ]}>
            {hasActiveFilter ? `Change "${getCurrentFilterName()}" Filter` : "Change Filter"}
          </Text>
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors.text }]}>Filter Photos</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* Album Section */}
                <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>
                  ALBUM
                </Text>
                <View style={styles.optionGrid}>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      { borderColor: selectedAlbumId === null ? Colors.accent : Colors.border },
                      selectedAlbumId === null && { backgroundColor: Colors.accentLight }
                    ]}
                    onPress={() => setSelectedAlbumId(null)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: selectedAlbumId === null ? Colors.accent : Colors.text }
                    ]}>
                      All Photos
                    </Text>
                  </TouchableOpacity>
                  {albums.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      style={[
                        styles.optionItem,
                        { borderColor: selectedAlbumId === album.id ? Colors.accent : Colors.border },
                        selectedAlbumId === album.id && { backgroundColor: Colors.accentLight }
                      ]}
                      onPress={() => setSelectedAlbumId(album.id)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: selectedAlbumId === album.id ? Colors.accent : Colors.text }
                      ]}>
                        {album.title} ({album.assetCount})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date Range Section */}
                <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>
                  DATE RANGE
                </Text>
                <View style={styles.optionGrid}>
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionItem,
                        { borderColor: selectedDateRange === option.value ? Colors.accent : Colors.border },
                        selectedDateRange === option.value && { backgroundColor: Colors.accentLight }
                      ]}
                      onPress={() => setSelectedDateRange(option.value)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: selectedDateRange === option.value ? Colors.accent : Colors.text }
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Modal Actions */}
              <View style={[styles.modalActions, { borderTopColor: Colors.border }]}>
                <TouchableOpacity
                  style={[styles.clearButton, { borderColor: Colors.border }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.clearButtonText, { color: Colors.textSecondary }]}>
                    Clear All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, { backgroundColor: Colors.accent }]}
                  onPress={handleApplyFilters}
                >
                  <Text style={[styles.applyButtonText, { color: Colors.white }]}>
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScreenBackground>
    );
  }

  // --- Finished swiping ---
  if (isFinished) {
    return (
      <ScreenBackground centered>
        <Text style={styles.finishedEmoji}>🎉</Text>
        <Text style={[styles.finishedTitle, {
          color: Colors.text,
        }]}>All Done!</Text>
        <Text style={styles.finishedSubtitle}>
          You sorted through {photos.length} photos.{"\n"}
          {deletedPhotos.length} marked for deletion.
        </Text>

        {deletedPhotos.length > 0 && (
          <TouchableOpacity style={styles.reviewButton} onPress={handleReview}>
            <LinearGradient
              colors={[Colors.gradientAltStart, Colors.gradientAltEnd]}
              start={[0, 0]}
              end={[1, 1]}
              style={styles.reviewButtonGradient}
            >
              <Trash2 size={20} color={Colors.white} />
              <Text style={styles.reviewButtonText}>
                Review {deletedPhotos.length} Photos
              </Text>
              <ArrowRight size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.undoAllButton} onPress={handleUndo}>
          <Undo2 size={18} color={Colors.textSecondary} />
          <Text style={styles.undoAllText}>Undo Last</Text>
        </TouchableOpacity>
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
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Swipe to sort your photos</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.counter, { borderColor: Colors.border }]}>
            <Text style={[styles.counterText, { color: Colors.text }]}>
              {currentPhotoIndex + 1}
              <Text style={[styles.counterTotal, { color: Colors.textSecondary }]}> / {photos.length}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { borderColor: Colors.border }]}
            onPress={() => router.push("/settings")}
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
                key={`${photo.id}-${cardKey}-${isTop ? "top" : "bottom"}`}
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
          style={[styles.controlButton, styles.undoButton, { borderColor: Colors.border }]}
          onPress={handleUndo}
          disabled={sortingHistory.length === 0}
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
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>Filter Photos</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Album Section */}
              <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>
                ALBUM
              </Text>
              <View style={styles.optionGrid}>
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { borderColor: selectedAlbumId === null ? Colors.accent : Colors.border },
                    selectedAlbumId === null && { backgroundColor: Colors.accentLight }
                  ]}
                  onPress={() => setSelectedAlbumId(null)}
                >
                  <Text style={[
                    styles.optionText,
                    { color: selectedAlbumId === null ? Colors.accent : Colors.text }
                  ]}>
                    All Photos
                  </Text>
                </TouchableOpacity>
                {albums.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={[
                      styles.optionItem,
                      { borderColor: selectedAlbumId === album.id ? Colors.accent : Colors.border },
                      selectedAlbumId === album.id && { backgroundColor: Colors.accentLight }
                    ]}
                    onPress={() => setSelectedAlbumId(album.id)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: selectedAlbumId === album.id ? Colors.accent : Colors.text }
                    ]}>
                      {album.title} ({album.assetCount})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Section */}
              <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>
                DATE RANGE
              </Text>
              <View style={styles.optionGrid}>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      { borderColor: selectedDateRange === option.value ? Colors.accent : Colors.border },
                      selectedDateRange === option.value && { backgroundColor: Colors.accentLight }
                    ]}
                    onPress={() => setSelectedDateRange(option.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: selectedDateRange === option.value ? Colors.accent : Colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalActions, { borderTopColor: Colors.border }]}>
              <TouchableOpacity
                style={[styles.clearButton, { borderColor: Colors.border }]}
                onPress={handleClearFilters}
              >
                <Text style={[styles.clearButtonText, { color: Colors.textSecondary }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: Colors.accent }]}
                onPress={handleApplyFilters}
              >
                <Text style={[styles.applyButtonText, { color: Colors.white }]}>
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
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
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
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
  // Empty / Loading states
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 22,
  },
  noPhotosFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  noPhotosFilterText: {
    fontSize: 15,
    fontWeight: "600",
  },
  retryButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  // Finished state
  finishedEmoji: {
    fontSize: 64,
  },
  finishedTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: Spacing.md,
  },
  finishedSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    lineHeight: 24,
  },
  reviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: Spacing.xl,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: BorderRadius.full,
  },
  reviewButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  deletedBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  reviewButtonText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  undoAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  undoAllText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "80%",
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  optionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  clearButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  applyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
