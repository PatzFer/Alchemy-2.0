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
  startDate?: string;
  endDate?: string;
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
  relatedOfferingId?: string;
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
  source?: 'google' | 'alchemy' | string;
  googleEventId?: string;
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

export type MemoryType = 'explicit' | 'confirmed' | 'learned' | 'temporary';
export type MemorySource =
  | 'user_stated'
  | 'foundation'
  | 'user_confirmed'
  | 'learned_pattern'
  | 'temporary_context'
  | 'ai_inferred';
export type MemoryConfidence = 'high' | 'medium' | 'low';

export interface MemoryItem {
  id: string;
  category: string;
  content: string;
  realm: Realm;
  dateAdded: string;
  importance: 'high' | 'medium' | 'contextual';
  source: MemorySource | 'user_stated' | 'ai_inferred';
  type?: MemoryType;
  confidence?: MemoryConfidence;
  updatedAt?: string;
  expiresAt?: string;
  status?: 'active' | 'archived' | 'pending_confirmation';
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
  relatedOfferingId?: string;
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
  price?: number;
  description?: string;
  status: 'active' | 'draft' | 'archived';
  deliverables?: string[];
}

export interface MarilunaClient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  countryCode?: string;
  phoneNumber?: string;
  phoneE164?: string;
  phone?: string;
  activeProjectIds?: string[];
  purchasedOfferingIds?: string[];
  status: 'lead' | 'active' | 'completed' | 'on_hold';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
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
  bodyDivergenceDismissed?: boolean;
  evaluations?: GarmentEvaluation[];
  learnedFeedback?: StyleLearnedFeedback[];
  activeMood?: string;
  selectedOccasion?: string;
}

export type CuisineType = 'portuguese' | 'belgian' | 'italian' | 'spanish' | 'greek' | 'french' | 'european' | 'other';
export type DiningParticipantChoice = 'solo' | 'couple' | 'none'; // 👤 1 — alleen ik | 👥 2 — ik + Jeroen | 🍴 Geen maaltijd nodig
export type MealStatus = 'planned' | 'cooked' | 'skipped' | 'replaced';
export type MealFeedbackRating = 'love' | 'like' | 'neutral' | 'dislike';

export interface RecipeIngredient {
  id: string;
  name: string;
  amountPerPerson: number;
  unit: string;
  category: 'meat_fish' | 'dairy_chilled' | 'vegetables' | 'pantry' | 'spices_other';
  notes?: string;
  isCookedOrPureed?: boolean;
}

export interface Recipe {
  id: string;
  name: string;
  cuisine: CuisineType;
  shortDescription: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  isSlowcooker: boolean;
  proteinGramsPerPerson: number;
  ingredients: RecipeIngredient[];
  steps: string[];
  substitutions?: string[];
  storageNotes?: string;
  mealPrepNotes?: string;
  isCustom?: boolean;
}

export interface PlannedMealDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  diningChoice: DiningParticipantChoice;
  estimatedAvailableCookingTimeMinutes?: number;
  dayContextNote?: string;
  recipeId?: string;
  customMealName?: string;
  status: MealStatus;
  replacementMealId?: string;
  skipReason?: string;
  notes?: string;
}

export interface PriveWeeklyMenuPlan {
  id: string;
  weekStartDate: string; // Monday YYYY-MM-DD
  plannedAt: string;
  thursdayPromptDismissed?: boolean;
  days: PlannedMealDay[];
  notes?: string;
}

export interface KitchenInventoryItem {
  id: string;
  name: string;
  quantity: string;
  location: 'pantry' | 'refrigerator' | 'freezer';
  category: 'meat_fish' | 'dairy_chilled' | 'vegetables' | 'pantry' | 'spices_other';
  addedDate: string;
  notes?: string;
  isUsed?: boolean;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: 'meat_fish' | 'dairy_chilled' | 'vegetables' | 'pantry' | 'spices_other';
  checked: boolean;
  alreadyInStock: boolean;
  stockLocation?: 'pantry' | 'refrigerator' | 'freezer';
  sourceRecipeNames?: string[];
}

export interface MealFeedbackEntry {
  recipeId: string;
  recipeName: string;
  feedback: MealFeedbackRating;
  date: string;
  notes?: string;
}

export interface MealHistoryEntry {
  id: string;
  date: string;
  recipeId: string;
  recipeName: string;
  cuisine: CuisineType;
  participants: DiningParticipantChoice;
  status: MealStatus;
  cookedAt?: string;
  feedback?: MealFeedbackRating;
}

export interface NutritionState {
  dietaryNotes: string;
  dislikes: string[];
  partnerSharedDinners: string[];
  cookingTimeAvailableWeekdays: number;
  // Authoritative Meals & Menu Planning State
  activeWeeklyPlan?: PriveWeeklyMenuPlan;
  pastWeeklyPlans?: PriveWeeklyMenuPlan[];
  inventory?: KitchenInventoryItem[];
  shoppingList?: ShoppingListItem[];
  feedbackHistory?: MealFeedbackEntry[];
  mealHistory?: MealHistoryEntry[];
  customRecipes?: Recipe[];
  lastThursdayPromptCheck?: string;
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
  | 'rescheduling_suggestion'
  | 'reminder_notifications'
  | 'calendar_notifications'
  | 'meal_planning_notifications'
  | 'health_movement_reminders'
  | 'mariluna_notifications'
  | 'important_ai_suggestions';

export interface NotificationSettings {
  enabled: boolean;
  browserPermission: 'default' | 'granted' | 'denied';
  browserPushEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  inAppNotificationsEnabled?: boolean;
  quietHoursStart: string; // e.g. "21:00"
  quietHoursEnd: string;   // e.g. "08:30"
  maxDailyFrequency: number; // e.g. 2 or 3 notifications per day
  soundEnabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  // Granular Category Controls (Prompt 10)
  reminderNotifications?: boolean;       // Sunday weekly measurement reminder
  calendarNotifications?: boolean;       // Calendar upcoming appointments
  mealPlanningNotifications?: boolean;   // Thursday 18:00 menu planning prompt
  healthMovementReminders?: boolean;     // Gentle movement / steps context
  marilunaNotifications?: boolean;       // Business follow-ups / client email review
  importantAiSuggestions?: boolean;      // Capacity alerts & rescheduling proposals
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

export interface FoundationPatzIdentity {
  name: string;
  preferredName: string;
  age: number;
  heightMeters: number;
  location: string;
  primaryLanguage: Language;
  bornIn: string;
  heritage: string;
  portugalConnectionNotes: string;
}

export interface FoundationAstrology {
  sunSign: string;
  frameworkRole: string;
  notes?: string;
}

export interface FoundationCommunication {
  primaryLanguage: Language;
  preferredTone: string;
  shortAnswers: boolean;
  preferBulletPoints: boolean;
  practicalAndDirect: boolean;
  doNotOverExplain: boolean;
  gentleCorrection: boolean;
  constructiveChallenge: boolean;
  avoidCorporateRobotic: boolean;
  avoidGenericAiFiller: boolean;
  supportiveNotPatronising: boolean;
  epistemologyNotes: string;
}

export interface FoundationLifeWork {
  workdays: string[]; // ['tuesday', 'wednesday', 'friday']
  workHoursStart: string; // '08:00'
  workHoursEnd: string; // '16:30'
  businessName: string;
  businessDescription: string;
  protectedPersonalTime: string;
  pacingPhilosophy: string;
  recurringCommitments: string[];
  personalRoutines: string[];
}

export interface FoundationPlanning {
  helpSeeWhatMatters: boolean;
  helpPrioritize: boolean;
  avoidUnrealisticPlanning: boolean;
  breakLargeProjectsIntoActions: boolean;
  rememberImportantThings: boolean;
  noticeConflicts: boolean;
  suggestRealisticTiming: boolean;
  keepSpaceForPersonalLife: boolean;
  connectAreasIntelligently: boolean;
  respectAutonomy: boolean;
  avoidProductivityTrap: boolean;
}

export interface FoundationFoodProfile {
  cuisineHierarchy: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  likes: string[];
  dislikes: string[];
  noCouscousRule: boolean;
  noQuinoaRule: boolean;
  noRawVegetablesRule: boolean;
  allergies: string[];
  intolerances: string[];
  kitchenNotes: string;
}

export interface StyleLearnedFeedback {
  id: string;
  itemTitle: string;
  category: string;
  rating?: 'love' | 'like' | 'neutral' | 'nah' | 'dislike';
  reaction?: 'love' | 'loveee' | 'like' | 'neutral' | 'nah' | 'dislike'; // ❤️, 💕, 👍, 😐, 👎, ❌
  reactionType?: 'mooi_bij_anderen' | 'zou_dragen' | 'voelt_als_mij' | 'gewenste_uitstraling';
  elementsLiked?: string[];
  elementsDisliked?: string[];
  note?: string;
  date: string;
}

export interface GarmentEvaluation {
  id: string;
  date: string;
  itemTitle: string;
  category: string;
  imageUrl?: string;
  productUrl?: string;
  brand?: string;
  price?: string;
  occasion?: string;
  mood?: string;
  isInsufficient?: boolean;
  insufficientReasonNl?: string;
  insufficientReasonEn?: string;
  styleMatchPercent: number;
  silhouetteMatchPercent: number;
  colourMatchPercent: number;
  detailMatchPercent?: number;
  moodMatchPercent?: number;
  practicalityPercent?: number;
  emotionalMatchPercent?: number;
  overallMatchPercent: number;
  fitConfidencePercent: number;
  fitConfidenceReason?: string;
  verdictNl: string;
  keyObservations: string[];
  pros?: string[];
  considerations?: string[];
  enhancements?: string[];
  conclusion?: string;
  alternatives?: string[];
  userFeedback?: 'love' | 'like' | 'neutral' | 'nah' | 'dislike';
  userReaction?: 'love' | 'loveee' | 'like' | 'neutral' | 'nah' | 'dislike';
  reactionType?: 'mooi_bij_anderen' | 'zou_dragen' | 'voelt_als_mij' | 'gewenste_uitstraling';
  wardrobeStatus?: 'none' | 'favorite' | 'wishlist' | 'owned' | 'reconsider';
  notes?: string;
}

export interface FoundationPersonalStyling {
  profileVersion: string;
  silhouetteLabel: string;
  heightMeters: number;
  antiRigidDisclaimer: string;
  bodyProportionsProfile: {
    torsoProportion: string;
    legLineEmphasis: string;
    waistDefinition: string;
    hipFlow: string;
  };
  bodyArchitecture: string;
  styleDNA: {
    essence: string;
    signatureElements: string[];
    preferredFabrics: string[];
    unfavorableElements: string[];
    coreKeywords?: string[];
    strongAccents?: string[];
    styleTensions?: string[];
    styleDirections?: string[];
  };
  desiredPresence?: string;
  clothingDetails?: string[];
  sensualityDNA: {
    philosophy: string;
    preferredAccents: string[];
  };
  colourDNA: {
    paletteName: string;
    primaryColors: { name: string; hex: string; role: string }[];
    colorsToAvoid: string[];
  };
  hairDNA: {
    aesthetic: string;
    notes: string;
  };
  accessoryDNA: {
    metals: string[];
    jewelleryStyle: string;
    bagsFootwear: string;
  };
  styleFormula: string;
  emotionalDressingMoods: string[];
  philosophy: string;
  posturePresence: string;
  stylingLanguagePreferences: string;
  evaluationLogicSummary: string;
  learnedFeedback: StyleLearnedFeedback[];
  recentEvaluations: GarmentEvaluation[];
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
  // Authoritative Foundation & Patz Profile domains
  patzIdentity: FoundationPatzIdentity;
  astrology: FoundationAstrology;
  communication: FoundationCommunication;
  lifeWork: FoundationLifeWork;
  planning: FoundationPlanning;
  foodProfile: FoundationFoodProfile;
  personalStyling: FoundationPersonalStyling;
  // Domain contexts & configurations
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

// -------------------------------------------------------------
// Integrations 1.0 Architecture (Prompt 10)
// -------------------------------------------------------------

export type IntegrationServiceId =
  | 'google_calendar'
  | 'mariluna_gmail'
  | 'health_connect'
  | 'mariluna_instagram'
  | 'push_notifications';

export type IntegrationConnectionStatus =
  | 'connected'
  | 'not_connected'
  | 'connecting'
  | 'syncing'
  | 'synced'
  | 'needs_attention'
  | 'authentication_expired'
  | 'permission_denied'
  | 'sync_error'
  | 'disconnected'
  | 'unavailable';

export interface GoogleCalendarIntegration {
  status: IntegrationConnectionStatus;
  accountEmail?: string;
  lastSync?: string;
  readOnly: boolean;
  syncedEventsCount: number;
  error?: string;
  // Explicit distinction
  isPatriciaOnlySchedule: boolean; // Always true: Never infer or retrieve Jeroen's schedule
}

export interface MarilunaGmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
  possibleClientMatchId?: string;
  needsReview?: boolean;
}

export interface MarilunaGmailIntegration {
  status: IntegrationConnectionStatus;
  accountEmail?: string;
  lastSync?: string;
  readOnly: boolean;
  businessOnly: boolean; // Strictly Mariluna business; never personal email
  syncedThreadsCount: number;
  messages: MarilunaGmailMessage[];
  error?: string;
}

export interface HealthConnectIntegration {
  status: IntegrationConnectionStatus;
  platform: 'android' | 'web';
  lastSync?: string;
  stepsToday?: number;
  todaySteps?: number;
  activeMinutes?: number;
  isStepsOnly: boolean; // Always true: strictly steps/activity; never heart rate, glucose, sleep, cycle, meds
  isPrivateOnly: boolean; // Always true: never exposed to Mariluna or external marketing
  error?: string;
}

export interface InstagramPostItem {
  id: string;
  caption: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REEL';
  mediaUrl?: string;
  permalink?: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
  reach?: number;
  matchedContentPostId?: string;
  needsReview?: boolean;
}

export interface MarilunaInstagramIntegration {
  status: IntegrationConnectionStatus;
  accountUsername?: string;
  accountType?: 'business' | 'creator';
  lastSync?: string;
  posts: InstagramPostItem[];
  error?: string;
}

export interface PushNotificationIntegration {
  enabled: boolean;
  permission: 'default' | 'granted' | 'denied';
  lastTested?: string;
}

export interface IntegrationsState {
  calendar: GoogleCalendarIntegration;
  gmail: MarilunaGmailIntegration;
  healthConnect: HealthConnectIntegration;
  instagram: MarilunaInstagramIntegration;
  pushNotifications: PushNotificationIntegration;
}

// -------------------------------------------------------------
// Alchemy Brain 1.0 Architecture (Prompt 11)
// -------------------------------------------------------------

export type BrainCapacityLevel = 'high' | 'normal' | 'reduced' | 'minimal';

export interface BrainCapacityAssessment {
  level: BrainCapacityLevel;
  freeMinutes: number;
  busyMinutes: number;
  feeling?: CheckInFeeling;
  reason: string;
  recommendedTaskCount: number;
  maxTaskMinutes: number;
}

export type BrainSuggestionPriority = 'high' | 'normal' | 'low';
export type BrainSuggestionStatus = 'new' | 'seen' | 'accepted' | 'dismissed' | 'snoozed' | 'expired';

export interface BrainSuggestionAction {
  id: string;
  label: string;
  actionType: 'plan_meal' | 'split_task' | 'reschedule_task' | 'view_project' | 'view_content' | 'dismiss' | 'custom';
  payload?: any;
  isPrimary?: boolean;
}

export interface BrainSuggestion {
  id: string;
  sourceModule: 'today' | 'tasks' | 'calendar' | 'meals' | 'wellbeing' | 'movement' | 'mariluna' | 'content' | 'admin' | 'integrations';
  title: string;
  description: string;
  reason: string; // Grounded, transparent explainability (no hidden chain-of-thought)
  priority: BrainSuggestionPriority;
  createdAt: string;
  expiresAt?: string;
  status: BrainSuggestionStatus;
  fingerprint: string; // Deduplication hash
  actions?: BrainSuggestionAction[];
}

export interface DailyAlchemyBrief {
  id: string;
  date: string; // YYYY-MM-DD
  greeting: string;
  bullets: string[];
  focusAnchor: string;
  capacityLevel: BrainCapacityLevel;
  capacityReason: string;
  suggestions: BrainSuggestion[];
  generatedAt: string;
  eveningReflection?: {
    date: string;
    feeling: 'good' | 'okay' | 'heavy' | 'productive' | 'chaotic' | 'calm';
    reflectionNote?: string;
    recordedAt: string;
  };
}

export interface BrainState {
  activeSuggestions: BrainSuggestion[];
  lastBrief?: DailyAlchemyBrief;
  lastBriefGeneratedDate?: string;
  dismissedSuggestionIds?: string[];
  acceptedSuggestionIds?: string[];
  recentSplitTasks?: { originalTaskId: string; subtasksCount: number; timestamp: string }[];
  lastUpdated?: string;
}





