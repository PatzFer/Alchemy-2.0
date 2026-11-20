import test from 'node:test';
import assert from 'node:assert/strict';
import { isIdeaDueForReview } from './ideaReview';

const today = new Date(2026, 10, 20, 12, 0);

test('idea review age uses local calendar days at the exact threshold', () => {
  assert.equal(isIdeaDueForReview('2026-10-31', '2026-11-01', today, 21), false);
  assert.equal(isIdeaDueForReview('2026-10-30', '2026-11-01', today, 21), false);
  assert.equal(isIdeaDueForReview('2026-10-30', '2026-11-01', today, 21), true);
});

test('last revisited date takes precedence over creation date', () => {
  assert.equal(isIdeaDueForReview('2026-11-10', '2026-09-01', today, 21), false);
  assert.equal(isIdeaDueForReview(undefined, '2026-10-01', today, 21), true);
});

test('future and malformed dates are not flagged for review', () => {
  assert.equal(isIdeaDueForReview('2026-11-21', '2026-01-01', today, 21), false);
  assert.equal(isIdeaDueForReview('not-a-date', 'also-invalid', today, 21), false);
  assert.equal(isIdeaDueForReview('2026-02-30', '2026-01-01', today, 21), false);
});

test('invalid review thresholds are rejected', () => {
  assert.equal(isIdeaDueForReview('2026-10-01', '2026-10-01', today, 0), false);
  assert.equal(isIdeaDueForReview('2026-10-01', '2026-10-01', today, 1.5), false);
});
