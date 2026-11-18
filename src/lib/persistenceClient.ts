import type { AppState } from './storage';

export interface AlchemySnapshot {
  id: string;
  owner_id: string;
  schema_version: number;
  revision: number;
  payload: Record<string, unknown>;
  payload_sha256: string | null;
  source: 'migration' | 'autosave' | 'manual_backup' | 'restore';
  created_at: string;
}

export type PersistenceFetch = typeof fetch;

function requireAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (!token || token.length > 8192) {
    throw new Error('Een geldige Alchemy-aanmeldsessie is vereist.');
  }
  return token;
}

async function readResponse<T>(response: Response): Promise<T> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('De opslagserver gaf een ongeldig antwoord.');
  }
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body &&
      typeof body.error === 'string'
      ? body.error
      : 'De Alchemy-opslagbewerking is mislukt.';
    throw new Error(message);
  }
  return body as T;
}

/**
 * Explicit server-mediated persistence adapter.
 * It is intentionally not wired to autosave until Supabase Auth and a staging
 * restore drill are configured. The browser never receives the service-role key.
 */
export async function saveAlchemySnapshot(
  accessToken: string,
  state: AppState,
  fetcher: PersistenceFetch = fetch,
): Promise<AlchemySnapshot> {
  const token = requireAccessToken(accessToken);
  const response = await fetcher('/api/persistence/snapshot', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: state,
      schemaVersion: 1,
      source: 'migration',
    }),
  });
  const result = await readResponse<{ snapshot?: AlchemySnapshot }>(response);
  if (!result.snapshot || !Number.isInteger(result.snapshot.revision) ||
      result.snapshot.revision < 1 || result.snapshot.schema_version !== 1) {
    throw new Error('De opslagserver heeft geen geldige Alchemy-back-up bevestigd.');
  }
  return result.snapshot;
}

export async function loadAlchemySnapshot(
  accessToken: string,
  fetcher: PersistenceFetch = fetch,
): Promise<AlchemySnapshot | null> {
  const token = requireAccessToken(accessToken);
  const response = await fetcher('/api/persistence/snapshot', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await readResponse<{ snapshot: AlchemySnapshot | null }>(response);
  if (result.snapshot === null) return null;
  if (!result.snapshot || !Number.isInteger(result.snapshot.revision) ||
      result.snapshot.revision < 1 || !Number.isInteger(result.snapshot.schema_version) ||
      result.snapshot.schema_version < 1 || !result.snapshot.payload ||
      typeof result.snapshot.payload !== 'object' || Array.isArray(result.snapshot.payload)) {
    throw new Error('De opgeslagen Alchemy-back-up is ongeldig of onvolledig.');
  }
  return result.snapshot;
}
