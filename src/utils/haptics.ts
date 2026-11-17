import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') {
  try {
    if (style === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (style === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (style === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (style === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (style === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  } catch (e) {
    // Web fallback if running inside browser
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (style === 'heavy' || style === 'success') {
        navigator.vibrate([30, 50, 30]);
      } else {
        navigator.vibrate(15);
      }
    }
  }
}

