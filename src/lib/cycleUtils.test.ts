import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCycleStatus, hasValidCycleAnchor } from './cycleUtils';
import type { CycleProfile } from '../types';

const profile = (overridePhase?: CycleProfile['overridePhase']): CycleProfile => ({
  lastPeriodStartDate: '2026-11-01',
  averageCycleLength: 28,
  averagePeriodLength: 5,
  history: [{ id: 'period-1', startDate: '2026-11-01', confirmedByUser: true }],
  trackingEnabled: true,
  privacyLocked: true,
  lastUpdated: '2026-11-01',
  overridePhase,
});

test('a logged period date anchors an estimate but does not claim the current phase is user-confirmed', () => {
  const status = calculateCycleStatus(profile(), '2026-11-19');
  assert.equal(status.cycleDay, 19);
  assert.equal(status.phaseConfidence, 'Estimated Model');
});

test('only an explicit phase override is labeled user-confirmed', () => {
  const status = calculateCycleStatus(profile('luteal'), '2026-11-19');
  assert.equal(status.activePhase, 'luteal');
  assert.equal(status.isOverridden, true);
  assert.equal(status.phaseConfidence, 'User-Confirmed');
});


test('cycle tracking requires a real, non-future period start date', () => {
  assert.equal(hasValidCycleAnchor(profile(), '2026-11-19'), true);
  assert.equal(hasValidCycleAnchor({ ...profile(), lastPeriodStartDate: '' }, '2026-11-19'), false);
  assert.equal(hasValidCycleAnchor({ ...profile(), lastPeriodStartDate: 'not-a-date' }, '2026-11-19'), false);
  assert.equal(hasValidCycleAnchor({ ...profile(), lastPeriodStartDate: '2026-11-20' }, '2026-11-19'), false);
});
