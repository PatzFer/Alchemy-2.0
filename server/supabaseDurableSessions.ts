import { createHash } from 'node:crypto';
import type { SupabaseServerConfig, FetchLike } from './supabasePersistence';

export type DurableAuthMethod = 'passkey' | 'totp' | 'recovery_code' | 'password';

export interface DurableSessionRecord {
  id: string;
  owner_id: string;
  session_hash: string;
  authenticated_with: DurableAuthMethod;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  step_up_expires_at: string | null;
  sensitive_unlocked_until: string | null;
  revoked_at: string | null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

export function hashSessionToken(token: string): string {
  if (typeof token !== 'string' || !COOKIE_TOKEN_PATTERN.test(token)) {
    throw new Error('A 256-bit opaque session token is required.');
  }
  return createHash('sha256').update(token.toLowerCase(), 'utf8').digest('hex');
}

function isAuthMethod(value: unknown): value is DurableAuthMethod {
  return value === 'passkey' || value === 'totp' || value === 'recovery_code' || value === 'password';
}

function isSessionRecord(value: unknown): value is DurableSessionRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && UUID_PATTERN.test(row.id) &&
    typeof row.owner_id === 'string' && UUID_PATTERN.test(row.owner_id) &&
    typeof row.session_hash === 'string' && /^[a-f0-9]{64}$/.test(row.session_hash) &&
    isAuthMethod(row.authenticated_with) &&
    typeof row.created_at === 'string' && Number.isFinite(Date.parse(row.created_at)) &&
    typeof row.last_activity_at === 'string' && Number.isFinite(Date.parse(row.last_activity_at)) &&
    typeof row.expires_at === 'string' && Number.isFinite(Date.parse(row.expires_at)) &&
    (row.step_up_expires_at === null || typeof row.step_up_expires_at === 'string') &&
    (row.sensitive_unlocked_until === null || typeof row.sensitive_unlocked_until === 'string') &&
    (row.revoked_at === null || typeof row.revoked_at === 'string');
}

/**
 * Server-only persistence adapter for application sessions.
 * It stores only a hash of the browser's opaque cookie token.
 * Callers must pass an owner ID obtained from a verified Supabase Auth identity.
 */
export class SupabaseDurableSessionStore {
  constructor(
    private readonly config: SupabaseServerConfig,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async create(
    verifiedOwnerId: string,
    cookieToken: string,
    authenticatedWith: DurableAuthMethod,
    expiresAt: Date,
  ): Promise<DurableSessionRecord> {
    if (!UUID_PATTERN.test(verifiedOwnerId)) throw new Error('A verified Supabase owner UUID is required.');
    if (!isAuthMethod(authenticatedWith)) throw new Error('Unsupported durable authentication method.');
    if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
      throw new Error('Session expiry must be a future date.');
    }

    const response = await this.fetcher(`${this.config.url}/rest/v1/security_sessions`, {
      method: 'POST',
      headers: {
        ...this.serviceHeaders(),
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        owner_id: verifiedOwnerId,
        session_hash: hashSessionToken(cookieToken),
        authenticated_with: authenticatedWith,
        expires_at: expiresAt.toISOString(),
      }),
    });
    const rows = await this.readRows(response);
    if (!rows[0] || !isSessionRecord(rows[0]) || rows[0].owner_id !== verifiedOwnerId ||
        rows[0].session_hash !== hashSessionToken(cookieToken)) {
      throw new Error('Supabase did not return a valid owner-bound session.');
    }
    return rows[0];
  }

  async findActive(cookieToken: string, now = new Date()): Promise<DurableSessionRecord | null> {
    const hash = hashSessionToken(cookieToken);
    const query = new URLSearchParams({
      select: 'id,owner_id,session_hash,authenticated_with,created_at,last_activity_at,expires_at,step_up_expires_at,sensitive_unlocked_until,revoked_at',
      session_hash: `eq.${hash}`,
      revoked_at: 'is.null',
      expires_at: `gt.${now.toISOString()}`,
      limit: '1',
    });
    const response = await this.fetcher(`${this.config.url}/rest/v1/security_sessions?${query.toString()}`, {
      method: 'GET',
      headers: this.serviceHeaders(),
    });
    const rows = await this.readRows(response);
    if (!rows.length) return null;
    if (!isSessionRecord(rows[0]) || rows[0].session_hash !== hash || rows[0].revoked_at !== null ||
        Date.parse(rows[0].expires_at) <= now.getTime()) {
      throw new Error('Supabase returned an invalid or inactive durable session.');
    }
    return rows[0];
  }

  async touch(cookieToken: string, now = new Date()): Promise<boolean> {
    const hash = hashSessionToken(cookieToken);
    const query = new URLSearchParams({
      session_hash: `eq.${hash}`,
      revoked_at: 'is.null',
      expires_at: `gt.${now.toISOString()}`,
    });
    const response = await this.fetcher(`${this.config.url}/rest/v1/security_sessions?${query.toString()}`, {
      method: 'PATCH',
      headers: { ...this.serviceHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ last_activity_at: now.toISOString() }),
    });
    const rows = await this.readRows(response);
    return rows.length === 1 && isSessionRecord(rows[0]) && rows[0].session_hash === hash;
  }

  async revoke(cookieToken: string, now = new Date()): Promise<boolean> {
    const hash = hashSessionToken(cookieToken);
    const query = new URLSearchParams({
      session_hash: `eq.${hash}`,
      revoked_at: 'is.null',
    });
    const response = await this.fetcher(`${this.config.url}/rest/v1/security_sessions?${query.toString()}`, {
      method: 'PATCH',
      headers: { ...this.serviceHeaders(), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ revoked_at: now.toISOString(), step_up_expires_at: null, sensitive_unlocked_until: null }),
    });
    const rows = await this.readRows(response);
    return rows.length === 1 && isSessionRecord(rows[0]) && rows[0].revoked_at !== null;
  }

  private async readRows(response: Response): Promise<unknown[]> {
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase durable session request failed (${response.status}).`);
    }
    const parsed: unknown = body ? JSON.parse(body) : [];
    if (!Array.isArray(parsed)) throw new Error('Supabase returned an invalid durable session response.');
    return parsed;
  }

  private serviceHeaders(): HeadersInit {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
    };
  }
}
