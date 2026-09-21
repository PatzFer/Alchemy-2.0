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
}

export async function splitTaskWithBrain(
  taskTitle: string,
  estimatedDuration: number = 60
): Promise<SplitTaskResponse> {
  try {
    const res = await fetch('/api/brain/split-task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskTitle, estimatedDuration }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.subtasks) && data.subtasks.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Fallback to local task splitter:', err);
  }

  // Graceful deterministic fallback
  return {
    subtasks: generateTaskSplits(taskTitle),
    rationale: 'Opgesplitst in logische stappen op basis van praktische taakpatronen.',
  };
}

export interface BrainQueryResponse {
  answer: string;
  scopeUsed: ContextPrivacyScope;
  relevantDomainsUsed: string[];
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
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.answer) {
        return {
          answer: data.answer,
          scopeUsed: effectiveScope,
          relevantDomainsUsed: relevance.relevantDomains,
        };
      }
    }
  } catch (err) {
    console.warn('Fallback to local brain advisor:', err);
  }

  // Grounded editorial fallback
  return {
    answer: `Op basis van je huidige dagritme en voorkeuren: houd vandaag je focus op 1 prioriteit en bewaar voldoende ademruimte. (${relevance.privacyRationale})`,
    scopeUsed: effectiveScope,
    relevantDomainsUsed: relevance.relevantDomains,
  };
}
