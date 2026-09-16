import { AssistantMessage, Task, CalendarEvent, LifeProfile } from '../types';

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  context: Record<string, any>,
  world: string
): Promise<AssistantMessage> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, world }),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    let content = data.content || '';
    let suggestedAction = undefined;

    // Check if the response contains an action block
    const actionMatch = content.match(/```action\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try {
        const actionData = JSON.parse(actionMatch[1]);
        suggestedAction = {
          type: actionData.type,
          label: actionData.label || 'Accept Recommendation',
          payload: actionData.data || actionData,
        };
        // Clean out action block from user display text
        content = content.replace(/```action[\s\S]*?```/, '').trim();
      } catch (err) {
        console.warn('Failed to parse action block:', err);
      }
    }

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      suggestedAction,
    };
  } catch (error: any) {
    console.error('AI chat communication error:', error);
    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content:
        'I am listening. While my cloud reasoning connection is momentarily re-calibrating, your schedule and goals remain grounded and secure. How can I help clarify your next priority?',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function requestIntelligentPlan(
  tasks: Task[],
  events: CalendarEvent[],
  profile: LifeProfile
): Promise<any> {
  try {
    const res = await fetch('/api/ai/plan-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tasks,
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
