import { WorkLogs, ActiveShift } from '../types';
import { getActiveMonthKeys } from './timeFormat';

const STORAGE_KEYS = {
  HOURLY_RATE: 'dora_hourly_rate',
  WORK_LOGS: 'dora_work_logs',
  ACTIVE_SHIFT: 'dora_active_shift',
  USER_NAME: 'dora_user_name',
  ONBOARDED: 'dora_onboarded',
};

/**
 * Perform auto-cleaning of logs older than previous month.
 * Keeps EXCLUSIVELY current month and previous month.
 */
export function cleanOldLogs(logs: WorkLogs): { cleaned: WorkLogs; removedCount: number } {
  const { currentMonthKey, prevMonthKey } = getActiveMonthKeys();
  const cleaned: WorkLogs = {};
  let removedCount = 0;

  for (const dateKey of Object.keys(logs)) {
    // dateKey is YYYY-MM-DD
    const monthKey = dateKey.substring(0, 7);
    if (monthKey === currentMonthKey || monthKey === prevMonthKey) {
      cleaned[dateKey] = logs[dateKey];
    } else {
      removedCount++;
    }
  }

  return { cleaned, removedCount };
}

/**
 * Load Work Logs from localStorage and run auto-cleanup.
 */
export function loadWorkLogs(): WorkLogs {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORK_LOGS);
    if (!raw) return {};
    const parsed: WorkLogs = JSON.parse(raw);
    
    // Auto-clean old records immediately on load
    const { cleaned, removedCount } = cleanOldLogs(parsed);
    if (removedCount > 0) {
      console.log(`[Auto-curățare] Șterse ${removedCount} zile mai vechi de luna precedentă.`);
      saveWorkLogs(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error loading work logs from localStorage:', err);
    return {};
  }
}

/**
 * Save Work Logs to localStorage
 */
export function saveWorkLogs(logs: WorkLogs): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WORK_LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error saving work logs to localStorage:', err);
  }
}

/**
 * Load Hourly Rate
 */
export function loadHourlyRate(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HOURLY_RATE);
    if (raw === null) return 15; // Valoare inițială implicită: 15 €
    const parsed = parseFloat(raw);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  } catch (err) {
    return 15;
  }
}

/**
 * Save Hourly Rate
 */
export function saveHourlyRate(rate: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HOURLY_RATE, String(rate));
  } catch (err) {
    console.error('Error saving hourly rate:', err);
  }
}

/**
 * Load Active Shift state (persisted across app restarts / background kills)
 */
export function loadActiveShift(): ActiveShift | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SHIFT);
    if (!raw) return null;
    const parsed: ActiveShift = JSON.parse(raw);
    if (parsed && parsed.isRunning && parsed.startTime > 0) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error loading active shift:', err);
    return null;
  }
}

/**
 * Save Active Shift state
 */
export function saveActiveShift(shift: ActiveShift | null): void {
  try {
    if (!shift) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SHIFT);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SHIFT, JSON.stringify(shift));
    }
  } catch (err) {
    console.error('Error saving active shift:', err);
  }
}

export function loadUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  } catch {
    return '';
  }
}

export function saveUserName(name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  } catch {
    // ignore
  }
}

export function loadOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDED) === 'true';
  } catch {
    return false;
  }
}

export function saveOnboarded(val: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDED, val ? 'true' : 'false');
  } catch {
    // ignore
  }
}

