import { ScreenBackground } from "@/components";
import { BrushSizeValue, BrushToolbar, DrawingCanvas, DrawingCanvasRef } from "@/components/features/eraser";
import { GradientButton, IconButton } from "@/components/shared/ui";
import { scale, scaleFont } from "@/constants/responsive";
import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { inpaint } from "@/services/stabilityai";
import { useAppStore } from "@/store";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { ArrowLeft, Download, Image as ImageIcon, RotateCcw, Wand2 } from "lucide-react-native";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CANVAS_MAX = 300;
const DEFAULT_BRUSH: BrushSizeValue = 30;

type Phase = "empty" | "drawing" | "result";

function scaledDims(imgW: number, imgH: number): { width: number; height: number } {
  if (imgW === 0 || imgH === 0) return { width: CANVAS_MAX, height: CANVAS_MAX };
  const ar = imgW / imgH;
  return ar > 1
    ? { width: CANVAS_MAX, height: Math.round(CANVAS_MAX / ar) }
    : { width: Math.round(CANVAS_MAX * ar), height: CANVAS_MAX };
}

function normalizeUri(uri: string): string {
  return `file://${uri.replace("file://", "")}`;
}

export default function EraserScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  const [phase, setPhase] = useState<Phase>("empty");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [brushSize, setBrushSize] = useState<BrushSizeValue>(DEFAULT_BRUSH);
  const [strokeCount, setStrokeCount] = useState(0);

  const drawingRef = useRef<DrawingCanvasRef>(null);
  const canvasSize = scaledDims(imageSize.width, imageSize.height);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "SnapSort needs photo library access to use the eraser.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 1 });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageSize({ width: asset.width, height: asset.height });
      setResultUri(null);
      setShowOriginal(false);
      setStrokeCount(0);
      setPhase("drawing");
    }
  }, []);

  const handleUndo = useCallback(() => { drawingRef.current?.undoStroke(); }, []);
  const handleClear = useCallback(() => { drawingRef.current?.clearStrokes(); setStrokeCount(0); }, []);

  const handleInpaint = useCallback(async () => {
    if (!imageUri || !drawingRef.current) return;
    if (!drawingRef.current.hasStrokes()) {
      Alert.alert("No Mask", "Paint over the areas you want to erase, then tap Erase.");
      return;
    }
    setIsLoading(true);
    try {
      const maskBase64 = await drawingRef.current.generateMask();
      if (!maskBase64) throw new Error("Failed to generate mask image.");

      const maskPath = `${FileSystem.cacheDirectory}ss_mask_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(maskPath, maskBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const maskInfo = await FileSystem.getInfoAsync(maskPath);
      if (!maskInfo.exists || (maskInfo as any).size === 0) {
        throw new Error("Mask file is empty. Please try drawing again.");
      }

      const response = await inpaint(
        normalizeUri(imageUri),
        normalizeUri(maskPath),
        "seamlessly remove the selected object, fill with natural background",
      );

      if (response?.image) {
        setResultUri(`data:image/png;base64,${response.image}`);
        setPhase("result");
      } else {
        throw new Error("No image returned from API.");
      }

      await FileSystem.deleteAsync(maskPath, { idempotent: true });
    } catch (err: any) {
      Alert.alert("Eraser Failed", err.message ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [imageUri]);

  const handleSave = useCallback(async () => {
    if (!resultUri) return;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Need library access to save.");
        return;
      }
      const base64 = resultUri.replace("data:image/png;base64,", "");
      const filePath = `${FileSystem.cacheDirectory}ss_result_${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(filePath, base64, { encoding: FileSystem.EncodingType.Base64 });
      await MediaLibrary.saveToLibraryAsync(filePath);
      await FileSystem.deleteAsync(filePath, { idempotent: true });
      Alert.alert("Saved! 🎉", "Your edited photo was saved to the library.");
    } catch {
      Alert.alert("Error", "Could not save photo. Please try again.");
    }
  }, [resultUri]);

  const handleTryAgain = useCallback(() => {
    setResultUri(null);
    setStrokeCount(0);
    drawingRef.current?.clearStrokes();
    setPhase("drawing");
  }, []);

  return (
    <ScreenBackground>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon={<ArrowLeft size={20} color={Colors.text} />}
          onPress={() => router.back()}
          variant="default"
          size="md"
        />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: Colors.text }]}>Magic Eraser</Text>
          {phase === "drawing" && strokeCount > 0 && (
            <Animated.Text entering={FadeIn.duration(200)} style={[styles.headerSub, { color: Colors.textMuted }]}>
              {strokeCount} stroke{strokeCount !== 1 ? "s" : ""}
            </Animated.Text>
          )}
        </View>
        <View style={{ width: scale(42) }} />
      </View>

      {/* Main content */}
      <View style={styles.content}>

        {/* EMPTY STATE */}
        {phase === "empty" && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: Colors.accentLight }]}>
              <Wand2 size={40} color={Colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: Colors.text }]}>Magic Eraser</Text>
            <Text style={[styles.emptySubtitle, { color: Colors.textSecondary }]}>
              Paint over any object and AI will erase it seamlessly
            </Text>
            <GradientButton
              label="Choose a Photo"
              onPress={handlePickImage}
              icon={<ImageIcon size={18} color="#fff" />}
              size="lg"
              style={{ marginTop: Spacing.xl }}
            />
          </Animated.View>
        )}

        {/* DRAWING PHASE */}
        {phase === "drawing" && imageUri && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.drawingContainer}>
            <View style={[styles.instructionPill, { backgroundColor: Colors.accentLight, borderColor: Colors.accent + "30" }]}>
              <Text style={[styles.instructionText, { color: Colors.accent }]}>
                ✏️ Paint over what you want to remove
              </Text>
            </View>

            <View style={[styles.canvasOuter, { width: canvasSize.width, height: canvasSize.height, borderColor: Colors.border }]}>
              <Image
                source={{ uri: imageUri }}
                style={{ width: canvasSize.width, height: canvasSize.height }}
                resizeMode="contain"
              />
              {/* Transparent drawing overlay — the fix for the black screen bug */}
              <DrawingCanvas
                ref={drawingRef}
                key={`canvas-${imageUri}`}
                width={canvasSize.width}
                height={canvasSize.height}
                brushSize={brushSize}
                onStrokeCountChange={setStrokeCount}
              />
            </View>
          </Animated.View>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && (imageUri || resultUri) && (
          <Animated.View entering={FadeIn.duration(500)} style={styles.resultContainer}>
            {resultUri && imageUri && (
              <View style={[styles.toggleRow, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border }]}>
                <TouchableOpacity
                  onPress={() => setShowOriginal(true)}
                  style={[styles.toggleBtn, showOriginal && { backgroundColor: Colors.surface, borderColor: Colors.border }]}
                >
                  <Text style={[styles.toggleLabel, { color: showOriginal ? Colors.text : Colors.textSecondary }]}>
                    Before
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowOriginal(false)}
                  style={[styles.toggleBtn, !showOriginal && { backgroundColor: Colors.surface, borderColor: Colors.border }]}
                >
                  <Text style={[styles.toggleLabel, { color: !showOriginal ? Colors.text : Colors.textSecondary }]}>
                    After ✨
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={[styles.canvasOuter, {
              width: canvasSize.width, height: canvasSize.height,
              borderColor: showOriginal ? Colors.border : Colors.accent,
            }]}>
              <Image
                source={{ uri: showOriginal ? imageUri! : resultUri! }}
                style={{ width: canvasSize.width, height: canvasSize.height }}
                resizeMode="contain"
              />
              {!showOriginal && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.erasedBadge}>
                  <LinearGradient colors={["#6C63FF", "#AE40FF"]} style={styles.erasedBadgeGradient} start={[0, 0]} end={[1, 0]}>
                    <Wand2 size={11} color="#fff" />
                    <Text style={styles.erasedBadgeText}>AI Erased</Text>
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      {/* Drawing controls */}
      {phase === "drawing" && (
        <>
          <BrushToolbar
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            onUndo={handleUndo}
            onClear={handleClear}
            strokeCount={strokeCount}
          />
          <View style={[styles.actionBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md }]}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={[styles.secondaryBtn, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border }]}
            >
              <Text style={[styles.secondaryBtnText, { color: Colors.textSecondary }]}>Change Photo</Text>
            </TouchableOpacity>
            <GradientButton
              label={isLoading ? "Erasing…" : "Erase ✨"}
              onPress={handleInpaint}
              loading={isLoading}
              disabled={strokeCount === 0}
              gradientColors={["#6C63FF", "#AE40FF"]}
              style={styles.eraseBtn}
            />
          </View>
        </>
      )}

      {/* Result controls */}
      {phase === "result" && (
        <View style={[styles.actionBar, {
          paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        }]}>
          <TouchableOpacity
            onPress={handleTryAgain}
            style={[styles.secondaryBtn, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border }]}
          >
            <RotateCcw size={16} color={Colors.text} />
            <Text style={[styles.secondaryBtnText, { color: Colors.text }]}>Try Again</Text>
          </TouchableOpacity>
          <GradientButton
            label="Save to Library"
            onPress={handleSave}
            gradientColors={[Colors.keep, Colors.keepDark ?? Colors.keep]}
            icon={<Download size={16} color="#fff" />}
            style={styles.eraseBtn}
          />
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, gap: Spacing.sm },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: scaleFont(18), fontWeight: "700" },
  headerSub: { fontSize: scaleFont(11), fontWeight: "500", marginTop: 1 },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyContainer: { alignItems: "center", paddingHorizontal: Spacing.xl },
  emptyIconCircle: { width: scale(88), height: scale(88), borderRadius: scale(44), justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg },
  emptyTitle: { fontSize: scaleFont(24), fontWeight: "800", letterSpacing: -0.5, marginBottom: Spacing.sm, textAlign: "center" },
  emptySubtitle: { fontSize: scaleFont(15), textAlign: "center", lineHeight: scaleFont(22) },
  drawingContainer: { alignItems: "center", gap: Spacing.md },
  instructionPill: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  instructionText: { fontSize: scaleFont(13), fontWeight: "600" },
  canvasOuter: { borderRadius: BorderRadius.lg, borderWidth: 1.5, overflow: "hidden", position: "relative" },
  resultContainer: { alignItems: "center", gap: Spacing.md },
  toggleRow: { flexDirection: "row", borderRadius: BorderRadius.md, borderWidth: 1, padding: 3, gap: 2 },
  toggleBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: "transparent" },
  toggleLabel: { fontSize: scaleFont(13), fontWeight: "700" },
  erasedBadge: { position: "absolute", top: 8, right: 8, borderRadius: BorderRadius.full, overflow: "hidden" },
  erasedBadgeGradient: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.full },
  erasedBadgeText: { fontSize: scaleFont(10), fontWeight: "700", color: "#fff" },
  actionBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md - 2, borderRadius: BorderRadius.full, borderWidth: 1 },
  secondaryBtnText: { fontSize: scaleFont(14), fontWeight: "600" },
  eraseBtn: { flex: 1 },
});