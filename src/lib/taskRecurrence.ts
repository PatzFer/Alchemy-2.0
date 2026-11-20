export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

/**
 * Calculate the next local calendar date for a recurring task.
 * Returns null for non-recurring tasks or malformed dates.
 */
export function getNextRecurringTaskDate(dueDate: string, recurrence: TaskRecurrence): string | null {
  if (recurrence === 'none' || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return null;

  const [year, month, day] = dueDate.split('-').map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  const nextDate = new Date(year, month - 1, day);
  if (
    nextDate.getFullYear() !== year ||
    nextDate.getMonth() !== month - 1 ||
    nextDate.getDate() !== day
  ) return null;

  if (recurrence === 'daily') nextDate.setDate(nextDate.getDate() + 1);
  if (recurrence === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
  if (recurrence === 'monthly') {
    const targetYear = month === 12 ? year + 1 : year;
    const targetMonth = month === 12 ? 0 : month;
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    nextDate.setFullYear(targetYear, targetMonth, Math.min(day, lastDayOfTargetMonth));
  }

  return [
    nextDate.getFullYear(),
    String(nextDate.getMonth() + 1).padStart(2, '0'),
    String(nextDate.getDate()).padStart(2, '0'),
  ].join('-');
}
