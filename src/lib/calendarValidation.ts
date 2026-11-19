import type { CalendarEvent, Realm } from '../types';

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** Validates a same-day calendar time range in 24-hour HH:mm format. */
export function validateCalendarTimeRange(startTime: string, endTime: string): string | null {
  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return 'Vul een geldige start- en eindtijd in.';
  }
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (end <= start) return 'De eindtijd moet later zijn dan de starttijd.';
  return null;
}

/** Detects an exact duplicate without blocking intentional overlapping appointments. */
export function findDuplicateCalendarEvent(
  events: CalendarEvent[],
  candidate: { title: string; date: string; startTime: string; endTime: string; realm: Realm }
): CalendarEvent | undefined {
  const normalizedTitle = candidate.title.trim().toLocaleLowerCase();
  return events.find((event) =>
    event.date === candidate.date &&
    event.startTime === candidate.startTime &&
    event.endTime === candidate.endTime &&
    event.realm === candidate.realm &&
    event.title.trim().toLocaleLowerCase() === normalizedTitle
  );
}
