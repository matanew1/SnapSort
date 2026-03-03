import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Trash2, X } from "lucide-react-native";
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

import { BorderRadius, Colors, getColors, Spacing } from "@/constants/theme";
import { useAppStore, useServiceStore } from "@/store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_GAP = 3;
const NUM_COLUMNS = 3;
const THUMB_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    assetIds: string;
    assetUris: string;
  }>();

  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  // Store hooks
  const { isDeleting, deletePhotos } = useServiceStore();
  const { incrementPhotosDeleted } = useAppStore();

  const assets = useMemo(() => {
    const ids = params.assetIds?.split(",").filter(Boolean) ?? [];
    const uris = params.assetUris?.split(",").filter(Boolean) ?? [];
    return ids.map((id, index) => ({ id, uri: uris[index] ?? "" }));
  }, [params.assetIds, params.assetUris]);

  const [deselected, setDeselected] = useState<Set<string>>(new Set());

  const selectedAssets = useMemo(
    () => assets.filter((a) => !deselected.has(a.id)),
    [assets, deselected],
  );

  const toggleDeselect = useCallback((id: string) => {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (selectedAssets.length === 0) return;

    Alert.alert(
      "Delete Photos",
      `Are you sure you want to permanently delete ${selectedAssets.length} photo${selectedAssets.length > 1 ? "s" : ""}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const ids = selectedAssets.map((a) => a.id);
              const deletedCount = selectedAssets.length;
              
              // Use store to delete photos
              const success = await deletePhotos(ids);
              
              if (success) {
                // Track deleted count in app store
                incrementPhotosDeleted(deletedCount);
                
                // Navigate back to home and pass deletion count
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/");
                }
                // Force refresh with deletion count info
                setTimeout(() => {
                  router.setParams({ deletedCount });
                }, 100);
              } else {
                Alert.alert(
                  "Error",
                  "Failed to delete some photos. Please try again.",
                );
              }
            } catch (error) {
              console.error("Delete failed:", error);
              Alert.alert(
                "Error",
                "Failed to delete some photos. Please try again.",
              );
            }
          },
        },
      ],
    );
  }, [selectedAssets, deletePhotos, incrementPhotosDeleted, router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Review</Text>
          <Text style={styles.headerSubtitle}>
            {selectedAssets.length} of {assets.length} selected
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Trash2 size={16} color={Colors.delete} />
        <Text style={styles.infoText}>
          Tap a photo to deselect it from deletion
        </Text>
      </View>

      {/* Grid */}
      <FlatList
        data={assets}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const isSelected = !deselected.has(item.id);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleDeselect(item.id)}
              style={[styles.thumb, !isSelected && styles.thumbDeselected]}
            >
              <Image
                source={{ uri: item.uri }}
                style={styles.thumbImage}
                contentFit="cover"
              />
              {isSelected && (
                <View style={styles.thumbOverlay}>
                  <View style={styles.trashBadge}>
                    <Trash2 size={14} color={Colors.white} />
                  </View>
                </View>
              )}
              {!isSelected && (
                <View style={styles.deselectedOverlay}>
                  <X size={24} color={Colors.textMuted} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Bottom action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.deleteButton,
            selectedAssets.length === 0 && styles.deleteButtonDisabled,
          ]}
          onPress={handleDelete}
          disabled={selectedAssets.length === 0 || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Trash2 size={20} color={Colors.white} />
              <Text style={styles.deleteButtonText}>
                Permanently Delete {selectedAssets.length} Photo
                {selectedAssets.length !== 1 ? "s" : ""}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.deleteLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.15)",
  },
  infoText: {
    fontSize: 13,
    color: Colors.delete,
    fontWeight: "500",
  },
  grid: {
    paddingHorizontal: GRID_GAP,
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
    opacity: 0.4,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    padding: 6,
  },
  trashBadge: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.delete,
    justifyContent: "center",
    alignItems: "center",
  },
  deselectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.delete,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
    opacity: 0.5,
  },
  deleteButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
