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

export interface Goal {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  progress: number; // 0 - 100
  targetDate: string;
  connectedTaskIds: string[];
  connectedProjectIds: string[];
  milestones: Milestone[];
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  realm: Realm;
  category: string;
  status: 'raw' | 'exploring' | 'converted_to_project' | 'archived';
  createdAt: string;
  lastRevisitedAt: string;
  aiSummary?: string;
  suggestedNextStep?: string;
  followUpQuestions?: string[];
  connectedProjectId?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  realm: Realm;
  goalId?: string;
  status: 'active' | 'planning' | 'on_hold' | 'completed';
  deadline?: string;
  progress: number;
  notes?: string;
  taskIds: string[];
  ideaIds: string[];
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

export interface ContentPost {
  id: string;
  title: string;
  platform: 'Instagram' | 'Newsletter' | 'Journal / Blog' | 'Podcast' | 'Special Edition';
  status: 'idea' | 'drafted' | 'ready' | 'published';
  scheduledDate?: string;
  pillar: string;
  notes?: string;
}

export interface ContentPlan {
  quarterTheme: string;
  monthlyTheme: string;
  pillars: string[];
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
export type MoodState = 'calm' | 'focused' | 'reflective' | 'sensitive' | 'expansive' | 'overstimulated';
export type AppetiteLevel = 'low' | 'normal' | 'increased';
export type PhysicalComfort = 'comfortable' | 'mild_cramps' | 'fatigue' | 'tension' | 'restorative';

export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  energy: EnergyLevel;
  mood?: MoodState;
  hunger?: AppetiteLevel;
  physicalDiscomfort?: PhysicalComfort;
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

