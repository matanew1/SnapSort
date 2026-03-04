import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export function useHaptics() {
  const triggerSwipeFeedback = useCallback((direction: 'keep' | 'delete') => {
    if (direction === 'delete') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const triggerSelectionFeedback = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const triggerSuccessFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const triggerErrorFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const triggerWarningFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const triggerLightImpact = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    triggerSwipeFeedback,
    triggerSelectionFeedback,
    triggerSuccessFeedback,
    triggerErrorFeedback,
    triggerWarningFeedback,
    triggerLightImpact,
  };
}

