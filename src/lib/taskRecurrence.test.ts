import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextRecurringTaskDate } from './taskRecurrence';

test('daily and weekly task recurrence crosses month and year boundaries', () => {
  assert.equal(getNextRecurringTaskDate('2026-12-31', 'daily'), '2027-01-01');
  assert.equal(getNextRecurringTaskDate('2026-12-28', 'weekly'), '2027-01-04');
});

test('monthly recurrence clamps to the last day of shorter months', () => {
  assert.equal(getNextRecurringTaskDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(getNextRecurringTaskDate('2024-01-31', 'monthly'), '2024-02-29');
  assert.equal(getNextRecurringTaskDate('2026-03-31', 'monthly'), '2026-04-30');
});

test('monthly recurrence rolls December into January', () => {
  assert.equal(getNextRecurringTaskDate('2026-12-31', 'monthly'), '2027-01-31');
});

test('invalid and non-recurring dates do not create occurrences', () => {
  assert.equal(getNextRecurringTaskDate('2026-02-30', 'daily'), null);
  assert.equal(getNextRecurringTaskDate('not-a-date', 'weekly'), null);
  assert.equal(getNextRecurringTaskDate('2026-01-01', 'none'), null);
});
test('late completion skips missed daily and weekly occurrences', () => {
  assert.equal(getNextRecurringTaskDate('2026-11-01', 'daily', '2026-11-20'), '2026-11-21');
  assert.equal(getNextRecurringTaskDate('2026-11-02', 'weekly', '2026-11-20'), '2026-11-23');
});

test('late monthly completion keeps the original month-end anchor', () => {
  assert.equal(getNextRecurringTaskDate('2026-01-31', 'monthly', '2026-03-01'), '2026-03-31');
  assert.equal(getNextRecurringTaskDate('2024-01-31', 'monthly', '2024-02-29'), '2024-03-31');
});

test('invalid after-date does not create a recurring occurrence', () => {
  assert.equal(getNextRecurringTaskDate('2026-11-01', 'daily', '2026-02-30'), null);
});
