import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");

const COLORS = [
  "#6C63FF",
  "#FF6B9D",
  "#00E5A0",
  "#FFD700",
  "#FF4D6D",
  "#00D4FF",
  "#F97316",
  "#10B981",
  "#EC4899",
  "#8B5CF6",
];

const PIECE_COUNT = 26;

interface Piece {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  scale: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
  startXOffset: number;
  endXOffset: number;
  delay: number;
  duration: number;
}

function makePiece(): Piece {
  return {
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    rot: new Animated.Value(0),
    scale: new Animated.Value(0),
    opacity: new Animated.Value(0),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 7 + Math.random() * 11,
    isCircle: Math.random() > 0.45,
    startXOffset: (Math.random() - 0.5) * W * 0.75,
    endXOffset: (Math.random() - 0.5) * W * 0.55,
    delay: Math.random() * 700,
    duration: 2300 + Math.random() * 1600,
  };
}

interface ConfettiCelebrationProps {
  visible: boolean;
}

export function ConfettiCelebration({ visible }: ConfettiCelebrationProps) {
  const pieces = useRef<Piece[]>(
    Array.from({ length: PIECE_COUNT }, makePiece),
  ).current;

  useEffect(() => {
    if (!visible) return;

    // Reset all pieces first
    pieces.forEach((piece) => {
      piece.x.setValue(piece.startXOffset);
      piece.y.setValue(-80);
      piece.scale.setValue(0);
      piece.opacity.setValue(0);
      piece.rot.setValue(0);
    });

    const composites = pieces.map((piece) =>
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.parallel([
          // Fade in quickly, fade out near end
          Animated.sequence([
            Animated.timing(piece.opacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: true,
            }),
            Animated.delay(piece.duration - 680),
            Animated.timing(piece.opacity, {
              toValue: 0,
              duration: 460,
              useNativeDriver: true,
            }),
          ]),
          // Pop in
          Animated.spring(piece.scale, {
            toValue: 1,
            tension: 90,
            friction: 5,
            useNativeDriver: true,
          }),
          // Gravity fall
          Animated.timing(piece.y, {
            toValue: H + 130,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          // Horizontal drift
          Animated.timing(piece.x, {
            toValue: piece.endXOffset,
            duration: piece.duration,
            useNativeDriver: true,
          }),
          // Spin
          Animated.timing(piece.rot, {
            toValue: 7 + Math.random() * 7,
            duration: piece.duration,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    const master = Animated.parallel(composites);
    master.start();

    return () => {
      master.stop();
    };
  }, [visible, pieces]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: H * 0.3,
            left: W / 2 - piece.size / 2,
            width: piece.size,
            height: piece.size,
            borderRadius: piece.isCircle ? piece.size / 2 : piece.size * 0.22,
            backgroundColor: piece.color,
            opacity: piece.opacity,
            transform: [
              { translateX: piece.x },
              { translateY: piece.y },
              { scale: piece.scale },
              {
                rotate: piece.rot.interpolate({
                  inputRange: [0, 10],
                  outputRange: ["0deg", "3600deg"],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}