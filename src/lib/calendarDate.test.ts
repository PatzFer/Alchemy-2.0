import test from 'node:test';
import assert from 'node:assert/strict';
import { shiftCalendarDate } from './calendarDate';

test('day and week navigation crosses month and year boundaries', () => {
  assert.equal(shiftCalendarDate('2026-12-31', 'day', 1), '2027-01-01');
  assert.equal(shiftCalendarDate('2026-12-28', 'week', 1), '2027-01-04');
});

test('month navigation clamps month-end dates instead of skipping a month', () => {
  assert.equal(shiftCalendarDate('2026-01-31', 'month', 1), '2026-02-28');
  assert.equal(shiftCalendarDate('2024-01-31', 'month', 1), '2024-02-29');
  assert.equal(shiftCalendarDate('2026-03-31', 'month', 1), '2026-04-30');
  assert.equal(shiftCalendarDate('2026-03-31', 'month', -1), '2026-02-28');
});

test('month navigation crosses year boundaries', () => {
  assert.equal(shiftCalendarDate('2026-12-31', 'month', 1), '2027-01-31');
  assert.equal(shiftCalendarDate('2027-01-31', 'month', -1), '2026-12-31');
});

test('invalid dates and non-integer shifts are unchanged', () => {
  assert.equal(shiftCalendarDate('2026-02-30', 'day', 1), '2026-02-30');
  assert.equal(shiftCalendarDate('invalid', 'month', 1), 'invalid');
  assert.equal(shiftCalendarDate('2026-01-01', 'day', 1.5), '2026-01-01');
});


test('isValidCalendarDate accepts real local dates and rejects impossible dates', async () => {
  const { isValidCalendarDate } = await import('./calendarDate');
  assert.equal(isValidCalendarDate('2026-11-20'), true);
  assert.equal(isValidCalendarDate('2024-02-29'), true);
  assert.equal(isValidCalendarDate('2026-02-29'), false);
  assert.equal(isValidCalendarDate('2026-13-01'), false);
  assert.equal(isValidCalendarDate('20/11/2026'), false);
});
