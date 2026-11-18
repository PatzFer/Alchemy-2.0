import type { AppState } from './storage';
import type { AlchemySnapshot } from './persistenceClient';

export type PersistenceMigrationAction =
  | 'fresh_start'
  | 'upload_local_after_confirmation'
  | 'restore_remote_after_confirmation'
  | 'resolve_local_remote_conflict';

export interface PersistenceMigrationPlan {
  action: PersistenceMigrationAction;
  requiresExplicitChoice: boolean;
  localRecordCount: number;
  remoteRecordCount: number;
  remoteRevision: number | null;
  remoteCreatedAt: string | null;
  explanation: string;
}

const COLLECTIONS = [
  'tasks', 'goals', 'ideas', 'projects', 'calendarEvents', 'memories',
  'dailyCheckIns', 'intentions', 'notifications', 'proactiveSuggestions',
  'marilunaOfferings', 'marilunaClients',
] as const;

function countRecords(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countStateRecords(state: Record<string, unknown>): number {
  return COLLECTIONS.reduce((total, key) => total + countRecords(state[key]), 0);
}

/**
 * Creates a read-only migration decision. It never writes, merges or replaces
 * data; the UI must ask the owner to choose before any migration action.
 */
export function planPersistenceMigration(
  localState: AppState,
  remoteSnapshot: AlchemySnapshot | null,
): PersistenceMigrationPlan {
  const localRecordCount = countStateRecords(localState as unknown as Record<string, unknown>);
  const remoteRecordCount = remoteSnapshot
    ? countStateRecords(remoteSnapshot.payload)
    : 0;

  if (!remoteSnapshot && localRecordCount === 0) {
    return {
      action: 'fresh_start',
      requiresExplicitChoice: false,
      localRecordCount,
      remoteRecordCount,
      remoteRevision: null,
      remoteCreatedAt: null,
      explanation: 'Er zijn nog geen lokale of cloudgegevens om te migreren.',
    };
  }

  if (!remoteSnapshot) {
    return {
      action: 'upload_local_after_confirmation',
      requiresExplicitChoice: true,
      localRecordCount,
      remoteRecordCount,
      remoteRevision: null,
      remoteCreatedAt: null,
      explanation: 'Er bestaan lokale gegevens maar nog geen cloudback-up. Uploaden vereist jouw bevestiging.',
    };
  }

  if (localRecordCount === 0) {
    return {
      action: 'restore_remote_after_confirmation',
      requiresExplicitChoice: true,
      localRecordCount,
      remoteRecordCount,
      remoteRevision: remoteSnapshot.revision,
      remoteCreatedAt: remoteSnapshot.created_at,
      explanation: 'Er bestaat een cloudback-up. Herstellen naar dit toestel vereist jouw bevestiging.',
    };
  }

  return {
    action: 'resolve_local_remote_conflict',
    requiresExplicitChoice: true,
    localRecordCount,
    remoteRecordCount,
    remoteRevision: remoteSnapshot.revision,
    remoteCreatedAt: remoteSnapshot.created_at,
    explanation: 'Er bestaan zowel lokale als cloudgegevens. Er wordt niets automatisch overschreven; kies eerst hoe je deze gegevens wilt behouden.',
  };
}
