import { HighlightPhoto, HighlightReel } from "@/components/features/highlights";
import { LoadingState } from "@/components/features";
import { ScreenBackground } from "@/components";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { getColors, Spacing } from "@/constants/theme";
import { scaleFont } from "@/constants/responsive";
import { useAppStore } from "@/store";
import { useRouter } from "expo-router";
import { Sparkles } from "lucide-react-native";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const MIN_QUALITY = 60;
const MAX_HIGHLIGHTS = 20;

export default function HighlightsScreen() {
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  const { photos, loading: photosLoading } = useMediaLibrary();
  const { analyses, loading: analysisLoading } = useAIAnalysis(photos);

  const isLoading = photosLoading || analysisLoading;

  const highlights = useMemo<HighlightPhoto[]>(() => {
    if (photos.length === 0 || analyses.length === 0) return [];
    return photos
      .map((photo, i) => ({
        id: photo.id,
        uri: photo.uri,
        qualityScore: analyses[i]?.qualityScore ?? 50,
        creationTime: photo.creationTime,
        filename: photo.filename,
      }))
      .filter((p) => p.qualityScore >= MIN_QUALITY)
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, MAX_HIGHLIGHTS);
  }, [photos, analyses]);

  if (isLoading) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <LoadingState message="Finding your best shots…" />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(600)} style={StyleSheet.absoluteFill}>
        <HighlightReel
          photos={highlights}
          onClose={() => router.back()}
        />
      </Animated.View>

      {highlights.length > 0 && (
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.reelLabel}
          pointerEvents="none"
        >
          <Sparkles size={14} color="#AE40FF" />
          <Text style={styles.reelLabelText}>Your Top {highlights.length} Shots</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  reelLabel: {
    position: "absolute",
    top: 70,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    backgroundColor: "rgba(174,64,255,0.2)",
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "rgba(174,64,255,0.35)",
  },
  reelLabelText: { fontSize: scaleFont(11), fontWeight: "700", color: "#AE40FF", letterSpacing: 0.3 },
});