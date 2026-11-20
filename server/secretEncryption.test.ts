import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { decryptSecret, encryptSecret } from './secretEncryption';

const ownerId = 'd4f1c1a2-1234-4a5b-9c8d-1234567890ab';
const otherOwnerId = 'a4f1c1a2-1234-4a5b-9c8d-1234567890ab';
const env = {
  APP_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
  APP_ENCRYPTION_KEY_VERSION: 'test-v1',
};

test('AES-256-GCM secret envelope round-trips and binds ciphertext to owner and purpose', () => {
  const envelope = encryptSecret('totp-seed-value', ownerId, 'totp_secret', env);
  assert.equal(envelope.version, 1);
  assert.equal(envelope.key_version, 'test-v1');
  assert.equal(decryptSecret(envelope, ownerId, 'totp_secret', env), 'totp-seed-value');
  assert.throws(() => decryptSecret(envelope, otherOwnerId, 'totp_secret', env), /authentication failed/);
  assert.throws(() => decryptSecret(envelope, ownerId, 'integration_access_token', env), /authentication failed/);
});

test('secret encryption uses a fresh nonce for each envelope', () => {
  const first = encryptSecret('same-secret', ownerId, 'totp_secret', env);
  const second = encryptSecret('same-secret', ownerId, 'totp_secret', env);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
});

test('secret encryption fails closed for missing, malformed or rotated keys', () => {
  assert.throws(() => encryptSecret('secret', ownerId, 'totp_secret', {}), /APP_ENCRYPTION_KEY is required/);
  assert.throws(() => encryptSecret('secret', ownerId, 'totp_secret', { APP_ENCRYPTION_KEY: 'short' }), /32-byte key/);
  const envelope = encryptSecret('secret', ownerId, 'totp_secret', env);
  assert.throws(() => decryptSecret(envelope, ownerId, 'totp_secret', {
    APP_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    APP_ENCRYPTION_KEY_VERSION: 'test-v2',
  }), /unavailable key version/);
});

test('secret envelope rejects tampering and malformed owner or purpose inputs', () => {
  const envelope = encryptSecret('secret', ownerId, 'totp_secret', env);
  assert.throws(() => decryptSecret({ ...envelope, ciphertext: Buffer.from('tampered').toString('base64') }, ownerId, 'totp_secret', env), /authentication failed|invalid binary fields/);
  assert.throws(() => encryptSecret('secret', 'not-an-owner', 'totp_secret', env), /owner UUID/);
  assert.throws(() => encryptSecret('secret', ownerId, 'unsupported' as any, env), /Unsupported secret purpose/);
  assert.throws(() => encryptSecret('', ownerId, 'totp_secret', env), /between 1 byte and 16 KB/);
});
