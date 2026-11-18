import { createHash } from 'node:crypto';

export interface SupabaseServerConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

export interface VerifiedSupabaseOwner {
  id: string;
  email?: string;
}

export interface SnapshotRecord {
  id: string;
  owner_id: string;
  schema_version: number;
  revision: number;
  payload: Record<string, unknown>;
  payload_sha256: string | null;
  source: string;
  created_at: string;
}

export type FetchLike = typeof fetch;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(',')}}`;
}

export function readSupabaseServerConfig(
  env: Record<string, string | undefined> = process.env,
): SupabaseServerConfig | null {
  const url = env.SUPABASE_URL?.trim();
  const anonKey = env.SUPABASE_ANON_KEY?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceRoleKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('SUPABASE_URL must be a valid absolute URL.');
  }
  const isLocalHttp = parsed.protocol === 'http:' &&
    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  if (parsed.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('SUPABASE_URL must use HTTPS outside local development.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('SUPABASE_URL must not contain credentials, query parameters or a fragment.');
  }

  return { url: parsed.toString().replace(/\/$/, ''), anonKey, serviceRoleKey };
}

export class SupabasePersistence {
  constructor(
    private readonly config: SupabaseServerConfig,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await this.fetcher(`${this.config.url}${path}`, init);
    const body = await response.text();
    if (!response.ok) {
      throw new Error(`Supabase request failed (${response.status}): ${body.slice(0, 300)}`);
    }
    return (body ? JSON.parse(body) : null) as T;
  }

  async verifyOwner(accessToken: string): Promise<VerifiedSupabaseOwner> {
    if (!accessToken || accessToken.length > 8192) {
      throw new Error('A valid Supabase access token is required.');
    }
    const owner = await this.request<VerifiedSupabaseOwner>('/auth/v1/user', {
      method: 'GET',
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!owner || typeof owner.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(owner.id)) {
      throw new Error('Supabase did not return a valid authenticated owner.');
    }
    return owner;
  }

  async saveSnapshot(
    accessToken: string,
    payload: Record<string, unknown>,
    schemaVersion = 1,
    source: 'migration' | 'autosave' | 'manual_backup' | 'restore' = 'autosave',
  ): Promise<SnapshotRecord> {
    if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
      throw new Error('schemaVersion must be a positive integer.');
    }
    const owner = await this.verifyOwner(accessToken);
    const payloadSha256 = createHash('sha256').update(stableJson(payload)).digest('hex');
    // Revision allocation and insertion happen in one database transaction. This
    // avoids duplicate revisions when autosaves from multiple tabs race.
    const rows = await this.request<SnapshotRecord[]>('/rest/v1/rpc/save_app_state_snapshot', {
      method: 'POST',
      headers: {
        ...this.serviceHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_owner_id: owner.id,
        p_schema_version: schemaVersion,
        p_payload: payload,
        p_payload_sha256: payloadSha256,
        p_source: source,
      }),
    });
    if (!rows[0]) throw new Error('Supabase did not return the saved snapshot.');
    return rows[0];
  }

  async loadLatestSnapshot(accessToken: string): Promise<SnapshotRecord | null> {
    const owner = await this.verifyOwner(accessToken);
    const rows = await this.request<SnapshotRecord[]>(
      `/rest/v1/app_state_snapshots?owner_id=eq.${owner.id}&select=id,owner_id,schema_version,revision,payload,payload_sha256,source,created_at&order=revision.desc&limit=1`,
      {
        method: 'GET',
        headers: this.serviceHeaders(),
      },
    );
    const snapshot = rows[0] ?? null;
    if (!snapshot) return null;
    const actualHash = createHash('sha256').update(stableJson(snapshot.payload)).digest('hex');
    if (snapshot.payload_sha256 && actualHash !== snapshot.payload_sha256) {
      throw new Error('Stored Alchemy snapshot integrity check failed.');
    }
    return snapshot;
  }

  private serviceHeaders(): HeadersInit {
    return {
      apikey: this.config.serviceRoleKey,
      Authorization: `Bearer ${this.config.serviceRoleKey}`,
    };
  }
}

export function createSupabasePersistence(
  env: Record<string, string | undefined> = process.env,
  fetcher: FetchLike = fetch,
): SupabasePersistence | null {
  const config = readSupabaseServerConfig(env);
  return config ? new SupabasePersistence(config, fetcher) : null;
}
