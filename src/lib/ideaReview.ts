import { isValidCalendarDate } from './calendarDate';

function localDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Check whether an idea has gone untouched for the requested number of local calendar days. */
export function isIdeaDueForReview(
  lastTouchedAt: string | undefined,
  createdAt: string,
  today: Date = new Date(),
  minimumDays = 21,
): boolean {
  if (!Number.isInteger(minimumDays) || minimumDays < 1) return false;

  const source = lastTouchedAt || createdAt;
  let touchedDate: string;

  if (isValidCalendarDate(source)) {
    touchedDate = source;
  } else {
    const parsed = new Date(source);
    if (!Number.isFinite(parsed.getTime())) return false;
    touchedDate = localDateKey(parsed);
  }

  const todayKey = localDateKey(today);
  if (!isValidCalendarDate(touchedDate) || touchedDate > todayKey) return false;

  const [ty, tm, td] = todayKey.split('-').map(Number);
  const [iy, im, id] = touchedDate.split('-').map(Number);
  const todayUtc = Date.UTC(ty, tm - 1, td);
  const touchedUtc = Date.UTC(iy, im - 1, id);
  const daysElapsed = Math.floor((todayUtc - touchedUtc) / 86_400_000);
  return daysElapsed >= minimumDays;
}
