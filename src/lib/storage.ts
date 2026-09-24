import {
  Task,
  Goal,
  Idea,
  Project,
  CalendarEvent,
  LifeProfile,
  MemoryItem,
  ContentPlan,
  AssistantMessage,
  PersonalStyleState,
  NutritionState,
  CycleProfile,
  DailyCheckIn,
  NotificationSettings,
  SmartNotification,
  ProactiveSuggestion,
  WellbeingState,
  FoundationData,
  MarilunaAdminState,
  MarilunaMetricsState,
  MarilunaOffering,
  MarilunaClient,
  IntegrationsState,
  BrainState,
} from '../types';
import { DEFAULT_NOTIFICATION_SETTINGS } from './notificationEngine';
import { INITIAL_WELLBEING_STATE, EMPTY_WELLBEING_STATE } from './wellbeingData';
import { DEFAULT_FOUNDATION_DATA } from './foundationDefaults';
import { DEFAULT_BRAIN_STATE } from './brain/types';

const STORAGE_KEY = 'pm_alchemy_os_data_v1';
const LEGACY_STORAGE_KEY = 'mariluna_os_data_v1';

export const DEFAULT_INTEGRATIONS_STATE: IntegrationsState = {
  calendar: {
    status: 'not_connected',
    accountEmail: undefined,
    lastSync: undefined,
    readOnly: true,
    syncedEventsCount: 0,
    isPatriciaOnlySchedule: true,
  },
  gmail: {
    status: 'not_connected',
    accountEmail: undefined,
    lastSync: undefined,
    readOnly: true,
    businessOnly: true,
    syncedThreadsCount: 0,
    messages: [],
  },
  healthConnect: {
    status: typeof window !== 'undefined' && ('HealthConnect' in window || (typeof navigator !== 'undefined' && navigator.userAgent.includes('Android'))) ? 'not_connected' : 'unavailable',
    platform: typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.userAgent.includes('Android') ? 'android' : 'web',
    isStepsOnly: true,
    isPrivateOnly: true,
    stepsToday: undefined,
  },
  instagram: {
    status: 'not_connected',
    accountUsername: undefined,
    accountType: 'business',
    posts: [],
  },
  pushNotifications: {
    enabled: true,
    permission: typeof window !== 'undefined' && 'Notification' in window ? (Notification.permission as 'default' | 'granted' | 'denied') : 'default',
  },
};

export interface AppState {
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  projects: Project[];
  calendarEvents: CalendarEvent[];
  lifeProfile: LifeProfile;
  memories: MemoryItem[];
  contentPlan: ContentPlan;
  chatHistory: AssistantMessage[];
  personalStyle: PersonalStyleState;
  nutrition: NutritionState;
  cycleProfile: CycleProfile;
  dailyCheckIns: DailyCheckIn[];
  wellbeing: WellbeingState;
  notificationSettings: NotificationSettings;
  notifications: SmartNotification[];
  proactiveSuggestions: ProactiveSuggestion[];
  isSampleData: boolean;
  foundation: FoundationData;
  setupStatus: 'not_started' | 'in_progress' | 'skipped' | 'completed';
  marilunaAdmin?: MarilunaAdminState;
  marilunaMetrics?: MarilunaMetricsState;
  marilunaOfferings?: MarilunaOffering[];
  marilunaClients?: MarilunaClient[];
  integrations: IntegrationsState;
  brain?: BrainState;
}

const todayStr = new Date().toISOString().split('T')[0];

export const INITIAL_STATE: AppState = {
  isSampleData: false,
  setupStatus: 'not_started',
  foundation: DEFAULT_FOUNDATION_DATA,
  tasks: [],
  goals: [],
  ideas: [],
  projects: [],
  calendarEvents: [],
  lifeProfile: {
    workingDays: [],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    commuteTimeMinutes: 0,
    routines: [],
    commitments: [],
    preferences: {
      energyPeak: 'morning',
      protectEvenings: true,
      maxHighPriorityTasksPerDay: 3,
      bufferTimeBetweenTasksMinutes: 15,
      unhurriedMorningRitual: true,
    },
  },
  memories: [],
  contentPlan: {
    quarterTheme: '',
    monthlyTheme: '',
    pillars: [],
    monthlyTargetCount: 0,
    posts: [],
  },
  chatHistory: [],
  personalStyle: {
    colorPalette: [],
    preferredSilhouettes: [],
    dislikedStyles: [],
    measurementsNotes: '',
    occasions: [],
  },
  nutrition: {
    dietaryNotes: '',
    dislikes: [],
    partnerSharedDinners: [],
    cookingTimeAvailableWeekdays: 30,
    inventory: [],
    shoppingList: [],
    feedbackHistory: [],
    mealHistory: [],
    pastWeeklyPlans: [],
  },
  cycleProfile: {
    lastPeriodStartDate: '',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    history: [],
    trackingEnabled: false,
    privacyLocked: true,
    lastUpdated: new Date().toISOString(),
  },
  dailyCheckIns: [],
  wellbeing: EMPTY_WELLBEING_STATE,
  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
  notifications: [],
  proactiveSuggestions: [],
  marilunaAdmin: {
    items: [],
    expenses: [],
    invoices: [],
    deadlines: [],
  },
  marilunaMetrics: {
    metrics: [],
    records: [],
  },
  marilunaOfferings: [],
  marilunaClients: [],
  integrations: DEFAULT_INTEGRATIONS_STATE,
  brain: DEFAULT_BRAIN_STATE,
};

export const SAMPLE_STATE: AppState = {
  isSampleData: true,
  setupStatus: 'completed',
  foundation: {
    ...DEFAULT_FOUNDATION_DATA,
    isCompleted: true,
    aboutYou: {
      name: 'Patricia',
      preferredLanguage: 'nl',
    },
  },
  tasks: [
    {
      id: 't-1',
      title: 'Brainstorm "Sovereignty" content pillar',
      description: 'Develop 3 distinct perspectives on feminine sovereignty in modern leadership.',
      realm: 'mariluna',
      category: 'content',
      priority: 'high',
      dueDate: todayStr,
      estimatedDuration: 45,
      recurring: 'weekly',
      status: 'todo',
      subtasks: [
        { id: 'st-1', title: 'Review autumn quarter theme manifesto', completed: true },
        { id: 'st-2', title: 'Outline newsletter essay', completed: false },
        { id: 'st-3', title: 'Draft carousel script', completed: false },
      ],
      createdAt: '2026-09-14',
    },
    {
      id: 't-2',
      title: 'Afternoon coastal swim & breathwork',
      description: 'Unhurried reset before transitioning to evening me-time.',
      realm: 'personal',
      category: 'exercise',
      priority: 'high',
      dueDate: todayStr,
      estimatedDuration: 50,
      recurring: 'weekly',
      status: 'todo',
      subtasks: [],
      createdAt: '2026-09-15',
    },
    {
      id: 't-3',
      title: 'Review bespoke client proposal for Atelier',
      description: 'Confirm scope, deliverables, and retainers before Thursday dispatch.',
      realm: 'mariluna',
      category: 'clients',
      priority: 'medium',
      dueDate: todayStr,
      estimatedDuration: 30,
      recurring: 'none',
      status: 'in_progress',
      subtasks: [
        { id: 'st-4', title: 'Verify timeline milestones', completed: true },
        { id: 'st-5', title: 'Export PDF with custom typography', completed: false },
      ],
      createdAt: '2026-09-15',
    },
    {
      id: 't-4',
      title: 'Read 25 pages of aesthetic philosophy',
      description: 'Part of monthly reading goal. Keep tea brewed, phone in airplane mode.',
      realm: 'personal',
      category: 'reading',
      priority: 'medium',
      dueDate: todayStr,
      estimatedDuration: 25,
      recurring: 'daily',
      status: 'todo',
      subtasks: [],
      createdAt: '2026-09-16',
    },
    {
      id: 't-5',
      title: 'Reorganize seasonal wardrobe & capsule items',
      description: 'Clear visual clutter; prepare pieces for tailoring.',
      realm: 'personal',
      category: 'household',
      priority: 'low',
      dueDate: '2026-09-15', // Past date to demonstrate gentle missed task handling
      estimatedDuration: 60,
      recurring: 'none',
      status: 'todo',
      missed: true,
      rescheduleSuggestion: 'You were in deep client focus yesterday. Would you like to move this to Saturday morning at 10:30?',
      subtasks: [],
      createdAt: '2026-09-13',
    },
    {
      id: 't-6',
      title: 'Review quarterly revenue & webshop analytics',
      description: 'Evaluate course pre-orders and inventory margin balance.',
      realm: 'mariluna',
      category: 'finances',
      priority: 'medium',
      dueDate: '2026-09-18',
      estimatedDuration: 40,
      recurring: 'monthly',
      status: 'todo',
      subtasks: [],
      createdAt: '2026-09-16',
    },
  ],

  goals: [
    {
      id: 'g-1',
      title: 'Launch "The Sovereign Woman" Master Workshop',
      description: 'A cohort experience integrating personal sovereignty and creative entrepreneurship.',
      realm: 'mariluna',
      timeframe: 'quarterly',
      progress: 65,
      targetDate: '2026-11-15',
      connectedTaskIds: ['t-1', 't-3'],
      connectedProjectIds: ['p-1'],
      milestones: [
        { id: 'm-1', title: 'Finalize curriculum modules', completed: true, suggestedDay: 'Completed' },
        { id: 'm-2', title: 'Open private waitlist page', completed: true, suggestedDay: 'Completed' },
        { id: 'm-3', title: 'Record foundational video prologue', completed: false, suggestedDay: 'Next Tuesday', durationMins: 90 },
        { id: 'm-4', title: 'Host live invitation masterclass', completed: false, suggestedDay: 'October 12', durationMins: 60 },
      ],
    },
    {
      id: 'g-2',
      title: 'Read two formative books this month',
      description: 'Dedicate quiet morning/evening reading rituals without digital interruption.',
      realm: 'personal',
      timeframe: 'monthly',
      progress: 40,
      targetDate: '2026-09-30',
      connectedTaskIds: ['t-4'],
      connectedProjectIds: [],
      milestones: [
        { id: 'm-5', title: 'Read 15 minutes Tuesday evening', completed: true, suggestedDay: 'Tue' },
        { id: 'm-6', title: 'Read 25 minutes Thursday afternoon', completed: false, suggestedDay: 'Thu' },
        { id: 'm-7', title: 'Read 40 minutes Sunday sanctuary morning', completed: false, suggestedDay: 'Sun' },
      ],
    },
    {
      id: 'g-3',
      title: 'Harmonious Physical Vitality',
      description: '3 weekly movement sessions honoring energy cycles rather than exhaustive regimens.',
      realm: 'personal',
      timeframe: 'weekly',
      progress: 66,
      targetDate: '2026-09-20',
      connectedTaskIds: ['t-2'],
      connectedProjectIds: [],
      milestones: [
        { id: 'm-8', title: 'Ocean/pool swim', completed: true },
        { id: 'm-9', title: 'Pilates reformer & mobility', completed: true },
        { id: 'm-10', title: 'Gentle nature trail walk', completed: false, suggestedDay: 'Friday' },
      ],
    },
  ],

  ideas: [
    {
      id: 'i-1',
      title: 'Bespoke sensory audio rituals for Mariluna clients',
      content: 'Maybe I could create subtle soundscapes and contemplative audio guides to accompany our tactile wellness products.',
      realm: 'mariluna',
      category: 'product',
      status: 'exploring',
      createdAt: '2026-08-01', // 6 weeks ago to illustrate proactive assistant revisiting
      lastRevisitedAt: '2026-08-01',
      aiSummary: 'Sensory acoustic extension for the Mariluna physical product line.',
      suggestedNextStep: 'Draft a 1-page sample script for the foundational sunrise ritual.',
      followUpQuestions: [
        'Would this be packaged as an exclusive digital companion with physical shipments?',
        'Does this fit the current "Sovereignty" quarter theme?',
      ],
    },
    {
      id: 'i-2',
      title: 'Autumn capsule wardrobe color palette study',
      content: 'Earthy travertine, soft bone, smoky oyster, and burnished bronze accents. High tactile texture like silk wool and brushed linen.',
      realm: 'personal',
      category: 'personal style',
      status: 'raw',
      createdAt: '2026-09-10',
      lastRevisitedAt: '2026-09-10',
      aiSummary: 'Personal seasonal wardrobe curation in muted travertine and bronze.',
    },
    {
      id: 'i-3',
      title: 'Private executive salon in Lisbon',
      content: 'An intimate 8-person salon dinner on female agency, wealth sovereignty, and conscious enterprise.',
      realm: 'mariluna',
      category: 'services',
      status: 'raw',
      createdAt: '2026-09-12',
      lastRevisitedAt: '2026-09-12',
      aiSummary: 'High-touch in-person intimate dinner gathering for visionary clients.',
    },
  ],

  projects: [
    {
      id: 'p-1',
      title: 'Sovereign Woman Master Experience',
      description: 'The premier Mariluna flagship educational offering for Q4.',
      realm: 'mariluna',
      status: 'active',
      deadline: '2026-11-15',
      progress: 60,
      notes: 'Ensure visual identity matches quiet luxury editorial aesthetic.',
      taskIds: ['t-1', 't-3'],
      ideaIds: ['i-1'],
    },
    {
      id: 'p-2',
      title: 'Home Sanctuary & Library Curation',
      description: 'Curating the reading lounge into an intentional, screen-free sanctuary.',
      realm: 'personal',
      status: 'active',
      deadline: '2026-10-01',
      progress: 45,
      notes: 'Soft lighting, travertine vessels, linen throw blankets.',
      taskIds: ['t-5'],
      ideaIds: ['i-2'],
    },
  ],

  calendarEvents: [
    {
      id: 'e-1',
      title: 'Scheduled Workday Block',
      startTime: '09:00',
      endTime: '16:30',
      date: todayStr,
      realm: 'mariluna',
      type: 'work',
      location: 'Mariluna Atelier / Studio',
    },
    {
      id: 'e-2',
      title: 'Client Vision Alignment (Atelier)',
      startTime: '11:00',
      endTime: '11:45',
      date: todayStr,
      realm: 'mariluna',
      type: 'appointment',
      location: 'Virtual Chamber',
    },
    {
      id: 'e-3',
      title: 'Ocean Swim & Salt Reset',
      startTime: '17:00',
      endTime: '17:50',
      date: todayStr,
      realm: 'personal',
      type: 'me_time',
      location: 'Cove Beach',
    },
    {
      id: 'e-4',
      title: 'Evening Sanctuary & Reading',
      startTime: '20:30',
      endTime: '21:30',
      date: todayStr,
      realm: 'personal',
      type: 'routine',
      location: 'Home Library',
    },
  ],

  lifeProfile: {
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    workingHoursStart: '09:00',
    workingHoursEnd: '16:30',
    commuteTimeMinutes: 20,
    routines: [
      {
        id: 'r-1',
        title: 'Sensory Tea & Morning Journaling',
        timeOfDay: 'morning',
        durationMinutes: 30,
        recurrence: 'permanent',
        realm: 'personal',
      },
      {
        id: 'r-2',
        title: 'Deep Mariluna Strategy Sprint',
        timeOfDay: 'morning',
        durationMinutes: 90,
        recurrence: 'recurring',
        realm: 'mariluna',
      },
      {
        id: 'r-3',
        title: 'Digital Sunset & Evening Bathing Ritual',
        timeOfDay: 'evening',
        durationMinutes: 45,
        recurrence: 'permanent',
        realm: 'personal',
      },
    ],
    commitments: [
      {
        id: 'c-1',
        title: 'Weekly Mariluna Operational Review',
        dayOfWeek: 'Monday',
        startTime: '09:30',
        endTime: '10:30',
        recurrence: 'recurring',
        realm: 'mariluna',
      },
      {
        id: 'c-2',
        title: 'Pilates & Structural Movement',
        dayOfWeek: 'Wednesday',
        startTime: '07:30',
        endTime: '08:30',
        recurrence: 'recurring',
        realm: 'personal',
      },
      {
        id: 'c-3',
        title: 'Friday Afternoon Studio Decompression',
        dayOfWeek: 'Friday',
        startTime: '15:30',
        endTime: '16:30',
        recurrence: 'permanent',
        realm: 'mariluna',
      },
    ],
    preferences: {
      energyPeak: 'morning',
      protectEvenings: true,
      maxHighPriorityTasksPerDay: 3,
      bufferTimeBetweenTasksMinutes: 25,
      unhurriedMorningRitual: true,
    },
  },

  memories: [
    {
      id: 'm-1',
      category: 'Lifestyle & Energy',
      content: 'Prefers quiet, screen-free evenings after 19:30; creative focus peaks between 09:30 and 12:30.',
      realm: 'personal',
      dateAdded: '2026-09-01',
      importance: 'high',
      source: 'user_stated',
    },
    {
      id: 'm-2',
      category: 'Brand Ethos',
      content: 'Mariluna stands for sovereignty, aesthetic refinement, unhurried mastery, and grounded luxury.',
      realm: 'mariluna',
      dateAdded: '2026-09-02',
      importance: 'high',
      source: 'user_stated',
    },
    {
      id: 'm-3',
      category: 'Working Hours',
      content: 'Strict boundary: official working hours end at 16:30 to avoid cognitive exhaustion.',
      realm: 'personal',
      dateAdded: '2026-09-05',
      importance: 'high',
      source: 'user_stated',
    },
    {
      id: 'm-4',
      category: 'Strategic Rhythm',
      content: 'Enjoys grouping client meetings on Tuesdays and Thursdays, leaving Mondays and Wednesdays for deep creation.',
      realm: 'mariluna',
      dateAdded: '2026-09-10',
      importance: 'medium',
      source: 'ai_inferred',
    },
  ],

  contentPlan: {
    quarterTheme: 'Sovereignty & Grounded Power',
    monthlyTheme: 'The Art of Unhurried Mastery',
    pillars: ['Sovereignty & Agency', 'Aesthetic Rituals', 'Client Chronicles', 'The Living Studio'],
    monthlyTargetCount: 8,
    posts: [
      {
        id: 'cp-1',
        title: 'Why hurried urgency is the enemy of true luxury',
        platform: 'Newsletter',
        status: 'ready',
        scheduledDate: '2026-09-18',
        pillar: 'Sovereignty & Agency',
        notes: 'Long-form editorial essay with custom photographic stills.',
      },
      {
        id: 'cp-2',
        title: '5 boundaries that preserved my creative clarity this season',
        platform: 'Instagram',
        status: 'drafted',
        scheduledDate: '2026-09-20',
        pillar: 'Aesthetic Rituals',
      },
      {
        id: 'cp-3',
        title: 'Behind the atelier: designing the Sovereign Masterclass',
        platform: 'Journal / Blog',
        status: 'idea',
        pillar: 'The Living Studio',
      },
    ],
  },

  chatHistory: [
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Good morning. The studio is calm today.

You have official working hours until 16:30, with one client alignment at 11:00. Your afternoon ocean swim is safely protected at 17:00. 

I've gently kept your active high-priority task list to just two items today so you have spacious cognitive breathing room. How would you like to direct our focus?`,
      timestamp: '2026-09-16T08:15:00.000Z',
    },
  ],

  personalStyle: {
    colorPalette: [
      { name: 'Warm Travertine', hex: '#EAE5DB', role: 'Foundation' },
      { name: 'Oyster Bone', hex: '#F4F1EA', role: 'Neutral' },
      { name: 'Burnished Bronze', hex: '#8C7051', role: 'Accent' },
      { name: 'Mineral Obsidian', hex: '#23201D', role: 'Structure' },
    ],
    preferredSilhouettes: ['Tailored column trousers', 'Fluid silk blouses', 'Structured cashmere overcoats', 'Minimalist leather loafers'],
    dislikedStyles: ['Synthetic neon prints', 'Fussy ruffles', 'Stiff uncomfortable denim'],
    measurementsNotes: 'Preference for relaxed tailoring with drape; high waistline with floor-length trouser breaks.',
    occasions: ['Studio Creative Days', 'High-Touch Client Dinners', 'Restorative Coastal Weekends'],
  },

  nutrition: {
    dietaryNotes: 'Mediterranean-inspired, seasonal organic produce, high hydration, matcha & mineral broths.',
    dislikes: ['Heavy refined oils', 'Artificially sweetened beverages'],
    partnerSharedDinners: ['Wednesday', 'Friday', 'Sunday'],
    cookingTimeAvailableWeekdays: 35,
    inventory: [],
    shoppingList: [],
    feedbackHistory: [],
    mealHistory: [],
    pastWeeklyPlans: [],
  },

  cycleProfile: {
    lastPeriodStartDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    averageCycleLength: 28,
    averagePeriodLength: 5,
    history: [
      {
        id: 'ce-prev-1',
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Unhurried start, mild day 1 cramping, restorative rest respected.',
        confirmedByUser: true,
      },
      {
        id: 'ce-current',
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Confirmed onset. Transitioned into follicular clarity smoothly.',
        confirmedByUser: true,
      },
    ],
    trackingEnabled: true,
    privacyLocked: true,
    lastUpdated: todayStr,
  },

  dailyCheckIns: [
    {
      id: 'dci-today',
      date: todayStr,
      energy: 'good',
      mood: 'focused',
      hunger: 'normal',
      physicalDiscomfort: 'comfortable',
      notes: 'Clear mental presence after early matcha and breathwork.',
      timestamp: new Date().toISOString(),
    },
  ],

  notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,

  notifications: [
    {
      id: 'sn-welcome',
      category: 'weekly_planning',
      title: 'P & M Alchemy Activated',
      body: 'Your personal AI operating system is configured. Balanced between Personal sanctuary, Cycle intelligence, and Mariluna Studio.',
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'thoughtful',
      targetTab: 'today',
    },
    {
      id: 'sn-cycle-notice',
      category: 'cycle_insight',
      title: 'Cycle Rhythm: Follicular / Creative Momentum',
      body: 'Estimated Day 13 of 28. A gentle, favorable window for strategic ideation and visionary content planning.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'gentle',
      targetTab: 'cycle',
    },
  ],

  proactiveSuggestions: [
    {
      id: 'ps-1',
      title: 'Unfinished Mariluna Ideas Awaiting Review',
      body: 'You have 3 untouched ideas in your Studio Idea Sanctuary. Would you like me to curate them for a relaxed 20-minute review this weekend?',
      reason: 'Ideas have rested untouched for over 14 days.',
      actionLabel: 'Review Ideas',
      actionType: 'review_ideas',
      actionPrompt: 'Let us review my 3 raw Mariluna ideas and suggest which ones to elevate into active projects.',
      createdAt: todayStr,
    },
    {
      id: 'ps-2',
      title: 'Gentle Energy Alignment',
      body: 'Your cycle is approaching the late follicular / ovulatory window. If you wish, we can schedule your upcoming high-touch client proposal review on Thursday morning when your communicative presence is naturally expansive.',
      reason: 'Natural alignment between creative phase and client engagement.',
      actionLabel: 'Propose Adjustment',
      actionType: 'adjust_schedule',
      actionPrompt: 'Suggest how to space out my high-priority client tasks for Thursday based on my energy rhythm.',
      createdAt: todayStr,
    },
  ],
  wellbeing: INITIAL_WELLBEING_STATE,
  integrations: DEFAULT_INTEGRATIONS_STATE,
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);

    const foundation: FoundationData = {
      ...DEFAULT_FOUNDATION_DATA,
      ...(parsed.foundation || {}),
      patzIdentity: { ...DEFAULT_FOUNDATION_DATA.patzIdentity, ...(parsed.foundation?.patzIdentity || {}) },
      astrology: { ...DEFAULT_FOUNDATION_DATA.astrology, ...(parsed.foundation?.astrology || {}) },
      communication: { ...DEFAULT_FOUNDATION_DATA.communication, ...(parsed.foundation?.communication || {}) },
      lifeWork: { ...DEFAULT_FOUNDATION_DATA.lifeWork, ...(parsed.foundation?.lifeWork || {}) },
      planning: { ...DEFAULT_FOUNDATION_DATA.planning, ...(parsed.foundation?.planning || {}) },
      foodProfile: { ...DEFAULT_FOUNDATION_DATA.foodProfile, ...(parsed.foundation?.foodProfile || {}) },
      personalStyling: {
        ...DEFAULT_FOUNDATION_DATA.personalStyling,
        ...(parsed.foundation?.personalStyling || {}),
        bodyProportionsProfile: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.bodyProportionsProfile,
          ...(parsed.foundation?.personalStyling?.bodyProportionsProfile || {}),
        },
        styleDNA: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.styleDNA,
          ...(parsed.foundation?.personalStyling?.styleDNA || {}),
        },
        sensualityDNA: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.sensualityDNA,
          ...(parsed.foundation?.personalStyling?.sensualityDNA || {}),
        },
        colourDNA: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.colourDNA,
          ...(parsed.foundation?.personalStyling?.colourDNA || {}),
        },
        hairDNA: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.hairDNA,
          ...(parsed.foundation?.personalStyling?.hairDNA || {}),
        },
        accessoryDNA: {
          ...DEFAULT_FOUNDATION_DATA.personalStyling.accessoryDNA,
          ...(parsed.foundation?.personalStyling?.accessoryDNA || {}),
        },
        learnedFeedback: parsed.foundation?.personalStyling?.learnedFeedback || DEFAULT_FOUNDATION_DATA.personalStyling.learnedFeedback || [],
        recentEvaluations: parsed.foundation?.personalStyling?.recentEvaluations || DEFAULT_FOUNDATION_DATA.personalStyling.recentEvaluations || [],
      },
      aboutYou: { ...DEFAULT_FOUNDATION_DATA.aboutYou, ...(parsed.foundation?.aboutYou || {}) },
      yourLife: { ...DEFAULT_FOUNDATION_DATA.yourLife, ...(parsed.foundation?.yourLife || {}) },
      work: { ...DEFAULT_FOUNDATION_DATA.work, ...(parsed.foundation?.work || {}) },
      goals: { ...DEFAULT_FOUNDATION_DATA.goals, ...(parsed.foundation?.goals || {}) },
      wellbeing: { ...DEFAULT_FOUNDATION_DATA.wellbeing, ...(parsed.foundation?.wellbeing || {}) },
      nutrition: { ...DEFAULT_FOUNDATION_DATA.nutrition, ...(parsed.foundation?.nutrition || {}) },
      cycle: { ...DEFAULT_FOUNDATION_DATA.cycle, ...(parsed.foundation?.cycle || {}) },
      mariluna: { ...DEFAULT_FOUNDATION_DATA.mariluna, ...(parsed.foundation?.mariluna || {}) },
      ai: { ...DEFAULT_FOUNDATION_DATA.ai, ...(parsed.foundation?.ai || {}) },
      notifications: { ...DEFAULT_FOUNDATION_DATA.notifications, ...(parsed.foundation?.notifications || {}) },
    };

    const setupStatus =
      parsed.setupStatus ||
      (foundation.isCompleted ? 'completed' : foundation.isSkipped ? 'skipped' : 'not_started');

    const rawIdeas = parsed.ideas || INITIAL_STATE.ideas || [];
    const ideasMap = new Map<string, Idea>();
    for (const item of rawIdeas) {
      if (!item || !item.id) continue;
      if (!ideasMap.has(item.id)) {
        ideasMap.set(item.id, item);
      } else {
        const existing = ideasMap.get(item.id)!;
        ideasMap.set(item.id, { ...existing, ...item });
      }
    }
    const deduplicatedIdeas = Array.from(ideasMap.values());

    const rawOfferings: MarilunaOffering[] = parsed.marilunaOfferings || [];
    const offeringsMap = new Map<string, MarilunaOffering>();
    for (const item of rawOfferings) {
      if (!item || !item.id) continue;
      if (!offeringsMap.has(item.id)) {
        offeringsMap.set(item.id, item);
      } else {
        const existing = offeringsMap.get(item.id)!;
        offeringsMap.set(item.id, { ...existing, ...item });
      }
    }
    const deduplicatedOfferings = Array.from(offeringsMap.values());

    const rawDailyCheckIns: DailyCheckIn[] = parsed.dailyCheckIns || [];
    const checkInsMap = new Map<string, DailyCheckIn>();
    for (const item of rawDailyCheckIns) {
      if (!item) continue;
      const key = item.id || item.date;
      if (!key) continue;
      if (!checkInsMap.has(key)) {
        checkInsMap.set(key, item);
      } else {
        const existing = checkInsMap.get(key)!;
        checkInsMap.set(key, { ...existing, ...item });
      }
    }
    const deduplicatedCheckIns = Array.from(checkInsMap.values());

    return {
      ...INITIAL_STATE,
      ...parsed,
      ideas: deduplicatedIdeas,
      foundation,
      setupStatus,
      wellbeing: {
        ...EMPTY_WELLBEING_STATE,
        ...(parsed.wellbeing || {}),
        preferences: {
          ...EMPTY_WELLBEING_STATE.preferences,
          ...(parsed.wellbeing?.preferences || {}),
          foodPreferences: {
            ...EMPTY_WELLBEING_STATE.preferences.foodPreferences,
            ...(parsed.wellbeing?.preferences?.foodPreferences || {}),
          },
          movementPreferences: {
            ...EMPTY_WELLBEING_STATE.preferences.movementPreferences,
            ...(parsed.wellbeing?.preferences?.movementPreferences || {}),
          },
        },
      },
      cycleProfile: { ...INITIAL_STATE.cycleProfile, ...(parsed.cycleProfile || {}) },
      nutrition: {
        ...INITIAL_STATE.nutrition,
        ...(parsed.nutrition || {}),
        inventory: parsed.nutrition?.inventory || [],
        shoppingList: parsed.nutrition?.shoppingList || [],
        feedbackHistory: parsed.nutrition?.feedbackHistory || [],
        mealHistory: parsed.nutrition?.mealHistory || [],
        pastWeeklyPlans: parsed.nutrition?.pastWeeklyPlans || [],
      },
      notificationSettings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(INITIAL_STATE.notificationSettings || {}),
        ...(parsed.notificationSettings || {}),
        categories: {
          ...DEFAULT_NOTIFICATION_SETTINGS.categories,
          ...(INITIAL_STATE.notificationSettings?.categories || {}),
          ...(parsed.notificationSettings?.categories || {}),
        },
      },
      dailyCheckIns: deduplicatedCheckIns,
      notifications: parsed.notifications || [],
      proactiveSuggestions: parsed.proactiveSuggestions || [],
      integrations: {
        calendar: {
          ...DEFAULT_INTEGRATIONS_STATE.calendar,
          ...(parsed.integrations?.calendar || {}),
        },
        gmail: {
          ...DEFAULT_INTEGRATIONS_STATE.gmail,
          ...(parsed.integrations?.gmail || {}),
        },
        healthConnect: {
          ...DEFAULT_INTEGRATIONS_STATE.healthConnect,
          ...(parsed.integrations?.healthConnect || {}),
        },
        instagram: {
          ...DEFAULT_INTEGRATIONS_STATE.instagram,
          ...(parsed.integrations?.instagram || {}),
        },
        pushNotifications: {
          ...DEFAULT_INTEGRATIONS_STATE.pushNotifications,
          ...(parsed.integrations?.pushNotifications || {}),
        },
      },
      marilunaClients: parsed.marilunaClients || [],
      marilunaAdmin: {
        items: parsed.marilunaAdmin?.items || [],
        expenses: parsed.marilunaAdmin?.expenses || [],
        invoices: parsed.marilunaAdmin?.invoices || [],
        deadlines: parsed.marilunaAdmin?.deadlines || [],
      },
      marilunaMetrics: {
        metrics: parsed.marilunaMetrics?.metrics || [],
        records: parsed.marilunaMetrics?.records || [],
      },
      marilunaOfferings: deduplicatedOfferings,
      brain: parsed.brain ? { ...DEFAULT_BRAIN_STATE, ...parsed.brain } : DEFAULT_BRAIN_STATE,
    };
  } catch (err) {
    console.error('Failed to load state from localStorage, falling back to default:', err);
    return INITIAL_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function resetState(): AppState {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { ...INITIAL_STATE };
}
