import { scale, verticalScale } from "@/constants/responsive";
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

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  type: "welcome" | "keep" | "trash" | "undo" | "ai";
  gradientColors: [string, string];
  accentColor: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to SnapSort",
    description:
      "The fastest way to declutter your photo library. Let's walk you through the basics.",
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
      "Want to remove a photo? Swipe left or tap the trash button. Don't worry, you can review them before they're gone forever.",
    type: "trash",
    gradientColors: ["#FF4D6D", "#FF8E53"],
    accentColor: "#FF4D6D",
  },
  {
    id: "undo",
    title: "Made a Mistake?",
    description:
      "No problem! Just tap the undo button to bring back the last photo you swiped.",
    type: "undo",
    gradientColors: ["#00D4FF", "#6C63FF"],
    accentColor: "#00D4FF",
  },
  {
    id: "ai",
    title: "Powered by AI",
    description:
      "SnapSort's AI analyzes your photos to find duplicates, suggest the best shots, and help you organize even faster.",
    type: "ai",
    gradientColors: ["#AE40FF", "#8033FF"],
    accentColor: "#AE40FF",
  },
];

const useOrientation = () => {
  const [orientation, setOrientation] = useState("portrait");

  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get("window");
      if (width < height) {
        setOrientation("portrait");
      } else {
        setOrientation("landscape");
      }
    };

    updateOrientation();
    const subscription = Dimensions.addEventListener("change", updateOrientation);

    return () => {
      subscription?.remove();
    };
  }, []);

  return orientation;
};
interface SwipeTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

export function SwipeTutorial({ visible, onComplete }: SwipeTutorialProps) {
  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);
  const [currentStep, setCurrentStep] = useState(0);
  const orientation = useOrientation();

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const iconAnims = useRef(
    TUTORIAL_STEPS.map(() => new Animated.Value(0))
  ).current;

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    startIconAnimation(0);
  };

  const startIconAnimation = (index: number) => {
    iconAnims[index].setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconAnims[index], {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconAnims[index], {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    if (visible) {
      animateIn();
    }
  }, [visible]);

  useEffect(() => {
    startIconAnimation(currentStep);
  }, [currentStep]);

  const animateStepChange = (nextStep: number) => {
    Animated.timing(contentAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

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
    Animated.timing(backdropAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(0);
      onComplete();
    });
  };

  const step = TUTORIAL_STEPS[currentStep];

  const getIconForStep = (
    stepType: TutorialStep["type"],
    size: number,
    color: string
  ) => {
    switch (stepType) {
      case "welcome":
        return <Sparkles size={size} color={color} />;
      case "keep":
        return <Heart size={size} color={color} />;
      case "trash":
        return <Trash2 size={size} color={color} />;
      case "undo":
        return <Undo2 size={size} color={color} />;
      case "ai":
        return <Sparkles size={size} color={color} />;
      default:
        return null;
    }
  };

  const isLandscape = orientation === "landscape";
  const cardWidth = isLandscape ? "60%" : "100%";
  const cardPadding = isLandscape ? Spacing.lg : Spacing.xl;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />

      <View style={styles.container}>
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              width: cardWidth,
              opacity: cardAnim,
              transform: [
                {
                  translateY: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isLandscape ? 50 : 100, 0],
                  }),
                },
                {
                  scale: cardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 50 : 80}
            tint={isDark ? "dark" : "light"}
            style={styles.cardBlur}
          >
            <View
              style={[
                styles.card,
                {
                  padding: cardPadding,
                  backgroundColor: Colors.background,
                  borderColor: Colors.border,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  { backgroundColor: Colors.surfaceLight },
                ]}
                onPress={handleSkip}
              >
                <X size={scale(18)} color={Colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  {TUTORIAL_STEPS.map((s, index) => {
                    const isCurrent = currentStep === index;
                    const anim = iconAnims[index];

                    const opacity = anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0.5, 1, 0.5],
                    });
                    const scaleAnim = anim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [1, 1.2, 1],
                    });
                    return (
                      <Animated.View
                        key={s.id}
                        style={[
                          styles.icon,
                          {
                            backgroundColor: isCurrent
                              ? s.accentColor
                              : Colors.surface,
                            opacity: isCurrent ? 1 : opacity,
                            transform: [{ scale: isCurrent ? 1 : scaleAnim }],
                          },
                        ]}
                      >
                        {getIconForStep(
                          s.type,
                          scale(24),
                          isCurrent ? "#fff" : Colors.textSecondary
                        )}
                      </Animated.View>
                    );
                  })}
                </View>
              </View>

              <Animated.View
                style={[styles.content, { opacity: contentAnim }]}
              >
                <Text style={[styles.title, { color: Colors.text }]}>
                  {step.title}
                </Text>
                <Text
                  style={[styles.description, { color: Colors.textSecondary }]}
                >
                  {step.description}
                </Text>
              </Animated.View>
              <View style={styles.dotsRow}>
                {TUTORIAL_STEPS.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          i === currentStep ? step.accentColor : Colors.border,
                        width: i === currentStep ? scale(24) : scale(8),
                      },
                    ]}
                  />
                ))}
              </View>

              <View style={styles.nav}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={[
                      styles.navBack,
                      { borderColor: Colors.borderLight },
                    ]}
                    onPress={handlePrevious}
                  >
                    <ArrowLeft size={scale(20)} color={Colors.text} />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: scale(48) }} />
                )}

                <TouchableOpacity
                  onPress={handleNext}
                  style={styles.nextWrapper}
                >
                  <LinearGradient
                    colors={step.gradientColors}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={styles.nextButton}
                  >
                    <Text style={styles.nextText}>
                      {currentStep === TUTORIAL_STEPS.length - 1
                        ? "Let's Go!"
                        : "Next"}
                    </Text>
                    {currentStep < TUTORIAL_STEPS.length - 1 && (
                      <ArrowRight size={scale(18)} color="#fff" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  cardWrapper: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 20,
  },
  cardBlur: {
    borderRadius: BorderRadius.xxl,
    overflow: "hidden",
  },
  card: {
    borderRadius: BorderRadius.xxl,
    alignItems: "center",
    borderWidth: 1,
  },
  skipButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  iconContainer: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  icon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    width: "100%",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: scale(26),
    fontWeight: "800",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: scale(16),
    textAlign: "center",
    lineHeight: scale(24),
    maxWidth: "90%",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  dot: {
    height: scale(8),
    borderRadius: scale(4),
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: Spacing.md,
  },
  navBack: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  nextWrapper: {
    flex: 1,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
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
    fontSize: scale(16),
    fontWeight: "700",
    color: "#fff",
  },
});
