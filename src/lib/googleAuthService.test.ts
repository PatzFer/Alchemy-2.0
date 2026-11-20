import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCachedAccessToken,
  revokeGoogleAccessToken,
  setCachedAccessToken,
} from './googleAuthService';

test('Google token cache returns a token only while safely before expiry', () => {
  const originalNow = Date.now;
  let now = 1_000_000;
  Date.now = () => now;
  try {
    setCachedAccessToken('calendar', 'short-lived-token', 300);
    assert.equal(getCachedAccessToken('calendar'), 'short-lived-token');
    now += 240_000;
    // The cache expires one minute before the provider expiry.
    assert.equal(getCachedAccessToken('calendar'), null);
    assert.equal(getCachedAccessToken('calendar'), null);
  } finally {
    Date.now = originalNow;
    setCachedAccessToken('calendar', null);
  }
});

test('Google token cache clears tokens immediately when explicitly unset', () => {
  setCachedAccessToken('gmail', 'temporary-token');
  assert.equal(getCachedAccessToken('gmail'), 'temporary-token');
  setCachedAccessToken('gmail', null);
  assert.equal(getCachedAccessToken('gmail'), null);
});

test('Google token cache bounds invalid and excessive expiry values', () => {
  const originalNow = Date.now;
  let now = 2_000_000;
  Date.now = () => now;
  try {
    setCachedAccessToken('calendar', 'bounded-token', Number.POSITIVE_INFINITY);
    now += 3_400_000;
    assert.equal(getCachedAccessToken('calendar'), null);
  } finally {
    Date.now = originalNow;
    setCachedAccessToken('calendar', null);
  }
});

test('Google disconnect clears the local token even without a browser runtime', async () => {
  setCachedAccessToken('calendar', 'disconnect-token');
  await revokeGoogleAccessToken('calendar');
  assert.equal(getCachedAccessToken('calendar'), null);
});
