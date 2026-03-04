import { ArrowLeft, ArrowRight, Heart, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, getColors, Spacing } from '@/constants/theme';
import { useAppStore } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SwipeTutorialProps {
  visible: boolean;
  onComplete: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to SnapSort!',
    description: 'Let\'s quickly show you how to sort your photos.',
    position: 'center' as const,
  },
  {
    title: 'Swipe Right to Keep',
    description: 'Keep photos you want to save by swiping right.',
    icon: 'heart',
    position: 'right' as const,
  },
  {
    title: 'Swipe Left to Delete',
    description: 'Mark photos for deletion by swiping left.',
    icon: 'trash',
    position: 'left' as const,
  },
  {
    title: 'Undo Mistakes',
    description: 'Made a mistake? Tap the undo button to go back.',
    icon: 'undo',
    position: 'bottom' as const,
  },
  {
    title: 'Ready to Start!',
    description: 'Start sorting your photos now and clean up your gallery!',
    position: 'center' as const,
  },
];

export function SwipeTutorial({ visible, onComplete }: SwipeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isDark = useAppStore((s) => s.isDarkMode);
  const Colors = getColors(isDark);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(0);
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
    });
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!visible) return null;

  const step = TUTORIAL_STEPS[currentStep];

  const renderIcon = () => {
    switch (step.icon) {
      case 'heart':
        return (
          <View style={styles.iconContainer}>
            <Heart size={48} color={Colors.keep} fill={Colors.keep} />
            <ArrowRight size={32} color={Colors.keep} />
          </View>
        );
      case 'trash':
        return (
          <View style={styles.iconContainer}>
            <ArrowLeft size={32} color={Colors.delete} />
            <Trash2 size={48} color={Colors.delete} />
          </View>
        );
      case 'undo':
        return (
          <View style={styles.iconContainer}>
            <Text style={styles.undoEmoji}>↩️</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.welcomeIcon, { backgroundColor: Colors.accent }]}>
            <Text style={styles.welcomeIconText}>📸</Text>
          </View>
        );
    }
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor: Colors.overlay, opacity: fadeAnim },
      ]}
    >
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: Colors.surface,
            transform: [
              {
                scale: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityLabel="Skip tutorial"
          accessibilityRole="button"
        >
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={styles.iconWrapper}>{renderIcon()}</View>

        {/* Title */}
        <Text style={[styles.title, { color: Colors.text }]}>{step.title}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: Colors.textSecondary }]}>
          {step.description}
        </Text>

        {/* Progress Dots */}
        <View style={styles.dotsContainer}>
          {TUTORIAL_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentStep ? Colors.accent : Colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[styles.navButton, { borderColor: Colors.border }]}
              onPress={handlePrevious}
              accessibilityLabel="Previous step"
              accessibilityRole="button"
            >
              <ArrowLeft size={20} color={Colors.text} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, { backgroundColor: Colors.accent }]}
            onPress={handleNext}
            accessibilityLabel={currentStep === TUTORIAL_STEPS.length - 1 ? 'Get started' : 'Next'}
            accessibilityRole="button"
          >
            <Text style={[styles.nextButtonText, { color: Colors.white }]}>
              {currentStep === TUTORIAL_STEPS.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    width: SCREEN_WIDTH - 48,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 1,
  },
  iconWrapper: {
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeIconText: {
    fontSize: 36,
  },
  undoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    minWidth: 140,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

