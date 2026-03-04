import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Copy, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3;

interface SimilarityGroup {
  groupId: string;
  photos: { id: string; uri: string }[];
  bestPhotoId: string;
  similarity: number;
}

interface AISimilarPhotosProps {
  groups: SimilarityGroup[];
  onSelectPhotosForDeletion?: (photoIds: string[]) => void;
  onDismiss?: () => void;
}

export function AISimilarPhotos({
  groups,
  onSelectPhotosForDeletion,
  onDismiss,
}: AISimilarPhotosProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [selectedGroup, setSelectedGroup] = useState<SimilarityGroup | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (groups.length === 0) return null;

  const handleSelectPhoto = (photoId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleSelectAll = (groupId: string) => {
    const group = groups.find((g) => g.groupId === groupId);
    if (!group) return;

    const allSelected = group.photos.every((p) => selected.has(p.id));
    setSelected((prev) => {
      const next = new Set(prev);
      group.photos.forEach((p) => {
        if (allSelected) {
          next.delete(p.id);
        } else {
          next.add(p.id);
        }
      });
      return next;
    });
  };

  const handleApply = () => {
    if (selected.size > 0) {
      onSelectPhotosForDeletion?.(Array.from(selected));
      setSelected(new Set());
      setSelectedGroup(null);
    }
  };

  return (
    <>
      {/* Floating indicator */}
      {groups.length > 0 && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.indicator}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentSecondary ?? Colors.accent]}
            style={styles.indicatorGradient}
          >
            <Copy size={14} color="#fff" />
            <Text style={styles.indicatorText}>
              {groups.length} similar group{groups.length !== 1 ? "s" : ""}
            </Text>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Modal for detailed view */}
      <Modal
        visible={selectedGroup !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedGroup(null)}
      >
        <View style={[styles.modal, { backgroundColor: Colors.background }]}>
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: Colors.surface, borderBottomColor: Colors.border },
            ]}
          >
            <Text style={[styles.modalTitle, { color: Colors.text }]}>
              Similar Photos
            </Text>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: Colors.surfaceLight }]}
              onPress={() => setSelectedGroup(null)}
            >
              <X size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {groups.map((group) => {
              const groupSelected = group.photos.filter((p) => selected.has(p.id));
              const allSelected = groupSelected.length === group.photos.length;

              return (
                <View key={group.groupId} style={styles.groupCard}>
                  {/* Group header */}
                  <View
                    style={[
                      styles.groupHeader,
                      {
                        backgroundColor: Colors.surfaceLight,
                        borderColor: Colors.border,
                      },
                    ]}
                  >
                    <View>
                      <Text style={[styles.groupTitle, { color: Colors.text }]}>
                        {group.photos.length} similar photos
                      </Text>
                      <Text style={[styles.groupSubtitle, { color: Colors.textMuted }]}>
                        {groupSelected.length} selected
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.selectAllBtn,
                        {
                          backgroundColor: allSelected
                            ? Colors.accentLight
                            : Colors.border,
                        },
                      ]}
                      onPress={() => handleSelectAll(group.groupId)}
                    >
                      <Text
                        style={[
                          styles.selectAllText,
                          {
                            color: allSelected ? Colors.accent : Colors.textSecondary,
                          },
                        ]}
                      >
                        {allSelected ? "Deselect" : "Select"} All
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Photos grid */}
                  <View style={styles.photosGrid}>
                    {group.photos.map((photo) => {
                      const isSelected = selected.has(photo.id);
                      const isBest = photo.id === group.bestPhotoId;

                      return (
                        <TouchableOpacity
                          key={photo.id}
                          style={[
                            styles.photoThumb,
                            isSelected && styles.photoThumbSelected,
                          ]}
                          onPress={() => handleSelectPhoto(photo.id)}
                        >
                          <Image
                            source={{ uri: photo.uri }}
                            style={styles.photoImage}
                            contentFit="cover"
                          />

                          {/* Best badge */}
                          {isBest && (
                            <View
                              style={[
                                styles.bestBadge,
                                { backgroundColor: Colors.keep },
                              ]}
                            >
                              <Text style={styles.bestText}>Best</Text>
                            </View>
                          )}

                          {/* Selection overlay */}
                          {isSelected && (
                            <View
                              style={[
                                styles.selectOverlay,
                                { backgroundColor: Colors.delete + "80" },
                              ]}
                            >
                              <Copy size={20} color="#fff" />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Footer */}
          {selected.size > 0 && (
            <View
              style={[
                styles.modalFooter,
                { backgroundColor: Colors.surface, borderTopColor: Colors.border },
              ]}
            >
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: Colors.border }]}
                onPress={() => {
                  setSelected(new Set());
                  setSelectedGroup(null);
                }}
              >
                <Text style={[styles.cancelText, { color: Colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyBtnWrapper}
                onPress={handleApply}
              >
                <LinearGradient
                  colors={[Colors.delete, Colors.deleteDark ?? Colors.delete]}
                  style={styles.applyBtn}
                  start={[0, 0]}
                  end={[1, 0]}
                >
                  <Copy size={16} color="#fff" />
                  <Text style={styles.applyText}>
                    Delete {selected.size} Duplicate{selected.size !== 1 ? "s" : ""}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  indicator: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  indicatorGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  indicatorText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  groupCard: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  groupSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  selectAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "700",
  },
  photosGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  photoThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  photoThumbSelected: {
    borderColor: "#FF4D6D",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  bestBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  bestText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  selectOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  applyBtnWrapper: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  applyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
