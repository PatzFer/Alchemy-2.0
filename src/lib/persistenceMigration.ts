import type { AppState } from './storage';
import { DEFAULT_FOUNDATION_DATA } from './foundationDefaults';
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
  'chatHistory', 'marilunaOfferings', 'marilunaClients',
] as const;

function countRecords(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function countStateRecords(state: Record<string, unknown>): number {
  let total = COLLECTIONS.reduce((sum, key) => sum + countRecords(state[key]), 0);

  const foundation = state.foundation as Record<string, unknown> | undefined;
  const aboutYou = foundation?.aboutYou as Record<string, unknown> | undefined;
  if (aboutYou) {
    const defaultAboutYou = DEFAULT_FOUNDATION_DATA.aboutYou as unknown as Record<string, unknown>;
    total += Object.entries(aboutYou).filter(([key, value]) => {
      const defaultValue = defaultAboutYou[key];
      return value !== defaultValue &&
        (typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined);
    }).length;
  }

  const cycle = state.cycleProfile as Record<string, unknown> | undefined;
  if (cycle?.trackingEnabled === true) total += 1;
  if (typeof cycle?.lastPeriodStartDate === 'string' && cycle.lastPeriodStartDate.trim()) total += 1;

  const profileKeys = ['workingDays', 'routines', 'commitments'] as const;
  const lifeProfile = state.lifeProfile as Record<string, unknown> | undefined;
  total += profileKeys.reduce((sum, key) => sum + countRecords(lifeProfile?.[key]), 0);

  const personalStyle = state.personalStyle as Record<string, unknown> | undefined;
  total += ['colorPalette', 'preferredSilhouettes', 'dislikedStyles', 'occasions']
    .reduce((sum, key) => sum + countRecords(personalStyle?.[key]), 0);
  if (typeof personalStyle?.measurementsNotes === 'string' && personalStyle.measurementsNotes.trim()) total += 1;

  const nutrition = state.nutrition as Record<string, unknown> | undefined;
  total += ['dislikes', 'partnerSharedDinners', 'inventory', 'shoppingList', 'mealHistory', 'pastWeeklyPlans']
    .reduce((sum, key) => sum + countRecords(nutrition?.[key]), 0);
  if (typeof nutrition?.dietaryNotes === 'string' && nutrition.dietaryNotes.trim()) total += 1;

  const admin = state.marilunaAdmin as Record<string, unknown> | undefined;
  total += ['items', 'expenses', 'invoices', 'deadlines']
    .reduce((sum, key) => sum + countRecords(admin?.[key]), 0);
  const metrics = state.marilunaMetrics as Record<string, unknown> | undefined;
  total += countRecords(metrics?.metrics) + countRecords(metrics?.records);

  const contentPlan = state.contentPlan as Record<string, unknown> | undefined;
  total += countRecords(contentPlan?.posts) + countRecords(contentPlan?.pillars) + countRecords(contentPlan?.platforms);
  if (typeof contentPlan?.quarterTheme === 'string' && contentPlan.quarterTheme.trim()) total += 1;
  if (typeof contentPlan?.monthlyTheme === 'string' && contentPlan.monthlyTheme.trim()) total += 1;

  const brain = state.brain as Record<string, unknown> | undefined;
  total += countRecords(brain?.activeSuggestions) + countRecords(brain?.recentSplitTasks) +
    countRecords(brain?.dismissedSuggestionIds) + countRecords(brain?.acceptedSuggestionIds);
  if (brain?.lastBrief && typeof brain.lastBrief === 'object') total += 1;

  const integrations = state.integrations as Record<string, unknown> | undefined;
  if (integrations && Object.values(integrations).some((value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (value as Record<string, unknown>).status === 'connected'
  )) total += 1;

  return total;
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
