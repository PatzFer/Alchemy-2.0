import { AppState } from '../storage';
import { DailyAlchemyBrief } from './types';
import { assessCapacity } from './capacityEngine';
import { generateActiveSuggestions } from './suggestionEngine';

/**
 * DAILY ALCHEMY BRIEF SERVICE
 * 
 * Assembles the compact, editorial morning briefing for TodayView.
 * Generates clear, high-signal bullets, calm sovereign focus anchor,
 * capacity assessment, and 1-2 prioritized smart actions.
 */

export function generateDeterministicBrief(
  state: AppState,
  targetDate: string = new Date().toISOString().split('T')[0]
): DailyAlchemyBrief {
  const foundation = state.foundation;
  const callingName = foundation?.patzIdentity?.preferredName || foundation?.aboutYou?.name || 'Patz';
  
  // Time-aware greeting
  const currentHour = new Date().getHours();
  let greeting = `Goedemorgen ${callingName}`;
  if (currentHour >= 12 && currentHour < 18) greeting = `Goedemiddag ${callingName}`;
  if (currentHour >= 18) greeting = `Goedenavond ${callingName}`;

  // 1. Working hours / Calendar Commitments bullet
  const todayEvents = (state.calendarEvents || []).filter((e) => e.date === targetDate);
  const workEvent = todayEvents.find((e) => e.title.toLowerCase().includes('werk') || e.type === 'work');
  
  let calendarBullet = 'Geen vaste werkuren gepland; volledige dagruimte';
  if (workEvent && workEvent.startTime && workEvent.endTime) {
    calendarBullet = `Werk ${workEvent.startTime}–${workEvent.endTime}`;
  } else if (todayEvents.length > 0) {
    calendarBullet = `${todayEvents.length} afspraak/afspraken in agenda`;
  }

  // 2. Priority tasks bullet
  const openTasks = (state.tasks || []).filter((t) => t.status !== 'completed');
  const highPriorityTasks = openTasks.filter((t) => t.priority === 'high');
  let tasksBullet = 'Geen urgente taken voor vandaag';
  if (highPriorityTasks.length > 0) {
    tasksBullet = `${highPriorityTasks.length} belangrijke taak/taken`;
  } else if (openTasks.length > 0) {
    tasksBullet = `${openTasks.length} openstaande taken`;
  }

  // 3. Dinner status bullet
  const plannedDay = state.nutrition?.activeWeeklyPlan?.days?.find((d) => d.date === targetDate);
  let dinnerBullet = 'Vanavond nog geen maaltijd gepland';
  if (plannedDay?.recipeId) {
    dinnerBullet = `Vanavond: ${plannedDay.customMealName || 'Gepland gerecht'}`;
  }

  // 4. Mariluna deadline / milestone bullet
  const deadlines = (state.marilunaAdmin?.deadlines || []).filter((d) => !d.completed);
  const activeProjects = (state.projects || []).filter((p) => p.status === 'active');
  let marilunaBullet = 'Mariluna ritme is rustig';
  if (deadlines.length > 0) {
    marilunaBullet = `${deadlines.length} administratieve deadline(s) deze periode`;
  } else if (activeProjects.length > 0) {
    marilunaBullet = `${activeProjects.length} actief Mariluna project(en)`;
  }

  // 5. Steps context if Health Connect is synced
  const steps = state.integrations?.healthConnect?.todaySteps ?? state.integrations?.healthConnect?.stepsToday;
  const bullets = [
    calendarBullet,
    tasksBullet,
    dinnerBullet,
    marilunaBullet,
  ];
  if (steps && steps > 0) {
    bullets.push(`${steps.toLocaleString('nl-NL')} stappen geregistreerd`);
  }

  // Capacity Assessment
  const todayCheckIn = (state.dailyCheckIns || []).find((c) => c.date === targetDate);
  const capacity = assessCapacity(todayEvents, todayCheckIn, openTasks);

  // Focus Anchor
  let focusAnchor = 'Doe vandaag alleen wat vandaag nodig is.';
  if (capacity.level === 'minimal') {
    focusAnchor = 'Herstel en rust hebben vandaag absolute voorrang.';
  } else if (capacity.level === 'reduced') {
    focusAnchor = 'Houd je tempo laag en bescherm je avond.';
  } else if (capacity.level === 'high') {
    focusAnchor = 'Ruimte om met toewijding aan 1 belangrijk project te bouwen.';
  }

  // Proactive suggestions
  const suggestions = generateActiveSuggestions(state, targetDate);

  return {
    id: `brief-${targetDate}`,
    date: targetDate,
    greeting,
    bullets,
    focusAnchor,
    capacityLevel: capacity.level,
    capacityReason: capacity.reason,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Async fetch for AI-enhanced Brief, with deterministic fallback
 */
export async function getOrRefreshAlchemyBrief(
  state: AppState,
  targetDate: string = new Date().toISOString().split('T')[0]
): Promise<DailyAlchemyBrief> {
  const deterministic = generateDeterministicBrief(state, targetDate);

  try {
    const res = await fetch('/api/brain/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: targetDate,
        deterministicBrief: deterministic,
        checkIn: state.dailyCheckIns?.find((c) => c.date === targetDate),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.brief) {
        return {
          ...deterministic,
          ...data.brief,
          suggestions: deterministic.suggestions, // Keep robust local actions
        };
      }
    }
  } catch {
    // Network or server error -> graceful fallback
  }

  return deterministic;
}
