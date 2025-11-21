import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error';

const hapticPatterns: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 30, 10],
  error: [50, 30, 50]
};

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((pattern: HapticPattern = 'medium') => {
    // Check if the Vibration API is supported
    if (!('vibrate' in navigator)) {
      return;
    }

    try {
      const vibrationPattern = hapticPatterns[pattern];
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      // Silently fail if vibration is not supported or blocked
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  const triggerSwipeHaptic = useCallback((action: 'like' | 'pass' | 'super_like') => {
    switch (action) {
      case 'like':
        triggerHaptic('medium');
        break;
      case 'pass':
        triggerHaptic('light');
        break;
      case 'super_like':
        triggerHaptic('success');
        break;
    }
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    triggerSwipeHaptic
  };
};
