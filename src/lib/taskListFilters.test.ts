import test from 'node:test';
import assert from 'node:assert/strict';
import { filterTaskList } from './taskListFilters';
import type { Goal, Project, Task } from '../types';

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 'one', title: 'Boodschappen doen', description: 'Voor het avondeten',
  realm: 'personal', category: 'household', priority: 'medium',
  dueDate: '2026-11-20', estimatedDuration: 30, recurring: 'none',
  status: 'todo', subtasks: [{ id: 's1', title: 'Olijfolie kopen', completed: false }],
  createdAt: '2026-11-20', ...overrides,
});
const defaults = { activeWorld: 'all' as const, status: 'all' as const, priority: 'all' as const };

test('task search matches title, description, notes, category, date and subtasks', () => {
  const item = task({ notes: 'Niet vergeten de lijst mee te nemen' });
  for (const query of ['boodschappen', 'avondeten', 'lijst mee', 'household', '2026-11-20', 'olijfolie']) {
    assert.deepEqual(filterTaskList([item], { ...defaults, query }).map((entry) => entry.id), ['one']);
  }
});

test('task filters combine workspace, completion status and priority', () => {
  const items = [
    task({ id: 'private', priority: 'high' }),
    task({ id: 'mariluna', realm: 'mariluna', priority: 'high' }),
    task({ id: 'done', status: 'completed', priority: 'high' }),
    task({ id: 'low', priority: 'low' }),
  ];
  assert.deepEqual(filterTaskList(items, { ...defaults, activeWorld: 'personal', status: 'active', priority: 'high' }).map(x => x.id), ['private']);
  assert.deepEqual(filterTaskList(items, { ...defaults, status: 'completed' }).map(x => x.id), ['done']);
});

test('task search also matches linked project and goal names', () => {
  const item = task({ projectId: 'p1', goalId: 'g1' });
  const projects = [{ id: 'p1', title: 'Mariluna website' } as Project];
  const goals = [{ id: 'g1', title: 'Meer rust en ruimte' } as Goal];
  assert.deepEqual(filterTaskList([item], { ...defaults, query: 'website', projects }).map((x) => x.id), ['one']);
  assert.deepEqual(filterTaskList([item], { ...defaults, query: 'rust en ruimte', goals }).map((x) => x.id), ['one']);
});

test('task search trims whitespace and ignores case', () => {
  const items = [task({ id: 'a', title: 'Lucy uitlaten' }), task({ id: 'b', title: 'Lucy eten geven' })];
  assert.deepEqual(filterTaskList(items, { ...defaults, query: '  LUCY  ' }).map(x => x.id), ['b', 'a']);
  assert.deepEqual(filterTaskList(items, { ...defaults, query: '   ' }).map(x => x.id), ['b', 'a']);
});

test('active tasks sort by deadline then priority, with completed tasks last', () => {
  const items = [
    task({ id: 'completed', status: 'completed', dueDate: '2026-11-20' }),
    task({ id: 'later', dueDate: '2026-11-22', priority: 'high' }),
    task({ id: 'low', dueDate: '2026-11-20', priority: 'low' }),
    task({ id: 'high', dueDate: '2026-11-20', priority: 'high' }),
    task({ id: 'invalid', dueDate: '2026-02-30', priority: 'high' }),
  ];
  assert.deepEqual(filterTaskList(items, defaults).map((x) => x.id), ['high', 'low', 'later', 'invalid', 'completed']);
});
