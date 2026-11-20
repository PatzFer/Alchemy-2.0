import test from 'node:test';
import assert from 'node:assert/strict';
import type { Task } from '../types';
import { getCalendarTasksForDate } from './calendarTasks';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 't1', title: 'Taak', description: '', realm: 'personal', category: 'general',
  priority: 'medium', dueDate: '2026-11-20', estimatedDuration: 30, recurring: 'none',
  status: 'todo', subtasks: [], createdAt: '2026-11-01', ...overrides,
});

test('calendar tasks match the selected date and active workspace', () => {
  const items = [
    task({ id: 'personal' }),
    task({ id: 'mariluna', realm: 'mariluna' }),
    task({ id: 'tomorrow', dueDate: '2026-11-21' }),
  ];
  assert.deepEqual(getCalendarTasksForDate(items, '2026-11-20', 'personal').map((x) => x.id), ['personal']);
  assert.deepEqual(getCalendarTasksForDate(items, '2026-11-20', 'all').map((x) => x.id), ['personal', 'mariluna']);
});

test('calendar task ordering puts open high-priority work first and completed work last', () => {
  const items = [
    task({ id: 'done', status: 'completed', priority: 'high' }),
    task({ id: 'low', priority: 'low' }),
    task({ id: 'high', priority: 'high' }),
    task({ id: 'medium', priority: 'medium' }),
  ];
  assert.deepEqual(getCalendarTasksForDate(items, '2026-11-20', 'all').map((x) => x.id), ['high', 'medium', 'low', 'done']);
});
