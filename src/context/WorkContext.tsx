import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { WorkLogs, ActiveShift, MonthViewType, WorkSession } from '../types';
import {
  loadWorkLogs,
  saveWorkLogs,
  loadHourlyRate,
  saveHourlyRate,
  loadActiveShift,
  saveActiveShift,
  cleanOldLogs,
  loadUserName,
  saveUserName,
  loadOnboarded,
  saveOnboarded,
} from '../utils/storage';
import {
  formatDateKey,
  getMonthKey,
  getActiveMonthKeys,
} from '../utils/timeFormat';
import { triggerHaptic } from '../utils/haptics';

interface DailyBarData {
  day: number;
  dateKey: string;
  minutes: number;
  hours: number;
  isToday: boolean;
  dayOfWeek: string;
  isLeave?: boolean;
}

interface WorkContextType {
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  activeShift: ActiveShift | null;
  elapsedMs: number;
  startShift: () => void;
  stopShift: () => { durationMinutes: number; date: string } | null;
  workLogs: WorkLogs;
  selectedMonth: MonthViewType;
  setSelectedMonth: (month: MonthViewType) => void;
  selectedMonthDate: Date;
  selectedMonthKey: string;
  updateDayMinutes: (dateKey: string, totalMinutes: number) => void;
  setDayLeave: (dateKey: string, isLeave: boolean, totalMinutes?: number) => void;
  addManualSession: (dateKey: string, durationMinutes: number, note?: string) => void;
  deleteSession: (dateKey: string, sessionId: string) => void;
  clearDayLog: (dateKey: string) => void;
  // Computed stats for selected month
  totalMinutesMonth: number;
  totalMoneyMonth: number;
  daysWorkedMonth: number;
  dailyBarsData: DailyBarData[];
  // Theme
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  // User & Onboarding
  userName: string;
  setUserName: (name: string) => void;
  isOnboarded: boolean;
  completeOnboarding: (name: string, rate: number) => void;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export const WorkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hourlyRate, setHourlyRateState] = useState<number>(() => loadHourlyRate());
  const [workLogs, setWorkLogsState] = useState<WorkLogs>(() => loadWorkLogs());
  const [activeShift, setActiveShiftState] = useState<ActiveShift | null>(() => loadActiveShift());
  const [elapsedMs, setElapsedMs] = useState<number>(() => {
    const shift = loadActiveShift();
    return shift && shift.isRunning ? Math.max(0, Date.now() - shift.startTime) : 0;
  });
  const [selectedMonth, setSelectedMonth] = useState<MonthViewType>('current');
  const [userName, setUserNameState] = useState<string>(() => loadUserName());
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => loadOnboarded());

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    saveUserName(name);
  }, []);

  const completeOnboarding = useCallback((name: string, rate: number) => {
    const cleanName = name.trim();
    setUserNameState(cleanName);
    saveUserName(cleanName);
    const validRate = isNaN(rate) || rate < 0 ? 0 : rate;
    setHourlyRateState(validRate);
    saveHourlyRate(validRate);
    setIsOnboarded(true);
    saveOnboarded(true);
    triggerHaptic('success');
  }, []);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('dora_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    try {
      localStorage.setItem('dora_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    triggerHaptic('light');
  }, []);

  // Hourly Rate setter
  const setHourlyRate = useCallback((rate: number) => {
    const validRate = isNaN(rate) || rate < 0 ? 0 : rate;
    setHourlyRateState(validRate);
    saveHourlyRate(validRate);
  }, []);

  // Work logs saver
  const updateWorkLogs = useCallback((updater: (prev: WorkLogs) => WorkLogs) => {
    setWorkLogsState((prev) => {
      const next = updater(prev);
      saveWorkLogs(next);
      return next;
    });
  }, []);

  // Ticking timer effect
  useEffect(() => {
    if (!activeShift || !activeShift.isRunning) {
      setElapsedMs(0);
      return;
    }

    // Immediately calculate
    setElapsedMs(Math.max(0, Date.now() - activeShift.startTime));

    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - activeShift.startTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeShift]);

  // Periodic memory auto-cleaning check (runs on mount and every hour)
  useEffect(() => {
    const runCleanup = () => {
      setWorkLogsState((prev) => {
        const { cleaned, removedCount } = cleanOldLogs(prev);
        if (removedCount > 0) {
          saveWorkLogs(cleaned);
          return cleaned;
        }
        return prev;
      });
    };

    runCleanup();
    const cleanupInterval = setInterval(runCleanup, 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, []);

  // Start shift
  const startShift = useCallback(() => {
    const now = Date.now();
    const dateObj = new Date(now);
    const timeFormatted = `${String(dateObj.getHours()).padStart(2, '0')}:${String(
      dateObj.getMinutes()
    ).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')}`;

    const newShift: ActiveShift = {
      isRunning: true,
      startTime: now,
      startFormatted: timeFormatted,
    };

    setActiveShiftState(newShift);
    saveActiveShift(newShift);
    triggerHaptic('heavy');
  }, []);

  // Stop shift
  const stopShift = useCallback(() => {
    if (!activeShift || !activeShift.isRunning) return null;

    const stopTime = Date.now();
    const durationMs = Math.max(0, stopTime - activeShift.startTime);
    // Convert to minutes (at least 1 minute if > 15s)
    let durationMinutes = Math.round(durationMs / 60000);
    if (durationMinutes === 0 && durationMs >= 15000) {
      durationMinutes = 1;
    }

    const todayKey = formatDateKey(new Date(stopTime));
    const newSession: WorkSession = {
      id: `session_${stopTime}`,
      start: activeShift.startTime,
      end: stopTime,
      durationMinutes,
      note: 'Pontaj automat tură',
      manual: false,
    };

    // Update log
    updateWorkLogs((prev) => {
      const existing = prev[todayKey] || {
        date: todayKey,
        totalMinutes: 0,
        sessions: [],
      };

      const updatedSessions = [...existing.sessions, newSession];
      const newTotal = updatedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      return {
        ...prev,
        [todayKey]: {
          date: todayKey,
          totalMinutes: newTotal,
          sessions: updatedSessions,
        },
      };
    });

    // Clear active shift
    setActiveShiftState(null);
    saveActiveShift(null);
    setElapsedMs(0);
    triggerHaptic('success');

    return { durationMinutes, date: todayKey };
  }, [activeShift, updateWorkLogs]);

  // Update total minutes directly for a day
  const updateDayMinutes = useCallback((dateKey: string, totalMinutes: number) => {
    const safeMinutes = Math.max(0, Math.round(totalMinutes));
    updateWorkLogs((prev) => {
      const existing = prev[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessions: [],
      };

      // Add a manual adjustment session if there were previous sessions, or set directly
      const diff = safeMinutes - existing.totalMinutes;
      let newSessions = [...existing.sessions];

      if (existing.sessions.length === 0) {
        if (safeMinutes > 0) {
          newSessions = [
            {
              id: `manual_${Date.now()}`,
              start: Date.now() - safeMinutes * 60000,
              end: Date.now(),
              durationMinutes: safeMinutes,
              note: 'Înregistrare manuală',
              manual: true,
            },
          ];
        }
      } else if (diff !== 0) {
        newSessions.push({
          id: `adj_${Date.now()}`,
          start: Date.now(),
          end: Date.now(),
          durationMinutes: diff,
          note: diff > 0 ? `Ajustare manuală (+${diff}m)` : `Ajustare manuală (${diff}m)`,
          manual: true,
        });
      }

      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          totalMinutes: safeMinutes,
          sessions: newSessions,
          isLeave: existing.isLeave,
        },
      };
    });
    triggerHaptic('light');
  }, [updateWorkLogs]);

  // Set or unset Leave (Concediu) for a day
  const setDayLeave = useCallback((dateKey: string, isLeave: boolean, totalMinutes?: number) => {
    updateWorkLogs((prev) => {
      const existing = prev[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessions: [],
      };

      const nextMinutes = totalMinutes !== undefined ? Math.max(0, Math.round(totalMinutes)) : existing.totalMinutes;
      let nextSessions = [...existing.sessions];

      if (totalMinutes !== undefined) {
        if (nextMinutes > 0) {
          nextSessions = [
            {
              id: `leave_${Date.now()}`,
              start: Date.now() - nextMinutes * 60000,
              end: Date.now(),
              durationMinutes: nextMinutes,
              note: isLeave ? 'Concediu plătit' : 'Înregistrare manuală',
              manual: true,
            },
          ];
        } else {
          nextSessions = [];
        }
      }

      if (!isLeave && nextMinutes === 0 && nextSessions.length === 0) {
        const copy = { ...prev };
        delete copy[dateKey];
        return copy;
      }

      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          totalMinutes: nextMinutes,
          sessions: nextSessions,
          isLeave,
        },
      };
    });
    triggerHaptic('medium');
  }, [updateWorkLogs]);

  // Add manual session
  const addManualSession = useCallback((dateKey: string, durationMinutes: number, note?: string) => {
    if (durationMinutes <= 0) return;
    updateWorkLogs((prev) => {
      const existing = prev[dateKey] || {
        date: dateKey,
        totalMinutes: 0,
        sessions: [],
      };

      const newSession: WorkSession = {
        id: `manual_${Date.now()}`,
        start: Date.now() - durationMinutes * 60000,
        end: Date.now(),
        durationMinutes,
        note: note || 'Adăugat manual',
        manual: true,
      };

      const updatedSessions = [...existing.sessions, newSession];
      const newTotal = updatedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          totalMinutes: newTotal,
          sessions: updatedSessions,
        },
      };
    });
    triggerHaptic('medium');
  }, [updateWorkLogs]);

  // Delete a session
  const deleteSession = useCallback((dateKey: string, sessionId: string) => {
    updateWorkLogs((prev) => {
      const existing = prev[dateKey];
      if (!existing) return prev;

      const filtered = existing.sessions.filter((s) => s.id !== sessionId);
      const newTotal = filtered.reduce((acc, s) => acc + s.durationMinutes, 0);

      return {
        ...prev,
        [dateKey]: {
          date: dateKey,
          totalMinutes: newTotal,
          sessions: filtered,
        },
      };
    });
    triggerHaptic('warning');
  }, [updateWorkLogs]);

  // Clear day log
  const clearDayLog = useCallback((dateKey: string) => {
    updateWorkLogs((prev) => {
      const copy = { ...prev };
      delete copy[dateKey];
      return copy;
    });
    triggerHaptic('warning');
  }, [updateWorkLogs]);

  // Selected month date representation
  const selectedMonthDate = useMemo(() => {
    const now = new Date();
    if (selectedMonth === 'current') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      return new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }
  }, [selectedMonth]);

  const selectedMonthKey = useMemo(() => {
    return getMonthKey(selectedMonthDate);
  }, [selectedMonthDate]);

  // Computed stats for selected month
  const { totalMinutesMonth, daysWorkedMonth, dailyBarsData } = useMemo(() => {
    const year = selectedMonthDate.getFullYear();
    const month = selectedMonthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = formatDateKey(new Date());

    let totalMins = 0;
    let daysWorked = 0;
    const bars: DailyBarData[] = [];

    const weekDays = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const log = workLogs[dateKey];
      const mins = log ? log.totalMinutes : 0;
      const hours = Math.round((mins / 60) * 10) / 10;

      if (mins > 0) {
        totalMins += mins;
        daysWorked++;
      }

      bars.push({
        day: d,
        dateKey,
        minutes: mins,
        hours,
        isToday: dateKey === todayStr,
        dayOfWeek: weekDays[dayDate.getDay()],
        isLeave: Boolean(log?.isLeave),
      });
    }

    return {
      totalMinutesMonth: totalMins,
      daysWorkedMonth: daysWorked,
      dailyBarsData: bars,
    };
  }, [selectedMonthDate, workLogs]);

  // Total money calculation: (totalMinutes / 60) * hourlyRate
  const totalMoneyMonth = useMemo(() => {
    const hours = totalMinutesMonth / 60;
    return Math.round(hours * hourlyRate * 100) / 100;
  }, [totalMinutesMonth, hourlyRate]);

  const value: WorkContextType = {
    hourlyRate,
    setHourlyRate,
    activeShift,
    elapsedMs,
    startShift,
    stopShift,
    workLogs,
    selectedMonth,
    setSelectedMonth,
    selectedMonthDate,
    selectedMonthKey,
    updateDayMinutes,
    setDayLeave,
    addManualSession,
    deleteSession,
    clearDayLog,
    totalMinutesMonth,
    totalMoneyMonth,
    daysWorkedMonth,
    dailyBarsData,
    theme,
    toggleTheme,
    userName,
    setUserName,
    isOnboarded,
    completeOnboarding,
  };

  return <WorkContext.Provider value={value}>{children}</WorkContext.Provider>;
};

export const useWork = () => {
  const context = useContext(WorkContext);
  if (!context) {
    throw new Error('useWork must be used within a WorkProvider');
  }
  return context;
};

