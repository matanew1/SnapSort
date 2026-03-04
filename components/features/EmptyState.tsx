import { FolderOpen, ImageOff, RefreshCw } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, getColors, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

interface EmptyStateProps {
  type: 'permission' | 'no-photos' | 'no-results';
  hasActiveFilter?: boolean;
  filterName?: string;
  onRetry?: () => void;
  onFilterPress?: () => void;
}

export function EmptyState({
  type,
  hasActiveFilter = false,
  filterName,
  onRetry,
  onFilterPress,
}: EmptyStateProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  const renderContent = () => {
    switch (type) {
      case 'permission':
        return (
          <>
            <ImageOff size={64} color={Colors.textMuted} />
            <Text style={[styles.title, { color: Colors.text }]}>
              Photo Access Required
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              SnapSort needs access to your photo library to help you clean up
              your gallery.
            </Text>
            {onRetry && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: Colors.accent }]}
                onPress={onRetry}
                accessibilityLabel="Grant photo permission"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: Colors.white }]}>
                  Grant Permission
                </Text>
              </TouchableOpacity>
            )}
          </>
        );

      case 'no-photos':
        return (
          <>
            <ImageOff size={64} color={Colors.textMuted} />
            <Text style={[styles.title, { color: Colors.text }]}>
              No Photos Found
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              Your gallery appears to be empty. Take some photos and come back!
            </Text>
          </>
        );

      case 'no-results':
        return (
          <>
            <FolderOpen size={64} color={Colors.textMuted} />
            <Text style={[styles.title, { color: Colors.text }]}>
              No Photos Found
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              No photos match your current filter
              {filterName ? ` "${filterName}"` : ''}
              .{'\n'}Try a different filter!
            </Text>
            {onFilterPress && (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { borderColor: Colors.border },
                ]}
                onPress={onFilterPress}
                accessibilityLabel="Change filter"
                accessibilityRole="button"
              >
                <FolderOpen
                  size={18}
                  color={hasActiveFilter ? Colors.accent : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color: hasActiveFilter
                        ? Colors.accent
                        : Colors.textSecondary,
                    },
                  ]}
                >
                  {hasActiveFilter
                    ? `Change "${filterName}" Filter`
                    : 'Change Filter'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading your photos...' }: LoadingStateProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <RefreshCw
          size={40}
          color={Colors.accent}
          style={styles.spinner}
        />
        <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

interface FinishedStateProps {
  totalPhotos: number;
  deletedCount: number;
  onReview?: () => void;
  onUndo?: () => void;
}

export function FinishedState({
  totalPhotos,
  deletedCount,
  onReview,
  onUndo,
}: FinishedStateProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={[styles.title, { color: Colors.text }]}>All Done!</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
          You sorted through {totalPhotos} photos.{'\n'}
          {deletedCount} marked for deletion.
        </Text>

        {deletedCount > 0 && onReview && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: Colors.accent }]}
            onPress={onReview}
            accessibilityLabel={`Review ${deletedCount} photos`}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: Colors.white }]}>
              Review {deletedCount} Photos
            </Text>
          </TouchableOpacity>
        )}

        {onUndo && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={onUndo}
            accessibilityLabel="Undo last action"
            accessibilityRole="button"
          >
            <Text style={[styles.undoText, { color: Colors.textSecondary }]}>
              Undo Last
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    marginTop: Spacing.lg,
  },
  spinner: {
    opacity: 0.8,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  undoText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

