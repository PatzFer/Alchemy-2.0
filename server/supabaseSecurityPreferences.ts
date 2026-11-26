import type { SupabaseServerConfig, FetchLike } from './supabasePersistence';

export interface DurableSecurityPreferences {
  calendarRead: boolean;
  calendarWrite: boolean;
  aiMayCreateTasks: boolean;
  aiRequiresConfirmationForModifications: true;
  aiRequiresConfirmationForDestructive: true;
  allowCycleDataToAI: boolean;
  allowPersonalDataToAI: boolean;
  allowMarilunaDataToAI: boolean;
  allowFinancialDataToAI: boolean;
  allowWellbeingDataToAI: boolean;
  activeAiProvider: 'openai-server' | 'gemini-server' | 'local-rules';
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BOOLEAN_KEYS = [
  'calendarRead', 'calendarWrite', 'aiMayCreateTasks', 'allowCycleDataToAI',
  'allowPersonalDataToAI', 'allowMarilunaDataToAI', 'allowFinancialDataToAI',
  'allowWellbeingDataToAI',
] as const;

export function isDurableSecurityPreferences(value: unknown): value is DurableSecurityPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return BOOLEAN_KEYS.every((key) => typeof item[key] === 'boolean') &&
    item.aiRequiresConfirmationForModifications === true &&
    item.aiRequiresConfirmationForDestructive === true &&
    ['openai-server', 'gemini-server', 'local-rules'].includes(String(item.activeAiProvider));
}

/** Server-only owner-scoped security preferences, with immutable AI confirmation safeguards. */
export class SupabaseSecurityPreferencesStore {
  constructor(private readonly config: SupabaseServerConfig, private readonly fetcher: FetchLike = fetch) {}

  async load(ownerId: string): Promise<DurableSecurityPreferences | null> {
    this.assertOwner(ownerId);
    const query = new URLSearchParams({ select: 'preferences', owner_id: `eq.${ownerId}`, limit: '1' });
    const response = await this.fetcher(`${this.config.url}/rest/v1/owner_profiles?${query.toString()}`, {
      method: 'GET',
      headers: this.headers(),
    });
    const rows = await this.readRows(response);
    if (!rows.length) return null;
    const preferences = rows[0]?.preferences;
    const security = preferences && typeof preferences === 'object'
      ? (preferences as Record<string, unknown>).security
      : null;
    return isDurableSecurityPreferences(security) ? security : null;
  }

  async save(ownerId: string, preferences: DurableSecurityPreferences): Promise<void> {
    this.assertOwner(ownerId);
    if (!isDurableSecurityPreferences(preferences)) {
      throw new Error('Security preferences are invalid or weaken mandatory confirmation safeguards.');
    }
    const response = await this.fetcher(`${this.config.url}/rest/v1/rpc/save_alchemy_security_preferences`, {
      method: 'POST',
      headers: { ...this.headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_owner_id: ownerId, p_preferences: preferences }),
    });
    const body = await response.text();
    if (!response.ok) throw new Error(`Supabase security preferences request failed (${response.status}).`);
    let returned: unknown;
    try { returned = JSON.parse(body); } catch { throw new Error('Supabase returned invalid security preferences.'); }
    if (!isDurableSecurityPreferences(returned)) {
      throw new Error('Supabase did not confirm the saved security preferences.');
    }
  }

  private assertOwner(ownerId: string): void {
    if (!UUID_PATTERN.test(ownerId)) throw new Error('A verified Supabase owner UUID is required.');
  }

  private async readRows(response: Response): Promise<any[]> {
    const body = await response.text();
    if (!response.ok) throw new Error(`Supabase security preferences request failed (${response.status}).`);
    const rows: unknown = body ? JSON.parse(body) : [];
    if (!Array.isArray(rows)) throw new Error('Supabase returned invalid security preference rows.');
    return rows;
  }

  private headers(): HeadersInit {
    return { apikey: this.config.serviceRoleKey, Authorization: `Bearer ${this.config.serviceRoleKey}` };
  }
}
