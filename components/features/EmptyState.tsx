import {
    scale
} from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { LinearGradient } from "expo-linear-gradient";
import {
    CheckCircle,
    FolderOpen,
    Image as ImageIcon,
    RefreshCw,
    Sparkles,
    Trash2,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type EmptyStateType =
  | "no-permission"
  | "no-photos"
  | "permission-undetermined"
  | "no-photos-in-filter";

interface EmptyStateProps {
  type: EmptyStateType;
  onRequestPermission?: () => void;
  onFilterPress?: () => void;
  hasActiveFilter?: boolean;
  filterName?: string;
}

export function EmptyState({
  type,
  onRequestPermission,
  onFilterPress,
  hasActiveFilter,
  filterName,
}: EmptyStateProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const renderContent = () => {
    switch (type) {
      case "no-permission":
        return (
          <>
            <Animated.View
              style={[
                styles.iconWrapper,
                { transform: [{ translateY: floatTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.accentLight]}
                style={styles.iconCircle}
              >
                <ImageIcon size={44} color={Colors.accent} />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.title, { color: Colors.text }]}>
              Photo Access Required
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              SnapSort needs access to your photo library to help you organize
              and clean up your photos.
            </Text>
            {onRequestPermission && (
              <TouchableOpacity onPress={onRequestPermission}>
                <LinearGradient
                  colors={[
                    Colors.accent,
                    Colors.accentSecondary ?? Colors.accent,
                  ]}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.primaryButton}
                >
                  <Text
                    style={[styles.primaryButtonText, { color: Colors.white }]}
                  >
                    Grant Access
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </>
        );

      case "permission-undetermined":
        return (
          <>
            <Animated.View
              style={[
                styles.iconWrapper,
                { transform: [{ translateY: floatTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.accentLight]}
                style={styles.iconCircle}
              >
                <RefreshCw size={44} color={Colors.accent} />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.title, { color: Colors.text }]}>
              Checking Permissions
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              Please wait while we check your photo library access.
            </Text>
          </>
        );

      case "no-photos":
        return (
          <>
            <Animated.View
              style={[
                styles.iconWrapper,
                { transform: [{ translateY: floatTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.keepLight, Colors.accentLight]}
                style={styles.iconCircle}
              >
                <Sparkles size={44} color={Colors.keep} />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.title, { color: Colors.text }]}>
              All Caught Up!
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              Your photo library is empty or all photos have been sorted. Great
              job keeping things organized!
            </Text>
          </>
        );

      case "no-photos-in-filter":
        return (
          <>
            <Animated.View
              style={[
                styles.iconWrapper,
                { transform: [{ translateY: floatTranslate }] },
              ]}
            >
              <LinearGradient
                colors={[Colors.primaryLight, Colors.accentLight]}
                style={styles.iconCircle}
              >
                <FolderOpen size={44} color={Colors.accent} />
              </LinearGradient>
            </Animated.View>
            <Text style={[styles.title, { color: Colors.text }]}>
              No Photos Found
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              No photos match your current filter
              {filterName ? ` "${filterName}"` : ""}. Try a different filter!
            </Text>
            {onFilterPress && (
              <TouchableOpacity
                style={[
                  styles.outlineButton,
                  { borderColor: Colors.borderLight },
                ]}
                onPress={onFilterPress}
              >
                <FolderOpen
                  size={16}
                  color={hasActiveFilter ? Colors.accent : Colors.textSecondary}
                />
                <Text
                  style={[
                    styles.outlineButtonText,
                    {
                      color: hasActiveFilter
                        ? Colors.accent
                        : Colors.textSecondary,
                    },
                  ]}
                >
                  {hasActiveFilter ? `Change Filter` : "Change Filter"}
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {renderContent()}
    </Animated.View>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading your photos...",
}: LoadingStateProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconCircle,
          {
            backgroundColor: Colors.primaryLight,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <RefreshCw size={40} color={Colors.accent} />
        </Animated.View>
      </Animated.View>
      <Text style={[styles.loadingText, { color: Colors.textSecondary }]}>
        {message}
      </Text>
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
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const keptCount = totalPhotos - deletedCount;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Trophy icon */}
      <Animated.View
        style={[styles.trophyWrapper, { transform: [{ scale: scaleAnim }] }]}
      >
        <LinearGradient
          colors={[Colors.accent, Colors.accentSecondary ?? Colors.accent]}
          style={styles.trophyCircle}
        >
          <CheckCircle size={52} color={Colors.white} />
        </LinearGradient>
      </Animated.View>

      <Text style={[styles.title, { color: Colors.text }]}>All Sorted!</Text>
      <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
        You reviewed {totalPhotos} photos
      </Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: Colors.keepLight,
              borderColor: Colors.keep + "40",
            },
          ]}
        >
          <Text style={[styles.statNumber, { color: Colors.keep }]}>
            {keptCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
            Kept
          </Text>
        </View>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: Colors.deleteLight,
              borderColor: Colors.delete + "40",
            },
          ]}
        >
          <Text style={[styles.statNumber, { color: Colors.delete }]}>
            {deletedCount}
          </Text>
          <Text style={[styles.statLabel, { color: Colors.textSecondary }]}>
            To Delete
          </Text>
        </View>
      </View>

      {deletedCount > 0 && onReview && (
        <TouchableOpacity onPress={onReview} style={styles.reviewButtonWrapper}>
          <LinearGradient
            colors={[Colors.delete, Colors.deleteDark ?? Colors.delete]}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.primaryButton}
          >
            <Trash2 size={18} color={Colors.white} />
            <Text style={[styles.primaryButtonText, { color: Colors.white }]}>
              Review {deletedCount} Photos
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {onUndo && (
        <TouchableOpacity style={styles.undoButton} onPress={onUndo}>
          <Text style={[styles.undoText, { color: Colors.textSecondary }]}>
            Undo Last Action
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    justifyContent: "center",
    alignItems: "center",
  },
  trophyWrapper: {
    marginBottom: Spacing.xl,
  },
  trophyCircle: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  title: {
    fontSize: scale(28),
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: scale(15),
    textAlign: "center",
    lineHeight: scale(22),
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: scale(36),
    fontWeight: "800",
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: scale(13),
    fontWeight: "600",
    marginTop: 4,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: scale(16),
    fontWeight: "700",
  },
  reviewButtonWrapper: {
    width: "100%",
    alignItems: "center",
  },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  outlineButtonText: {
    fontSize: scale(15),
    fontWeight: "600",
  },
  loadingText: {
    fontSize: scale(15),
    marginTop: Spacing.lg,
    fontWeight: "500",
  },
  undoButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  undoText: {
    fontSize: scale(14),
    fontWeight: "500",
  },
});
