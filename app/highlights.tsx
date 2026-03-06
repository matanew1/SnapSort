import { ScreenBackground } from "@/components";
import { LoadingState } from "@/components/features";
import { HighlightPhoto, HighlightReel } from "@/components/features/highlights";
import { scaleFont } from "@/constants/responsive";
import { Spacing } from "@/constants/theme";
import { useAIAnalysis } from "@/hooks/useAIAnalysis";
import { useMediaLibrary } from "@/hooks/useMediaLibrary";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const MIN_QUALITY = 60;
const MAX_HIGHLIGHTS = 20;

export default function HighlightsScreen() {
  const router = useRouter();

  const { photos, loading: photosLoading } = useMediaLibrary();
  const { analyses, loading: analysisLoading } = useAIAnalysis(photos);

  const isLoading = photosLoading || analysisLoading;

  const highlights = useMemo<HighlightPhoto[]>(() => {
    if (photos.length === 0 || analyses.length === 0) return [];
    return photos
      .map((photo, i) => {
        const analysis = analyses[i];
        
        return {
          id: photo.id,
          uri: photo.uri,
          qualityScore: analysis?.qualityScore ?? 50,
          creationTime: photo.creationTime,
          filename: photo.filename,
          uniquenessText: undefined, // Will be generated in HighlightReel
          megapixels: analysis?.megapixels,
          aspectRatio: analysis?.aspectRatio,
          fileSizeKB: analysis?.fileSizeKB,
          isBlurry: analysis?.isBlurry,
          isDark: analysis?.isDark,
          isOverexposed: analysis?.isOverexposed,
          isBurst: analysis?.isBurst,
          // Enhanced data
          exposure: analysis?.exposure,
          composition: analysis?.composition,
          lighting: analysis?.lighting,
          hasFace: analysis?.hasFace,
          isPanorama: analysis?.isPanorama,
          colorVibrancy: analysis?.colorVibrancy,
        };
      })
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