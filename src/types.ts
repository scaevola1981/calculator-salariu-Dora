export interface WorkSession {
  id: string;
  start: number; // timestamp ms
  end: number;   // timestamp ms
  durationMinutes: number;
  note?: string;
  manual?: boolean;
}

export interface DayLog {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  sessions: WorkSession[];
  isLeave?: boolean; // Zi de concediu
}

export type WorkLogs = Record<string, DayLog>;

export interface ActiveShift {
  isRunning: boolean;
  startTime: number; // timestamp ms
  startFormatted: string; // HH:mm:ss
}

export type MonthViewType = 'current' | 'previous';

