import { ScreenBackground } from "@/components";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckSquare,
  Info,
  Square,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface PhotoAsset {
  id: string;
  uri: string;
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const params = useLocalSearchParams<{ assetIds?: string; assetUris?: string }>();

  const assetIds = useMemo(
    () => (params.assetIds ? params.assetIds.split(",").filter(Boolean) : []),
    [params.assetIds]
  );
  const assetUris = useMemo(
    () => (params.assetUris ? params.assetUris.split(",").filter(Boolean) : []),
    [params.assetUris]
  );

  const selectedAssets: PhotoAsset[] = useMemo(
    () => assetIds.map((id, i) => ({ id, uri: assetUris[i] ?? "" })),
    [assetIds, assetUris]
  );

  const [deselected, setDeselected] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleDeselect = useCallback((id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setDeselected(new Set()), []);
  const deselectAll = useCallback(
    () => setDeselected(new Set(assetIds)),
    [assetIds]
  );

  const toDeleteCount = selectedAssets.length - deselected.size;
  const allSelected = deselected.size === 0;

  const handleDelete = useCallback(async () => {
    const toDelete = selectedAssets.filter((a) => !deselected.has(a.id));
    if (toDelete.length === 0) return;

    Alert.alert(
      "Permanently Delete Photos",
      `This will permanently delete ${toDelete.length} photo${toDelete.length !== 1 ? "s" : ""} from your library. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await MediaLibrary.deleteAssetsAsync(toDelete.map((a) => a.id));
              router.replace({
                pathname: "/",
                params: { deletedCount: toDelete.length.toString() },
              });
            } catch (error) {
              Alert.alert("Error", "Failed to delete some photos. Please try again.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [selectedAssets, deselected, router]);

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: Colors.surfaceLight, borderColor: Colors.border },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: Colors.text }]}>
            Review Photos
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.textSecondary }]}>
            {toDeleteCount} of {selectedAssets.length} selected
          </Text>
        </View>

        {/* Select All / Deselect All */}
        <TouchableOpacity
          style={[
            styles.selectAllButton,
            {
              backgroundColor: allSelected ? Colors.accentLight : Colors.surfaceLight,
              borderColor: allSelected ? Colors.accent : Colors.border,
            },
          ]}
          onPress={allSelected ? deselectAll : selectAll}
        >
          {allSelected ? (
            <CheckSquare size={18} color={Colors.accent} />
          ) : (
            <Square size={18} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View
        style={[
          styles.infoBanner,
          { backgroundColor: Colors.deleteLight, borderColor: Colors.delete + "30" },
        ]}
      >
        <AlertTriangle size={14} color={Colors.delete} />
        <Text style={[styles.infoText, { color: Colors.delete }]}>
          Tap a photo to deselect it from deletion
        </Text>
      </View>

      {/* Photo Grid */}
      {selectedAssets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Check size={48} color={Colors.keep} />
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            No photos to review
          </Text>
        </View>
      ) : (
        <FlatList
          data={selectedAssets}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isSelected = !deselected.has(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => toggleDeselect(item.id)}
                style={[
                  styles.thumb,
                  !isSelected && styles.thumbDeselected,
                ]}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={styles.thumbImage}
                  contentFit="cover"
                  transition={150}
                />

                {/* Selected overlay with trash badge */}
                {isSelected && (
                  <View style={styles.selectedOverlay}>
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.5)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <View
                      style={[
                        styles.trashBadge,
                        { backgroundColor: Colors.delete },
                      ]}
                    >
                      <Trash2 size={12} color={Colors.white} />
                    </View>
                  </View>
                )}

                {/* Deselected overlay */}
                {!isSelected && (
                  <View style={styles.deselectedOverlay}>
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: Colors.keep },
                      ]}
                    >
                      <Check size={12} color={Colors.white} />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + Spacing.sm,
            backgroundColor: Colors.surface,
            borderTopColor: Colors.border,
          },
        ]}
      >
        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statPill, { backgroundColor: Colors.keepLight }]}>
            <Check size={12} color={Colors.keep} />
            <Text style={[styles.statText, { color: Colors.keep }]}>
              {deselected.size} keeping
            </Text>
          </View>
          <View style={[styles.statPill, { backgroundColor: Colors.deleteLight }]}>
            <Trash2 size={12} color={Colors.delete} />
            <Text style={[styles.statText, { color: Colors.delete }]}>
              {toDeleteCount} deleting
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButtonWrapper,
            { opacity: toDeleteCount === 0 || isDeleting ? 0.5 : 1 },
          ]}
          onPress={handleDelete}
          disabled={toDeleteCount === 0 || isDeleting}
        >
          <LinearGradient
            colors={[Colors.delete, Colors.deleteDark ?? Colors.delete]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.deleteButton}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Trash2 size={20} color={Colors.white} />
                <Text style={[styles.deleteButtonText, { color: Colors.white }]}>
                  Permanently Delete {toDeleteCount} Photo
                  {toDeleteCount !== 1 ? "s" : ""}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  selectAllButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    paddingHorizontal: GRID_GAP,
    paddingTop: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  thumbDeselected: {
    opacity: 0.35,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 5,
  },
  trashBadge: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  deselectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  statText: {
    fontSize: 12,
    fontWeight: "700",
  },
  deleteButtonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
