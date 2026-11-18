import type { AppState } from './storage';

export interface AlchemySnapshot {
  id: string;
  owner_id: string;
  schema_version: number;
  revision: number;
  payload: Record<string, unknown>;
  payload_sha256: string;
  source: 'migration' | 'autosave' | 'manual_backup' | 'restore';
  created_at: string;
}

export type PersistenceFetch = typeof fetch;
export type SnapshotSource = AlchemySnapshot['source'];

const REQUIRED_ARRAYS = ['tasks', 'goals', 'ideas', 'projects', 'calendarEvents', 'memories', 'dailyCheckIns', 'notifications', 'proactiveSuggestions', 'chatHistory'] as const;
const REQUIRED_OBJECTS = ['lifeProfile', 'contentPlan', 'personalStyle', 'nutrition', 'cycleProfile', 'wellbeing', 'notificationSettings', 'foundation', 'integrations'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCompleteAlchemyPayload(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  if (!REQUIRED_ARRAYS.every((key) => Array.isArray(value[key]))) return false;
  if (!REQUIRED_OBJECTS.every((key) => isRecord(value[key]))) return false;
  if (typeof value.isSampleData !== 'boolean') return false;
  if (!['not_started', 'in_progress', 'skipped', 'completed'].includes(String(value.setupStatus))) return false;
  const foundation = value.foundation as Record<string, unknown>;
  const integrations = value.integrations as Record<string, unknown>;
  return isRecord(foundation.aboutYou) && isRecord(integrations.calendar) && isRecord(integrations.gmail);
}

function isValidSnapshot(value: unknown): value is AlchemySnapshot {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.owner_id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.owner_id) &&
    Number.isInteger(value.revision) && Number(value.revision) > 0 &&
    Number.isInteger(value.schema_version) && Number(value.schema_version) > 0 &&
    isCompleteAlchemyPayload(value.payload) &&
    typeof value.payload_sha256 === 'string' && /^[a-f0-9]{64}$/i.test(value.payload_sha256) &&
    ['migration', 'autosave', 'manual_backup', 'restore'].includes(String(value.source)) &&
    typeof value.created_at === 'string' && Number.isFinite(Date.parse(value.created_at));
}

function requireAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (!token || token.length > 8192 || /\s/.test(token)) {
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
  source: SnapshotSource = 'migration',
): Promise<AlchemySnapshot> {
  const token = requireAccessToken(accessToken);
  if (!isCompleteAlchemyPayload(state)) {
    throw new Error('De lokale Alchemy-gegevens zijn onvolledig en zijn niet verzonden.');
  }
  const response = await fetcher('/api/persistence/snapshot', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: state,
      schemaVersion: 1,
      source,
    }),
  });
  const result = await readResponse<{ snapshot?: AlchemySnapshot }>(response);
  if (!isValidSnapshot(result.snapshot) || result.snapshot.schema_version !== 1 ||
      result.snapshot.source !== source) {
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
  if (!isValidSnapshot(result.snapshot)) {
    throw new Error('De opgeslagen Alchemy-back-up is ongeldig of onvolledig.');
  }
  return result.snapshot;
}
