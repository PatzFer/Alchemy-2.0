import { isValidCalendarDate } from './calendarDate';

export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Calculate one anchored recurrence step without drifting monthly end-of-month dates. */
function getNextAnchoredDate(baseDate: string, occurrenceIndex: number, recurrence: Exclude<TaskRecurrence, 'none'>): string {
  const [year, month, day] = baseDate.split('-').map(Number);
  if (recurrence === 'daily' || recurrence === 'weekly') {
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + occurrenceIndex * (recurrence === 'daily' ? 1 : 7));
    return formatLocalDate(date);
  }

  const absoluteMonth = year * 12 + (month - 1) + occurrenceIndex;
  const targetYear = Math.floor(absoluteMonth / 12);
  const targetMonth = absoluteMonth % 12;
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  return formatLocalDate(new Date(targetYear, targetMonth, Math.min(day, lastDay)));
}

/**
 * Calculate the next local calendar date for a recurring task.
 * When afterDate is supplied, skip missed occurrences and return the first future occurrence.
 */
export function getNextRecurringTaskDate(
  dueDate: string,
  recurrence: TaskRecurrence,
  afterDate?: string,
): string | null {
  if (recurrence === 'none' || !isValidCalendarDate(dueDate)) return null;
  if (afterDate !== undefined && !isValidCalendarDate(afterDate)) return null;

  let occurrenceIndex = 1;
  let nextDate = getNextAnchoredDate(dueDate, occurrenceIndex, recurrence);
  if (!afterDate) return nextDate;

  // Bound iteration to guard corrupted inputs; four centuries is beyond any practical task series.
  while (nextDate <= afterDate && occurrenceIndex < 5000) {
    occurrenceIndex += 1;
    nextDate = getNextAnchoredDate(dueDate, occurrenceIndex, recurrence);
  }
  return nextDate > afterDate ? nextDate : null;
}
