import { dimensions, scale, scaleFont } from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, ChevronLeft, ChevronRight, Pause, Play, Sparkles, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
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

export function HighlightReel({ photos, onClose }: HighlightReelProps) {
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
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

  useEffect(() => {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => navigate("next"), AUTO_ADVANCE_MS);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isPlaying, currentIndex]);

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
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{currentIndex + 1}<Text style={styles.counterTotal}>/{photos.length}</Text></Text>
          </View>
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => setIsPlaying((v) => !v)} style={styles.playBtn}>
            {isPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" fill="#fff" />}
          </TouchableOpacity>
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
  counter: { backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: Spacing.md, paddingVertical: 5, borderRadius: BorderRadius.full },
  counterText: { fontSize: scaleFont(16), fontWeight: "800", color: "#fff" },
  counterTotal: { fontSize: scaleFont(13), color: "rgba(255,255,255,0.5)", fontWeight: "500" },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  playBtn: { width: scale(44), height: scale(44), borderRadius: scale(22), backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  aiBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: "rgba(174,64,255,0.2)", borderRadius: BorderRadius.full, borderWidth: 1, borderColor: "rgba(174,64,255,0.4)" },
  aiBadgeText: { fontSize: scaleFont(11), fontWeight: "700", color: "#AE40FF" },
});