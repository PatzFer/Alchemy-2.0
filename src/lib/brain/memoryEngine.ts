import {
  MemoryItem,
  MemoryType,
  MemorySource,
  MemoryConfidence,
  Realm,
} from './types';

/**
 * MEMORY ENGINE
 * 
 * Manages long-term preferences and context that genuinely improve future interactions.
 * Strictly separates factual database history (e.g. weight log) from qualitative memory
 * (e.g. "Patricia wil dat haar gezondheidstraject draait om rust en kracht, zonder schuldgevoel").
 */

export interface CreateMemoryParams {
  content: string;
  type?: MemoryType;
  source?: MemorySource;
  confidence?: MemoryConfidence;
  realm?: Realm;
  category?: string;
  expiresAt?: string;
}

/**
 * Creates a new memory item with required safety metadata
 */
export function createMemory(params: CreateMemoryParams): MemoryItem {
  const now = new Date().toISOString();
  const dateAdded = now.split('T')[0];

  const type = params.type || 'explicit';
  const status = type === 'learned' ? 'pending_confirmation' : 'active';

  return {
    id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    content: params.content.trim(),
    category: params.category || 'Algemeen',
    realm: params.realm || 'personal',
    dateAdded,
    importance: type === 'explicit' ? 'high' : 'medium',
    source: params.source || (type === 'explicit' ? 'user_stated' : 'learned_pattern'),
    type,
    confidence: params.confidence || (type === 'explicit' ? 'high' : 'medium'),
    updatedAt: now,
    expiresAt: params.expiresAt,
    status,
  };
}

/**
 * Detects explicit memory phrases like "Onthoud dat...", "Onthoud:", "Remember that..."
 */
export function parseExplicitMemoryStatement(input: string): {
  isExplicitMemory: boolean;
  extractedContent?: string;
  suggestedCategory?: string;
  suggestedRealm?: Realm;
} {
  const trimmed = input.trim();
  const regex = /^(?:onthoud\s+dat|onthoud:|onthoud\s+even\s+dat|onthoud|remember\s+that|remember:)\s*(.+)$/i;
  const match = trimmed.match(regex);

  if (!match || !match[1] || match[1].trim().length < 4) {
    return { isExplicitMemory: false };
  }

  const rawContent = match[1].trim();

  // Determine category and realm heuristically
  let suggestedCategory = 'Algemene Voorkeur';
  let suggestedRealm: Realm = 'personal';

  const lower = rawContent.toLowerCase();
  if (lower.includes('eten') || lower.includes('kook') || lower.includes('lust') || lower.includes('gerecht')) {
    suggestedCategory = 'Voeding & Keuken';
  } else if (lower.includes('mariluna') || lower.includes('klant') || lower.includes('prijs') || lower.includes('dienst')) {
    suggestedCategory = 'Mariluna Business';
    suggestedRealm = 'mariluna';
  } else if (lower.includes('agenda') || lower.includes('ochtend') || lower.includes('planning') || lower.includes('werkdag')) {
    suggestedCategory = 'Dagritme & Planning';
  } else if (lower.includes('kleding') || lower.includes('stijl') || lower.includes('kleur')) {
    suggestedCategory = 'Persoonlijke Stijl';
  }

  return {
    isExplicitMemory: true,
    extractedContent: rawContent,
    suggestedCategory,
    suggestedRealm,
  };
}

/**
 * Confirms a learned memory, converting it into a confirmed, permanent preference.
 */
export function confirmLearnedMemory(memories: MemoryItem[], memoryId: string): MemoryItem[] {
  const now = new Date().toISOString();
  return memories.map((m) => {
    if (m.id === memoryId) {
      return {
        ...m,
        type: 'confirmed',
        source: 'user_confirmed',
        confidence: 'high',
        status: 'active',
        updatedAt: now,
      };
    }
    return m;
  });
}

/**
 * Dismisses/rejects a learned memory suggestion.
 */
export function dismissLearnedMemory(memories: MemoryItem[], memoryId: string): MemoryItem[] {
  return memories.filter((m) => m.id !== memoryId);
}

/**
 * Edits an existing memory
 */
export function updateMemoryContent(
  memories: MemoryItem[],
  memoryId: string,
  newContent: string,
  newCategory?: string
): MemoryItem[] {
  const now = new Date().toISOString();
  return memories.map((m) => {
    if (m.id === memoryId) {
      return {
        ...m,
        content: newContent.trim(),
        category: newCategory || m.category,
        updatedAt: now,
      };
    }
    return m;
  });
}

/**
 * Filters memories for UI display or AI injection
 */
export function filterMemories(
  memories: MemoryItem[],
  options?: {
    realm?: Realm | 'all';
    type?: MemoryType;
    status?: 'active' | 'pending_confirmation' | 'all';
    category?: string;
  }
): MemoryItem[] {
  return memories.filter((m) => {
    if (options?.realm && options.realm !== 'all' && m.realm !== options.realm) {
      return false;
    }
    if (options?.type && m.type !== options.type) {
      return false;
    }
    if (options?.status && options.status !== 'all') {
      if (options.status === 'active' && m.status !== 'active') return false;
      if (options.status === 'pending_confirmation' && m.status !== 'pending_confirmation') return false;
    }
    if (options?.category && m.category !== options.category) {
      return false;
    }
    return true;
  });
}
