/**
 * DrawingCanvas
 *
 * KEY FIXES from original eraser.tsx:
 * 1. Canvas is TRANSPARENT – no black fill covering the image
 * 2. All mutable values (ctx, isDrawing, brushSize, brushColor) stored as refs
 *    so PanResponder (created once) never captures stale values
 * 3. Strokes are stored in-memory for undo and mask re-generation
 * 4. generateMask() draws black-bg + white strokes just before export,
 *    then restores the visual display strokes
 * 5. onStrokeCountChange stored as ref to avoid stale closure in PanResponder
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Canvas from "react-native-canvas";

export interface DrawingCanvasRef {
  clearStrokes: () => void;
  undoStroke: () => void;
  generateMask: () => Promise<string | null>;
  hasStrokes: () => boolean;
  getStrokeCount: () => number;
}

interface Point { x: number; y: number; }
interface Stroke { points: Point[]; }

interface DrawingCanvasProps {
  width: number;
  height: number;
  brushSize?: number;
  brushColor?: string;
  onStrokeCountChange?: (count: number) => void;
}

export const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ width, height, brushSize = 30, brushColor = "rgba(255, 70, 70, 0.72)", onStrokeCountChange }, ref) => {
    const canvasRef = useRef<Canvas>(null);
    const ctxRef = useRef<any>(null);
    const canvasReadyRef = useRef(false);
    const strokesRef = useRef<Stroke[]>([]);
    const currentStrokeRef = useRef<Point[]>([]);

    const brushSizeRef = useRef(brushSize);
    const brushColorRef = useRef(brushColor);
    const widthRef = useRef(width);
    const heightRef = useRef(height);
    const onChangeRef = useRef(onStrokeCountChange);

    useEffect(() => { brushSizeRef.current = brushSize; }, [brushSize]);
    useEffect(() => { brushColorRef.current = brushColor; }, [brushColor]);
    useEffect(() => { widthRef.current = width; }, [width]);
    useEffect(() => { heightRef.current = height; }, [height]);
    useEffect(() => { onChangeRef.current = onStrokeCountChange; }, [onStrokeCountChange]);

    const drawStroke = useCallback((ctx: any, stroke: Stroke, color: string, lineWidth: number) => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      if (stroke.points.length === 1) {
        ctx.arc(stroke.points[0].x, stroke.points[0].y, lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        return;
      }
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }, []);

    const redrawAll = useCallback((ctx: any, strokes: Stroke[], color: string, lineWidth: number) => {
      ctx.clearRect(0, 0, widthRef.current, heightRef.current);
      strokes.forEach((s) => drawStroke(ctx, s, color, lineWidth));
    }, [drawStroke]);

    useImperativeHandle(ref, () => ({
      clearStrokes() {
        strokesRef.current = [];
        if (ctxRef.current && canvasReadyRef.current) {
          ctxRef.current.clearRect(0, 0, widthRef.current, heightRef.current);
        }
        onChangeRef.current?.(0);
      },
      undoStroke() {
        if (strokesRef.current.length === 0) return;
        strokesRef.current.pop();
        if (ctxRef.current && canvasReadyRef.current) {
          redrawAll(ctxRef.current, strokesRef.current, brushColorRef.current, brushSizeRef.current);
        }
        onChangeRef.current?.(strokesRef.current.length);
      },
      async generateMask(): Promise<string | null> {
        if (!canvasRef.current || !ctxRef.current || !canvasReadyRef.current) return null;
        const ctx = ctxRef.current;
        const w = widthRef.current;
        const h = heightRef.current;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);
        strokesRef.current.forEach((s) => drawStroke(ctx, s, "white", brushSizeRef.current));
        await new Promise((resolve) => setTimeout(resolve, 180));
        try {
          const dataUrl = await canvasRef.current.toDataURL("image/png");
          const base64 = (dataUrl as string).replace(/^"|"$/g, "").replace(/^data:image\/png;base64,/, "");
          redrawAll(ctx, strokesRef.current, brushColorRef.current, brushSizeRef.current);
          return base64;
        } catch (err) {
          console.error("[DrawingCanvas] toDataURL failed:", err);
          redrawAll(ctx, strokesRef.current, brushColorRef.current, brushSizeRef.current);
          return null;
        }
      },
      hasStrokes: () => strokesRef.current.length > 0,
      getStrokeCount: () => strokesRef.current.length,
    }), [drawStroke, redrawAll]);

    const handleCanvasRef = useCallback((canvas: Canvas) => {
      if (!canvas) return;
      canvasRef.current = canvas;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctxRef.current = ctx;
      canvasReadyRef.current = true;
      // ✅ NO black fill here — canvas stays transparent so image shows through
    }, [width, height]);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant(evt) {
          if (!canvasReadyRef.current || !ctxRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          currentStrokeRef.current = [{ x: locationX, y: locationY }];
          const ctx = ctxRef.current;
          ctx.beginPath();
          ctx.arc(locationX, locationY, brushSizeRef.current / 2, 0, Math.PI * 2);
          ctx.fillStyle = brushColorRef.current;
          ctx.fill();
        },
        onPanResponderMove(evt) {
          if (!canvasReadyRef.current || !ctxRef.current) return;
          const { locationX, locationY } = evt.nativeEvent;
          const current = currentStrokeRef.current;
          if (current.length === 0) return;
          const last = current[current.length - 1];
          current.push({ x: locationX, y: locationY });
          const ctx = ctxRef.current;
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(locationX, locationY);
          ctx.strokeStyle = brushColorRef.current;
          ctx.lineWidth = brushSizeRef.current;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        },
        onPanResponderRelease() {
          if (currentStrokeRef.current.length > 0) {
            strokesRef.current.push({ points: [...currentStrokeRef.current] });
            currentStrokeRef.current = [];
            onChangeRef.current?.(strokesRef.current.length);
          }
        },
      }),
    ).current;

    return (
      <View style={[StyleSheet.absoluteFill, { width, height }]} {...panResponder.panHandlers} pointerEvents="box-only">
        <Canvas ref={handleCanvasRef} style={[styles.canvas, { width, height, backgroundColor: "transparent" }]} />
      </View>
    );
  },
);

DrawingCanvas.displayName = "DrawingCanvas";
const styles = StyleSheet.create({ canvas: {} });