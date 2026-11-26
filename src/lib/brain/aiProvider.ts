import { AppState } from '../storage';
import { buildBrainContext } from './contextEngine';
import { determineRelevance } from './relevanceEngine';
import { generateTaskSplits } from './capacityEngine';
import { ContextPrivacyScope } from './types';

/**
 * AI PROVIDER ADAPTER & SERVICE LAYER
 * 
 * Provides an abstracted interface to server-side AI endpoints (powered by Gemini).
 * If the network is offline or no API key is set, automatically falls back to local
 * deterministic reasoning, guaranteeing that the application is never blocked.
 */

export interface SplitTaskResponse {
  subtasks: { title: string; durationMinutes: number }[];
  rationale?: string;
  mode: 'ai' | 'local-deterministic';
  notice?: string;
}

export async function splitTaskWithBrain(
  taskTitle: string,
  estimatedDuration: number = 60,
  world: 'personal' | 'mariluna' = 'personal'
): Promise<SplitTaskResponse> {
  const res = await fetch('/api/brain/split-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskTitle, estimatedDuration, world }),
  });

  const payload = await res.json().catch(() => null);
  if (res.ok && payload && Array.isArray(payload.subtasks) && payload.subtasks.length > 0) {
    return {
      subtasks: payload.subtasks,
      rationale: payload.rationale,
      mode: 'ai',
    };
  }

  if (res.status === 503) {
    // Explicit deterministic fallback when AI provider or consent is intentionally off/unavailable
    return {
      subtasks: generateTaskSplits(taskTitle),
      rationale: 'Lokale deterministische taakopdeling (externe AI niet actief).',
      mode: 'local-deterministic',
      notice: typeof payload?.error === 'string'
        ? payload.error
        : 'Externe AI is niet actief; lokale richtlijnstappen getoond.',
    };
  }

  const message = payload && typeof payload.error === 'string'
    ? payload.error
    : 'Jarvis kon deze taak niet betrouwbaar opdelen. Probeer het opnieuw of voeg zelf stappen toe.';
  throw new Error(message);
}

export interface BrainQueryResponse {
  answer: string;
  scopeUsed: ContextPrivacyScope;
  relevantDomainsUsed: string[];
  mode: 'ai' | 'local-deterministic';
  error?: string;
}

export async function queryBrainAdvisor(
  query: string,
  state: AppState,
  scopeOverride?: ContextPrivacyScope
): Promise<BrainQueryResponse> {
  const relevance = determineRelevance(query);
  const effectiveScope = scopeOverride || relevance.scope;
  const safeContext = buildBrainContext(state, effectiveScope);

  try {
    const res = await fetch('/api/brain/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        context: safeContext,
        relevance,
        world: effectiveScope === 'mariluna' ? 'mariluna' : 'personal',
      }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data && typeof data.answer === 'string' && data.answer.trim()) {
      return {
        answer: data.answer,
        scopeUsed: effectiveScope,
        relevantDomainsUsed: relevance.relevantDomains,
        mode: data.provider === 'local' ? 'local-deterministic' : 'ai',
      };
    }

    const errorMessage = data && typeof data.error === 'string'
      ? data.error
      : 'Jarvis Brain is tijdelijk niet beschikbaar. Er zijn geen gegevens gewijzigd.';
    return {
      answer: errorMessage,
      scopeUsed: effectiveScope,
      relevantDomainsUsed: relevance.relevantDomains,
      mode: 'local-deterministic',
      error: errorMessage,
    };
  } catch (err) {
    const errorMessage = err instanceof Error && err.message
      ? `Jarvis Brain is niet bereikbaar (${err.message}). Er zijn geen gegevens gewijzigd.`
      : 'Jarvis Brain is momenteel niet bereikbaar. Controleer je verbinding en probeer het opnieuw.';
    return {
      answer: errorMessage,
      scopeUsed: effectiveScope,
      relevantDomainsUsed: relevance.relevantDomains,
      mode: 'local-deterministic',
      error: errorMessage,
    };
  }
}
