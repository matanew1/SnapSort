import { X } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BorderRadius, getColors, Spacing } from '@/constants/theme';
import { Album, DateRangeFilter } from '@/hooks/useMediaLibrary';
import { useAppStore } from '@/store';

// Date range filter options
export const DATE_RANGE_OPTIONS: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'older', label: 'Older' },
];

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  albums: Album[];
  selectedAlbumId: string | null;
  selectedDateRange: DateRangeFilter;
  onSelectAlbum: (albumId: string | null) => void;
  onSelectDateRange: (range: DateRangeFilter) => void;
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

  const handleClearFilters = useCallback(() => {
    onClearFilters();
  }, [onClearFilters]);

  const handleApplyFilters = useCallback(() => {
    onApplyFilters();
  }, [onApplyFilters]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor: Colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{ width: '100%' }}
        >
          <View
            style={[styles.modalContent, { backgroundColor: Colors.surface }]}
          >
            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                { borderBottomColor: Colors.border },
              ]}
            >
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                Filter Photos
              </Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Body */}
            <ScrollView style={styles.modalBody}>
              {/* Album Section */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: Colors.textSecondary },
                ]}
              >
                ALBUM
              </Text>
              <View style={styles.optionGrid}>
                {/* All Photos Option */}
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    {
                      borderColor:
                        selectedAlbumId === null
                          ? Colors.accent
                          : Colors.border,
                    },
                    selectedAlbumId === null && {
                      backgroundColor: Colors.accentLight,
                    },
                  ]}
                  onPress={() => onSelectAlbum(null)}
                  accessibilityLabel="All Photos"
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.optionText,
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
                </TouchableOpacity>

                {/* Album Options */}
                {albums.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={[
                      styles.optionItem,
                      {
                        borderColor:
                          selectedAlbumId === album.id
                            ? Colors.accent
                            : Colors.border,
                      },
                      selectedAlbumId === album.id && {
                        backgroundColor: Colors.accentLight,
                      },
                    ]}
                    onPress={() => onSelectAlbum(album.id)}
                    accessibilityLabel={`${album.title} album`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            selectedAlbumId === album.id
                              ? Colors.accent
                              : Colors.text,
                        },
                      ]}
                    >
                      {album.title} ({album.assetCount})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date Range Section */}
              <Text
                style={[
                  styles.sectionLabel,
                  { color: Colors.textSecondary },
                ]}
              >
                DATE RANGE
              </Text>
              <View style={styles.optionGrid}>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      {
                        borderColor:
                          selectedDateRange === option.value
                            ? Colors.accent
                            : Colors.border,
                      },
                      selectedDateRange === option.value && {
                        backgroundColor: Colors.accentLight,
                      },
                    ]}
                    onPress={() => onSelectDateRange(option.value)}
                    accessibilityLabel={option.label}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color:
                            selectedDateRange === option.value
                              ? Colors.accent
                              : Colors.text,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Actions */}
            <View
              style={[
                styles.modalActions,
                { borderTopColor: Colors.border },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  { borderColor: Colors.border },
                ]}
                onPress={handleClearFilters}
                accessibilityLabel="Clear all filters"
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.clearButtonText,
                    { color: Colors.textSecondary },
                  ]}
                >
                  Clear All
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: Colors.accent },
                ]}
                onPress={handleApplyFilters}
                accessibilityLabel="Apply filters"
                accessibilityRole="button"
              >
                <Text
                  style={[styles.applyButtonText, { color: Colors.white }]}
                >
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: '600',
  },
  applyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

