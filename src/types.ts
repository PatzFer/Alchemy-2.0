export type Realm = 'personal' | 'mariluna';
export type ActiveWorldFilter = 'all' | 'personal' | 'mariluna';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  category: string;
  projectId?: string;
  goalId?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string; // YYYY-MM-DD
  estimatedDuration: number; // minutes
  recurring: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'todo' | 'in_progress' | 'completed';
  notes?: string;
  subtasks: TaskSubtask[];
  missed?: boolean;
  rescheduleSuggestion?: string;
  createdAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  suggestedDay?: string;
  durationMins?: number;
}

export type GoalTimeframe =
  | 'year'
  | 'quarter'
  | 'month'
  | 'custom'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export type GoalStatus =
  | 'active'
  | 'achieved'
  | 'paused'
  | 'archived'
  | 'completed';

export interface GoalMeasurableTarget {
  type: 'revenue' | 'clients' | 'bookings' | 'posts' | 'products_sold' | 'custom';
  targetValue: number;
  currentValue: number;
  unit?: string;
  customLabel?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  timeframe: GoalTimeframe;
  progress: number; // 0 - 100
  targetDate?: string;
  status?: GoalStatus;
  priority?: 'high' | 'normal' | 'low';
  notes?: string;
  connectedTaskIds: string[];
  connectedProjectIds: string[];
  connectedContentIds?: string[];
  milestones: Milestone[];
  measurableTarget?: GoalMeasurableTarget;
  createdAt?: string;
}

export type IdeaStatus =
  | 'new'
  | 'raw'
  | 'exploring'
  | 'developing'
  | 'ready_to_use'
  | 'ready'
  | 'parked'
  | 'converted'
  | 'converted_to_project'
  | 'archived';

export interface Idea {
  id: string;
  title: string;
  content: string;
  realm: Realm;
  category: string;
  status: IdeaStatus;
  createdAt: string;
  lastRevisitedAt: string;
  aiSummary?: string;
  suggestedNextStep?: string;
  followUpQuestions?: string[];
  connectedProjectId?: string;
  contentPillar?: string;
  assignedTaskId?: string;
  relatedContentIds?: string[];
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
  notes?: string;
  sparringNotes?: string;
  convertedToType?: 'content' | 'project' | 'task';
}

export type ProjectStatus =
  | 'idea'
  | 'planning'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'archived';

export interface Project {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  goalId?: string;
  status: ProjectStatus;
  startDate?: string;
  deadline?: string;
  progress: number;
  priority?: 'high' | 'normal' | 'low';
  notes?: string;
  taskIds: string[];
  ideaIds: string[];
  relatedContent?: string;
  relatedContentIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // "09:30"
  endTime: string;   // "11:00"
  date: string;      // "2026-09-16"
  realm: Realm;
  type: 'work' | 'appointment' | 'commitment' | 'me_time' | 'routine';
  location?: string;
  isExternalSync?: boolean;
}

export interface RoutineItem {
  id: string;
  title: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  durationMinutes: number;
  recurrence: 'permanent' | 'recurring' | 'temporary';
  realm: Realm;
}

export interface LifeCommitment {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  recurrence: 'permanent' | 'recurring' | 'temporary';
  realm: Realm;
}

export interface LifeProfile {
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  commuteTimeMinutes: number;
  routines: RoutineItem[];
  commitments: LifeCommitment[];
  preferences: {
    energyPeak: 'morning' | 'afternoon' | 'evening';
    protectEvenings: boolean;
    maxHighPriorityTasksPerDay: number;
    bufferTimeBetweenTasksMinutes: number;
    unhurriedMorningRitual: boolean;
  };
}

export interface MemoryItem {
  id: string;
  category: string;
  content: string;
  realm: Realm;
  dateAdded: string;
  importance: 'high' | 'medium' | 'contextual';
  source: 'user_stated' | 'ai_inferred';
}

export type ContentStatus =
  | 'idea'
  | 'draft'
  | 'drafted'
  | 'planned'
  | 'ready'
  | 'published'
  | 'archived';

export interface ContentPillar {
  id: string;
  name: string;
  description?: string;
  archived?: boolean;
}

export interface ContentPost {
  id: string;
  title: string;
  description?: string;
  platform: string; // Configurable: Instagram, Facebook, Website, Newsletter, LinkedIn, Podcast, Other, etc.
  status: ContentStatus;
  scheduledDate?: string;
  pillar: string;
  format?: string;
  campaign?: string;
  priority?: 'high' | 'normal' | 'low';
  relatedProjectId?: string;
  relatedIdeaId?: string;
  notes?: string;
  recurring?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// Mariluna Domain Architecture (Admin, Cijfers, Clients, Offerings)
// -------------------------------------------------------------
export type AdminItemFrequency =
  | 'none'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

export type AdminItemStatus =
  | 'todo'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface MarilunaAdminItem {
  id: string;
  title: string;
  description?: string;
  category: string; // e.g. 'ADMIN' | 'INVOICE' | 'EXPENSE' | 'TAX' | 'SOCIAL CONTRIBUTIONS' | 'DOCUMENT' | 'DEADLINE' | 'OTHER'
  priority: 'high' | 'normal' | 'low';
  dueDate?: string; // YYYY-MM-DD
  recurring: AdminItemFrequency;
  customRecurringInterval?: string; // e.g. "Elke 2 maanden"
  status: AdminItemStatus;
  notes?: string;
  amount?: number;
  reference?: string;
  projectId?: string;
  goalId?: string;
  linkedTaskId?: string; // Central task sync ID
  lastCompletedDate?: string;
  createdAt?: string;
}

export interface MarilunaExpense {
  id: string;
  description: string;
  amount: number;
  vatAmount?: number;
  date: string; // YYYY-MM-DD
  category: string; // e.g. 'software' | 'materials' | 'marketing' | 'tax_social' | 'office' | 'subscriptions' | 'equipment' | 'other'
  paid: boolean;
  notes?: string;
  projectId?: string;
  goalId?: string;
  reference?: string;
  receiptRef?: string;
}

export interface MarilunaInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  projectId?: string;
  goalId?: string;
  reference?: string;
}

export interface MarilunaTaxDeadline {
  id: string;
  title: string;
  dueDate: string;
  type:
    | 'vat_btw'
    | 'income_tax'
    | 'social_contribution'
    | 'annual_accounts'
    | 'subscription'
    | 'insurance'
    | 'domain'
    | 'appointment'
    | 'other';
  completed: boolean;
  notes?: string;
  amount?: number;
  reference?: string;
  recurring?: AdminItemFrequency;
  projectId?: string;
  goalId?: string;
}

export interface MarilunaAdminState {
  items?: MarilunaAdminItem[];
  expenses: MarilunaExpense[];
  invoices: MarilunaInvoice[];
  deadlines: MarilunaTaxDeadline[];
  notes?: string;
}

export interface MarilunaMetricRecord {
  id: string;
  metricId?: string;
  name: string; // e.g. "Omzet", "Kosten", "Winst", "Aantal klanten", "Boekingen", "Instagram followers"
  category?:
    | 'revenue'
    | 'expense'
    | 'profit'
    | 'clients'
    | 'bookings'
    | 'products'
    | 'services'
    | 'content'
    | 'followers'
    | 'visits'
    | 'custom';
  value: number;
  unit?: string; // e.g. "€", "klanten", "boekingen", "volgers", "stuks"
  period: string; // e.g. "September 2026", "2026-09", "Q3 2026"
  recordedAt: string;
  projectId?: string;
  goalId?: string;
  notes?: string;
}

export interface MarilunaMetric {
  id: string;
  name: string;
  value: number | string;
  unit?: string;
  period?: string;
  notes?: string;
  category?: string;
  target?: number;
}

export interface MarilunaMetricsState {
  revenueTargetYear?: number;
  metrics: MarilunaMetric[];
  records?: MarilunaMetricRecord[];
  notes?: string;
}

export interface MarilunaOffering {
  id: string;
  title: string;
  type: 'service' | 'product' | 'workshop' | 'package' | 'bespoke';
  price: number;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  deliverables?: string[];
}

export interface MarilunaClient {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  activeProjectIds?: string[];
  status: 'lead' | 'active' | 'completed' | 'on_hold';
  notes?: string;
  createdAt: string;
}

export interface ContentPlan {
  quarterTheme: string;
  monthlyTheme: string;
  pillars: (string | ContentPillar)[];
  platforms?: string[];
  monthlyTargetCount: number;
  posts: ContentPost[];
}

export interface AssistantAction {
  type: 'SUGGEST_TASK' | 'RESCHEDULE_TASK' | 'ADD_MEMORY' | 'BREAKDOWN_GOAL' | 'CREATE_PROJECT';
  label: string;
  payload: any;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestedAction?: AssistantAction;
}

export interface PersonalStyleState {
  colorPalette: { name: string; hex: string; role: string }[];
  preferredSilhouettes: string[];
  dislikedStyles: string[];
  measurementsNotes: string;
  occasions: string[];
  bodyShape?: string;
  calculatedBodyShape?: string;
  shapePromptDismissed?: boolean;
}

export interface NutritionState {
  dietaryNotes: string;
  dislikes: string[];
  partnerSharedDinners: string[];
  cookingTimeAvailableWeekdays: number;
}

// -------------------------------------------------------------
// Menstrual Cycle & Rhythm Intelligence
// -------------------------------------------------------------
export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

export interface CycleEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  notes?: string;
  confirmedByUser: boolean;
}

export interface CycleProfile {
  lastPeriodStartDate: string; // YYYY-MM-DD
  averageCycleLength: number;  // typically 26-35 days, default 28
  averagePeriodLength: number; // typically 3-7 days, default 5
  history: CycleEntry[];
  overridePhase?: CyclePhase;  // user manual correction if desired
  trackingEnabled: boolean;
  privacyLocked: boolean;      // ensures cycle stays in Personal realm only
  lastUpdated: string;
}

// -------------------------------------------------------------
// User-Reported Energy & Holistic Daily Check-In
// -------------------------------------------------------------
export type EnergyLevel = 'very_low' | 'low' | 'normal' | 'good' | 'high';
export type CheckInFeeling = 'good' | 'lower' | 'sick' | 'mentally_heavy';
export type CheckInDriver = 'poor_sleep' | 'low_energy' | 'cycle' | 'stress' | 'other';
export type MoodState = 'calm' | 'focused' | 'reflective' | 'sensitive' | 'expansive' | 'overstimulated';
export type AppetiteLevel = 'low' | 'normal' | 'increased';
export type PhysicalComfort = 'comfortable' | 'mild_cramps' | 'fatigue' | 'tension' | 'restorative';

export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  feeling?: CheckInFeeling;
  feelingDriver?: CheckInDriver;
  energy: EnergyLevel;
  mood?: MoodState;
  hunger?: AppetiteLevel;
  physicalDiscomfort?: PhysicalComfort;
  wakeTime?: string;
  sleepTime?: string;
  generalWellbeing?: 'great' | 'good' | 'neutral' | 'tired' | 'strained';
  notes?: string;
  timestamp: string;
}

// -------------------------------------------------------------
// Smart Sparse Notifications Architecture
// -------------------------------------------------------------
export type NotificationCategory =
  | 'important_deadline'
  | 'upcoming_task'
  | 'calendar_reminder'
  | 'mariluna_followup'
  | 'forgotten_idea'
  | 'goal_checkin'
  | 'cycle_insight'
  | 'weekly_planning'
  | 'rescheduling_suggestion';

export interface NotificationSettings {
  enabled: boolean;
  browserPermission: 'default' | 'granted' | 'denied';
  browserPushEnabled?: boolean;
  inAppNotificationsEnabled?: boolean;
  quietHoursStart: string; // e.g. "21:00"
  quietHoursEnd: string;   // e.g. "08:30"
  maxDailyFrequency: number; // e.g. 2 or 3 notifications per day
  soundEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  upcomingTaskReminders?: boolean;
  marilunaFollowUps?: boolean;
  forgottenIdeas?: boolean;
  goalCheckIns?: boolean;
  cycleInsights?: boolean;
  weeklyPlanning?: boolean;
  rescheduleSuggestions?: boolean;
}

export interface SmartNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  isRead?: boolean;
  priority: 'urgent' | 'thoughtful' | 'gentle';
  targetTab?: string;
  actionPrompt?: string;
}

// -------------------------------------------------------------
// Proactive Strategic Partner Suggestions
// -------------------------------------------------------------
export interface ProactiveSuggestion {
  id: string;
  title: string;
  body: string;
  reason: string;
  actionLabel?: string;
  actionPrompt?: string;
  actionType?: 'adjust_schedule' | 'review_ideas' | 'schedule_content' | 'lighten_workload';
  dismissed?: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// Wellbeing & Sovereign Body Intelligence Architecture
// -------------------------------------------------------------

export interface BodyMeasurements {
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  thighCm?: number;
  armCm?: number;
  // Exact 11 body measurements (in centimeters)
  shoulder?: number;
  bicepLeft?: number;
  bicepRight?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
  unit?: 'cm' | 'in';
  notes?: string;
}

export interface BodyMeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  unit: 'cm' | 'in';
  notes?: string;
  shoulder?: number;
  bicepLeft?: number;
  bicepRight?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  thighLeft?: number;
  thighRight?: number;
  calfLeft?: number;
  calfRight?: number;
}

export interface WaterLogEntry {
  date: string; // YYYY-MM-DD
  bottles: number; // 1 tap = 1 bottle (750ml)
  volumeMl: number; // bottles * 750
  targetBottles?: number;
  notes?: string;
}

export interface WaterTrackerState {
  bottleVolumeMl: number; // 750
  defaultTargetBottles: number; // default 4 (3.0L)
  history: WaterLogEntry[];
}

export interface WeeklyBodyCheckReminder {
  enabled: boolean;
  dayOfWeek: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
  preferredTime: string; // e.g. "09:00"
  snoozedUntil?: string | null; // ISO timestamp string
  lastSkippedWeek?: string; // e.g. "2026-W38"
  lastCompletedDate?: string;
}

export type MovementActivityType =
  | 'home_workout'
  | 'walking'
  | 'swimming'
  | 'paddling'
  | 'yoga'
  | 'pilates'
  | 'strength'
  | 'yoga_stretch'
  | 'dance'
  | 'cardio'
  | 'breathwork_restore'
  | 'other';

export interface BodyComposition {
  bodyFatPercentage?: number;
  muscleMassPercentage?: number;
  hydrationPercentage?: number;
}

export interface ProgressPhotoEntry {
  id: string;
  date: string;
  pose: 'front' | 'side' | 'back' | 'custom';
  photoUrl?: string;
  notes?: string;
}

export interface ProgressLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  measurements?: BodyMeasurements;
  composition?: BodyComposition;
  feelingNotes?: string;
  recordedFact?: string; // Explicit empirical fact recorded
  aiInterpretation?: string; // AI pattern insight (distinct from facts)
}

export interface WellbeingGoal {
  id: string;
  title: string;
  targetMetric?: string;
  targetValue?: string;
  currentValue?: string;
  deadline?: string;
  status: 'active' | 'achieved' | 'paused';
  notes?: string;
}

export interface WellbeingMilestone {
  id: string;
  title: string;
  date: string;
  category: 'movement' | 'strength' | 'habit' | 'body';
  description?: string;
  celebrated: boolean;
}

export interface CheckInConfig {
  id: string;
  title: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  preferredDay: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  includeWeight: boolean;
  includeMeasurements: boolean;
  includeComposition: boolean;
  includePhotos: boolean;
  includeReflection: boolean;
  reflectionPrompt?: string;
  active: boolean;
  lastCompletedDate?: string;
  nextDueDate: string;
}

export interface MovementExercise {
  name: string;
  sets?: number;
  reps?: string;
  durationMins?: number;
  notes?: string;
}

export interface MovementSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'pilates' | 'strength' | 'walking' | 'yoga_stretch' | 'dance' | 'cardio' | 'breathwork_restore';
  activityType?: MovementActivityType;
  plannedDurationMins: number;
  actualDurationMins?: number;
  durationMins?: number;
  intensity: 'gentle' | 'moderate' | 'energizing' | 'peak';
  completed: boolean;
  energyLevelAtStart?: EnergyLevel;
  perceivedExertion?: 'effortless' | 'pleasantly_challenged' | 'heavy' | 'fatigued';
  exercises: MovementExercise[];
  equipment?: string[];
  notes?: string;
  adaptationReason?: string; // e.g. "Adapted to 15m restorative due to evening transition"
}

export interface WeeklyMovementPlan {
  weekStarting: string; // YYYY-MM-DD
  targetWeeklySessions: number;
  focusTheme: string;
  sessions: MovementSession[];
}

export interface MealItem {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTimeMinutes: number;
  cookingTimeMinutes: number;
  diningSetting: 'solo' | 'shared_partner' | 'gathering';
  ingredients: string[];
  tags: string[];
  instructions?: string;
  pantryItemsUsed?: string[];
  notes?: string;
}

export interface DailyMealPlan {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date?: string;
  isWorkday: boolean;
  availablePrepTimeMinutes: number;
  diningSettingDinner: 'solo' | 'shared_partner';
  meals: {
    breakfast: MealItem;
    lunch: MealItem;
    dinner: MealItem;
    snack?: MealItem;
  };
}

export interface WeeklyMenuPlan {
  id: string;
  weekStarting: string; // YYYY-MM-DD
  theme?: string;
  preferencesApplied: {
    dietaryNotes: string;
    exclusions: string[];
    antiInflammatoryFocus: boolean;
    cycleSyncEnabled: boolean;
  };
  days: DailyMealPlan[];
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: 'produce' | 'proteins' | 'pantry' | 'dairy_refrigerated' | 'herbs_spices' | 'other';
  quantity: string;
  inPantry: boolean;
  checked: boolean;
  fromMealId?: string;
  isManual: boolean;
}

export interface WellbeingPreferences {
  allowWellbeingDataToAI: boolean; // AI access permission toggle
  preferredWeightUnit: 'kg' | 'lbs';
  preferredMeasurementUnit: 'cm' | 'in';
  foodPreferences: {
    dietaryStyle: string;
    exclusions: string[];
    partnerSharedDinnerDays: string[];
    quickPrepWeekdaysMaxMinutes: number;
    pantryStaples: string[];
    cycleSyncNutrition: boolean;
  };
  movementPreferences: {
    preferredTypes: string[];
    typicalSessionMinutes: number;
    preferredTimeOfDay: 'morning' | 'lunch' | 'afternoon' | 'evening';
    listenToCycleEnergy: boolean;
  };
}

export interface WellbeingState {
  progressLogs: ProgressLog[];
  photos: ProgressPhotoEntry[];
  goals: WellbeingGoal[];
  milestones: WellbeingMilestone[];
  checkInConfigs: CheckInConfig[];
  movementHistory: MovementSession[];
  currentWeeklyMovement: WeeklyMovementPlan;
  weeklyMenu: WeeklyMenuPlan;
  shoppingList: ShoppingItem[];
  preferences: WellbeingPreferences;
  waterTracker?: WaterTrackerState;
  bodyMeasurementHistory?: BodyMeasurementEntry[];
  weeklyBodyCheckReminder?: WeeklyBodyCheckReminder;
  calculatedBodyShape?: string;
}

// -------------------------------------------------------------
// Language & Foundation System (First-Time Setup & Settings)
// -------------------------------------------------------------

export type Language = 'nl' | 'en';

export interface WeatherInfo {
  temperature: number;
  weatherCode: number;
  description: string;
  locationName: string;
  isDay?: boolean;
}

export interface FoundationAboutYou {
  name: string;
  dateOfBirth?: string;
  preferredLanguage: Language;
  location?: string;
}

export interface FoundationYourLife {
  dailyRhythm: string;
  typicalAvailableTime: string;
  recurringCommitments: string[];
  personalRoutines: string[];
  planningRestPeriods: string[];
  notes?: string;
}

export interface WorkContext {
  id: string;
  name: string;
  workdays: string[]; // e.g. ['monday', 'tuesday', 'thursday']
  startTime: string; // e.g. '09:00'
  endTime: string; // e.g. '17:00'
  location: string; // e.g. 'Thuis', 'Kantoor'
  commuteMinutes?: number;
  breakNotes?: string;
}

export interface FoundationWork {
  workContexts: WorkContext[];
}

export interface FoundationGoalItem {
  id: string;
  name: string;
  description?: string;
  domain: 'personal' | 'wellbeing' | 'mariluna';
  priority: 'high' | 'medium' | 'low';
  targetDate?: string;
}

export interface FoundationGoals {
  goals: FoundationGoalItem[];
}

export interface FoundationWellbeing {
  currentWeightKg?: number;
  waistCm?: number;
  hipsCm?: number;
  chestCm?: number;
  measurementNotes?: string;
  trackPhotos: boolean;
  wellbeingGoals: string[];
  movementPreferences: string[];
  regularActivities: string[];
  measurementFrequency: 'weekly' | 'biweekly' | 'monthly' | 'as_desired';
}

export interface FoundationNutrition {
  enjoyedFoods: string[];
  dislikedFoods: string[];
  allergies: string[];
  dietaryRestrictions: string[];
  avoidedFoods: string[];
  eatingPattern: string;
  cookingTimeMinutes?: number;
  diningSetting: 'alone' | 'with_partner' | 'family' | 'flexible';
  kitchenNotes?: string;
}

export interface FoundationCycle {
  enabled: boolean;
  lastPeriodStart?: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  cycleHistoryNotes?: string;
  cycleInfluencesPlanning: boolean;
}

export interface FoundationMariluna {
  enabled: boolean;
  businessGoals: string[];
  services: string[];
  products: string[];
  projects: string[];
  contentAreas: string[];
  platforms: string[];
  recurringActivities: string[];
  importantDeadlines: string[];
}

export interface FoundationAI {
  communicationStyle: 'short_direct' | 'warm_supportive' | 'strategic' | 'detailed';
  proactivity: 'minimal' | 'balanced' | 'proactive';
  suggestActions: boolean;
  helpPrioritize: boolean;
  challengeAssumptions: boolean;
  rescheduleUnfinished: boolean;
  surfacePatterns: boolean;
}

export interface FoundationNotifications {
  categories: {
    tasks: boolean;
    calendar: boolean;
    goals: boolean;
    wellbeing: boolean;
    nutrition: boolean;
    cycle: boolean;
    mariluna: boolean;
    reviewsInsights: boolean;
  };
  quietHoursStart: string;
  quietHoursEnd: string;
  frequency: 'sparse' | 'moderate' | 'all';
  permissions: {
    calendarAccess: boolean;
    externalAiAccess: boolean;
    isolateMariluna: boolean;
    requireStepUpSensitive: boolean;
  };
}

export interface FoundationData {
  isCompleted: boolean;
  isSkipped: boolean;
  currentStep: number;
  completedSteps: number[];
  configuredSections: string[];
  skippedSections: string[];
  lastUpdated?: string;
  aboutYou: FoundationAboutYou;
  yourLife: FoundationYourLife;
  work: FoundationWork;
  goals: FoundationGoals;
  wellbeing: FoundationWellbeing;
  nutrition: FoundationNutrition;
  cycle: FoundationCycle;
  mariluna: FoundationMariluna;
  ai: FoundationAI;
  notifications: FoundationNotifications;
}



