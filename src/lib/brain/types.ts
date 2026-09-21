import {
  Realm,
  CheckInFeeling,
  BrainCapacityLevel,
  BrainCapacityAssessment,
  BrainSuggestionPriority,
  BrainSuggestionStatus,
  BrainSuggestionAction,
  BrainSuggestion,
  DailyAlchemyBrief,
  BrainState,
  MemoryType,
  MemorySource,
  MemoryConfidence,
  MemoryItem,
} from '../../types';

export type {
  Realm,
  CheckInFeeling,
  BrainCapacityLevel,
  BrainCapacityAssessment,
  BrainSuggestionPriority,
  BrainSuggestionStatus,
  BrainSuggestionAction,
  BrainSuggestion,
  DailyAlchemyBrief,
  BrainState,
  MemoryType,
  MemorySource,
  MemoryConfidence,
  MemoryItem,
};

export const DEFAULT_BRAIN_STATE: BrainState = {
  lastBriefGeneratedDate: '',
  lastBrief: undefined,
  activeSuggestions: [],
  dismissedSuggestionIds: [],
  acceptedSuggestionIds: [],
  recentSplitTasks: [],
  lastUpdated: new Date().toISOString(),
};

export type ContextPrivacyScope = 'personal' | 'mariluna' | 'balanced' | 'sensitive_private' | 'meals' | 'styling' | 'movement';

export interface BrainContextLayer1Identity {
  name: string;
  preferredLanguage: string;
  roots: string;
  communicationStyle: string;
  personalValues: string[];
  planningPreference: string;
}

export interface BrainContextLayer2Preferences {
  foodDislikes: string[];
  foodFavorites: string[];
  cuisineStyles: string[];
  diningSetting: string;
  styleDNA: string;
  workContexts: { name: string; days: string[]; hours: string }[];
}

export interface BrainContextLayer3CurrentState {
  date: string;
  capacityLevel: BrainCapacityLevel;
  checkInFeeling?: CheckInFeeling;
  freeMinutesToday: number;
  busyMinutesToday: number;
  appointmentsCount: number;
  scheduledEvents: { title: string; time: string; realm: Realm }[];
  priorityTasksCount: number;
  openTasks: { id: string; title: string; priority: string; estimatedDuration: number; realm: Realm }[];
  dinnerPlanned: boolean;
  dinnerRecipeName?: string;
  activeProjectsCount: number;
  urgentDeadlinesCount: number;
}

export interface BrainContextLayer4Goals {
  activeGoals: { id: string; title: string; realm: Realm; progress: number }[];
}

export interface BrainContextLayer5History {
  recentMealNames: string[];
  recentMovementSessions: string[];
}

export interface BrainContextLayer6External {
  googleCalendarConnected: boolean;
  marilunaGmailConnected: boolean;
  instagramConnected: boolean;
  healthConnectConnected: boolean;
  todaySteps?: number;
  unreadBusinessInquiriesCount?: number;
}

export interface AssembledBrainContext {
  scope: ContextPrivacyScope;
  layer1Identity: BrainContextLayer1Identity;
  layer2Preferences: BrainContextLayer2Preferences;
  layer3CurrentState: BrainContextLayer3CurrentState;
  layer4Goals: BrainContextLayer4Goals;
  layer5History: BrainContextLayer5History;
  layer6External: BrainContextLayer6External;
  relevantMemories: MemoryItem[];
}
