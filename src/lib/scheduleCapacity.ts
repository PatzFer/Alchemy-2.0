import type { CalendarEvent } from '../types';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function toMinutes(value: string): number | null {
  if (!TIME_PATTERN.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

/** Return the union of occupied same-day minutes; overlapping events count only once. */
export function calculateBusyMinutes(events: CalendarEvent[]): number {
  const intervals = events
    .map((event) => {
      const start = toMinutes(event.startTime);
      const end = toMinutes(event.endTime);
      return start !== null && end !== null && end > start ? [start, end] as const : null;
    })
    .filter((interval): interval is readonly [number, number] => interval !== null)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let total = 0;
  let activeStart: number | null = null;
  let activeEnd = 0;

  for (const [start, end] of intervals) {
    if (activeStart === null) {
      activeStart = start;
      activeEnd = end;
    } else if (start <= activeEnd) {
      activeEnd = Math.max(activeEnd, end);
    } else {
      total += activeEnd - activeStart;
      activeStart = start;
      activeEnd = end;
    }
  }

  if (activeStart !== null) total += activeEnd - activeStart;
  return total;
}
