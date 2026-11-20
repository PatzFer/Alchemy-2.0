import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBusyMinutes } from './scheduleCapacity';
import type { CalendarEvent } from '../types';

const event = (id: string, startTime: string, endTime: string): CalendarEvent => ({
  id, title: id, date: '2026-11-20', startTime, endTime, realm: 'personal', type: 'appointment',
});

test('counts separate calendar events independently', () => {
  assert.equal(calculateBusyMinutes([
    event('one', '09:00', '10:00'),
    event('two', '11:00', '12:30'),
  ]), 150);
});

test('merges overlapping and nested appointments instead of double-counting them', () => {
  assert.equal(calculateBusyMinutes([
    event('one', '09:00', '10:30'),
    event('two', '10:00', '11:00'),
    event('three', '09:15', '09:45'),
    event('four', '10:45', '12:00'),
  ]), 180);
});

test('touching intervals merge without changing their total duration', () => {
  assert.equal(calculateBusyMinutes([
    event('one', '09:00', '10:00'),
    event('two', '10:00', '11:00'),
  ]), 120);
});

test('malformed and zero-length event times are ignored safely', () => {
  assert.equal(calculateBusyMinutes([
    event('bad', '9:00', '10:00'),
    event('zero', '10:00', '10:00'),
    event('reverse', '12:00', '11:00'),
    event('good', '13:00', '13:30'),
  ]), 30);
});
