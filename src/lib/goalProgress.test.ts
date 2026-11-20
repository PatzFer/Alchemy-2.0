import test from 'node:test';
import assert from 'node:assert/strict';
import type { Milestone, Task } from '../types';
import { calculateGoalProgress } from './goalProgress';

const milestone = (completed: boolean): Milestone => ({ id: String(completed), title: 'Step', completed });
const task = (status: Task['status']): Task => ({
  id: status, title: 'Task', description: '', realm: 'personal', category: 'general',
  priority: 'medium', dueDate: '2026-11-20', estimatedDuration: 30, recurring: 'none',
  status, subtasks: [], createdAt: '2026-11-20',
});

test('milestones are the primary goal progress source', () => {
  assert.equal(calculateGoalProgress([milestone(true), milestone(false)], [task('completed'), task('completed')], 90), 50);
});

test('linked task completion determines progress when there are no milestones', () => {
  assert.equal(calculateGoalProgress([], [task('completed'), task('todo'), task('in_progress')]), 33);
  assert.equal(calculateGoalProgress([], [task('completed'), task('completed')]), 100);
});

test('manual progress is the fallback when there are no milestones or linked tasks', () => {
  assert.equal(calculateGoalProgress([], [], 65), 65);
  assert.equal(calculateGoalProgress([], [], 150), 100);
  assert.equal(calculateGoalProgress([], [], -10), 0);
  assert.equal(calculateGoalProgress([], [], Number.NaN), 0);
});
