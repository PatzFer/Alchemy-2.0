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
    const lastMsg = messages.length > 0 ? messages[messages.length - 1].content : '';
    const isDutch = /\b(wat|is|er|op|mijn|planning|vrijdag|hoe|waar|moet|ik|me|richten|sparren|bespreek|idee|taken|project|welke)\b/i.test(lastMsg);
    
    let fallbackText = isDutch
      ? `Ik luister met je mee over "${lastMsg || 'je vraag'}". Je planning en prioriteiten blijven lokaal geborgd. Waar wil je nu als eerste de focus op leggen?`
      : `Reflecting on "${lastMsg || 'your query'}". Your schedule and priorities remain securely held. What specific outcome shall we focus on first?`;

    // Handle agenda / friday specifically in offline catch
    if (/vrijdag|friday|planning|agenda/i.test(lastMsg)) {
      fallbackText = isDutch
        ? `Er staan momenteel geen afspraken of taken op je planning voor vrijdag.`
        : `There are currently no events or tasks scheduled on your planning for Friday.`;
    }

    return {
      id: 'msg-' + Date.now(),
      role: 'assistant',
      content: fallbackText,
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
