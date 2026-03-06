import { scale, scaleFont } from "@/constants/responsive";
import { BorderRadius, Spacing } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AUTO_ADVANCE_MS = 4500;
const KEN_BURNS_DURATION = AUTO_ADVANCE_MS + 500;

const KB_CONFIGS = [
  { startX: -12, endX: 12, startY: -6, endY: 6, startS: 1.08, endS: 1.18 },
  { startX: 12, endX: -12, startY: 6, endY: -6, startS: 1.18, endS: 1.08 },
  { startX: -6, endX: 14, startY: -12, endY: 2, startS: 1.1, endS: 1.2 },
  { startX: 6, endX: -14, startY: 12, endY: -2, startS: 1.2, endS: 1.1 },
];

export interface HighlightPhoto {
  id: string;
  uri: string;
  qualityScore: number;
  creationTime: number;
  filename: string;
  uniquenessText?: string;
  megapixels?: number;
  aspectRatio?: number;
  fileSizeKB?: number;
  isBlurry?: boolean;
  isDark?: boolean;
  isOverexposed?: boolean;
  isBurst?: boolean;
  // Enhanced data
  exposure?: "balanced" | "dark" | "bright";
  composition?: "portrait" | "landscape" | "square" | "panorama" | "standard";
  lighting?: "natural" | "artificial" | "low" | "harsh" | "golden_hour" | "blue_hour";
  hasFace?: boolean;
  isPanorama?: boolean;
  colorVibrancy?: "vibrant" | "muted" | "neutral";
}

interface HighlightReelProps {
  photos: HighlightPhoto[];
  onClose?: () => void;
}

function qualityStars(score: number): number {
  if (score >= 80) return 5;
  if (score >= 65) return 4;
  if (score >= 50) return 3;
  if (score >= 35) return 2;
  return 1;
}

function formatDate(creationTime: number): string {
  return new Date(creationTime).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function generateUniquenessText(photo: HighlightPhoto): string {
  const parts: string[] = [];
  
  // Add uniqueness text from analysis if available
  if (photo.uniquenessText) {
    return photo.uniquenessText;
  }
  
  // Generate uniqueness based on megapixels (resolution quality)
  if (photo.megapixels) {
    if (photo.megapixels >= 12) {
      parts.push("Ultra HD");
    } else if (photo.megapixels >= 8) {
      parts.push("High Res");
    } else if (photo.megapixels >= 4) {
      parts.push("Good Res");
    } else if (photo.megapixels >= 2) {
      parts.push("Standard Res");
    }
  }
  
  // Add composition type
  if (photo.composition) {
    const compLabels: Record<string, string> = {
      portrait: "Portrait",
      landscape: "Landscape",
      square: "Square",
      panorama: "Panorama",
      standard: "Standard"
    };
    if (photo.composition === "panorama" || photo.isPanorama) {
      parts.push("Panorama");
    } else if (photo.composition !== "standard") {
      parts.push(compLabels[photo.composition]);
    }
  }
  
  // Add lighting conditions
  if (photo.lighting) {
    const lightingLabels: Record<string, string> = {
      natural: "Natural Light",
      artificial: "Artificial Light",
      low: "Low Light",
      harsh: "Harsh Light",
      golden_hour: "Golden Hour",
      blue_hour: "Blue Hour"
    };
    if (photo.lighting !== "natural" && photo.lighting !== "artificial") {
      parts.push(lightingLabels[photo.lighting]);
    }
  }
  
  // Add exposure info
  if (photo.exposure && photo.exposure !== "balanced") {
    if (photo.exposure === "dark") {
      parts.push("Moody");
    } else if (photo.exposure === "bright") {
      parts.push("Bright");
    }
  }
  
  // Add color vibrancy
  if (photo.colorVibrancy) {
    const vibrancyLabels: Record<string, string> = {
      vibrant: "Vibrant Colors",
      muted: "Muted Tones",
      neutral: "Neutral"
    };
    if (photo.colorVibrancy === "vibrant") {
      parts.push("Vibrant");
    } else if (photo.colorVibrancy === "muted") {
      parts.push("Muted");
    }
  }
  
  // Add face detection
  if (photo.hasFace) {
    parts.push("Portrait");
  }
  
  // Burst photo indicator
  if (photo.isBurst) {
    parts.push("Best in Burst");
  }
  
  // File size based detail indicator
  if (photo.fileSizeKB && photo.fileSizeKB > 5000) {
    parts.push("High Detail");
  } else if (photo.fileSizeKB && photo.fileSizeKB > 2000) {
    parts.push("Detailed");
  }
  
  // Overall quality assessment (only if no other info)
  if (parts.length === 0 || parts.every(p => 
    p.includes("Res") || p.includes("Standard") || 
    p.includes("Portrait") || p.includes("Landscape") ||
    p.includes("Square") || p.includes("Panorama")
  )) {
    if (photo.qualityScore >= 90) {
      parts.push("Exceptional");
    } else if (photo.qualityScore >= 80) {
      parts.push("Excellent");
    } else if (photo.qualityScore >= 70) {
      parts.push("Great Shot");
    } else if (photo.qualityScore >= 60) {
      parts.push("Good Shot");
    }
  }
  
  return parts.slice(0, 3).join(" • ");
}

export function HighlightReel({ photos, onClose }: HighlightReelProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const photoOpacity = useSharedValue(0);
  const kbTranslateX = useSharedValue(0);
  const kbTranslateY = useSharedValue(0);
  const kbScale = useSharedValue(1.1);
  const progressWidth = useSharedValue(0);

  const photo = photos[currentIndex];

  const animateIn = useCallback((idx: number) => {
    const config = KB_CONFIGS[idx % KB_CONFIGS.length];
    kbTranslateX.value = config.startX;
    kbTranslateY.value = config.startY;
    kbScale.value = config.startS;
    photoOpacity.value = 0;
    photoOpacity.value = withTiming(1, { duration: 600 });
    kbTranslateX.value = withTiming(config.endX, { duration: KEN_BURNS_DURATION });
    kbTranslateY.value = withTiming(config.endY, { duration: KEN_BURNS_DURATION });
    kbScale.value = withTiming(config.endS, { duration: KEN_BURNS_DURATION });
    progressWidth.value = 0;
    progressWidth.value = withTiming(1, { duration: AUTO_ADVANCE_MS });
  }, [kbTranslateX, kbTranslateY, kbScale, photoOpacity, progressWidth]);

  const navigate = useCallback((direction: "next" | "prev") => {
    if (photos.length === 0) return;
    setCurrentIndex((prev) => {
      const next = direction === "next" ? (prev + 1) % photos.length : (prev - 1 + photos.length) % photos.length;
      animateIn(next);
      return next;
    });
  }, [photos.length, animateIn]);

  useEffect(() => { animateIn(0); }, []);

  const swipeGesture = Gesture.Pan().minDistance(30).onEnd((e) => {
    if (Math.abs(e.translationX) > Math.abs(e.translationY)) {
      if (e.translationX < -40) runOnJS(navigate)("next");
      else if (e.translationX > 40) runOnJS(navigate)("prev");
    }
  });

  const photoStyle = useAnimatedStyle(() => ({
    opacity: photoOpacity.value,
    transform: [{ scale: kbScale.value }, { translateX: kbTranslateX.value }, { translateY: kbTranslateY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({ width: `${progressWidth.value * 100}%` }));

  if (photos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: "#0a0a0a" }]}>
        <Sparkles size={48} color="#6C63FF" />
        <Text style={styles.emptyTitle}>No Highlights Yet</Text>
        <Text style={styles.emptySubtitle}>Sort a few photos and let AI find your best shots</Text>
        <TouchableOpacity onPress={onClose} style={styles.emptyClose}>
          <Text style={styles.emptyCloseText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stars = qualityStars(photo?.qualityScore ?? 0);

  return (
    <View style={styles.root}>
      <GestureDetector gesture={swipeGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            <Image source={{ uri: photo?.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={800} />
          </Animated.View>
          <LinearGradient colors={["rgba(0,0,0,0.75)", "transparent"]} style={styles.vignetteTop} pointerEvents="none" />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.85)"]} style={styles.vignetteBottom} pointerEvents="none" />
        </View>
      </GestureDetector>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.dotsRow}>
          {photos.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex ? styles.dotActive : { backgroundColor: "rgba(255,255,255,0.3)" }]}>
              {i === currentIndex && <Animated.View style={[styles.dotFill, progressStyle]} />}
            </View>
          ))}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nav arrows */}
      <View style={styles.navRow} pointerEvents="box-none">
        <TouchableOpacity onPress={() => navigate("prev")} style={styles.navBtn}>
          <ChevronLeft size={28} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <View style={styles.flex} />
        <TouchableOpacity onPress={() => navigate("next")} style={styles.navBtn}>
          <ChevronRight size={28} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      </View>

      {/* Bottom info */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.infoRow}>
          <View>
            <View style={styles.starsRow}>
              {[1,2,3,4,5].map((n) => (
                <Star key={n} size={14} color={n <= stars ? "#FFD700" : "rgba(255,255,255,0.25)"} fill={n <= stars ? "#FFD700" : "transparent"} />
              ))}
              <Text style={styles.scoreText}>{photo?.qualityScore}%</Text>
            </View>
            <View style={styles.dateRow}>
              <Calendar size={11} color="rgba(255,255,255,0.6)" />
              <Text style={styles.dateText}>{photo ? formatDate(photo.creationTime) : ""}</Text>
            </View>
            {photo && (
              <>
                <Text style={styles.uniquenessText}>
                  {generateUniquenessText(photo)}
                </Text>
                <View style={styles.techRow}>
                  {photo.megapixels && (
                    <Text style={styles.techText}>
                      {photo.megapixels.toFixed(1)}MP
                    </Text>
                  )}
                  {photo.exposure && photo.exposure !== "balanced" && (
                    <Text style={styles.techText}>
                      {photo.exposure === "dark" ? "🌙" : "☀️"}
                    </Text>
                  )}
                  {photo.lighting && photo.lighting !== "natural" && photo.lighting !== "artificial" && (
                    <Text style={styles.techText}>
                      {photo.lighting === "golden_hour" ? "🌅" : photo.lighting === "blue_hour" ? "🌆" : photo.lighting === "low" ? "暗" : "💡"}
                    </Text>
                  )}
                  {photo.colorVibrancy && photo.colorVibrancy === "vibrant" && (
                    <Text style={styles.techText}>🎨</Text>
                  )}
                  {photo.hasFace && (
                    <Text style={styles.techText}>👤</Text>
                  )}
                  {photo.isPanorama && (
                    <Text style={styles.techText}>🌐</Text>
                  )}
                  {photo.isBurst && (
                    <Text style={styles.techText}>📸</Text>
                  )}
                </View>
              </>
            )}
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentIndex + 1}<Text style={styles.counterTotal}>/{photos.length}</Text></Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <View style={styles.flex} />
          <View style={styles.aiBadge}>
            <Sparkles size={11} color="#AE40FF" />
            <Text style={styles.aiBadgeText}>AI Highlight</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: Spacing.md, padding: Spacing.xl },
  emptyTitle: { fontSize: scaleFont(22), fontWeight: "800", color: "#fff", textAlign: "center" },
  emptySubtitle: { fontSize: scaleFont(15), color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: scaleFont(22) },
  emptyClose: { marginTop: Spacing.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, backgroundColor: "rgba(108,99,255,0.25)", borderRadius: BorderRadius.full, borderWidth: 1, borderColor: "rgba(108,99,255,0.5)" },
  emptyCloseText: { color: "#AE40FF", fontWeight: "700", fontSize: scaleFont(15) },
  vignetteTop: { position: "absolute", top: 0, left: 0, right: 0, height: 180 },
  vignetteBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 280 },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, gap: Spacing.sm },
  dotsRow: { flex: 1, flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { flex: 1, height: 2.5, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)", overflow: "hidden", maxWidth: 48 },
  dotActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  dotFill: { height: "100%", backgroundColor: "#fff", borderRadius: 2 },
  closeBtn: { width: scale(32), height: scale(32), borderRadius: scale(16), backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  closeBtnText: { color: "#fff", fontSize: scaleFont(14), fontWeight: "600" },
  navRow: { position: "absolute", top: "40%", left: 0, right: 0, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.sm },
  navBtn: { width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center" },
  flex: { flex: 1 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 5 },
  scoreText: { fontSize: scaleFont(11), fontWeight: "700", color: "rgba(255,255,255,0.6)", marginLeft: 4 },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { fontSize: scaleFont(12), color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  uniquenessText: { fontSize: scaleFont(10), color: "rgba(174,64,255,0.9)", fontWeight: "600", marginTop: 4 },
  techRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  techText: { fontSize: scaleFont(10), color: "rgba(255,255,255,0.7)" },
  counter: { backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
  counterText: { fontSize: scaleFont(16), fontWeight: "800", color: "#fff" },
  counterTotal: { fontSize: scaleFont(13), color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: "rgba(174,64,255,0.2)", borderRadius: BorderRadius.full, borderWidth: 1, borderColor: "rgba(174,64,255,0.4)" },
  aiBadgeText: { fontSize: scaleFont(11), fontWeight: "700", color: "#AE40FF" },
});