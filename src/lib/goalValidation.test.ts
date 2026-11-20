import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGoalInput } from './goalValidation';

const valid = {
  title: 'Meer ruimte voor creativiteit',
  description: 'Elke week tijd vrijmaken voor eigen projecten',
  targetDate: '2026-12-20',
  milestones: [{ title: 'Weekplanning maken' }, { title: 'Eerste creatief blok plannen' }],
};

test('accepts a valid goal with milestones', () => {
  assert.equal(validateGoalInput(valid), null);
});

test('requires a title and limits title and description', () => {
  assert.equal(validateGoalInput({ ...valid, title: ' ' }), 'title_required');
  assert.equal(validateGoalInput({ ...valid, title: 'x'.repeat(161) }), 'title_too_long');
  assert.equal(validateGoalInput({ ...valid, description: 'x'.repeat(5001) }), 'description_too_long');
});

test('allows an optional target date but rejects impossible dates', () => {
  assert.equal(validateGoalInput({ ...valid, targetDate: '' }), null);
  assert.equal(validateGoalInput({ ...valid, targetDate: '2026-02-31' }), 'invalid_target_date');
});

test('bounds milestone count and validates each milestone title', () => {
  assert.equal(validateGoalInput({ ...valid, milestones: Array(51).fill({ title: 'Stap' }) }), 'too_many_milestones');
  assert.equal(validateGoalInput({ ...valid, milestones: [{ title: '  ' }] }), 'milestone_title_invalid');
  assert.equal(validateGoalInput({ ...valid, milestones: [{ title: 'x'.repeat(161) }] }), 'milestone_title_invalid');
});
