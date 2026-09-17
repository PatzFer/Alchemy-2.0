import {
  FoundationData,
  WorkContext,
  FoundationGoalItem,
  LifeProfile,
  Goal,
  CycleProfile,
  WellbeingState,
  Language,
} from '../types';

export const DEFAULT_FOUNDATION_DATA: FoundationData = {
  isCompleted: false,
  isSkipped: false,
  currentStep: 1,
  completedSteps: [],
  configuredSections: [],
  skippedSections: [],
  aboutYou: {
    name: '',
    dateOfBirth: '',
    preferredLanguage: 'nl',
  },
  yourLife: {
    dailyRhythm: 'Gebalanceerd dagritme',
    typicalAvailableTime: '2-3 uur persoonlijke tijd',
    recurringCommitments: [],
    personalRoutines: [],
    planningRestPeriods: ['Stille avonden', 'Ontspannen weekenden'],
    notes: '',
  },
  work: {
    workContexts: [],
  },
  goals: {
    goals: [],
  },
  wellbeing: {
    trackPhotos: false,
    wellbeingGoals: [],
    movementPreferences: ['Wandelen'],
    regularActivities: [],
    measurementFrequency: 'weekly',
  },
  nutrition: {
    enjoyedFoods: [],
    dislikedFoods: [],
    allergies: [],
    dietaryRestrictions: [],
    avoidedFoods: [],
    eatingPattern: 'Regelmatige maaltijden',
    cookingTimeMinutes: 30,
    diningSetting: 'flexible',
    kitchenNotes: '',
  },
  cycle: {
    enabled: false,
    averageCycleLength: 28,
    averagePeriodLength: 5,
    cycleInfluencesPlanning: true,
    cycleHistoryNotes: '',
  },
  mariluna: {
    enabled: false,
    businessGoals: [],
    services: [],
    products: [],
    projects: [],
    contentAreas: [],
    platforms: [],
    recurringActivities: [],
    importantDeadlines: [],
  },
  ai: {
    communicationStyle: 'warm_supportive',
    proactivity: 'balanced',
    suggestActions: true,
    helpPrioritize: true,
    challengeAssumptions: false,
    rescheduleUnfinished: true,
    surfacePatterns: true,
  },
  notifications: {
    categories: {
      tasks: true,
      calendar: true,
      goals: false,
      wellbeing: false,
      nutrition: false,
      cycle: false,
      mariluna: false,
      reviewsInsights: false,
    },
    quietHoursStart: '21:30',
    quietHoursEnd: '08:30',
    frequency: 'sparse',
    permissions: {
      calendarAccess: false,
      externalAiAccess: false,
      isolateMariluna: true,
      requireStepUpSensitive: true,
    },
  },
};

export const ONBOARDING_STEPS = [
  { id: 1, slug: 'about-you', titleNl: 'Over jou', titleEn: 'About You', optional: false },
  { id: 2, slug: 'your-life', titleNl: 'Jouw leven', titleEn: 'Your Life', optional: true },
  { id: 3, slug: 'work', titleNl: 'Werk', titleEn: 'Work', optional: true },
  { id: 4, slug: 'goals', titleNl: 'Doelen', titleEn: 'Goals', optional: true },
  { id: 5, slug: 'wellbeing', titleNl: 'Welzijn', titleEn: 'Wellbeing', optional: true },
  { id: 6, slug: 'nutrition', titleNl: 'Voeding', titleEn: 'Nutrition', optional: true },
  { id: 7, slug: 'cycle', titleNl: 'Cyclus', titleEn: 'Cycle', optional: true },
  { id: 8, slug: 'mariluna', titleNl: 'Mariluna', titleEn: 'Mariluna', optional: true },
  { id: 9, slug: 'your-ai', titleNl: 'Jouw AI', titleEn: 'Your AI', optional: true },
  { id: 10, slug: 'notifications', titleNl: 'Meldingen & Toestemmingen', titleEn: 'Notifications & Permissions', optional: true },
];

/**
 * Synchronizes foundation configuration into domain states (LifeProfile, Goals, CycleProfile, Wellbeing)
 */
export function syncFoundationData(
  foundation: FoundationData,
  prevLifeProfile: LifeProfile,
  prevGoals: Goal[],
  prevCycleProfile: CycleProfile,
  prevWellbeing: WellbeingState
): {
  lifeProfile: LifeProfile;
  goals: Goal[];
  cycleProfile: CycleProfile;
  wellbeing: WellbeingState;
} {
  // 1. Work contexts to LifeProfile
  const primaryWork = foundation.work.workContexts[0];
  const lifeProfile: LifeProfile = {
    ...prevLifeProfile,
    workingDays: primaryWork ? primaryWork.workdays : prevLifeProfile.workingDays || [],
    workingHoursStart: primaryWork ? primaryWork.startTime : prevLifeProfile.workingHoursStart || '09:00',
    workingHoursEnd: primaryWork ? primaryWork.endTime : prevLifeProfile.workingHoursEnd || '17:00',
    commuteTimeMinutes: primaryWork?.commuteMinutes || 0,
    commitments: [
      ...foundation.yourLife.recurringCommitments.map((c, i) => ({
        id: `fc-${i + 1}`,
        title: c,
        dayOfWeek: 'Vrijdag',
        startTime: '10:00',
        endTime: '11:00',
        recurrence: 'recurring' as const,
        realm: 'personal' as const,
      })),
    ],
    routines: [
      ...foundation.yourLife.personalRoutines.map((r, i) => ({
        id: `fr-${i + 1}`,
        title: r,
        timeOfDay: 'morning' as const,
        durationMinutes: 20,
        recurrence: 'recurring' as const,
        realm: 'personal' as const,
      })),
    ],
  };

  // 2. Goals sync: only real user goals entered in Foundation
  const syncedGoals: Goal[] = [
    ...prevGoals,
    ...foundation.goals.goals
      .filter((fg) => !prevGoals.some((pg) => pg.id === fg.id || pg.title.toLowerCase() === fg.name.toLowerCase()))
      .map((fg) => ({
        id: fg.id || `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: fg.name,
        description: fg.description || '',
        realm: fg.domain === 'mariluna' ? ('mariluna' as const) : ('personal' as const),
        timeframe: 'quarterly' as const,
        progress: 0,
        targetDate: fg.targetDate || '',
        connectedTaskIds: [],
        connectedProjectIds: [],
        milestones: [],
      })),
  ];

  // 3. Cycle profile sync
  const cycleProfile: CycleProfile = {
    ...prevCycleProfile,
    trackingEnabled: foundation.cycle.enabled,
    lastPeriodStartDate: foundation.cycle.lastPeriodStart || prevCycleProfile.lastPeriodStartDate || '',
    averageCycleLength: foundation.cycle.averageCycleLength || 28,
    averagePeriodLength: foundation.cycle.averagePeriodLength || 5,
    privacyLocked: true,
    lastUpdated: new Date().toISOString(),
  };

  // 4. Wellbeing state sync
  let updatedProgressLogs = [...(prevWellbeing.progressLogs || [])];
  if (
    foundation.wellbeing.currentWeightKg ||
    foundation.wellbeing.waistCm ||
    foundation.wellbeing.hipsCm ||
    foundation.wellbeing.chestCm
  ) {
    const todayStr = new Date().toISOString().split('T')[0];
    const existingToday = updatedProgressLogs.find((p) => p.date === todayStr);
    if (!existingToday) {
      updatedProgressLogs.unshift({
        id: `pl-foundation-${Date.now()}`,
        date: todayStr,
        weightKg: foundation.wellbeing.currentWeightKg,
        measurements: {
          waistCm: foundation.wellbeing.waistCm,
          hipsCm: foundation.wellbeing.hipsCm,
          chestCm: foundation.wellbeing.chestCm,
        },
        recordedFact: 'Initiële startmeting vastgelegd tijdens fundament configuratie.',
      });
    }
  }

  const wellbeing: WellbeingState = {
    ...prevWellbeing,
    progressLogs: updatedProgressLogs,
    preferences: {
      ...prevWellbeing.preferences,
      foodPreferences: {
        ...prevWellbeing.preferences?.foodPreferences,
        dietaryStyle: foundation.nutrition.dietaryRestrictions.join(', ') || prevWellbeing.preferences?.foodPreferences?.dietaryStyle,
        exclusions: foundation.nutrition.avoidedFoods || [],
        quickPrepWeekdaysMaxMinutes: foundation.nutrition.cookingTimeMinutes || 30,
      },
      movementPreferences: {
        ...prevWellbeing.preferences?.movementPreferences,
        preferredTypes: foundation.wellbeing.movementPreferences.length > 0
          ? foundation.wellbeing.movementPreferences
          : prevWellbeing.preferences?.movementPreferences?.preferredTypes || [],
      },
    },
  };

  return {
    lifeProfile,
    goals: syncedGoals,
    cycleProfile,
    wellbeing,
  };
}

export function applyFoundationToAppState(
  appStateOrFoundation: any,
  foundationOrLifeProfile?: any,
  prevGoals?: Goal[],
  prevCycleProfile?: CycleProfile,
  prevWellbeing?: WellbeingState
): any {
  if (appStateOrFoundation && 'tasks' in appStateOrFoundation && foundationOrLifeProfile) {
    const appState = appStateOrFoundation;
    const foundation: FoundationData = foundationOrLifeProfile;
    const res = syncFoundationData(
      foundation,
      appState.lifeProfile,
      appState.goals,
      appState.cycleProfile,
      appState.wellbeing
    );
    return {
      ...appState,
      lifeProfile: res.lifeProfile,
      goals: res.goals,
      cycleProfile: res.cycleProfile,
      wellbeing: res.wellbeing,
    };
  }

  return syncFoundationData(
    appStateOrFoundation as FoundationData,
    foundationOrLifeProfile as LifeProfile,
    prevGoals || [],
    prevCycleProfile || ({} as CycleProfile),
    prevWellbeing || ({} as WellbeingState)
  );
}
