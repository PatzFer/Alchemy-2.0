import test from 'node:test';
import assert from 'node:assert/strict';
import { groupTasksForToday } from './todayDashboardModel';
import { Task } from '../types';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Testtaak',
  description: '',
  realm: 'personal',
  category: 'general',
  priority: 'medium',
  dueDate: '2026-11-20',
  estimatedDuration: 30,
  recurring: 'none',
  status: 'todo',
  subtasks: [],
  createdAt: '2026-11-01T10:00:00.000Z',
  ...overrides,
});

test('dashboard separates overdue tasks from tasks due today', () => {
  const groups = groupTasksForToday([
    task({ id: 'old', dueDate: '2026-11-19' }),
    task({ id: 'today', dueDate: '2026-11-20' }),
    task({ id: 'future', dueDate: '2026-11-21' }),
  ], '2026-11-20', 'all');
  assert.deepEqual(groups.overdue.map((item) => item.id), ['old']);
  assert.deepEqual(groups.dueToday.map((item) => item.id), ['today']);
});

test('dashboard hides completed tasks and respects the active world', () => {
  const groups = groupTasksForToday([
    task({ id: 'private' }),
    task({ id: 'mariluna', realm: 'mariluna' }),
    task({ id: 'done', status: 'completed' }),
  ], '2026-11-20', 'personal');
  assert.deepEqual(groups.dueToday.map((item) => item.id), ['private']);
});

test('dashboard orders urgent work by priority then due date and title', () => {
  const groups = groupTasksForToday([
    task({ id: 'low', priority: 'low' }),
    task({ id: 'medium', priority: 'medium' }),
    task({ id: 'high-later', priority: 'high', dueDate: '2026-11-20' }),
    task({ id: 'high-first', priority: 'high', dueDate: '2026-11-19' }),
  ], '2026-11-20', 'all');
  assert.deepEqual(groups.overdue.map((item) => item.id), ['high-first']);
  assert.deepEqual(groups.dueToday.map((item) => item.id), ['high-later', 'medium', 'low']);
});

test('dashboard ignores malformed due dates and invalid dashboard dates', () => {
  const groups = groupTasksForToday([
    task({ id: 'bad-task-date', dueDate: '2026-02-31' }),
    task({ id: 'good' }),
  ], '2026-11-20', 'all');
  assert.deepEqual(groups.dueToday.map((item) => item.id), ['good']);
  assert.deepEqual(groupTasksForToday([task()], '2026-02-31', 'all'), { overdue: [], dueToday: [] });
});
