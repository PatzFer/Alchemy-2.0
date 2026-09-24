const SNOOZE_STORAGE_KEY = 'alchemy_snoozed_suggestions_v1';

export interface SnoozeMap {
  [suggestionId: string]: number; // timestamp until snoozed
}

export function getSnoozedSuggestions(): SnoozeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function snoozeSuggestion(suggestionId: string, durationHours: number = 4) {
  if (typeof window === 'undefined') return;
  const current = getSnoozedSuggestions();
  const snoozeUntil = Date.now() + durationHours * 60 * 60 * 1000;
  current[suggestionId] = snoozeUntil;
  try {
    localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.warn('Could not save snooze state:', e);
  }
}

export function isSuggestionSnoozed(suggestionId: string): boolean {
  const current = getSnoozedSuggestions();
  const until = current[suggestionId];
  if (!until) return false;
  if (Date.now() > until) {
    // Expired
    delete current[suggestionId];
    try {
      localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify(current));
    } catch {}
    return false;
  }
  return true;
}
