import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGoalBreakdown } from './goalBreakdownValidation';

const valid = [
  { title: 'Doel helder formuleren', durationMins: 20, suggestedDay: 'Morgen' },
  { title: 'Eerste concrete stap uitvoeren', durationMins: 45, suggestedDay: 'Deze week' },
  { title: 'Resultaat evalueren', durationMins: 15, suggestedDay: 'Volgende week' },
];

test('accepts three to five valid model-generated milestones and trims text', () => {
  const result = validateGoalBreakdown(valid);
  assert.equal(result?.length, 3);
  assert.equal(result?.[0].title, 'Doel helder formuleren');
  assert.equal(result?.[0].durationMins, 20);
});

test('accepts a wrapped milestones response and supplies a neutral missing day label', () => {
  const result = validateGoalBreakdown({ milestones: valid.map(({ title, durationMins }) => ({ title, durationMins })) });
  assert.equal(result?.[0].suggestedDay, 'Binnenkort');
});

test('rejects empty, too short, too long and malformed model output', () => {
  assert.equal(validateGoalBreakdown(null), null);
  assert.equal(validateGoalBreakdown([]), null);
  assert.equal(validateGoalBreakdown(valid.slice(0, 2)), null);
  assert.equal(validateGoalBreakdown([...valid, ...valid]), null);
  assert.equal(validateGoalBreakdown([valid[0], null, valid[2]]), null);
});

test('rejects unsafe field lengths and invalid durations', () => {
  assert.equal(validateGoalBreakdown(valid.map((item, i) => i ? item : { ...item, title: 'x'.repeat(161) })), null);
  assert.equal(validateGoalBreakdown(valid.map((item, i) => i ? item : { ...item, durationMins: 2 })), null);
  assert.equal(validateGoalBreakdown(valid.map((item, i) => i ? item : { ...item, durationMins: 241 })), null);
  assert.equal(validateGoalBreakdown(valid.map((item, i) => i ? item : { ...item, durationMins: Number.NaN })), null);
  assert.equal(validateGoalBreakdown(valid.map((item, i) => i ? item : { ...item, suggestedDay: 'x'.repeat(81) })), null);
});
