import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTaskInput } from './taskValidation';

const valid = {
  title: 'Plan weekmenu',
  description: 'Menu en boodschappen voorbereiden',
  dueDate: '2026-11-20',
  estimatedDuration: 30,
  subtasks: [{ title: 'Recepten kiezen' }, { title: 'Boodschappenlijst maken' }],
};

test('accepts a valid task and its subtasks', () => {
  assert.equal(validateTaskInput(valid), null);
});

test('requires a trimmed title and limits title and description size', () => {
  assert.equal(validateTaskInput({ ...valid, title: '  ' }), 'title_required');
  assert.equal(validateTaskInput({ ...valid, title: 'x'.repeat(161) }), 'title_too_long');
  assert.equal(validateTaskInput({ ...valid, description: 'x'.repeat(5001) }), 'description_too_long');
});

test('rejects impossible due dates and out-of-range durations', () => {
  assert.equal(validateTaskInput({ ...valid, dueDate: '2026-02-31' }), 'invalid_due_date');
  assert.equal(validateTaskInput({ ...valid, estimatedDuration: 4 }), 'invalid_duration');
  assert.equal(validateTaskInput({ ...valid, estimatedDuration: 1441 }), 'invalid_duration');
  assert.equal(validateTaskInput({ ...valid, estimatedDuration: Number.NaN }), 'invalid_duration');
});

test('limits subtasks and requires each subtask to have a short title', () => {
  assert.equal(validateTaskInput({ ...valid, subtasks: Array(31).fill({ title: 'Subtaak' }) }), 'too_many_subtasks');
  assert.equal(validateTaskInput({ ...valid, subtasks: [{ title: '  ' }] }), 'subtask_title_invalid');
  assert.equal(validateTaskInput({ ...valid, subtasks: [{ title: 'x'.repeat(161) }] }), 'subtask_title_invalid');
});
