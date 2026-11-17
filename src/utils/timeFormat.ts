/**
 * Time and Date formatting utilities in Romanian locale
 */

export const MONTH_NAMES_RO = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export const MONTH_NAMES_SHORT_RO = [
  'Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun',
  'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'
];

export const DAYS_SHORT_RO = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];

/**
 * Returns date in YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns month key in YYYY-MM
 */
export function getMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get current month key and previous month key
 */
export function getActiveMonthKeys(): { currentMonthKey: string; prevMonthKey: string } {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  
  // Previous month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = getMonthKey(prevDate);

  return { currentMonthKey, prevMonthKey };
}

/**
 * Format total minutes to "08h 30m"
 */
export function formatMinutesToHM(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0h 00m';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/**
 * Format minutes to decimal hours (e.g., 8.5h)
 */
export function formatMinutesToDecimal(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0.0h';
  const decimal = (totalMinutes / 60).toFixed(1);
  return `${decimal}h`;
}

/**
 * Format milliseconds into HH:MM:SS for live timer
 */
export function formatElapsedMs(elapsedMs: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
}

/**
 * Format currency in EURO (€)
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' €';
}

/**
 * Format timestamp to Romanian time (e.g. 08:30)
 */
export function formatTimeOnly(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Month display label (e.g. "Martie 2026")
 */
export function getMonthDisplayName(year: number, monthIndex: number): string {
  return `${MONTH_NAMES_RO[monthIndex]} ${year}`;
}

