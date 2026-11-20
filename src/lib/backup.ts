import type { AppState } from './storage';
import { saveState } from './storage';

export const ALCHEMY_BACKUP_FORMAT = 'p-m-alchemy-backup';
export const ALCHEMY_BACKUP_VERSION = 1;
export const ALCHEMY_APP_SCHEMA_VERSION = 1;
export const MAX_ALCHEMY_BACKUP_BYTES = 15 * 1024 * 1024;

/** Keep untrusted backup imports bounded before reading them into browser memory. */
export function isBackupFileSizeAllowed(size: number): boolean {
  return Number.isSafeInteger(size) && size >= 0 && size <= MAX_ALCHEMY_BACKUP_BYTES;
}


export interface AlchemyBackupEnvelope {
  format: typeof ALCHEMY_BACKUP_FORMAT;
  backupVersion: typeof ALCHEMY_BACKUP_VERSION;
  appSchemaVersion: number;
  exportedAt: string;
  checksumAlgorithm: 'SHA-256';
  checksum: string;
  payload: AppState;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Deze browser ondersteunt geen veilige SHA-256-controle.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(digest);
}

function stablePayloadString(payload: AppState): string {
  // JSON serialization is deterministic for the same stored object and preserves
  // the exact state structure used by the current app.
  return JSON.stringify(payload);
}

export async function createAlchemyBackup(payload: AppState): Promise<AlchemyBackupEnvelope> {
  const serialized = stablePayloadString(payload);
  return {
    format: ALCHEMY_BACKUP_FORMAT,
    backupVersion: ALCHEMY_BACKUP_VERSION,
    appSchemaVersion: ALCHEMY_APP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    checksumAlgorithm: 'SHA-256',
    checksum: await sha256(serialized),
    payload,
  };
}

export async function verifyAlchemyBackup(input: unknown): Promise<AlchemyBackupEnvelope> {
  if (!input || typeof input !== 'object') {
    throw new Error('Het back-upbestand is geen geldig Alchemy-object.');
  }
  const candidate = input as Partial<AlchemyBackupEnvelope>;
  if (candidate.format !== ALCHEMY_BACKUP_FORMAT || candidate.backupVersion !== ALCHEMY_BACKUP_VERSION) {
    throw new Error('Dit is geen ondersteunde Alchemy-back-upversie.');
  }
  if (!candidate.payload || typeof candidate.payload !== 'object' || Array.isArray(candidate.payload)) {
    throw new Error('De back-up bevat geen geldige gegevensstructuur.');
  }
  if (candidate.checksumAlgorithm !== 'SHA-256' || typeof candidate.checksum !== 'string') {
    throw new Error('De integriteitscontrole ontbreekt of wordt niet ondersteund.');
  }
  if (!Number.isInteger(candidate.appSchemaVersion) || (candidate.appSchemaVersion ?? 0) < 1) {
    throw new Error('De appgegevensversie in deze back-up is ongeldig.');
  }
  if ((candidate.appSchemaVersion ?? 0) > ALCHEMY_APP_SCHEMA_VERSION) {
    throw new Error('Deze back-up is gemaakt met een nieuwere Alchemy-versie. Werk Alchemy bij voordat je deze herstelt.');
  }
  if (!/^[a-f0-9]{64}$/i.test(candidate.checksum)) {
    throw new Error('De integriteitscontrole in deze back-up heeft een ongeldig formaat.');
  }
  if (typeof candidate.exportedAt !== 'string' || Number.isNaN(Date.parse(candidate.exportedAt))) {
    throw new Error('De exportdatum in deze back-up is ongeldig.');
  }

  const payload = candidate.payload as AppState;
  const requiredArrays: (keyof AppState)[] = [
    'tasks', 'goals', 'ideas', 'projects', 'calendarEvents', 'memories',
    'dailyCheckIns', 'notifications', 'proactiveSuggestions', 'chatHistory',
  ];
  for (const key of requiredArrays) {
    if (!Array.isArray(payload[key])) {
      throw new Error(`De back-up is onvolledig: ${String(key)} ontbreekt of is ongeldig.`);
    }
  }

  const requiredObjects: (keyof AppState)[] = [
    'lifeProfile', 'contentPlan', 'personalStyle', 'nutrition', 'cycleProfile',
    'wellbeing', 'notificationSettings', 'foundation', 'integrations',
  ];
  for (const key of requiredObjects) {
    const value = payload[key];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`De back-up is onvolledig: ${String(key)} ontbreekt of is ongeldig.`);
    }
  }

  if (typeof payload.isSampleData !== 'boolean' ||
      !['not_started', 'in_progress', 'skipped', 'completed'].includes(payload.setupStatus)) {
    throw new Error('De algemene Alchemy-status in de back-up is ongeldig.');
  }
  const foundation = payload.foundation as AppState['foundation'];
  const integrations = payload.integrations as AppState['integrations'];
  if (!foundation.aboutYou || typeof foundation.aboutYou !== 'object' || Array.isArray(foundation.aboutYou) ||
      !integrations.calendar || typeof integrations.calendar !== 'object' || Array.isArray(integrations.calendar) ||
      !integrations.gmail || typeof integrations.gmail !== 'object' || Array.isArray(integrations.gmail)) {
    throw new Error('De basisgegevens of integraties van de back-up zijn onvolledig.');
  }

  const expected = await sha256(stablePayloadString(payload));
  if (expected !== candidate.checksum) {
    throw new Error('De integriteitscontrole is mislukt. De back-up is gewijzigd of beschadigd.');
  }

  return candidate as AlchemyBackupEnvelope;
}

export async function restoreAlchemyBackup(input: unknown): Promise<AppState> {
  const verified = await verifyAlchemyBackup(input);
  // This is an explicit restore operation. Callers must obtain user confirmation
  // before invoking it; no import happens merely by selecting or parsing a file.
  const saved = saveState(verified.payload);
  if (!saved) {
    throw new Error('De back-up is gecontroleerd, maar kon niet lokaal worden opgeslagen. Maak ruimte vrij of controleer de browseropslag en probeer opnieuw.');
  }
  return verified.payload;
}

export function downloadAlchemyBackupFile(envelope: AlchemyBackupEnvelope): void {
  if (typeof window === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `alchemy-backup-${new Date(envelope.exportedAt).toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
