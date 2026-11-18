import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveWebAuthnRelyingParty } from './webauthnOrigin';

test('accepts an explicitly configured production origin and RP ID', () => {
  assert.deepEqual(
    resolveWebAuthnRelyingParty(
      { host: 'app.mariluna.be', origin: 'https://app.mariluna.be', protocol: 'https' },
      {
        NODE_ENV: 'production',
        WEBAUTHN_RP_ID: 'mariluna.be',
        WEBAUTHN_ALLOWED_ORIGINS: 'https://app.mariluna.be,https://www.mariluna.be',
      },
    ),
    { rpID: 'mariluna.be', origin: 'https://app.mariluna.be' },
  );
});

test('rejects an unlisted production origin even when its host looks valid', () => {
  assert.throws(
    () => resolveWebAuthnRelyingParty(
      { host: 'evil.mariluna.be', origin: 'https://evil.mariluna.be', protocol: 'https' },
      {
        NODE_ENV: 'production',
        WEBAUTHN_RP_ID: 'mariluna.be',
        WEBAUTHN_ALLOWED_ORIGINS: 'https://app.mariluna.be',
      },
    ),
    /not allowed/,
  );
});

test('production fails closed when explicit relying-party configuration is missing', () => {
  assert.throws(
    () => resolveWebAuthnRelyingParty(
      { host: 'app.mariluna.be', origin: 'https://app.mariluna.be', protocol: 'https' },
      { NODE_ENV: 'production' },
    ),
    /configuration is required/,
  );
});

test('rejects an origin containing a path, query or fragment', () => {
  for (const origin of [
    'https://app.mariluna.be/path',
    'https://app.mariluna.be?redirect=evil',
    'https://app.mariluna.be#fragment',
  ]) {
    assert.throws(
      () => resolveWebAuthnRelyingParty(
        { host: 'app.mariluna.be', origin, protocol: 'https' },
        {
          NODE_ENV: 'production',
          WEBAUTHN_RP_ID: 'mariluna.be',
          WEBAUTHN_ALLOWED_ORIGINS: 'https://app.mariluna.be',
        },
      ),
      /Invalid WebAuthn origin/,
    );
  }
});

test('rejects RP IDs that are not a suffix of the origin hostname', () => {
  assert.throws(
    () => resolveWebAuthnRelyingParty(
      { host: 'mariluna.be.attacker.test', origin: 'https://mariluna.be.attacker.test', protocol: 'https' },
      {
        NODE_ENV: 'production',
        WEBAUTHN_RP_ID: 'mariluna.be',
        WEBAUTHN_ALLOWED_ORIGINS: 'https://mariluna.be.attacker.test',
      },
    ),
    /does not match/,
  );
});

test('development permits loopback only when no explicit allowlist is set', () => {
  assert.deepEqual(
    resolveWebAuthnRelyingParty(
      { host: 'localhost:3000', protocol: 'http' },
      { NODE_ENV: 'development' },
    ),
    { rpID: 'localhost', origin: 'http://localhost:3000' },
  );
  assert.throws(
    () => resolveWebAuthnRelyingParty(
      { host: 'preview.example.test', origin: 'https://preview.example.test', protocol: 'https' },
      { NODE_ENV: 'development' },
    ),
    /not configured/,
  );
});

test('rejects a mismatch between the browser origin and request host', () => {
  assert.throws(
    () => resolveWebAuthnRelyingParty(
      { host: 'app.mariluna.be', origin: 'https://attacker.mariluna.be', protocol: 'https' },
      {
        NODE_ENV: 'production',
        WEBAUTHN_RP_ID: 'mariluna.be',
        WEBAUTHN_ALLOWED_ORIGINS: 'https://attacker.mariluna.be',
      },
    ),
    /does not match the request host/,
  );
});
