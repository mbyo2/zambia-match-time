import { useCallback } from 'react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

type NativeHapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export const useNativeHaptics = () => {
  const isNative = Capacitor.isNativePlatform();

  const triggerHaptic = useCallback(async (pattern: NativeHapticPattern = 'medium') => {
    if (!isNative) {
      // Fallback to web vibration API
      if ('vibrate' in navigator) {
        const patterns: Record<NativeHapticPattern, number[]> = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 30, 10],
          error: [50, 30, 50],
          warning: [20, 20, 20]
        };
        navigator.vibrate(patterns[pattern]);
      }
      return;
    }

    try {
      switch (pattern) {
        case 'light':
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
      }
    } catch (error) {
      console.debug('Haptic feedback error:', error);
    }
  }, [isNative]);

  const triggerSwipeHaptic = useCallback(async (action: 'like' | 'pass' | 'super_like') => {
    switch (action) {
      case 'like':
        await triggerHaptic('medium');
        break;
      case 'pass':
        await triggerHaptic('light');
        break;
      case 'super_like':
        await triggerHaptic('success');
        break;
    }
  }, [triggerHaptic]);

  return {
    triggerHaptic,
    triggerSwipeHaptic,
    isNative
  };
};
