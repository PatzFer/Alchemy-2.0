import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const OWNER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SecretPurpose =
  | 'totp_secret'
  | 'integration_access_token'
  | 'integration_refresh_token';

export interface EncryptedSecret {
  version: 1;
  key_version: string;
  iv: string;
  ciphertext: string;
  auth_tag: string;
}

export type EncryptionEnvironment = Record<string, string | undefined>;

function readKey(env: EncryptionEnvironment): { key: Buffer; version: string } {
  const encoded = env.APP_ENCRYPTION_KEY?.trim();
  if (!encoded) throw new Error('APP_ENCRYPTION_KEY is required for secret encryption.');

  let key: Buffer;
  try {
    key = Buffer.from(encoded, 'base64');
  } catch {
    throw new Error('APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }
  if (key.length !== 32 || key.toString('base64').replace(/=+$/, '') !== encoded.replace(/=+$/, '')) {
    throw new Error('APP_ENCRYPTION_KEY must be a base64-encoded 32-byte key.');
  }

  const version = env.APP_ENCRYPTION_KEY_VERSION?.trim() || 'v1';
  if (!/^[a-zA-Z0-9._-]{1,32}$/.test(version)) {
    throw new Error('APP_ENCRYPTION_KEY_VERSION must be 1–32 safe identifier characters.');
  }
  return { key, version };
}

function buildAad(ownerId: string, purpose: SecretPurpose): Buffer {
  if (!OWNER_ID_PATTERN.test(ownerId)) throw new Error('A valid owner UUID is required.');
  if (!['totp_secret', 'integration_access_token', 'integration_refresh_token'].includes(purpose)) {
    throw new Error('Unsupported secret purpose.');
  }
  return Buffer.from(`alchemy-secret:v1:${ownerId.toLowerCase()}:${purpose}`, 'utf8');
}

/** Encrypts a secret with AES-256-GCM. The key must remain outside the database. */
export function encryptSecret(
  plaintext: string,
  ownerId: string,
  purpose: SecretPurpose,
  env: EncryptionEnvironment = process.env,
): EncryptedSecret {
  if (typeof plaintext !== 'string' || plaintext.length === 0 || Buffer.byteLength(plaintext, 'utf8') > 16_384) {
    throw new Error('Secret must contain between 1 byte and 16 KB.');
  }
  const { key, version } = readKey(env);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const aad = buildAad(ownerId, purpose);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    version: 1,
    key_version: version,
    iv: iv.toString('base64'),
    ciphertext: ciphertext.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
  };
}

/** Decrypts only for the same owner and purpose used during encryption. */
export function decryptSecret(
  envelope: EncryptedSecret,
  ownerId: string,
  purpose: SecretPurpose,
  env: EncryptionEnvironment = process.env,
): string {
  const { key, version } = readKey(env);
  if (!envelope || envelope.version !== 1 || envelope.key_version !== version ||
      typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string' ||
      typeof envelope.auth_tag !== 'string') {
    throw new Error('Encrypted secret envelope is invalid or uses an unavailable key version.');
  }

  const iv = Buffer.from(envelope.iv, 'base64');
  const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
  const authTag = Buffer.from(envelope.auth_tag, 'base64');
  if (iv.length !== IV_BYTES || authTag.length !== TAG_BYTES ||
      ciphertext.length === 0 || ciphertext.length > 16_384) {
    throw new Error('Encrypted secret envelope has invalid binary fields.');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAAD(buildAad(ownerId, purpose));
  decipher.setAuthTag(authTag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new Error('Encrypted secret authentication failed.');
  }
}
