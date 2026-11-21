import { AssistantMessage, AssistantAction, Task, CalendarEvent, LifeProfile } from '../types';

const ALLOWED_ACTION_TYPES = new Set<AssistantAction['type']>([
  'SUGGEST_TASK',
  'RESCHEDULE_TASK',
  'ADD_MEMORY',
  'CREATE_PROJECT',
  'CREATE_CONTENT',
]);

function assistantWorld(world: string): AssistantMessage['world'] {
  return world === 'mariluna' ? 'mariluna' : world === 'all' ? 'all' : 'personal';
}

function createAssistantMessage(
  content: string,
  world: string,
  suggestedAction?: AssistantAction,
): AssistantMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    world: assistantWorld(world),
    ...(suggestedAction ? { suggestedAction } : {}),
  };
}

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  context: Record<string, any>,
  world: string
): Promise<AssistantMessage> {
  const lastMsg = messages.length > 0 ? messages[messages.length - 1].content : '';

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, world }),
    });

    if (!res.ok) {
      throw new Error(`Jarvis endpoint returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || typeof data.content !== 'string' || !data.content.trim()) {
      throw new Error('Jarvis returned an empty or invalid response.');
    }

    let content = data.content;
    let suggestedAction: AssistantAction | undefined;
    const actionBlockStart = content.indexOf('```action');
    if (actionBlockStart >= 0) {
      const actionBlock = content.slice(actionBlockStart);
      const actionMatch = actionBlock.match(/^```action\s*([\s\S]*?)\s*```/);
      if (actionMatch) {
        try {
          const actionData = JSON.parse(actionMatch[1]);
          const validType = ALLOWED_ACTION_TYPES.has(actionData?.type);
          const validPayload = actionData?.data !== null &&
            typeof actionData?.data === 'object' &&
            !Array.isArray(actionData.data);
          if (validType && validPayload) {
            suggestedAction = {
              type: actionData.type,
              label: typeof actionData.label === 'string' && actionData.label.trim()
                ? actionData.label.slice(0, 100)
                : 'Aanbeveling bekijken',
              payload: actionData.data,
            };
          } else {
            console.warn('Jarvis action block rejected: unsupported type or invalid payload.');
          }
        } catch (err) {
          console.warn('Jarvis action block could not be parsed:', err);
        }
      } else {
        console.warn('Jarvis returned an incomplete action block; it was discarded.');
      }
      // Remove the entire action tail, even if its closing fence is missing.
      content = content.slice(0, actionBlockStart).trim();
    }

    return createAssistantMessage(content || 'Ik heb je bericht ontvangen, maar geen tekstueel antwoord gekregen.', world, suggestedAction);
  } catch (error) {
    console.warn('Jarvis is temporarily unavailable:', error);
    const isDutch = /\b(wat|is|er|op|mijn|planning|vrijdag|hoe|waar|moet|ik|me|richten|sparren|bespreek|idee|taken|project|welke|kun je|wil je)\b/i.test(lastMsg);
    const fallbackText = isDutch
      ? 'Jarvis is momenteel niet bereikbaar. Je bericht blijft in dit gesprek staan, maar ik heb je agenda of gegevens niet kunnen raadplegen en er is niets gewijzigd. Controleer je verbinding of probeer het straks opnieuw.'
      : 'Jarvis is temporarily unavailable. Your message remains in this conversation, but I could not access your schedule or data and nothing has been changed. Check your connection or try again shortly.';
    return createAssistantMessage(fallbackText, world);
  }
}

export async function requestIntelligentPlan(
  tasks: Task[],
  events: CalendarEvent[],
  profile: LifeProfile,
  realm: 'personal' | 'mariluna' = 'personal'
): Promise<any> {
  try {
    const res = await fetch('/api/ai/plan-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks,
        realm,
        calendarEvents: events,
        workingHours: {
          start: profile.workingHoursStart,
          end: profile.workingHoursEnd,
          days: profile.workingDays,
        },
        preferences: profile.preferences,
      }),
    });

    if (!res.ok) throw new Error('Plan API failed');
    return await res.json();
  } catch (err) {
    console.warn('Fallback to local planner:', err);
    return null;
  }
}

export async function requestGoalBreakdown(
  goalTitle: string,
  realm: string,
  timeframe: string
): Promise<any> {
  const res = await fetch('/api/ai/breakdown-goal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goalTitle, realm, timeframe }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload && typeof payload.error === 'string'
      ? payload.error
      : 'Jarvis is momenteel niet beschikbaar. Controleer je verbinding en probeer het opnieuw.';
    throw new Error(message);
  }
  if (!payload || !Array.isArray(payload.milestones)) {
    throw new Error('Jarvis gaf geen geldig stappenplan terug. Je doel is niet gewijzigd.');
  }
  return payload;
}

export async function requestIdeaAnalysis(rawIdea: string, realm: string): Promise<any> {
  const res = await fetch('/api/ai/analyze-idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawIdea, realm }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message = payload && typeof payload.error === 'string'
      ? payload.error
      : 'Jarvis kan dit idee nu niet analyseren. Je ruwe idee kan wel veilig bewaard worden.';
    throw new Error(message);
  }
  if (!payload || typeof payload.summary !== 'string' || typeof payload.category !== 'string') {
    throw new Error('Jarvis gaf geen geldige analyse terug. Je ruwe idee kan wel bewaard worden.');
  }
  return payload;
}

export async function requestStylingEvaluationPhoto(
  imageBase64: string,
  profileContext: Record<string, any>,
  optionalNotes?: string,
  optionalUrl?: string
): Promise<any> {
  try {
    const mimeType = imageBase64.startsWith('data:image/png')
      ? 'image/png'
      : imageBase64.startsWith('data:image/webp')
      ? 'image/webp'
      : 'image/jpeg';

    const res = await fetch('/api/brain/evaluate-styling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        profileContext,
        optionalNotes,
        optionalUrl,
      }),
    });

    if (!res.ok) throw new Error(`Styling evaluation failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Styling evaluation API fallback:', err);
    return null;
  }
}
