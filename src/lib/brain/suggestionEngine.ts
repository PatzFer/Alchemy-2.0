import { AppState } from '../storage';
import { BrainSuggestion } from './types';
import { assessCapacity } from './capacityEngine';
import { isSuggestionSnoozed } from '../snoozeStore';

/**
 * SUGGESTION ENGINE
 * 
 * Generates max 2–3 proactive, calm, high-signal suggestions for Patricia.
 * Enforces deduplication via fingerprints, auto-expires stale suggestions,
 * and always provides clear, transparent explainability reasons.
 */

export function generateActiveSuggestions(
  state: AppState,
  targetDate: string = new Date().toISOString().split('T')[0]
): BrainSuggestion[] {
  const suggestions: BrainSuggestion[] = [];
  const now = new Date().toISOString();

  const todayEvents = (state.calendarEvents || []).filter((e) => e.date === targetDate);
  const todayCheckIn = (state.dailyCheckIns || []).find((c) => c.date === targetDate);
  const openTasks = (state.tasks || []).filter((t) => t.status !== 'completed');
  const capacity = assessCapacity(todayEvents, todayCheckIn, openTasks);

  // -------------------------------------------------------------
  // TRIGGER 1: Evening meal check
  // If no dinner is planned tonight and calendar has significant commitments
  // -------------------------------------------------------------
  const targetDayOfWeek = new Date(targetDate).toLocaleDateString('nl-NL', { weekday: 'long' }).toLowerCase();
  const plannedDay = state.nutrition?.activeWeeklyPlan?.days?.find(
    (d) => d.date === targetDate || (d.dayOfWeek && d.dayOfWeek.toLowerCase() === targetDayOfWeek)
  );
  const dinnerPlanned = !!plannedDay?.recipeId;

  if (!dinnerPlanned) {
    suggestions.push({
      id: `sug-meal-${targetDate}`,
      sourceModule: 'meals',
      title: 'Avondmaaltijd voor vanavond',
      description: 'Je hebt voor vanavond nog geen maaltijd gepland in je weekmenu.',
      reason: capacity.busyMinutes > 180
        ? 'Omdat je vandaag een goedgevulde werkdag hebt, is een eenvoudig of vooraf bereid gerecht aan te raden.'
        : 'Door nu rustig te kiezen blijft je avond vrij van beslissingsmoeheid.',
      priority: 'normal',
      createdAt: now,
      expiresAt: `${targetDate}T20:00:00.000Z`,
      status: 'new',
      fingerprint: `meal_unplanned_${targetDate}`,
      actions: [
        {
          id: 'act-plan-meal',
          label: 'Plan maaltijd',
          actionType: 'plan_meal',
          payload: { date: targetDate },
          isPrimary: true,
        },
        {
          id: 'act-dismiss-meal',
          label: 'Later',
          actionType: 'dismiss',
        },
      ],
    });
  }

  // -------------------------------------------------------------
  // TRIGGER 2: Mariluna project deadline & open tasks
  // If an active project has a deadline approaching and open tasks
  // -------------------------------------------------------------
  const activeProjects = (state.projects || []).filter((p) => p.status === 'active');
  for (const proj of activeProjects) {
    const uncompletedTasks = openTasks.filter((t) => t.projectId === proj.id);
    if (uncompletedTasks.length > 0 && proj.deadline) {
      const daysDiff = Math.round(
        (new Date(proj.deadline).getTime() - new Date(targetDate).getTime()) / (1000 * 3600 * 24)
      );
      if (daysDiff >= 0 && daysDiff <= 7) {
        suggestions.push({
          id: `sug-proj-${proj.id}`,
          sourceModule: 'mariluna',
          title: `Deadline voor ${proj.title}`,
          description: `Dit project heeft een streefdatum over ${daysDiff === 0 ? 'vandaag' : `${daysDiff} dagen`} met nog ${uncompletedTasks.length} openstaande taak/taken.`,
          reason: `Het afronden van 1 kleine deeltaak vandaag voorkomt congestie later in de week.`,
          priority: daysDiff <= 2 ? 'high' : 'normal',
          createdAt: now,
          expiresAt: `${proj.deadline}T23:59:59.000Z`,
          status: 'new',
          fingerprint: `project_deadline_${proj.id}_${proj.deadline}`,
          actions: [
            {
              id: 'act-view-project',
              label: 'Bekijk project',
              actionType: 'view_project',
              payload: { projectId: proj.id },
              isPrimary: true,
            },
            {
              id: 'act-dismiss-proj',
              label: 'Later',
              actionType: 'dismiss',
            },
          ],
        });
        break; // Max 1 project suggestion at a time
      }
    }
  }

  // -------------------------------------------------------------
  // TRIGGER 3: Oversized Task Splitting
  // If an open high-priority task is > 60 mins or contains broad scope
  // -------------------------------------------------------------
  const bigTask = openTasks.find(
    (t) => (t.estimatedDuration >= 60 || t.title.toLowerCase().includes('website')) && t.subtasks.length === 0
  );
  if (bigTask) {
    suggestions.push({
      id: `sug-split-${bigTask.id}`,
      sourceModule: 'tasks',
      title: `Taak opdelen: ${bigTask.title}`,
      description: `Deze taak is geschat op ${bigTask.estimatedDuration || 60}m. Zal ik 3–5 heldere deeltaken voorstellen?`,
      reason: 'Grote taken roepen weerstand op. Door ze op te knippen in kleine stappen begin je met minder frictie.',
      priority: 'normal',
      createdAt: now,
      status: 'new',
      fingerprint: `split_task_${bigTask.id}`,
      actions: [
        {
          id: 'act-split-task',
          label: 'Splits taak',
          actionType: 'split_task',
          payload: { taskId: bigTask.id, taskTitle: bigTask.title },
          isPrimary: true,
        },
        {
          id: 'act-dismiss-split',
          label: 'Behoud zo',
          actionType: 'dismiss',
        },
      ],
    });
  }

  // -------------------------------------------------------------
  // TRIGGER 4: Content idea match with active project
  // -------------------------------------------------------------
  const rawIdeas = (state.ideas || []).filter((i) => i.realm === 'mariluna' && (!i.status || i.status === 'new' || i.status === 'raw'));
  if (activeProjects.length > 0 && rawIdeas.length > 0) {
    const firstIdea = rawIdeas[0];
    const matchingProj = activeProjects.find((p) =>
      firstIdea.title.toLowerCase().split(' ').some((w) => w.length > 4 && p.title.toLowerCase().includes(w))
    ) || activeProjects[0];

    suggestions.push({
      id: `sug-idea-${firstIdea.id}`,
      sourceModule: 'content',
      title: `Content-idee koppelen: "${firstIdea.title.slice(0, 30)}..."`,
      description: `Dit idee sluit mogelijk aan bij je actieve project "${matchingProj.title}".`,
      reason: 'Door ideeën direct aan een project of contentpijler te koppelen, worden ze sneller tastbaar.',
      priority: 'low',
      createdAt: now,
      status: 'new',
      fingerprint: `link_idea_${firstIdea.id}_${matchingProj.id}`,
      actions: [
        {
          id: 'act-view-content',
          label: 'Bekijk idee',
          actionType: 'view_content',
          payload: { ideaId: firstIdea.id },
          isPrimary: true,
        },
        {
          id: 'act-dismiss-idea',
          label: 'Later',
          actionType: 'dismiss',
        },
      ],
    });
  }

  // Filter out any dismissed fingerprints stored in brainState or snoozed in snoozeStore
  const dismissedFingerprints = new Set(
    (state.brain?.activeSuggestions || [])
      .filter((s) => s.status === 'dismissed')
      .map((s) => s.fingerprint)
  );

  const activeFiltered = suggestions.filter((s) => {
    if (dismissedFingerprints.has(s.fingerprint)) return false;
    if (isSuggestionSnoozed(s.id)) return false;
    if (s.fingerprint && isSuggestionSnoozed(s.fingerprint)) return false;
    return true;
  });

  // Cap at max 2–3 calm suggestions
  return activeFiltered.slice(0, 2);
}
