import { BlurView } from "expo-blur";
import { Image } from "expo-image";
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

import { BorderRadius, Colors, getColors } from "@/constants/theme";
import { useAppStore } from "@/store";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_ANGLE = 15;

interface SwipeCardProps {
  uri: string;
  onSwipe: (direction: "keep" | "delete") => void;
  isTop: boolean;
  hasActiveFilter?: boolean;
  getCurrentFilterName?: () => string;
  onFilterPress?: () => void;
  onGoBack?: () => void;
}

export function SwipeCard({ 
  uri, 
  onSwipe, 
  isTop,
  hasActiveFilter = false,
  getCurrentFilterName,
  onFilterPress,
  onGoBack,
}: SwipeCardProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(isTop ? 1 : 0.95);
  const isExiting = useSharedValue(false);
  const exitDirection = useSharedValue<"keep" | "delete">("keep");

  // Reset values when card becomes top
  React.useEffect(() => {
    if (isTop) {
      translateX.value = 0;
      translateY.value = 0;
      isExiting.value = false;
      cardScale.value = withSpring(1, {
        damping: 20,
        stiffness: 150,
      });
    } else {
      cardScale.value = withSpring(0.95, {
        damping: 20,
        stiffness: 150,
      });
    }
  }, [isTop, translateX, translateY, cardScale, isExiting]);

  const handleSwipe = (direction: "keep" | "delete") => {
    if (!isTop) return;
    isExiting.value = true;
    exitDirection.value = direction;
    onSwipe(direction);
  };

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4;
    })
    .onEnd((event) => {
      if (isExiting.value) return;
      
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "keep" : "delete";
        const targetX =
          event.translationX > 0 ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        translateX.value = withTiming(targetX, { duration: 250 });
        translateY.value = withTiming(event.translationY * 0.8, {
          duration: 250,
        });
        
        runOnJS(handleSwipe)(direction);
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_ANGLE, 0, ROTATION_ANGLE],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: cardScale.value },
      ],
      zIndex: isTop ? 10 : 1,
    };
  });

  const keepStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ scale }, { rotate: "-15deg" }] };
  });

  const deleteStampStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP,
    );
    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.5],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ scale }, { rotate: "15deg" }] };
  });

  const keepGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 0.3],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const deleteGlowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [0.3, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.cardContainer, cardStyle]}>
        {/* Floating Buttons - Top Row */}
        {(onFilterPress || onGoBack) && (
          <View style={styles.topButtonsRow}>         
            {/* Filter Button */}
            {onFilterPress && (
              <BlurView intensity={100} tint="default" style={styles.filterButtonBlur}>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={onFilterPress}
                >
                  {hasActiveFilter ? (
                    <ChevronDown size={16} color={Colors.black} />
                  ) : (
                    <FolderOpen size={16} color={Colors.black} />
                  )}
                  <Text style={[
                    styles.filterButtonText, 
                    { color: Colors.black }
                  ]}>
                    {getCurrentFilterName ? getCurrentFilterName() : "Filter"}
                  </Text>
                </TouchableOpacity>
              </BlurView>
            )}
          </View>
        )}

        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />

        {/* Green keep glow */}
        <Animated.View
          style={[styles.glowOverlay, styles.keepGlow, keepGlowStyle]}
        />

        {/* Red delete glow */}
        <Animated.View
          style={[styles.glowOverlay, styles.deleteGlow, deleteGlowStyle]}
        />

        {/* KEEP stamp */}
        <Animated.View style={[styles.stamp, styles.keepStamp, keepStampStyle]}>
          <Heart size={28} color={Colors.keep} fill={Colors.keep} />
          <Text style={[styles.stampText, styles.keepText]}>KEEP</Text>
        </Animated.View>

        {/* DELETE stamp */}
        <Animated.View
          style={[styles.stamp, styles.deleteStamp, deleteStampStyle]}
        >
          <Trash2 size={28} color={Colors.delete} />
          <Text style={[styles.stampText, styles.deleteText]}>DELETE</Text>
        </Animated.View>

        {/* Bottom gradient for readability */}
        <View style={styles.bottomGradient} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    position: "absolute",
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  filterButtonBlur: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  topButtonsRow: {
    position: "absolute",
    top: 16,
    right: 16,
    left: 16,
    zIndex: 100,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xxl,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xxl,
  },
  keepGlow: {
    backgroundColor: Colors.keep,
  },
  deleteGlow: {
    backgroundColor: Colors.delete,
  },
  stamp: {
    position: "absolute",
    top: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 3,
    borderRadius: BorderRadius.md,
  },
  keepStamp: {
    left: 20,
    borderColor: Colors.keep,
    backgroundColor: Colors.keepLight,
  },
  deleteStamp: {
    right: 20,
    borderColor: Colors.delete,
    backgroundColor: Colors.deleteLight,
  },
  stampText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
  },
  keepText: {
    color: Colors.keep,
  },
  deleteText: {
    color: Colors.delete,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    backgroundColor: "transparent",
  },
});

