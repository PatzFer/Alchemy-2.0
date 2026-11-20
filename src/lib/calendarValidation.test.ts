import test from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateCalendarEvent, validateCalendarEventInput, validateCalendarTimeRange } from './calendarValidation';
import type { CalendarEvent } from '../types';

const event: CalendarEvent = {
  id: 'event-1', title: 'Tandarts', date: '2026-11-20',
  startTime: '10:00', endTime: '11:00', realm: 'personal', type: 'appointment',
};

test('accepts valid same-day time ranges', () => {
  assert.equal(validateCalendarTimeRange('09:30', '10:00'), null);
});

test('rejects malformed times and end times at or before start', () => {
  assert.ok(validateCalendarTimeRange('9:30', '10:00'));
  assert.ok(validateCalendarTimeRange('10:00', '10:00'));
  assert.ok(validateCalendarTimeRange('11:00', '10:00'));
});

test('detects exact duplicate appointments within the same realm', () => {
  assert.equal(findDuplicateCalendarEvent([event], {
    title: ' tandarts ', date: event.date, startTime: event.startTime,
    endTime: event.endTime, realm: 'personal',
  })?.id, event.id);
});

test('does not treat an event in the other realm as a duplicate', () => {
  assert.equal(findDuplicateCalendarEvent([event], {
    title: event.title, date: event.date, startTime: event.startTime,
    endTime: event.endTime, realm: 'mariluna',
  }), undefined);
});

test('calendar event validation rejects blank titles and impossible dates', () => {
  assert.ok(validateCalendarEventInput({ title: '  ', date: '2026-11-20', startTime: '10:00', endTime: '11:00' }));
  assert.ok(validateCalendarEventInput({ title: 'Tandarts', date: '2026-02-30', startTime: '10:00', endTime: '11:00' }));
  assert.ok(validateCalendarEventInput({ title: 'Tandarts', date: 'not-a-date', startTime: '10:00', endTime: '11:00' }));
});

test('calendar event validation accepts a real date and valid title and time range', () => {
  assert.equal(validateCalendarEventInput({ title: ' Tandarts ', date: '2026-11-20', startTime: '10:00', endTime: '11:00' }), null);
});
