import { BorderRadius, getColors, Spacing } from "@/constants/theme";
import { useAppStore } from "@/store";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: "welcome" | "keep" | "trash" | "undo";
  gradientColors: [string, string];
  accentColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to SnapSort",
    description:
      "The fastest way to declutter your photo library. Swipe through your photos and decide what to keep or delete.",
    type: "welcome",
    gradientColors: ["#6C63FF", "#FF6B9D"],
    accentColor: "#6C63FF",
  },
  {
    id: "keep",
    title: "Swipe Right to Keep",
    description:
      "Love a photo? Swipe right or tap the heart button to keep it safe in your library.",
    type: "keep",
    gradientColors: ["#00E5A0", "#00B87A"],
    accentColor: "#00E5A0",
  },
  {
    id: "trash",
    title: "Swipe Left to Delete",
    description:
      "Want to remove a photo? Swipe left or tap the trash button. Photos are queued for review before permanent deletion.",
    type: "trash",
    gradientColors: ["#FF4D6D", "#FF8E53"],
    accentColor: "#FF4D6D",
  },
  {
    id: "undo",
    title: "Made a Mistake?",
    description:
      "No worries! Tap the undo button to go back and change your decision on any photo.",
    type: "undo",
    gradientColors: ["#00D4FF", "#6C63FF"],
    accentColor: "#00D4FF",
  },
];

interface SwipeTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export function SwipeTutorial({ visible, onComplete }: SwipeTutorialProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [currentStep, setCurrentStep] = useState(0);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const iconAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(cardAnim, { toValue: 1, tension: 70, friction: 10, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const animateStepChange = (nextStep: number) => {
    Animated.parallel([
      Animated.timing(iconAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(contentAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(nextStep);
      Animated.parallel([
        Animated.spring(iconAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(contentAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    iconAnim.setValue(1);
    contentAnim.setValue(1);
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      animateStepChange(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      animateStepChange(currentStep - 1);
    }
  };

  const handleSkip = () => handleComplete();

  const handleComplete = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setCurrentStep(0);
      onComplete();
    });
  };

  const step = TUTORIAL_STEPS[currentStep];

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const renderIcon = () => {
    switch (step.type) {
      case "welcome":
        return (
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ translateY: floatTranslate }] },
            ]}
          >
            <LinearGradient
              colors={step.gradientColors}
              style={styles.iconGradient}
            >
              <Sparkles size={48} color="#fff" />
            </LinearGradient>
          </Animated.View>
        );
      case "keep":
        return (
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ translateY: floatTranslate }] },
            ]}
          >
            <LinearGradient
              colors={step.gradientColors}
              style={styles.iconGradient}
            >
              <View style={styles.swipeIconRow}>
                <ArrowRight size={28} color="#fff" />
                <Heart size={40} color="#fff" fill="#fff" />
              </View>
            </LinearGradient>
          </Animated.View>
        );
      case "trash":
        return (
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ translateY: floatTranslate }] },
            ]}
          >
            <LinearGradient
              colors={step.gradientColors}
              style={styles.iconGradient}
            >
              <View style={styles.swipeIconRow}>
                <Trash2 size={40} color="#fff" />
                <ArrowLeft size={28} color="#fff" />
              </View>
            </LinearGradient>
          </Animated.View>
        );
      case "undo":
        return (
          <Animated.View
            style={[
              styles.iconCircle,
              { transform: [{ translateY: floatTranslate }] },
            ]}
          >
            <LinearGradient
              colors={step.gradientColors}
              style={styles.iconGradient}
            >
              <Undo2 size={48} color="#fff" />
            </LinearGradient>
          </Animated.View>
        );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />

      {/* Card */}
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            opacity: cardAnim,
            transform: [
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1],
                }),
              },
            ],
          },
        ]}
      >
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? "dark" : "light"}
          style={styles.cardBlur}
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark
                  ? "rgba(13,17,23,0.95)"
                  : "rgba(255,255,255,0.97)",
                borderColor: Colors.borderLight,
              },
            ]}
          >
            {/* Skip button */}
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <View style={[styles.skipIcon, { backgroundColor: Colors.surfaceLight }]}>
                <X size={16} color={Colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Icon */}
            <Animated.View
              style={[
                styles.iconWrapper,
                {
                  opacity: iconAnim,
                  transform: [
                    {
                      scale: iconAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {renderIcon()}
            </Animated.View>

            {/* Content */}
            <Animated.View style={{ opacity: contentAnim, width: "100%" }}>
              <Text style={[styles.title, { color: Colors.text }]}>
                {step.title}
              </Text>
              <Text style={[styles.description, { color: Colors.textSecondary }]}>
                {step.description}
              </Text>
            </Animated.View>

            {/* Progress dots */}
            <View style={styles.dotsRow}>
              {TUTORIAL_STEPS.map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === currentStep ? step.accentColor : Colors.border,
                      width: i === currentStep ? 24 : 8,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Navigation */}
            <View style={styles.nav}>
              {currentStep > 0 ? (
                <TouchableOpacity
                  style={[styles.navBack, { borderColor: Colors.borderLight }]}
                  onPress={handlePrevious}
                >
                  <ArrowLeft size={20} color={Colors.text} />
                </TouchableOpacity>
              ) : (
                <View style={{ width: 48 }} />
              )}

              <TouchableOpacity onPress={handleNext} style={styles.nextWrapper}>
                <LinearGradient
                  colors={step.gradientColors}
                  start={[0, 0]}
                  end={[1, 0]}
                  style={styles.nextButton}
                >
                  <Text style={styles.nextText}>
                    {currentStep === TUTORIAL_STEPS.length - 1
                      ? "Get Started"
                      : "Next"}
                  </Text>
                  {currentStep < TUTORIAL_STEPS.length - 1 && (
                    <ArrowRight size={18} color="#fff" />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  cardWrapper: {
    position: "absolute",
    top: "50%",
    left: 24,
    right: 24,
    transform: [{ translateY: -220 }],
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
  },
  cardBlur: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
  },
  card: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
  },
  skipButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
  skipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  iconCircle: {},
  iconGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  swipeIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: Spacing.xl,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: Spacing.md,
  },
  navBack: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  nextWrapper: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  nextText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
