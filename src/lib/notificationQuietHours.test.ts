import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_NOTIFICATION_SETTINGS, evaluateSmartNotifications, isWithinQuietHours, shouldDispatchBrowserPush } from './notificationEngine';

test('overnight quiet hours include the start and exclude the end boundary', () => {
  assert.equal(isWithinQuietHours(21 * 60, '21:00', '08:30'), true);
  assert.equal(isWithinQuietHours(23 * 60 + 59, '21:00', '08:30'), true);
  assert.equal(isWithinQuietHours(8 * 60 + 29, '21:00', '08:30'), true);
  assert.equal(isWithinQuietHours(8 * 60 + 30, '21:00', '08:30'), false);
  assert.equal(isWithinQuietHours(12 * 60, '21:00', '08:30'), false);
});

test('same-day quiet hours are handled correctly', () => {
  assert.equal(isWithinQuietHours(12 * 60, '12:00', '13:00'), true);
  assert.equal(isWithinQuietHours(12 * 60 + 59, '12:00', '13:00'), true);
  assert.equal(isWithinQuietHours(13 * 60, '12:00', '13:00'), false);
  assert.equal(isWithinQuietHours(11 * 60 + 59, '12:00', '13:00'), false);
});

test('equal or malformed quiet-hour endpoints never silence the entire day', () => {
  assert.equal(isWithinQuietHours(500, '08:00', '08:00'), false);
  assert.equal(isWithinQuietHours(500, '25:00', '08:00'), false);
  assert.equal(isWithinQuietHours(500, '08:00', '8:00'), false);
  assert.equal(isWithinQuietHours(500, 'nope', '08:00'), false);
});

test('invalid minute values are rejected', () => {
  assert.equal(isWithinQuietHours(-1, '21:00', '08:00'), false);
  assert.equal(isWithinQuietHours(1440, '21:00', '08:00'), false);
  assert.equal(isWithinQuietHours(1.5, '21:00', '08:00'), false);
});

test('a daily notification limit of zero is respected instead of defaulting to three', () => {
  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, maxDailyFrequency: 0 };
  const existing = [];
  assert.deepEqual(evaluateSmartNotifications({ settings, existingNotifications: existing }), existing);
});

test('negative daily notification limits are safely treated as zero', () => {
  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, maxDailyFrequency: -4 };
  const existing = [];
  assert.deepEqual(evaluateSmartNotifications({ settings, existingNotifications: existing }), existing);
});

test('push dispatch requires enabled settings and enabled integration', () => {
  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, quietHoursStart: '21:00', quietHoursEnd: '08:00' };
  const midday = new Date(2026, 10, 20, 12, 0);
  assert.equal(shouldDispatchBrowserPush(settings, true, midday), true);
  assert.equal(shouldDispatchBrowserPush(settings, false, midday), false);
  assert.equal(shouldDispatchBrowserPush({ ...settings, enabled: false }, true, midday), false);
});

test('push dispatch is suppressed during configured quiet hours', () => {
  const settings = { ...DEFAULT_NOTIFICATION_SETTINGS, quietHoursStart: '21:00', quietHoursEnd: '08:30' };
  assert.equal(shouldDispatchBrowserPush(settings, true, new Date(2026, 10, 20, 22, 0)), false);
  assert.equal(shouldDispatchBrowserPush(settings, true, new Date(2026, 10, 20, 7, 45)), false);
  assert.equal(shouldDispatchBrowserPush(settings, true, new Date(2026, 10, 20, 8, 30)), true);
});
