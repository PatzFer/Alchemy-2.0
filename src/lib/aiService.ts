import { AssistantMessage, Task, CalendarEvent, LifeProfile } from '../types';

import { AssistantMessage, AssistantAction, Task, CalendarEvent, LifeProfile } from '../types';

const ALLOWED_ACTION_TYPES = new Set<AssistantAction['type']>([
  'SUGGEST_TASK',
  'RESCHEDULE_TASK',
  'ADD_MEMORY',
  'BREAKDOWN_GOAL',
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
    const actionMatch = content.match(/```action\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        const validType = ALLOWED_ACTION_TYPES.has(actionData?.type);
        const validPayload = actionData?.data !== null && typeof actionData?.data === 'object';
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
      // Never show raw machine instructions or malformed action JSON in the conversation.
      content = content.replace(/```action[\s\S]*?```/, '').trim();
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
  try {
    const res = await fetch('/api/ai/breakdown-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goalTitle, realm, timeframe }),
    });
    if (!res.ok) throw new Error('Goal breakdown failed');
    return await res.json();
  } catch (err) {
    console.warn('Goal breakdown fallback:', err);
    return {
      milestones: [
        { title: `Clarify outcome for ${goalTitle}`, durationMins: 30, suggestedDay: 'Tomorrow' },
        { title: 'Core milestone execution sprint', durationMins: 60, suggestedDay: 'Thursday' },
        { title: 'Integrate into workflow and review', durationMins: 20, suggestedDay: 'Sunday' },
      ],
    };
  }
}

export async function requestIdeaAnalysis(rawIdea: string, realm: string): Promise<any> {
  try {
    const res = await fetch('/api/ai/analyze-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawIdea, realm }),
    });
    if (!res.ok) throw new Error('Idea analysis failed');
    return await res.json();
  } catch (err) {
    console.warn('Idea analysis fallback:', err);
    return {
      summary: rawIdea.slice(0, 70) + '...',
      category: realm === 'mariluna' ? 'Strategy & Offering' : 'Personal Inquiry',
      suggestedNextAction: 'Refine into a one-paragraph project brief',
      followUpQuestions: [
        'How does this serve your core quarterly focus?',
        'What would be the simplest, most delightful version of this?',
      ],
    };
  }
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
