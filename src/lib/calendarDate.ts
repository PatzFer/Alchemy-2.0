export type CalendarViewMode = 'day' | 'week' | 'month';

/** Shift a local calendar date without UTC drift or month-end overflow. */
export function shiftCalendarDate(dateStr: string, mode: CalendarViewMode, delta: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !Number.isInteger(delta)) return dateStr;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    year < 1000 || date.getFullYear() !== year ||
    date.getMonth() !== month - 1 || date.getDate() !== day
  ) return dateStr;

  if (mode === 'day') date.setDate(date.getDate() + delta);
  else if (mode === 'week') date.setDate(date.getDate() + delta * 7);
  else {
    const targetMonthIndex = year * 12 + (month - 1) + delta;
    const targetYear = Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    date.setFullYear(targetYear, targetMonth, Math.min(day, lastDay));
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}


/** Validate a YYYY-MM-DD calendar date without relying on permissive Date parsing. */
export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (year < 1000) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
