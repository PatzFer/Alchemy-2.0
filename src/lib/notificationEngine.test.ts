import test from 'node:test';
import assert from 'node:assert/strict';
import { getNotificationLocalDateKey, getNotificationTimestampLocalDateKey } from './notificationEngine';

test('notification date keys use the device local calendar date', () => {
  const localDate = new Date(2026, 10, 19, 0, 15, 0);
  assert.equal(getNotificationLocalDateKey(localDate), '2026-11-19');
});

test('notification timestamp date keys convert instants to local calendar dates', () => {
  const localDate = new Date(2026, 10, 19, 0, 15, 0);
  assert.equal(getNotificationTimestampLocalDateKey(localDate.toISOString()), '2026-11-19');
});

test('invalid notification timestamps are ignored safely', () => {
  assert.equal(getNotificationTimestampLocalDateKey('not-a-date'), null);
});
