import { Capacitor, registerPlugin } from '@capacitor/core';

interface ShiftNotificationPlugin {
  start(options: { startTime: number; userName?: string }): Promise<void>;
  stop(): Promise<void>;
}

const ShiftNotification = registerPlugin<ShiftNotificationPlugin>('ShiftNotification');

export async function startShiftNotification(startTime: number, userName?: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ShiftNotification.start({ startTime, userName });
  } catch {
    // Ignore on unsupported platforms
  }
}

export async function stopShiftNotification(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await ShiftNotification.stop();
  } catch {
    // Ignore on unsupported platforms
  }
}
