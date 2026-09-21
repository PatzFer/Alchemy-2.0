import { AppState } from '../storage';
import {
  ContextPrivacyScope,
  AssembledBrainContext,
  BrainContextLayer1Identity,
  BrainContextLayer2Preferences,
  BrainContextLayer3CurrentState,
  BrainContextLayer4Goals,
  BrainContextLayer5History,
  BrainContextLayer6External,
  MemoryItem,
} from './types';

/**
 * CONTEXT ENGINE
 * 
 * Implements the 6-Layer Architecture and strict Privacy Firewall.
 * It selects only the context relevant to the requested scope,
 * strictly quarantines sensitive private data from business modules,
 * and ensures no business data leaks into private personal realms.
 */
export function buildBrainContext(
  state: AppState,
  scope: ContextPrivacyScope = 'balanced',
  targetDate: string = new Date().toISOString().split('T')[0]
): AssembledBrainContext {
  const isPersonalScope = scope === 'personal' || scope === 'meals' || scope === 'styling' || scope === 'movement';
  const isMarilunaScope = scope === 'mariluna';

  // -------------------------------------------------------------
  // LAYER 1: IDENTITY (Who is Patz? Foundation Source of Truth)
  // -------------------------------------------------------------
  const foundation = state.foundation;
  const identity: BrainContextLayer1Identity = {
    name: foundation?.patzIdentity?.preferredName || foundation?.aboutYou?.name || 'Patricia',
    preferredLanguage: foundation?.aboutYou?.preferredLanguage || 'nl',
    roots: foundation?.patzIdentity?.heritage || foundation?.patzIdentity?.bornIn || 'Portugal / België',
    communicationStyle: foundation?.communication?.preferredTone || 'Kort, direct, warm, praktisch',
    personalValues: ['Rust', 'Vrijheid', 'Schoonheid'],
    planningPreference: foundation?.planning?.avoidUnrealisticPlanning ? 'Ruim, ongehaast, met ademruimte' : 'Gestructureerd',
  };

  // -------------------------------------------------------------
  // LAYER 2: PREFERENCES
  // -------------------------------------------------------------
  const foodProfile = foundation?.foodProfile;
  const foodDislikesList = [
    ...(foodProfile?.dislikes || []),
    ...(foodProfile?.noCouscousRule ? ['Couscous'] : []),
    ...(foodProfile?.noQuinoaRule ? ['Quinoa'] : []),
    ...(foodProfile?.noRawVegetablesRule ? ['Rauwe groenten'] : []),
    ...(foodProfile?.allergies || []),
    ...(foodProfile?.intolerances || []),
  ];

  const preferences: BrainContextLayer2Preferences = {
    foodDislikes: isMarilunaScope ? [] : foodDislikesList.length > 0 ? foodDislikesList : [
      'Fruit', 'Rauwe groenten', 'Yoghurt', 'Smoothies', 'Komkommer',
      'Couscous', 'Quinoa', 'Havermout', 'Noten in warme maaltijden', 'Linzen', 'Kabeljauw'
    ],
    foodFavorites: isMarilunaScope ? [] : (foodProfile?.likes && foodProfile.likes.length > 0) ? foodProfile.likes : ['Vlees', 'Gestoofde groenten', 'Puree', 'Slowcooker gerechten'],
    cuisineStyles: isMarilunaScope ? [] : [
      foodProfile?.cuisineHierarchy?.primary,
      foodProfile?.cuisineHierarchy?.secondary,
      foodProfile?.cuisineHierarchy?.tertiary,
    ].filter(Boolean) as string[],
    diningSetting: isMarilunaScope ? '' : (foodProfile?.kitchenNotes || 'Samen met partner'),
    styleDNA: isMarilunaScope ? '' : (foundation?.personalStyling?.styleDNA?.essence || 'Understated elegance, structured, neutral tones'),
    workContexts: (foundation?.work?.workContexts || []).map((w) => ({
      name: w.name,
      days: w.workdays,
      hours: `${w.startTime}–${w.endTime}`,
    })),
  };

  // -------------------------------------------------------------
  // LAYER 3: CURRENT STATE (Today, Agenda, Tasks, Capaciteit)
  // -------------------------------------------------------------
  const todayEvents = (state.calendarEvents || []).filter((e) => e.date === targetDate);
  const relevantEvents = todayEvents.filter((e) => {
    if (isMarilunaScope) return e.realm === 'mariluna';
    if (isPersonalScope) return e.realm === 'personal';
    return true;
  });

  // Calculate busy minutes
  let busyMinutes = 0;
  relevantEvents.forEach((ev) => {
    if (ev.startTime && ev.endTime) {
      const [sh, sm] = ev.startTime.split(':').map(Number);
      const [eh, em] = ev.endTime.split(':').map(Number);
      const dur = (eh * 60 + em) - (sh * 60 + sm);
      if (dur > 0) busyMinutes += dur;
    }
  });
  const freeMinutes = Math.max(0, 480 - busyMinutes); // 8-hour nominal container

  // Today's Check-In
  const todayCheckIn = (state.dailyCheckIns || []).find((c) => c.date === targetDate);
  let capacityLevel: 'high' | 'normal' | 'reduced' | 'minimal' = 'normal';
  if (todayCheckIn?.feeling === 'sick') capacityLevel = 'minimal';
  else if (todayCheckIn?.feeling === 'lower' || todayCheckIn?.feeling === 'mentally_heavy') capacityLevel = 'reduced';
  else if (freeMinutes < 90) capacityLevel = 'reduced';
  else if (freeMinutes >= 240 && todayCheckIn?.feeling === 'good') capacityLevel = 'high';

  // Tasks
  const openTasks = (state.tasks || [])
    .filter((t) => t.status !== 'completed')
    .filter((t) => {
      if (isMarilunaScope) return t.realm === 'mariluna';
      if (isPersonalScope) return t.realm === 'personal';
      return true;
    });

  const priorityTasksCount = openTasks.filter((t) => t.priority === 'high').length;

  // Dinner status (only if personal or balanced scope)
  let dinnerPlanned = false;
  let dinnerRecipeName: string | undefined;
  if (!isMarilunaScope) {
    const plannedDay = state.nutrition?.activeWeeklyPlan?.days?.find((d) => d.date === targetDate);
    if (plannedDay && plannedDay.recipeId) {
      dinnerPlanned = true;
      dinnerRecipeName = plannedDay.customMealName || 'Gepland recept';
    }
  }

  // Mariluna business state (only if mariluna or balanced scope)
  const activeProjectsCount = isPersonalScope ? 0 : (state.projects || []).filter((p) => p.status === 'active').length;
  const urgentDeadlinesCount = isPersonalScope
    ? 0
    : (state.marilunaAdmin?.deadlines || []).filter((d) => !d.completed).length;

  const currentState: BrainContextLayer3CurrentState = {
    date: targetDate,
    capacityLevel,
    checkInFeeling: isMarilunaScope ? undefined : todayCheckIn?.feeling,
    freeMinutesToday: freeMinutes,
    busyMinutesToday: busyMinutes,
    appointmentsCount: relevantEvents.length,
    scheduledEvents: relevantEvents.map((e) => ({
      title: e.title,
      time: `${e.startTime}–${e.endTime}`,
      realm: e.realm,
    })),
    priorityTasksCount,
    openTasks: openTasks.slice(0, 5).map((t) => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      estimatedDuration: t.estimatedDuration || 30,
      realm: t.realm,
    })),
    dinnerPlanned,
    dinnerRecipeName,
    activeProjectsCount,
    urgentDeadlinesCount,
  };

  // -------------------------------------------------------------
  // LAYER 4: GOALS
  // -------------------------------------------------------------
  const activeGoals = (state.goals || [])
    .filter((g) => g.status === 'active')
    .filter((g) => {
      if (isMarilunaScope) return g.realm === 'mariluna';
      if (isPersonalScope) return g.realm === 'personal';
      return true;
    })
    .map((g) => ({
      id: g.id,
      title: g.title,
      realm: g.realm,
      progress: g.progress,
    }));

  const goals: BrainContextLayer4Goals = {
    activeGoals,
  };

  // -------------------------------------------------------------
  // LAYER 5: HISTORY
  // -------------------------------------------------------------
  const recentMeals = isMarilunaScope
    ? []
    : (state.nutrition?.mealHistory || []).slice(0, 3).map((m) => m.recipeName);

  const recentMovement = isMarilunaScope
    ? []
    : (state.wellbeing?.movementHistory || []).slice(0, 3).map((m) => `${m.title} (${m.plannedDurationMins}m)`);

  const history: BrainContextLayer5History = {
    recentMealNames: recentMeals,
    recentMovementSessions: recentMovement,
  };

  // -------------------------------------------------------------
  // LAYER 6: EXTERNAL CONTEXT
  // -------------------------------------------------------------
  const integrations = state.integrations;
  const external: BrainContextLayer6External = {
    googleCalendarConnected: integrations?.calendar?.status === 'connected',
    marilunaGmailConnected: isPersonalScope ? false : integrations?.gmail?.status === 'connected',
    instagramConnected: isPersonalScope ? false : integrations?.instagram?.status === 'connected',
    healthConnectConnected: isMarilunaScope ? false : integrations?.healthConnect?.status === 'connected',
    todaySteps: isMarilunaScope ? undefined : (integrations?.healthConnect?.todaySteps ?? integrations?.healthConnect?.stepsToday),
    unreadBusinessInquiriesCount: isPersonalScope
      ? 0
      : (integrations?.gmail?.messages || []).filter((m) => m.unread).length,
  };

  // -------------------------------------------------------------
  // RELEVANT MEMORIES (Filtered by Scope & Privacy)
  // -------------------------------------------------------------
  const relevantMemories = (state.memories || []).filter((m) => {
    if (m.status === 'archived') return false;
    if (isMarilunaScope) return m.realm === 'mariluna';
    if (isPersonalScope) return m.realm === 'personal';
    return true;
  });

  return {
    scope,
    layer1Identity: identity,
    layer2Preferences: preferences,
    layer3CurrentState: currentState,
    layer4Goals: goals,
    layer5History: history,
    layer6External: external,
    relevantMemories,
  };
}
