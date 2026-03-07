import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Info, Trash2, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.33;
const ROTATION_FACTOR = 14;

export interface SwipeCardMetadata {
  filename: string;
  creationTime: number;
  megapixels?: number;
  fileSizeKB?: number;
}

interface SwipeCardProps {
  uri: string;
  onSwipe: (direction: "keep" | "delete") => void;
  onGoBack?: () => void;
  index?: number;
  /** Called on JS thread with progress -1…1 during drag; 0 on release */
  onDragProgress?: (progress: number) => void;
  qualityScore?: number;
  metadata?: SwipeCardMetadata;
}

function fmtSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`;
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SwipeCard({
  uri,
  onSwipe,
  index = 0,
  onDragProgress,
  qualityScore,
  metadata,
}: SwipeCardProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  const [showInfo, setShowInfo] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(1);

  // ─── stable JS callbacks ──────────────────────────────────────────
  const notifyProgress = useCallback(
    (x: number) => {
      onDragProgress?.(Math.max(-1, Math.min(1, x / SWIPE_THRESHOLD)));
    },
    [onDragProgress],
  );

  const resetProgress = useCallback(() => {
    onDragProgress?.(0);
  }, [onDragProgress]);

  const fireSwipe = useCallback(
    (dir: "keep" | "delete") => onSwipe(dir),
    [onSwipe],
  );

  // ─── programmatic swipe (tap buttons) ────────────────────────────
  const triggerSwipe = useCallback(
    (dir: "keep" | "delete") => {
      const exitX = dir === "keep" ? SCREEN_WIDTH * 1.8 : -SCREEN_WIDTH * 1.8;
      translateX.value = withTiming(exitX, { duration: 310 });
      onDragProgress?.(dir === "keep" ? 1 : -1);
      runOnJS(fireSwipe)(dir);
    },
    [fireSwipe, translateX, onDragProgress],
  );

  // ─── pan gesture ──────────────────────────────────────────────────
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      cardScale.value = withSpring(1.03, { damping: 22, stiffness: 320 });
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.14;
      runOnJS(notifyProgress)(e.translationX);
    })
    .onEnd((e) => {
      // Factor in velocity for a snappier feel
      const velocityBump = e.velocityX * 0.075;
      const effective = e.translationX + velocityBump;

      if (Math.abs(effective) > SWIPE_THRESHOLD * 0.75) {
        const dir = effective > 0 ? "keep" : "delete";
        // Faster fling = shorter exit duration
        const speed = Math.min(Math.abs(e.velocityX), 3500);
        const exitDur = Math.max(150, 330 - speed * 0.035);
        const exitX = dir === "keep" ? SCREEN_WIDTH * 1.85 : -SCREEN_WIDTH * 1.85;
        translateX.value = withTiming(exitX, { duration: exitDur });
        translateY.value = withTiming(e.translationY, { duration: exitDur });
        runOnJS(fireSwipe)(dir);
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 320 });
        translateY.value = withSpring(0, { damping: 22, stiffness: 320 });
        cardScale.value = withSpring(1, { damping: 22, stiffness: 320 });
        runOnJS(resetProgress)();
      }
    });

  // ─── animated styles ─────────────────────────────────────────────
  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_FACTOR, 0, ROTATION_FACTOR],
      Extrapolation.CLAMP,
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
    };
  });

  const keepStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.4],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const s = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.72, 1.06],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ scale: s }, { rotate: "-14deg" }] };
  });

  const deleteStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.4, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const s = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1.06, 0.72],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ scale: s }, { rotate: "14deg" }] };
  });

  const keepGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.28],
      Extrapolation.CLAMP,
    ),
  }));

  const deleteGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.28, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const keepBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.45],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const deleteBorderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.45, 0],
      [1, 0],
      Extrapolation.CLAMP,
    ),
  }));

  const scoreColor =
    qualityScore !== undefined
      ? qualityScore >= 70
        ? "#10B981"
        : qualityScore >= 42
          ? "#F59E0B"
          : "#EF4444"
      : null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        {/* ── Photo ── */}
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* ── Swipe color overlays ── */}
        <Animated.View
          style={[
            styles.glowOverlay,
            { backgroundColor: Colors.keep },
            keepGlowStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.glowOverlay,
            { backgroundColor: Colors.delete },
            deleteGlowStyle,
          ]}
        />

        {/* ── Border glows ── */}
        <Animated.View
          style={[
            styles.borderGlow,
            { borderColor: Colors.keep, shadowColor: Colors.keep },
            keepBorderStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.borderGlow,
            { borderColor: Colors.delete, shadowColor: Colors.delete },
            deleteBorderStyle,
          ]}
        />

        {/* ── Bottom gradient ── */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* ── Quality badge (top-right) ── */}
        {qualityScore !== undefined && scoreColor !== null && (
          <View
            style={[
              styles.qualityBadge,
              {
                backgroundColor: scoreColor + "20",
                borderColor: scoreColor + "55",
              },
            ]}
          >
            <View style={[styles.qualityDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.qualityText, { color: scoreColor }]}>
              {qualityScore}%
            </Text>
          </View>
        )}

        {/* ── Info button (top-left) ── */}
        {metadata && (
          <TouchableOpacity
            style={styles.infoBtn}
            onPress={() => setShowInfo((v) => !v)}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <BlurView intensity={40} tint="dark" style={styles.infoBtnBlur}>
              <Info size={14} color="rgba(255,255,255,0.88)" />
            </BlurView>
          </TouchableOpacity>
        )}

        {/* ── KEEP stamp ── */}
        <Animated.View style={[styles.stamp, styles.keepStamp, keepStampStyle]}>
          <BlurView intensity={60} tint="dark" style={styles.stampBlur}>
            <Heart size={22} color={Colors.keep} fill={Colors.keep} />
            <Text style={[styles.stampText, { color: Colors.keep }]}>KEEP</Text>
          </BlurView>
        </Animated.View>

        {/* ── DELETE stamp ── */}
        <Animated.View
          style={[styles.stamp, styles.deleteStamp, deleteStampStyle]}
        >
          <BlurView intensity={60} tint="dark" style={styles.stampBlur}>
            <Trash2 size={22} color={Colors.delete} />
            <Text style={[styles.stampText, { color: Colors.delete }]}>
              DELETE
            </Text>
          </BlurView>
        </Animated.View>

        {/* ── Tap-to-swipe action buttons ── */}
        <View style={styles.actionRow} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => triggerSwipe("delete")}
            activeOpacity={0.8}
          >
            <BlurView intensity={52} tint="dark" style={styles.actionBtnBlur}>
              <X size={20} color={Colors.delete} strokeWidth={2.5} />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => triggerSwipe("keep")}
            activeOpacity={0.8}
          >
            <BlurView intensity={52} tint="dark" style={styles.actionBtnBlur}>
              <Heart size={20} color={Colors.keep} fill={Colors.keep} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* ── Info overlay ── */}
        {showInfo && metadata && (
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowInfo(false)}
          >
            <BlurView
              intensity={78}
              tint="dark"
              style={[StyleSheet.absoluteFill, styles.infoOverlay]}
            >
              <View style={styles.infoContent}>
                <Text style={styles.infoFilename} numberOfLines={2}>
                  {metadata.filename}
                </Text>
                <View style={styles.infoRule} />
                <View style={styles.infoGrid}>
                  {metadata.megapixels !== undefined && (
                    <InfoCell label="RESOLUTION" value={`${metadata.megapixels.toFixed(1)} MP`} />
                  )}
                  {!!metadata.fileSizeKB && metadata.fileSizeKB > 0 && (
                    <InfoCell label="FILE SIZE" value={fmtSize(metadata.fileSizeKB)} />
                  )}
                  <InfoCell label="DATE" value={fmtDate(metadata.creationTime)} />
                  {qualityScore !== undefined && (
                    <InfoCell
                      label="AI SCORE"
                      value={`${qualityScore}%`}
                      valueColor={scoreColor ?? undefined}
                    />
                  )}
                </View>
                <Text style={styles.infoDismiss}>Tap anywhere to close</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── small helper ────────────────────────────────────────────────────────────
function InfoCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={[styles.infoCellValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.68,
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 22 },
    shadowOpacity: 0.52,
    shadowRadius: 42,
    elevation: 22,
  },
  image: { width: "100%", height: "100%" },
  glowOverlay: { ...StyleSheet.absoluteFillObject },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxl,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 190,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  // quality badge
  qualityBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  qualityDot: { width: 6, height: 6, borderRadius: 3 },
  qualityText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
  // info button
  infoBtn: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    borderRadius: 18,
    overflow: "hidden",
  },
  infoBtnBlur: {
    width: 34,
    height: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  // stamps
  stamp: { position: "absolute", top: 58, zIndex: 50 },
  keepStamp: { left: 20 },
  deleteStamp: { right: 20 },
  stampBlur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.14)",
  },
  stampText: { fontSize: 20, fontWeight: "900", letterSpacing: 2 },
  // tap-to-swipe buttons
  actionRow: {
    position: "absolute",
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl + 4,
  },
  actionBtn: {
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 7,
  },
  actionBtnBlur: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  // info overlay
  infoOverlay: {
    borderRadius: BorderRadius.xxl,
    justifyContent: "flex-end",
  },
  infoContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  infoFilename: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: Spacing.md,
    lineHeight: 21,
  },
  infoRule: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  infoCell: { flex: 1, minWidth: "40%" },
  infoCellLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.42)",
    letterSpacing: 1.6,
    marginBottom: 3,
  },
  infoCellValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  infoDismiss: {
    fontSize: 11,
    color: "rgba(255,255,255,0.32)",
    textAlign: "center",
    marginTop: Spacing.md,
  },
});