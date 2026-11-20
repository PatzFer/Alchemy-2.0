import test from 'node:test';
import assert from 'node:assert/strict';
import type { CalendarEvent, LifeProfile } from '../types';
import { calculateDayCapacity, formatApproximateTime } from './planningEngine';

const event = (id: string, startTime: string, endTime: string): CalendarEvent => ({
  id, title: id, date: '2026-11-20', startTime, endTime, realm: 'personal', type: 'appointment',
});

const profile: LifeProfile = {
  workingDays: ['fri'], workingHoursStart: '09:00', workingHoursEnd: '17:00',
  commuteTimeMinutes: 0, routines: [], commitments: [],
  preferences: {
    energyPeak: 'morning', protectEvenings: true, maxHighPriorityTasksPerDay: 2,
    bufferTimeBetweenTasksMinutes: 15, unhurriedMorningRitual: true,
  },
};

test('daily planning capacity counts overlapping events once', () => {
  const result = calculateDayCapacity(
    [],
    [event('one', '09:00', '10:30'), event('two', '10:00', '11:00')],
    profile,
    '2026-11-20',
  );
  assert.equal(result.scheduledEventsMinutes, 120);
  assert.equal(result.workdayHours, 8);
  assert.equal(result.availableFreeMinutes, 330, 'appointments inside working hours must not reduce free time twice');
});

test('appointments outside working hours reduce remaining free time', () => {
  const result = calculateDayCapacity(
    [],
    [event('evening', '18:00', '19:00')],
    profile,
    '2026-11-20',
  );
  assert.equal(result.scheduledEventsMinutes, 60);
  assert.equal(result.availableFreeMinutes, 270);
});

test('daily planning ignores malformed and reversed event times', () => {
  const result = calculateDayCapacity(
    [],
    [event('bad', '9:00', '10:00'), event('reverse', '12:00', '11:00')],
    profile,
    '2026-11-20',
  );
  assert.equal(result.scheduledEventsMinutes, 0);
});

test('approximate free time formatting stays non-negative and rounded', () => {
  assert.equal(formatApproximateTime(0), 'Geen vrije ruimte');
  assert.equal(formatApproximateTime(60), '±1u');
  assert.equal(formatApproximateTime(75), '±1u15');
});
