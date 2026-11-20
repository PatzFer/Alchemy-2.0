import test from 'node:test';
import assert from 'node:assert/strict';
import type { CalendarEvent, LifeProfile, Task } from '../../types';
import { assessCapacity, evaluateTaskFit, generateTaskSplits } from './capacityEngine';

const event = (id: string, startTime: string, endTime: string): CalendarEvent => ({
  id, title: id, date: '2026-11-20', startTime, endTime, realm: 'personal', type: 'appointment',
});

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1', title: 'Werk aan project', description: '', realm: 'personal',
  category: 'general', priority: 'medium', dueDate: '2026-11-20',
  estimatedDuration: 30, recurring: 'none', status: 'todo', subtasks: [],
  createdAt: '2026-11-01', ...overrides,
});

const profile: LifeProfile = {
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  workingHoursStart: '09:00', workingHoursEnd: '17:00', commuteTimeMinutes: 0,
  routines: [], commitments: [],
  preferences: {
    energyPeak: 'morning', protectEvenings: true, maxHighPriorityTasksPerDay: 2,
    bufferTimeBetweenTasksMinutes: 15, unhurriedMorningRitual: true,
  },
};

test('Jarvis capacity counts overlapping calendar events only once', () => {
  const result = assessCapacity([
    event('one', '09:00', '10:30'),
    event('two', '10:00', '11:00'),
    event('three', '11:30', '12:00'),
  ]);
  assert.equal(result.busyMinutes, 150);
  assert.equal(result.freeMinutes, 330);
});

test('task fit rejects work that exceeds the remaining free time', () => {
  const result = evaluateTaskFit(task({ estimatedDuration: 60 }), {
    level: 'normal', freeMinutes: 25, busyMinutes: 100, reason: 'Limited time',
    recommendedTaskCount: 1, maxTaskMinutes: 90,
  });
  assert.equal(result.fits, false);
  assert.equal(result.recommendation, 'reschedule_later');
});

test('task fit still respects a lower energy-based task duration limit', () => {
  const result = evaluateTaskFit(task({ estimatedDuration: 60 }), {
    level: 'reduced', freeMinutes: 180, busyMinutes: 60, reason: 'Lower energy',
    recommendedTaskCount: 1, maxTaskMinutes: 30,
  });
  assert.equal(result.fits, false);
  assert.equal(result.recommendation, 'reschedule_later');
});

test('oversized task that fits neither the remaining time nor capacity is suggested for splitting', () => {
  const result = evaluateTaskFit(task({ estimatedDuration: 120 }), {
    level: 'normal', freeMinutes: 45, busyMinutes: 200, reason: 'Dense day',
    recommendedTaskCount: 1, maxTaskMinutes: 60,
  });
  assert.equal(result.fits, false);
  assert.equal(result.recommendation, 'split_task');
});

test('task splitting produces bounded, actionable steps', () => {
  const splits = generateTaskSplits('Instagram content maken');
  assert.ok(splits.length >= 3 && splits.length <= 5);
  assert.ok(splits.every((item) => item.title.trim().length > 0 && item.durationMinutes > 0));
});
