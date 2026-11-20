import test from 'node:test';
import assert from 'node:assert/strict';
import { filterGoalList } from './goalListFilters';
import type { Goal } from '../types';

const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'g1', title: 'Meer rust in mijn week', description: 'Ruimte voor mezelf',
  realm: 'personal', timeframe: 'monthly', status: 'active', progress: 0,
  connectedTaskIds: [], connectedProjectIds: [],
  targetDate: '2026-12-20', milestones: [{ id: 'm1', title: 'Avonden vrijhouden', completed: false }],
  ...overrides,
});

test('goal search includes title, description, notes and milestone titles', () => {
  const item = goal({ notes: 'Zachte grenzen bewaken' });
  for (const query of ['meer rust', 'ruimte voor mezelf', 'zachte grenzen', 'avonden vrijhouden']) {
    assert.deepEqual(filterGoalList([item], { activeWorld: 'all', query }).map((x) => x.id), ['g1']);
  }
});

test('goal filters combine workspace and horizon', () => {
  const goals = [goal({ id: 'private' }), goal({ id: 'business', realm: 'mariluna' }), goal({ id: 'year', timeframe: 'yearly' })];
  assert.deepEqual(filterGoalList(goals, { activeWorld: 'personal', horizon: 'monthly' }).map((x) => x.id), ['private']);
  assert.deepEqual(filterGoalList(goals, { activeWorld: 'all', horizon: 'yearly' }).map((x) => x.id), ['year']);
});

test('goal search is case-insensitive, trims whitespace and preserves order', () => {
  const goals = [goal({ id: 'a', title: 'Lucy' }), goal({ id: 'b', title: 'Lucy wandeling' })];
  assert.deepEqual(filterGoalList(goals, { activeWorld: 'all', query: '  LUCY ' }).map((x) => x.id), ['a', 'b']);
});
