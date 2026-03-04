import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, FolderOpen, Heart, Trash2 } from "lucide-react-native";
import React from "react";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.35;
const ROTATION_FACTOR = 12;

interface SwipeCardProps {
  uri: string;
  onSwipe: (direction: "keep" | "delete") => void;
  onFilterPress?: () => void;
  onGoBack?: () => void;
  hasActiveFilter?: boolean;
  getCurrentFilterName?: () => string;
  index?: number;
}

export function SwipeCard({
  uri,
  onSwipe,
  onFilterPress,
  onGoBack,
  hasActiveFilter,
  getCurrentFilterName,
  index = 0,
}: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      scale.value = withSpring(1.02, { damping: 20, stiffness: 300 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.2;
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      if (shouldSwipe) {
        const direction = event.translationX > 0 ? "keep" : "delete";
        const exitX = direction === "keep" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        translateX.value = withTiming(exitX, { duration: 350 });
        translateY.value = withTiming(event.translationY, { duration: 350 });
        runOnJS(onSwipe)(direction);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
        scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_FACTOR, 0, ROTATION_FACTOR],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: scale.value },
      ],
    };
  });

  const keepStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const stampScale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.7, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale: stampScale }, { rotate: "-15deg" }] };
  });

  const deleteStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    const stampScale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.7],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale: stampScale }, { rotate: "15deg" }] };
  });

  const keepGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.4],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const deleteGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.4, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const keepBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD * 0.5],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const deleteBorderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD * 0.5, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        {/* Main Image */}
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* Keep glow overlay */}
        <Animated.View style={[styles.glowOverlay, styles.keepGlow, keepGlowStyle]} />

        {/* Delete glow overlay */}
        <Animated.View style={[styles.glowOverlay, styles.deleteGlow, deleteGlowStyle]} />

        {/* Keep border glow */}
        <Animated.View style={[styles.borderGlow, styles.keepBorder, keepBorderStyle]} />

        {/* Delete border glow */}
        <Animated.View style={[styles.borderGlow, styles.deleteBorder, deleteBorderStyle]} />

        {/* Bottom gradient */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* Top buttons row */}
        {onFilterPress && (
          <View style={styles.topButtonsRow}>
            <BlurView intensity={80} tint="dark" style={styles.filterButtonBlur}>
              <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
                {hasActiveFilter ? (
                  <ChevronDown size={14} color="#fff" />
                ) : (
                  <FolderOpen size={14} color="#fff" />
                )}
                <Text style={styles.filterButtonText}>
                  {getCurrentFilterName ? getCurrentFilterName() : "Filter"}
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        )}

        {/* KEEP stamp */}
        <Animated.View style={[styles.stamp, styles.keepStamp, keepStampStyle]}>
          <BlurView intensity={60} tint="dark" style={styles.stampBlur}>
            <Heart size={22} color={Colors.keep} fill={Colors.keep} />
            <Text style={[styles.stampText, { color: Colors.keep }]}>KEEP</Text>
          </BlurView>
        </Animated.View>

        {/* DELETE stamp */}
        <Animated.View style={[styles.stamp, styles.deleteStamp, deleteStampStyle]}>
          <BlurView intensity={60} tint="dark" style={styles.stampBlur}>
            <Trash2 size={22} color={Colors.delete} />
            <Text style={[styles.stampText, { color: Colors.delete }]}>DELETE</Text>
          </BlurView>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.68,
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 16,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keepGlow: {
    backgroundColor: Colors.keep,
    opacity: 0,
  },
  deleteGlow: {
    backgroundColor: Colors.delete,
    opacity: 0,
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxl,
    borderWidth: 3,
  },
  keepBorder: {
    borderColor: Colors.keep,
    shadowColor: Colors.keep,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  deleteBorder: {
    borderColor: Colors.delete,
    shadowColor: Colors.delete,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  topButtonsRow: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 100,
  },
  filterButtonBlur: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  stamp: {
    position: "absolute",
    top: 56,
    zIndex: 50,
  },
  keepStamp: {
    left: 20,
  },
  deleteStamp: {
    right: 20,
  },
  stampBlur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  stampText: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
