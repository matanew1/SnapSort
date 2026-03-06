import { ScreenBackground } from "@/components";
import { getColors, Spacing } from "@/constants/theme";
import { inpaint } from "@/services/stabilityai";
import { useAppStore } from "@/store";
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { ArrowLeft, Trash2, Wand2 } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Canvas from "react-native-canvas";

const CANVAS_SIZE = 300;

export default function EraserScreen() {
  const router = useRouter();
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [image, setImage] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inpaintedImage, setInpaintedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<Canvas>(null);
  const [ctx, setCtx] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const containerRef = useRef<View>(null);

  // Get image dimensions when image is loaded
  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageSize({ width, height });
    setImageLoaded(true);
  };

  // Reset canvas when image changes
  useEffect(() => {
    if (image) {
      setImageLoaded(false);
      setImageSize({ width: 0, height: 0 });
      setCanvasReady(false);
      setCtx(null);
    }
  }, [image]);

  // Calculate scaled canvas size to match image aspect ratio
  const getScaledSize = () => {
    if (imageSize.width === 0 || imageSize.height === 0) {
      return { width: CANVAS_SIZE, height: CANVAS_SIZE };
    }
    
    const aspectRatio = imageSize.width / imageSize.height;
    let scaledWidth = CANVAS_SIZE;
    let scaledHeight = CANVAS_SIZE;
    
    if (aspectRatio > 1) {
      scaledHeight = CANVAS_SIZE / aspectRatio;
    } else {
      scaledWidth = CANVAS_SIZE * aspectRatio;
    }
    
    return { width: scaledWidth, height: scaledHeight };
  };

  const scaledSize = getScaledSize();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt: any) => {
        // Ensure canvas is initialized before drawing
        if (!canvasRef.current || !canvasReady) {
          // Try to initialize canvas if not ready
          if (canvasRef.current && imageLoaded && imageSize.width) {
            canvasRef.current.width = scaledSize.width;
            canvasRef.current.height = scaledSize.height;
            const context = canvasRef.current.getContext("2d");
            context.fillStyle = "black";
            context.fillRect(0, 0, scaledSize.width, scaledSize.height);
            setCtx(context);
            setCanvasReady(true);
          } else {
            return;
          }
        }
        
        if (!ctx || !canvasRef.current) return;
        setIsDrawing(true);
        
        const { locationX, locationY } = evt.nativeEvent;
        
        // Scale coordinates to match canvas size vs displayed size
        const scaleX = canvasRef.current.width / scaledSize.width;
        const scaleY = canvasRef.current.height / scaledSize.height;
        
        const canvasX = locationX * scaleX;
        const canvasY = locationY * scaleY;
        
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY);
      },
      onPanResponderMove: (evt: any) => {
        if (!isDrawing || !ctx || !canvasRef.current) return;
        
        const { locationX, locationY } = evt.nativeEvent;
        
        // Scale coordinates to match canvas size vs displayed size
        const scaleX = canvasRef.current.width / scaledSize.width;
        const scaleY = canvasRef.current.height / scaledSize.height;
        
        const canvasX = locationX * scaleX;
        const canvasY = locationY * scaleY;
        
        ctx.lineTo(canvasX, canvasY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
      },
    })
  ).current;

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need access to your photos to use the eraser.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setInpaintedImage(null);
    }
  };

  const handleCanvas = useCallback((canvas: Canvas) => {
    if (!canvas) return;
    canvasRef.current = canvas;
  }, []);

  // Initialize canvas when image is loaded
  useEffect(() => {
    if (!canvasRef.current || !imageLoaded || !imageSize.width) return;
    
    const canvas = canvasRef.current;
    canvas.width = scaledSize.width;
    canvas.height = scaledSize.height;

    const context = canvas.getContext("2d");
    setCtx(context);
    setCanvasReady(true);

    // Fill with black (areas to keep - white = areas to inpaint)
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, [imageLoaded, imageSize.width, imageSize.height, scaledSize.width, scaledSize.height]);

  const handleReset = () => {
    if (ctx && canvasRef.current) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const handleInpaint = async () => {
    if (!image || !canvasRef.current || !ctx) return;
    setIsLoading(true);

    try {
      // 1. Get the mask data from canvas
      const maskDataUrl = await canvasRef.current.toDataURL("image/png");
      let cleanBase64 = maskDataUrl.replace(/^"|"$/g, ""); // Strip quotes
      cleanBase64 = cleanBase64.replace(/^data:image\/png;base64,/, ""); // Strip prefix

      // 2. Create the mask file
      const maskUri = `${FileSystem.cacheDirectory}mask.png`;
      await FileSystem.writeAsStringAsync(maskUri, cleanBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Normalize URIs (Fixes "Network Request Failed")
      const normalizeUri = (uri: string) => {
        // Ensure it starts with file:// but doesn't have it doubled
        const path = uri.replace('file://', '');
        return `file://${path}`;
      };

      let finalImageUri = normalizeUri(image);
      let finalMaskUri = normalizeUri(maskUri);

      // 4. Pre-flight check
      const maskInfo = await FileSystem.getInfoAsync(finalMaskUri);
      if (!maskInfo.exists || (maskInfo as any).size === 0) {
        throw new Error("Mask file failed to save.");
      }

      // 5. If the canvas size differs from original image size, we need to resize
      // The API expects the mask to match the image dimensions
      if (imageSize.width > 0 && imageSize.height > 0 && 
          (scaledSize.width !== imageSize.width || scaledSize.height !== imageSize.height)) {
        
        // For now, we'll let the API handle it - Stability AI can work with smaller masks
        // but the quality might be affected. The mask will be upscaled automatically.
        console.log("Note: Mask size differs from image size. API will upscale.");
      }

      // 6. API Request
      const result = await inpaint(
        finalImageUri,
        finalMaskUri,
        "seamlessly remove object, background matching"
      );

      // 7. Stability V2 returns the string in 'image'
      if (result && result.image) {
        setInpaintedImage(`data:image/png;base64,${result.image}`);
      }

    } catch (error: any) {
      console.error("Inpaint error:", error);
      Alert.alert("Inpaint Error", error.message || "Network request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenBackground>
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: Colors.surfaceLight,
              borderColor: Colors.border,
            },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.text }]}>
          Magic Eraser
        </Text>
        <View style={{ width: 42 }} />
      </View>
      <View style={styles.container}>
        {!image && (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={handleSelectImage}
          >
            <Text style={styles.selectButtonText}>Select Image</Text>
          </TouchableOpacity>
        )}
        {image && !inpaintedImage && (
          <View ref={containerRef}>
            <Image 
              source={{ uri: image }} 
              style={[styles.image, { width: scaledSize.width, height: scaledSize.height }]}
              onLoad={handleImageLoad}
            />
            <View
              style={[
                styles.canvasWrapper,
                { width: scaledSize.width, height: scaledSize.height }
              ]}
              {...panResponder.panHandlers}
            >
              <Canvas
                ref={handleCanvas}
                style={[styles.canvas, { width: scaledSize.width, height: scaledSize.height }]}
              />
            </View>
          </View>
        )}
        {inpaintedImage && (
          <Image source={{ uri: inpaintedImage }} style={styles.image} />
        )}
      </View>
      {image && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: Colors.surfaceLight }]}
            onPress={handleReset}
            disabled={isLoading}
          >
            <Trash2 size={20} color={Colors.text} />
            <Text style={[styles.buttonText, { color: Colors.text }]}>Reset</Text>
          </TouchableOpacity>

          {!inpaintedImage && (
            <TouchableOpacity
              style={[styles.inpaintButton, { backgroundColor: Colors.accent }]}
              onPress={handleInpaint}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Wand2 size={24} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          {inpaintedImage && (
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: Colors.accent }]}
              onPress={() => { setImage(null); setInpaintedImage(null); }}
            >
              <Text style={styles.selectButtonText}>Try Another</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  selectButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    backgroundColor: "#333",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
  canvas: {
    width: 300,
    height: 300,
  },
  canvasWrapper: {
    position: "absolute",
    width: 300,
    height: 300,
  },
  inpaintButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    gap: Spacing.lg,
  },
  resetButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonText: {
    fontSize: 16,
  },
});

