import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  NavTab,
} from './components/Navigation';
import { HomeLauncher } from './components/HomeLauncher';
import { TodayDashboardView } from './components/views/TodayDashboardView';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { TodayView } from './components/views/TodayView';
import { TasksView } from './components/views/TasksView';
import { CalendarView } from './components/views/CalendarView';
import { GoalsView } from './components/views/GoalsView';
import { IdeasView } from './components/views/IdeasView';
import { MarilunaHubView } from './components/views/MarilunaHubView';
import { PriveDomainView } from './components/views/PriveDomainView';
import { CycleView } from './components/views/CycleView';
import { WellbeingView } from './components/views/WellbeingView';
import { MyLifeView } from './components/views/MyLifeView';
import { SettingsView } from './components/views/SettingsView';
import { SecurityPrivacyCenter } from './components/views/SecurityPrivacyCenter';
import { AppAuthLockScreen } from './components/AppAuthLockScreen';
import { FirstTimeSetup } from './components/onboarding/FirstTimeSetup';
import { getNextRecurringTaskDate } from './lib/taskRecurrence';
import {
  loadState,
  saveState,
  resetState,
  AppState,
  INITIAL_STATE,
  DEFAULT_INTEGRATIONS_STATE,
} from './lib/storage';
import { IntegrationsService } from './lib/integrationsService';
import { getCachedAccessToken, createRealCalendarEventInApi } from './lib/googleAuthService';
import {
  ActiveWorldFilter,
  Task,
  Goal,
  Idea,
  Project,
  CalendarEvent,
  LifeProfile,
  MemoryItem,
  ContentPost,
  AssistantMessage,
  CycleProfile,
  DailyCheckIn,
  DailyIntention,
  Realm,
  NotificationSettings,
  SmartNotification,
  ProactiveSuggestion,
  FoundationData,
} from './types';
import { evaluateSmartNotifications, shouldDispatchBrowserPush } from './lib/notificationEngine';
import { applyFoundationToAppState } from './lib/foundationDefaults';
import { Sparkles } from 'lucide-react';
import { MorningCheckInModal } from './components/MorningCheckInModal';
import { purgeExpiredDailyCheckIns } from './lib/healthUtils';
import { createAlchemyBackup, downloadAlchemyBackupFile, verifyAlchemyBackup } from './lib/backup';
import { isValidCalendarDate } from './lib/calendarDate';

const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(() => {
    try { return localStorage.getItem('alchemy_last_saved_at'); } catch { return null; }
  });
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(() => {
    try { return localStorage.getItem('alchemy_last_backup_at'); } catch { return null; }
  });
  const [storageSaveError, setStorageSaveError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [activeWorld, setActiveWorld] = useState<ActiveWorldFilter>('all');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // FINAL SECURITY ARCHITECTURE: Perimeter Lock & Session Management
  const [isAppAuthenticated, setIsAppAuthenticated] = useState<boolean | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [inactivityLocked, setInactivityLocked] = useState<boolean>(false);
  const [securityLevel, setSecurityLevel] = useState<1 | 2 | 3>(2);
  const [isSensitiveUnlocked, setIsSensitiveUnlocked] = useState<boolean>(true);
  const [inactivityTimeoutMins, setInactivityTimeoutMins] = useState<number>(15);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(() => state.setupStatus === 'not_started');

  const checkAuthStatus = async () => {
    try {
      let res = await fetch('/api/auth/status');
      if (!res.ok) throw new Error('Authentication status unavailable.');
      let data = await res.json();

      // The server permits this one-click preview session only when
      // ENABLE_PREVIEW_AUTH=true and NODE_ENV is not production.
      // Production never accepts this route; all normal credentials remain required.
      if (!data.isAppAuthenticated) {
        const preview = await fetch('/api/auth/preview-unlock', { method: 'POST' });
        if (preview.ok) {
          res = await fetch('/api/auth/status');
          if (!res.ok) throw new Error('Authentication status unavailable after preview unlock.');
          data = await res.json();
        }
      }

      setIsAppAuthenticated(!!data.isAppAuthenticated);
      setIsPreviewMode(!!data.isPreviewMode);
      if (data.currentSecurityLevel) setSecurityLevel(data.currentSecurityLevel);
      if (data.isSensitiveUnlocked !== undefined) setIsSensitiveUnlocked(data.isSensitiveUnlocked);
      if (data.inactivityTimeoutMinutes) setInactivityTimeoutMins(data.inactivityTimeoutMinutes);
    } catch {
      // Fail closed: a missing API, disabled preview or auth outage never unlocks private data.
      setIsAppAuthenticated(false);
    }
  };

  useEffect(() => {
    void checkAuthStatus();
  }, []);

  // No automatic startup or inactivity lock in this personal-use v1.
  // Keep the explicit manual lock action available from Settings if desired.

  const handleLockApp = async () => {
    try {
      await fetch('/api/auth/lock-app', { method: 'POST' });
    } catch (err) {
      console.warn('Lock app endpoint error:', err);
    }
    setIsAppAuthenticated(false);
    setInactivityLocked(false);
  };

  const [isMorningModalOpen, setIsMorningModalOpen] = useState(false);

  // Morning Check-in trigger once per day
  useEffect(() => {
    if (!isAppAuthenticated) return;
    const todayStr = getLocalDateString();
    const lastShown = localStorage.getItem('lastMorningCheckInShownDate');
    const todayCheckIn = state.dailyCheckIns?.find((c) => c.date === todayStr);

    if (lastShown !== todayStr && !todayCheckIn) {
      setIsMorningModalOpen(true);
    }
  }, [isAppAuthenticated]);

  const handleDismissMorningModal = () => {
    const todayStr = getLocalDateString();
    localStorage.setItem('lastMorningCheckInShownDate', todayStr);
    setIsMorningModalOpen(false);
  };

  // Quick Task Modal from Today view
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickRealm, setQuickRealm] = useState<'personal' | 'mariluna'>('personal');
  const [quickKind, setQuickKind] = useState<'task' | 'reminder' | 'idea' | 'note' | 'appointment'>('task');
  const [quickDetails, setQuickDetails] = useState('');
  const [quickDate, setQuickDate] = useState(getLocalDateString());
  const [quickStartTime, setQuickStartTime] = useState('09:00');

  // Automatically persist changes to local storage
  useEffect(() => {
    // Never report a successful save when the browser rejected the write (e.g. quota exceeded).
    if (!saveState(state)) {
      setStorageSaveError('Je laatste wijzigingen konden niet op dit toestel worden opgeslagen. Maak eerst een back-up en controleer de beschikbare browseropslag.');
      return;
    }
    setStorageSaveError(null);
    const savedAt = new Date().toISOString();
    setLastSavedAt(savedAt);
    try { localStorage.setItem('alchemy_last_saved_at', savedAt); } catch { /* Timestamp is informational; state save already succeeded. */ }
  }, [state]);

  // Prevent duplicate external pushes when React replays effects in development Strict Mode.
  const dispatchedPushIds = useRef(new Set<string>());

  // Evaluate the notification digest whenever its source data changes.
  useEffect(() => {
    const settings = state.notificationSettings;
    if (!settings?.enabled) return;

    const generated = evaluateSmartNotifications({
      settings,
      existingNotifications: state.notifications || [],
      tasks: state.tasks || [],
      calendarEvents: state.calendarEvents || [],
      ideas: state.ideas || [],
      goals: state.goals || [],
      cycleProfile: state.cycleProfile,
      todayCheckIn: (state.dailyCheckIns || []).find(
        (checkIn) => checkIn.date === getLocalDateString()
      ),
    });
    if (!generated.length) return;

    const existingIds = new Set((state.notifications || []).map((item) => item.id));
    const newOnes = generated.filter((item) => !existingIds.has(item.id));
    if (!newOnes.length) return;

    // External side effects stay outside the React state updater.
    if (shouldDispatchBrowserPush(settings, !!state.integrations?.pushNotifications?.enabled)) {
      for (const item of newOnes) {
        if (dispatchedPushIds.current.has(item.id)) continue;
        dispatchedPushIds.current.add(item.id);
        void IntegrationsService.sendBrowserPush(item.title, { body: item.body });
      }
    }

    setState((previous) => {
      const previousIds = new Set((previous.notifications || []).map((item) => item.id));
      const additions = newOnes.filter((item) => !previousIds.has(item.id));
      if (!additions.length) return previous;
      return {
        ...previous,
        notifications: [...additions, ...(previous.notifications || [])].slice(0, 30),
      };
    });
  }, [
    state.tasks,
    state.calendarEvents,
    state.ideas,
    state.goals,
    state.dailyCheckIns,
    state.cycleProfile,
    state.notificationSettings,
    state.notifications,
    state.integrations?.pushNotifications?.enabled,
  ]);

  const unreadNotificationCount = (state.notifications || []).filter(
    (n) => !n.read && !n.isRead
  ).length;

  // Tasks handlers
  const handleToggleTask = (taskId: string) => {
    setState((prev) => {
      const current = prev.tasks.find((task) => task.id === taskId);
      if (!current) return prev;

      const completing = current.status !== 'completed';
      const updatedTasks = prev.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: completing ? 'completed' as const : 'todo' as const,
              missed: false,
              completedAt: completing ? new Date().toISOString() : undefined,
            }
          : task
      );

      // A recurring task creates its next occurrence only when completed.
      // Keep the original occurrence in history and reset subtasks on the new one.
      if (completing && current.recurring !== 'none' && current.dueDate) {
        const nextDueDate = getNextRecurringTaskDate(current.dueDate, current.recurring, getLocalDateString());
        // Invalid legacy dates must never create malformed "NaN-NaN-NaN" tasks.
        if (nextDueDate) {
          const nextOccurrence: Task = {
            ...current,
            id: `${current.id}-${nextDueDate}-${Date.now()}`,
            dueDate: nextDueDate,
            status: 'todo',
            missed: false,
            completedAt: undefined,
            subtasks: (current.subtasks || []).map((subtask) => ({
              ...subtask,
              id: `${subtask.id}-${nextDueDate}`,
              completed: false,
            })),
            createdAt: nextDueDate,
          };
          updatedTasks.unshift(nextOccurrence);
        }
      }

      return { ...prev, tasks: updatedTasks };
    });
  };

  const handleSaveTask = (taskPayload: Partial<Task>) => {
    setState((prev) => {
      const exists = prev.tasks.some((t) => t.id === taskPayload.id);
      if (exists) {
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskPayload.id ? ({ ...t, ...taskPayload } as Task) : t
          ),
        };
      }
      return {
        ...prev,
        tasks: [taskPayload as Task, ...prev.tasks],
      };
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleRescheduleTask = (taskId: string, newDate: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              dueDate: newDate,
              missed: false,
              rescheduleSuggestion: undefined,
            }
          : t
      ),
    }));
  };

  const handleSimplifyTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              estimatedDuration: Math.max(15, Math.round(t.estimatedDuration * 0.6)),
              description: t.description ? `${t.description} (Simplified focus)` : 'Simplified scope',
              missed: false,
              rescheduleSuggestion: undefined,
            }
          : t
      ),
    }));
  };

  // Calendar handlers
  const handleSyncCalendarEvents = (googleEvents: CalendarEvent[]) => {
    setState((prev) => {
      const localEventsOnly = (prev.calendarEvents || []).filter(
        (e) => !e.isExternalSync && e.source !== 'google'
      );
      return {
        ...prev,
        calendarEvents: [...localEventsOnly, ...googleEvents],
      };
    });
  };

  const handleAddCalendarEvent = async (evt: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      id: evt.id || `evt-${Date.now()}`,
      title: evt.title || 'Nieuwe Afspraak',
      date: evt.date || getLocalDateString(),
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '10:00',
      realm: evt.realm || 'personal',
      type: evt.type || 'appointment',
      location: evt.location,
      notes: evt.notes,
      isExternalSync: false,
      source: 'alchemy',
    };

    const token = getCachedAccessToken('calendar');
    const isConnected = state.integrations?.calendar?.status === 'connected';
    const isReadOnly = state.integrations?.calendar?.readOnly;

    if (isConnected && !isReadOnly && token) {
      try {
        const { googleEventId } = await createRealCalendarEventInApi(token, newEvent);
        newEvent.googleEventId = googleEventId;
        newEvent.isExternalSync = true;
      } catch (err: any) {
        console.warn('Could not push event to Google Calendar API:', err);
      }
    }

    setState((prev) => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, newEvent],
    }));
  };

  // Goals handlers
  const handleSaveGoal = (goalPayload: Partial<Goal>) => {
    setState((prev) => {
      const existing = prev.goals.find((g) => g.id === goalPayload.id);
      if (existing) {
        return {
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === goalPayload.id ? ({ ...g, ...goalPayload } as Goal) : g
          ),
        };
      }
      const newGoal: Goal = {
        id: goalPayload.id || 'g-' + Date.now(),
        title: goalPayload.title || 'Nieuw Doel',
        description: goalPayload.description || '',
        realm: goalPayload.realm || 'mariluna',
        timeframe: goalPayload.timeframe || 'quarter',
        status: goalPayload.status || 'active',
        priority: goalPayload.priority || 'normal',
        progress: goalPayload.progress || 0,
        targetDate: goalPayload.targetDate,
        startDate: goalPayload.startDate,
        endDate: goalPayload.endDate,
        notes: goalPayload.notes,
        connectedProjectIds: goalPayload.connectedProjectIds || [],
        connectedTaskIds: goalPayload.connectedTaskIds || [],
        connectedContentIds: goalPayload.connectedContentIds || [],
        milestones: goalPayload.milestones || [],
        measurableTarget: goalPayload.measurableTarget,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        goals: [newGoal, ...prev.goals],
      };
    });
  };

  const handleDeleteGoal = (goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = (g.milestones || []).map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : g.progress;
        return {
          ...g,
          milestones: updatedMilestones,
          progress,
        };
      }),
    }));
  };

  // Intentions handlers
  const handleSaveIntention = (title: string, realm: Realm = 'personal', dateStr?: string) => {
    const targetDate = dateStr || getLocalDateString();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setState((prev) => {
      const existingList = prev.intentions || [];
      const existingIndex = existingList.findIndex(
        (i) => i.date === targetDate && i.realm === realm
      );

      if (existingIndex >= 0) {
        const updatedList = [...existingList];
        updatedList[existingIndex] = {
          ...updatedList[existingIndex],
          title: cleanTitle,
          status: 'active',
          completed: false,
        };
        return { ...prev, intentions: updatedList };
      } else {
        const newIntention: DailyIntention = {
          id: `int-${targetDate}-${Date.now()}`,
          title: cleanTitle,
          date: targetDate,
          realm: realm,
          status: 'active',
          completed: false,
          createdAt: new Date().toISOString(),
        };
        return { ...prev, intentions: [newIntention, ...existingList] };
      }
    });
  };

  const handleCompleteIntention = (intentionId: string) => {
    const todayStr = getLocalDateString();
    setState((prev) => ({
      ...prev,
      intentions: (prev.intentions || []).map((i) =>
        i.id === intentionId
          ? {
              ...i,
              completed: true,
              status: 'completed',
              completedAt: new Date().toISOString(),
              lastPromptedDate: todayStr,
            }
          : i
      ),
    }));
  };

  const handleSnoozeIntention = (intentionId: string, minutes: number = 120) => {
    const snoozedUntilTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const todayStr = getLocalDateString();
    setState((prev) => ({
      ...prev,
      intentions: (prev.intentions || []).map((i) =>
        i.id === intentionId
          ? {
              ...i,
              status: 'snoozed',
              snoozedUntil: snoozedUntilTime,
              lastPromptedDate: todayStr,
            }
          : i
      ),
    }));
  };

  const handleDismissIntentionPrompt = (intentionId: string) => {
    const todayStr = getLocalDateString();
    setState((prev) => ({
      ...prev,
      intentions: (prev.intentions || []).map((i) =>
        i.id === intentionId
          ? {
              ...i,
              status: 'dismissed',
              lastPromptedDate: todayStr,
            }
          : i
      ),
    }));
  };

  // Ideas handlers
  const handleSaveIdea = (ideaPayload: Partial<Idea>) => {
    setState((prev) => {
      const targetId = ideaPayload.id;
      if (targetId && prev.ideas.some((i) => i.id === targetId)) {
        return {
          ...prev,
          ideas: prev.ideas.map((i) =>
            i.id === targetId
              ? {
                  ...i,
                  ...ideaPayload,
                  lastRevisitedAt: ideaPayload.lastRevisitedAt || getLocalDateString(),
                }
              : i
          ),
        };
      }

      const newIdea: Idea = {
        id: targetId || 'i-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title: ideaPayload.title || 'Untitled Idea',
        content: ideaPayload.content || '',
        realm: ideaPayload.realm || (activeWorld === 'mariluna' ? 'mariluna' : 'personal'),
        category: ideaPayload.category,
        status: ideaPayload.status || 'raw',
        createdAt: ideaPayload.createdAt || getLocalDateString(),
        lastRevisitedAt: ideaPayload.lastRevisitedAt || getLocalDateString(),
        ...ideaPayload,
      };

      return {
        ...prev,
        ideas: [newIdea, ...prev.ideas],
      };
    });
  };

  const handleConvertToProject = (ideaId: string) => {
    const idea = state.ideas.find((i) => i.id === ideaId);
    if (!idea || idea.realm !== 'mariluna') return;

    const newProject: Project = {
      id: 'p-' + Date.now(),
      title: idea.title,
      description: idea.content,
      realm: idea.realm,
      status: 'planning',
      progress: 0,
      taskIds: [],
      ideaIds: [idea.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      projects: [...prev.projects, newProject],
      ideas: prev.ideas.map((i) =>
        i.id === ideaId ? { ...i, status: 'converted_to_project' as const, convertedToType: 'project' as const } : i
      ),
    }));

    setActiveWorld(idea.realm);
    setCurrentTab(idea.realm === 'mariluna' ? 'mariluna' : 'prive');
  };

  const handleSaveProject = (projectData: Partial<Project>) => {
    setState((prev) => {
      const existing = prev.projects.find((p) => p.id === projectData.id);
      if (existing) {
        return {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === projectData.id ? ({ ...p, ...projectData, updatedAt: new Date().toISOString() } as Project) : p
          ),
        };
      }
      const newProj: Project = {
        id: projectData.id || 'p-' + Date.now(),
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        realm: projectData.realm || 'mariluna',
        goalId: projectData.goalId,
        status: projectData.status || 'planning',
        progress: projectData.progress || 0,
        taskIds: projectData.taskIds || [],
        ideaIds: projectData.ideaIds || [],
        relatedContentIds: projectData.relatedContentIds || [],
        priority: projectData.priority || 'normal',
        startDate: projectData.startDate,
        deadline: projectData.deadline,
        notes: projectData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        projects: [...prev.projects, newProj],
      };
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== projectId),
    }));
  };

  const handleArchiveIdea = (ideaId: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) =>
        i.id === ideaId ? { ...i, status: 'archived' as const } : i
      ),
    }));
  };

  const handleDeleteIdea = (ideaId: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((i) => i.id !== ideaId),
    }));
  };

  // Content Plan handlers
  const handleAddContentPost = (post: Partial<ContentPost>) => {
    setState((prev) => ({
      ...prev,
      contentPlan: {
        ...prev.contentPlan,
        posts: [...prev.contentPlan.posts, post as ContentPost],
      },
    }));
  };

  // Profile & Routines handlers
  const handleUpdateProfile = (profile: LifeProfile) => {
    setState((prev) => ({ ...prev, lifeProfile: profile }));
  };

  // Cycle & Check-in handlers
  const handleUpdateCycleProfile = (cycleProfile: CycleProfile) => {
    setState((prev) => ({ ...prev, cycleProfile }));
  };

  const handleSaveDailyCheckIn = (checkIn: DailyCheckIn) => {
    setState((prev) => {
      const existingIndex = prev.dailyCheckIns.findIndex((c) => c.id === checkIn.id || c.date === checkIn.date);
      let updated: DailyCheckIn[];
      if (existingIndex >= 0) {
        updated = [...prev.dailyCheckIns];
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...checkIn,
          id: updated[existingIndex].id || checkIn.id,
        };
      } else {
        updated = [checkIn, ...prev.dailyCheckIns];
      }
      // Apply 2-month retention purge
      const purged = purgeExpiredDailyCheckIns(updated, 2);
      return { ...prev, dailyCheckIns: purged };
    });
    handleDismissMorningModal();
  };

  // Notification handlers
  const handleUpdateNotificationSettings = (notificationSettings: NotificationSettings) => {
    setState((prev) => ({ ...prev, notificationSettings }));
  };

  const handleDismissNotification = (id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) =>
        n.id === id ? { ...n, read: true, isRead: true } : n
      ),
    }));
  };

  const handleMarkAllNotificationsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((n) => ({ ...n, read: true, isRead: true })),
    }));
  };

  const handleClearAllNotifications = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  const handleDismissSuggestion = (id: string) => {
    setState((prev) => ({
      ...prev,
      proactiveSuggestions: prev.proactiveSuggestions.filter((s) => s.id !== id),
    }));
  };

  // Memory handlers
  const handleAddMemory = (memory: Partial<MemoryItem>) => {
    setState((prev) => ({
      ...prev,
      memories: [memory as MemoryItem, ...prev.memories],
    }));
  };

  const handleDeleteMemory = (id: string) => {
    setState((prev) => ({
      ...prev,
      memories: prev.memories.filter((m) => m.id !== id),
    }));
  };

  const handleUpdateMemories = (updater: (prev: MemoryItem[]) => MemoryItem[]) => {
    setState((prev) => ({
      ...prev,
      memories: updater(prev.memories || []),
    }));
  };

  // Assistant messaging & structured actions
  const handleAddAssistantMessage = (msg: AssistantMessage) => {
    setState((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, msg],
    }));
  };

  const handleExecuteAssistantAction = (action: any) => {
    if (!action) return;
    const payload = action.payload || {};
    // The action card carries the workspace selected in Jarvis. Never let a
    // model-suggested payload silently file a task or memory in the other realm.
    const workspace: Realm = action.workspace === 'mariluna' || action.workspace === 'personal'
      ? action.workspace
      : activeWorld === 'mariluna' ? 'mariluna' : 'personal';

    if (action.type === 'SUGGEST_TASK' || action.type === 'ADD_TASK') {
      handleSaveTask({
        id: 't-' + Date.now(),
        title: payload.title || 'Aanbevolen actie',
        description: payload.description || '',
        realm: workspace,
        category: payload.category || (workspace === 'mariluna' ? 'strategy' : 'self-care'),
        priority: payload.priority === 'low' || payload.priority === 'medium' ? payload.priority : 'high',
        dueDate: payload.dueDate || getLocalDateString(),
        estimatedDuration: payload.duration || 30,
        recurring: 'none',
        status: 'todo',
        subtasks: [],
        createdAt: getLocalDateString(),
      });
      setActiveWorld(workspace);
      setIsAssistantOpen(false);
      setCurrentTab('tasks');
    } else if (action.type === 'RESCHEDULE_TASK') {
      const taskId = typeof payload.taskId === 'string' ? payload.taskId : '';
      const newDate = typeof payload.newDate === 'string' ? payload.newDate : '';
      const taskExistsInWorkspace = state.tasks.some((task) => task.id === taskId && task.realm === workspace);
      if (taskExistsInWorkspace && isValidCalendarDate(newDate)) {
        handleRescheduleTask(taskId, newDate);
      }
    } else if (action.type === 'ADD_MEMORY') {
      handleAddMemory({
        content: payload.content || '',
        category: payload.category || 'Insight',
        realm: workspace,
      });
    } else if (action.type === 'CREATE_PROJECT' && workspace === 'mariluna') {
      const sourceIdeaId = typeof payload.ideaId === 'string' && state.ideas.some((idea) => idea.id === payload.ideaId)
        ? payload.ideaId
        : undefined;
      handleSaveProject({
        id: 'p-' + Date.now(),
        title: payload.title || 'Nieuw project',
        description: payload.description || '',
        realm: workspace,
        status: 'planning',
        progress: 0,
        taskIds: [],
        ideaIds: sourceIdeaId ? [sourceIdeaId] : [],
        priority: payload.priority === 'high' || payload.priority === 'low' ? payload.priority : 'normal',
      });
      if (sourceIdeaId) {
        handleSaveIdea({ id: sourceIdeaId, status: 'converted_to_project', convertedToType: 'project' });
      }
      setActiveWorld(workspace);
      setIsAssistantOpen(false);
      setCurrentTab(workspace === 'mariluna' ? 'mariluna' : 'prive');
    } else if (action.type === 'CREATE_CONTENT' && workspace === 'mariluna') {
      const sourceIdeaId = typeof payload.ideaId === 'string' && state.ideas.some((idea) => idea.id === payload.ideaId)
        ? payload.ideaId
        : undefined;
      handleAddContentPost({
        id: 'post-' + Date.now(),
        title: payload.title || 'Nieuw contentidee',
        description: payload.description || '',
        platform: payload.platform || 'Nog te bepalen',
        status: 'idea',
        pillar: payload.pillar || payload.theme || 'Nog te bepalen',
        relatedIdeaId: sourceIdeaId,
        notes: payload.notes || '',
        createdAt: new Date().toISOString(),
      });
      if (sourceIdeaId) {
        handleSaveIdea({ id: sourceIdeaId, status: 'converted', convertedToType: 'content' });
      }
      setActiveWorld('mariluna');
      setIsAssistantOpen(false);
      setCurrentTab('mariluna');
    }
  };

  // Sample data & backup handlers
  const handleToggleSampleData = () => {
    if (state.isSampleData) {
      // Sample data spans every module. Reset the complete sample state rather
      // than clearing only tasks and ideas, which left demo goals, events,
      // projects and profile data mixed into a real workspace.
      setState(resetState());
    } else {
      setState(INITIAL_STATE);
    }
  };

  const handleExportData = async () => {
    try {
      const backup = await createAlchemyBackup(state);
      downloadAlchemyBackupFile(backup);
      const exportedAt = new Date().toISOString();
      setLastBackupAt(exportedAt);
      try { localStorage.setItem('alchemy_last_backup_at', exportedAt); } catch { /* Backup still downloaded; status can be re-established next time. */ }
    } catch (error) {
      console.error('Alchemy backup export failed:', error);
      alert('De back-up kon niet veilig worden aangemaakt. Probeer een recente browser.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const input = e.target;
    // Refuse oversized imports before FileReader allocates the full file and
    // JSON.parse duplicates it in memory. Normal Alchemy backups are far below
    // this ceiling; the limit protects mobile browsers from accidental huge files.
    const maxBackupBytes = 15 * 1024 * 1024;
    if (file.size > maxBackupBytes) {
      alert('Dit back-upbestand is groter dan 15 MB en kan niet veilig worden geïmporteerd. Controleer of je het juiste Alchemy-bestand hebt geselecteerd.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let restored: AppState;
        if (parsed?.format === 'p-m-alchemy-backup') {
          const verified = await verifyAlchemyBackup(parsed);
          restored = verified.payload;
        } else {
          // Backward compatibility for legacy raw-JSON exports. They have no checksum,
          // so require explicit confirmation and basic structural validation.
          const legacy = parsed as Partial<AppState>;
          const requiredArrays: (keyof AppState)[] = [
            'tasks', 'goals', 'ideas', 'projects', 'calendarEvents', 'memories',
            'dailyCheckIns', 'notifications', 'proactiveSuggestions',
          ];
          const valid = !!legacy && typeof legacy === 'object' &&
            requiredArrays.every((key) => Array.isArray(legacy[key])) &&
            !!legacy.foundation && typeof legacy.foundation === 'object' &&
            !!legacy.integrations && typeof legacy.integrations === 'object';
          if (!valid) throw new Error('Ongeldig of onvolledig back-upbestand.');
          const confirmed = window.confirm(
            'Dit is een oudere Alchemy-back-up zonder integriteitscontrole. Herstel kan de huidige gegevens vervangen. Maak eerst een actuele back-up. Wil je doorgaan?'
          );
          if (!confirmed) return;
          restored = legacy as AppState;
        }
        if (!window.confirm('Deze actie vervangt de huidige Alchemy-gegevens. Alchemy downloadt eerst automatisch een herstelkopie van je huidige gegevens. Wil je doorgaan?')) return;
        const rollbackBackup = await createAlchemyBackup(state);
        downloadAlchemyBackupFile(rollbackBackup);
        // Persist the verified restore before changing the in-memory UI state.
        // A quota/storage failure must never be presented as a successful restore.
        if (!saveState(restored)) {
          throw new Error('De back-up is geldig, maar kon niet op dit toestel worden opgeslagen. Je huidige gegevens zijn niet vervangen. Controleer de browseropslag en probeer opnieuw.');
        }
        setState(restored);
        alert('Alchemy-back-up gecontroleerd en hersteld. Er is eerst een herstelkopie van de vorige gegevens gedownload.');
      } catch (error) {
        console.error('Alchemy backup import failed:', error);
        alert(error instanceof Error ? error.message : 'De back-up kon niet worden gecontroleerd.');
      } finally {
        input.value = '';
      }
    };
    reader.onerror = () => {
      alert('Het back-upbestand kon niet worden gelezen.');
      input.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleResetData = async () => {
    if (!window.confirm('Alle Alchemy-gegevens worden teruggezet naar de standaardinstellingen. Eerst wordt automatisch een herstelkopie gedownload. Wil je doorgaan?')) return;
    try {
      const rollbackBackup = await createAlchemyBackup(state);
      downloadAlchemyBackupFile(rollbackBackup);
      setState(resetState());
      alert('Alchemy is gereset. Je vorige gegevens zijn als herstelkopie gedownload.');
    } catch (error) {
      console.error('Alchemy reset backup failed:', error);
      alert('Reset geannuleerd: er kon geen veilige herstelkopie worden gemaakt.');
    }
  };

  const [activeContextItem, setActiveContextItem] = useState<any>(null);

  const openAssistantWithPrompt = (prompt: string, contextItem?: any) => {
    setActiveContextItem(contextItem || null);
    setIsAssistantOpen(true);
    // Send directly
    const userMsg: AssistantMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    handleAddAssistantMessage(userMsg);
  };

  const handleUpdateFoundation = (updatedFoundation: FoundationData) => {
    setState((prev) => {
      const synced = applyFoundationToAppState(prev, updatedFoundation);
      const nextState: AppState = {
        ...synced,
        foundation: {
          ...updatedFoundation,
          isCompleted: true,
        },
        setupStatus: 'completed',
      };
      saveState(nextState);
      return nextState;
    });
  };

  const handleCompleteSetup = (completedFoundation: FoundationData) => {
    setState((prev) => {
      const synced = applyFoundationToAppState(prev, completedFoundation);
      const nextState: AppState = {
        ...synced,
        foundation: {
          ...completedFoundation,
          isCompleted: true,
        },
        setupStatus: 'completed',
      };
      saveState(nextState);
      return nextState;
    });
  };

  const handleSkipSetup = () => {
    setState((prev) => {
      const nextState: AppState = {
        ...prev,
        foundation: {
          ...prev.foundation,
          isSkipped: true,
        },
        setupStatus: 'skipped',
      };
      saveState(nextState);
      return nextState;
    });
  };

  // Perimeter Authentication Guard
  if (isAppAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[var(--app-bg)] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] flex items-center justify-center mb-3 animate-pulse">
          <span className="font-serif text-xs font-semibold text-[var(--accent-secondary)]">P&M</span>
        </div>
        <span className="font-serif text-xs tracking-[0.2em] uppercase text-[var(--text-primary)]">ALCHEMY</span>
      </div>
    );
  }

  if (isAppAuthenticated === false) {
    return (
      <AppAuthLockScreen
        onAuthenticated={() => {
          setIsAppAuthenticated(true);
          setInactivityLocked(false);
          checkAuthStatus();
        }}
        inactivityLocked={inactivityLocked}
      />
    );
  }

  // Optional First-Time Setup Wizard (launched when requested by user)
  if (isSetupWizardOpen) {
    return (
      <div className="relative min-h-screen bg-[var(--app-bg)]">
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setIsSetupWizardOpen(false)}
            className="px-4 py-2 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>✕</span>
            <span>{state.foundation?.aboutYou?.preferredLanguage === 'nl' ? 'Terug naar Dashboard' : 'Back to Dashboard'}</span>
          </button>
        </div>
        <FirstTimeSetup
          foundation={state.foundation}
          onSaveFoundation={(nextFoundation) => {
            setState((prev) => {
              const nextState = { ...prev, foundation: nextFoundation };
              saveState(nextState);
              return nextState;
            });
          }}
          onCompleteSetup={(completedFoundation) => {
            handleCompleteSetup(completedFoundation);
            setIsSetupWizardOpen(false);
          }}
          onSkipSetup={() => {
            handleSkipSetup();
            setIsSetupWizardOpen(false);
          }}
        />
      </div>
    );
  }

  const userLang = state.foundation?.aboutYou?.preferredLanguage || 'nl';

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] font-sans antialiased selection:bg-[#52634A] selection:text-[#F0EBDD]">
      {/* Offline Status Badge */}
      <OfflineIndicator />
      {isPreviewMode && (
        <div role="status" className="mx-auto mt-3 w-[calc(100%-2rem)] max-w-7xl rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900">
          Preview / Test Mode — gebruik uitsluitend testgegevens
        </div>
      )}

      {storageSaveError && (
        <div
          role="alert"
          aria-live="assertive"
          className="sticky top-0 z-[90] mx-3 mt-3 rounded-xl border border-[#B45309]/40 bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412] shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium">{storageSaveError}</p>
            <button
              type="button"
              onClick={() => {
                if (saveState(state)) {
                  setStorageSaveError(null);
                  const savedAt = new Date().toISOString();
                  setLastSavedAt(savedAt);
                  try { localStorage.setItem('alchemy_last_saved_at', savedAt); } catch { /* Informational only. */ }
                }
              }}
              className="shrink-0 rounded-lg border border-[#9A3412]/30 px-3 py-1.5 text-xs font-semibold hover:bg-[#FFEDD5]"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      )}

      {/* Global navigation remains available inside each domain. Home is the neutral launcher. */}
      {currentTab !== 'home' && (
        <Navigation
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === 'mariluna') setActiveWorld('mariluna');
            else if (tab === 'prive') setActiveWorld('personal');
            setCurrentTab(tab);
          }}
          activeWorld={activeWorld}
          onSelectWorld={setActiveWorld}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          isAssistantOpen={isAssistantOpen}
          sampleDataActive={state.isSampleData}
          unreadNotificationCount={unreadNotificationCount}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          securityLevel={securityLevel}
          isSensitiveUnlocked={isSensitiveUnlocked}
          onLockApp={handleLockApp}
          lang={userLang}
        />
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 lg:pb-16">
        {currentTab === 'home' && (
          <HomeLauncher
            onEnterMariluna={() => { setActiveWorld('mariluna'); setCurrentTab('mariluna'); }}
            onEnterPrivate={() => { setActiveWorld('personal'); setCurrentTab('prive'); }}
            onQuickCapture={() => { setQuickRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal'); setIsQuickTaskModalOpen(true); }}
            onOpenJarvis={() => setIsAssistantOpen(true)}
            onOpenNotifications={() => setIsNotificationCenterOpen(true)}
            onOpenSettings={() => setCurrentTab('settings')}
            unreadNotificationCount={unreadNotificationCount}
            lang={userLang}
          />
        )}

        {currentTab === 'today' && (
          <TodayDashboardView
            tasks={state.tasks}
            events={state.calendarEvents}
            activeWorld={activeWorld}
            onToggleTask={handleToggleTask}
            onOpenTasks={() => setCurrentTab('tasks')}
            onOpenCalendar={() => setCurrentTab('calendar')}
            onOpenJarvis={() => setIsAssistantOpen(true)}
            lang={userLang}
          />
        )}

        {currentTab === 'tasks' && (
          <TasksView
            tasks={state.tasks}
            goals={state.goals}
            projects={state.projects}
            activeWorld={activeWorld}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            events={state.calendarEvents}
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            lifeProfile={state.lifeProfile}
            activeWorld={activeWorld}
            onAddEvent={handleAddCalendarEvent}
            integrations={state.integrations}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsView
            goals={state.goals}
            tasks={state.tasks}
            projects={state.projects}
            activeWorld={activeWorld}
            onSaveGoal={handleSaveGoal}
            onToggleMilestone={handleToggleMilestone}
          />
        )}

        {currentTab === 'ideas' && (
          <IdeasView
            ideas={state.ideas}
            activeWorld={activeWorld}
            onSaveIdea={handleSaveIdea}
            onConvertToProject={handleConvertToProject}
            onArchiveIdea={handleArchiveIdea}
            onDeleteIdea={handleDeleteIdea}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
          />
        )}

        {currentTab === 'mariluna' && (
          <MarilunaHubView
            contentPlan={state.contentPlan}
            onAddContentPost={handleAddContentPost}
            onUpdateContentPlan={(plan) => setState((prev) => ({ ...prev, contentPlan: plan }))}
            projects={state.projects}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            ideas={state.ideas}
            onSaveIdea={handleSaveIdea}
            onArchiveIdea={handleArchiveIdea}
            onConvertToProject={handleConvertToProject}
            goals={state.goals}
            onSaveGoal={handleSaveGoal}
            onDeleteGoal={handleDeleteGoal}
            onToggleMilestone={handleToggleMilestone}
            metricsState={state.marilunaMetrics}
            onUpdateMetricsState={(metrics) => setState((prev) => ({ ...prev, marilunaMetrics: metrics }))}
            offerings={state.marilunaOfferings}
            onUpdateOfferings={(offerings) => setState((prev) => ({ ...prev, marilunaOfferings: offerings }))}
            clients={state.marilunaClients}
            onUpdateClients={(clients) => setState((prev) => ({ ...prev, marilunaClients: clients }))}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
            lang={state.foundation?.aboutYou?.preferredLanguage || 'nl'}
            integrations={state.integrations}
          />
        )}

        {(currentTab === 'prive' || currentTab === 'mylife' || currentTab === 'meals' || currentTab === 'nutrition') && (
          <PriveDomainView
            initialSubTab={currentTab === 'meals' || currentTab === 'nutrition' ? 'nutrition' : currentTab === 'prive' ? 'cycle' : 'overview'}
            lifeProfile={state.lifeProfile}
            onUpdateProfile={handleUpdateProfile}
            personalStyle={state.personalStyle}
            onUpdateStyle={(style) => setState((prev) => ({ ...prev, personalStyle: style }))}
            nutrition={state.nutrition}
            onUpdateNutrition={(nutrition) => setState((prev) => ({ ...prev, nutrition }))}
            cycleProfile={state.cycleProfile}
            onUpdateCycleProfile={handleUpdateCycleProfile}
            dailyCheckIns={state.dailyCheckIns}
            onSaveDailyCheckIn={handleSaveDailyCheckIn}
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            calendarEvents={state.calendarEvents}
            onAddCalendarEvent={handleAddCalendarEvent}
            wellbeing={state.wellbeing}
            onUpdateWellbeing={(updater) =>
              setState((prev) => ({ ...prev, wellbeing: updater(prev.wellbeing) }))
            }
            goals={state.goals}
            onSaveGoal={handleSaveGoal}
            onToggleMilestone={handleToggleMilestone}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
            onSelectTab={setCurrentTab}
            lang={state.foundation?.aboutYou?.preferredLanguage || 'nl'}
            foodProfile={state.foundation?.foodProfile}
            foundationStyling={state.foundation?.personalStyling}
            onUpdateFoundationStyling={(styling) =>
              setState((prev) => ({
                ...prev,
                foundation: { ...prev.foundation, personalStyling: styling },
              }))
            }
            integrations={state.integrations}
          />
        )}

        {currentTab === 'cycle' && (
          <PriveDomainView
            initialSubTab="cycle"
            lifeProfile={state.lifeProfile}
            onUpdateProfile={handleUpdateProfile}
            personalStyle={state.personalStyle}
            onUpdateStyle={(style) => setState((prev) => ({ ...prev, personalStyle: style }))}
            nutrition={state.nutrition}
            onUpdateNutrition={(nutrition) => setState((prev) => ({ ...prev, nutrition }))}
            cycleProfile={state.cycleProfile}
            onUpdateCycleProfile={handleUpdateCycleProfile}
            dailyCheckIns={state.dailyCheckIns}
            onSaveDailyCheckIn={handleSaveDailyCheckIn}
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            calendarEvents={state.calendarEvents}
            onAddCalendarEvent={handleAddCalendarEvent}
            wellbeing={state.wellbeing}
            onUpdateWellbeing={(updater) =>
              setState((prev) => ({ ...prev, wellbeing: updater(prev.wellbeing) }))
            }
            goals={state.goals}
            onSaveGoal={handleSaveGoal}
            onToggleMilestone={handleToggleMilestone}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
            onSelectTab={setCurrentTab}
            lang={state.foundation?.aboutYou?.preferredLanguage || 'nl'}
            foodProfile={state.foundation?.foodProfile}
            foundationStyling={state.foundation?.personalStyling}
            onUpdateFoundationStyling={(styling) =>
              setState((prev) => ({
                ...prev,
                foundation: { ...prev.foundation, personalStyling: styling },
              }))
            }
            integrations={state.integrations}
          />
        )}

        {currentTab === 'wellbeing' && (
          <PriveDomainView
            initialSubTab="wellbeing"
            lifeProfile={state.lifeProfile}
            onUpdateProfile={handleUpdateProfile}
            personalStyle={state.personalStyle}
            onUpdateStyle={(style) => setState((prev) => ({ ...prev, personalStyle: style }))}
            nutrition={state.nutrition}
            onUpdateNutrition={(nutrition) => setState((prev) => ({ ...prev, nutrition }))}
            cycleProfile={state.cycleProfile}
            onUpdateCycleProfile={handleUpdateCycleProfile}
            dailyCheckIns={state.dailyCheckIns}
            onSaveDailyCheckIn={handleSaveDailyCheckIn}
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            calendarEvents={state.calendarEvents}
            onAddCalendarEvent={handleAddCalendarEvent}
            wellbeing={state.wellbeing}
            onUpdateWellbeing={(updater) =>
              setState((prev) => ({ ...prev, wellbeing: updater(prev.wellbeing) }))
            }
            goals={state.goals}
            onSaveGoal={handleSaveGoal}
            onToggleMilestone={handleToggleMilestone}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
            onSelectTab={setCurrentTab}
            lang={state.foundation?.aboutYou?.preferredLanguage || 'nl'}
            foodProfile={state.foundation?.foodProfile}
            foundationStyling={state.foundation?.personalStyling}
            onUpdateFoundationStyling={(styling) =>
              setState((prev) => ({
                ...prev,
                foundation: { ...prev.foundation, personalStyling: styling },
              }))
            }
            integrations={state.integrations}
          />
        )}

        {(currentTab === 'settings' || currentTab === 'integrations') && (
          <SettingsView
            initialTab={currentTab === 'integrations' ? 'integrations' : 'foundation'}
            onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
            memories={state.memories}
            lastSavedAt={lastSavedAt}
            lastBackupAt={lastBackupAt}
            onAddMemory={handleAddMemory}
            onDeleteMemory={handleDeleteMemory}
            onUpdateMemories={handleUpdateMemories}
            isSampleData={state.isSampleData}
            onToggleSampleData={handleToggleSampleData}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            notificationSettings={state.notificationSettings}
            onUpdateNotificationSettings={handleUpdateNotificationSettings}
            cycleProfile={state.cycleProfile}
            foundation={state.foundation}
            onUpdateFoundation={handleUpdateFoundation}
            wellbeingState={state.wellbeing}
            integrations={state.integrations}
            onSyncCalendarEvents={handleSyncCalendarEvents}
            onUpdateIntegrations={(updater) =>
              setState((prev) => {
                const nextState = {
                  ...prev,
                  integrations: updater(prev.integrations || DEFAULT_INTEGRATIONS_STATE),
                };
                saveState(nextState);
                return nextState;
              })
            }
          />
        )}

        {currentTab === 'security' && (
          <SecurityPrivacyCenter
            memories={state.memories}
            onDeleteMemory={handleDeleteMemory}
            onClearAllMemories={() => {
              state.memories.forEach((m) => handleDeleteMemory(m.id));
            }}
            onExportCompleteData={handleExportData}
            onResetCompleteData={handleResetData}
            onLockApp={handleLockApp}
          />
        )}
      </main>

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={state.notifications || []}
        settings={state.notificationSettings}
        onUpdateSettings={handleUpdateNotificationSettings}
        onMarkAsRead={handleDismissNotification}
        onDismissNotification={handleDismissNotification}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onClearAll={handleClearAllNotifications}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenAssistantWithPrompt={openAssistantWithPrompt}
      />

      {/* Global Quick Capture: available from every working area */}
      {currentTab !== 'home' && (
        <button
          type="button"
          onClick={() => {
            setQuickRealm(currentTab === 'mariluna' ? 'mariluna' : currentTab === 'prive' ? 'personal' : activeWorld === 'mariluna' ? 'mariluna' : 'personal');
            setQuickKind('task');
            setIsQuickTaskModalOpen(true);
          }}
          className="fixed left-4 bottom-20 lg:bottom-6 z-30 flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-raised)] px-4 py-3 text-xs font-medium text-[var(--text-primary)] shadow-xl transition hover:-translate-y-0.5 hover:border-[var(--accent-secondary)]"
          aria-label="Quick Capture"
        >
          <span className="text-base leading-none">＋</span>
          <span className="hidden sm:inline">Snel vastleggen</span>
        </button>
      )}

      {/* Floating Action Button for AI Strategic Partner on mobile */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        id="mobile-fab-assistant"
        className="lg:hidden fixed right-4 bottom-18 z-30 p-3 rounded-full bg-[#2C2825] text-[#F9F7F2] shadow-xl border border-[#C5A880]/30 hover:scale-105 active:scale-95 transition cursor-pointer"
        title="Open JARVIS Strategic Partner"
      >
        <Sparkles className="w-5 h-5 text-[#C5A880]" />
      </button>

      {/* Central Strategic Partner AI Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => {
          setIsAssistantOpen(false);
          setActiveContextItem(null);
        }}
        messages={state.chatHistory}
        onAddMessage={handleAddAssistantMessage}
        tasks={state.tasks}
        goals={state.goals}
        ideas={state.ideas}
        projects={state.projects}
        calendarEvents={state.calendarEvents}
        contentPlan={state.contentPlan}
        offerings={state.marilunaOfferings}
        lifeProfile={state.lifeProfile}
        memories={state.memories}
        activeWorld={activeWorld}
        onExecuteAction={handleExecuteAssistantAction}
        wellbeing={state.wellbeing}
        dailyCheckIns={state.dailyCheckIns}
        cycleProfile={state.cycleProfile}
        intentions={state.intentions}
        activeContextItem={activeContextItem}
      />

      {/* Universal Quick Capture */}
      {isQuickTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-1)] p-5 shadow-2xl">
            <div className="mb-4">
              <p className={`text-[10px] uppercase tracking-[0.2em] ${quickRealm === 'mariluna' ? 'text-[#D1A9B9]' : 'text-[#A2A36B]'}`}>Alchemy · Quick Capture</p>
              <h3 className="mt-1 font-serif text-2xl text-[var(--text-primary)]">Leg het even vast</h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Eerst bewaren, later verfijnen.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const title = quickTitle.trim();
                if (!title) return;
                const id = Date.now();
                const today = getLocalDateString();
                if (quickKind === 'idea' || quickKind === 'note') {
                  handleSaveIdea({
                    id: 'i-' + id,
                    title,
                    content: quickDetails.trim(),
                    realm: quickRealm,
                    category: quickKind === 'note' ? 'note' : 'quick-capture',
                    status: 'raw',
                    createdAt: today,
                    lastRevisitedAt: today,
                  });
                } else if (quickKind === 'appointment') {
                  handleAddCalendarEvent({
                    id: 'evt-' + id,
                    title,
                    date: quickDate,
                    startTime: quickStartTime,
                    endTime: (() => {
                      const [hours, minutes] = quickStartTime.split(':').map(Number);
                      const total = hours * 60 + minutes + 60;
                      return String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
                    })(),
                    realm: quickRealm,
                    type: 'appointment',
                    notes: quickDetails.trim(),
                  });
                } else {
                  handleSaveTask({
                    id: 't-' + id,
                    title,
                    description: quickDetails.trim(),
                    realm: quickRealm,
                    category: quickRealm === 'mariluna' ? 'business' : 'personal',
                    priority: quickKind === 'reminder' ? 'high' : 'medium',
                    dueDate: quickDate,
                    estimatedDuration: 30,
                    recurring: 'none',
                    status: 'todo',
                    subtasks: [],
                    createdAt: today,
                  });
                }
                setQuickTitle('');
                setQuickDetails('');
                setQuickKind('task');
                setQuickDate(today);
                setIsQuickTaskModalOpen(false);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-3 gap-2">
                {([
                  ['task', 'Taak'],
                  ['reminder', 'Herinnering'],
                  ['idea', 'Idee'],
                  ['note', 'Notitie'],
                  ['appointment', 'Afspraak'],
                ] as const).map(([kind, label]) => (
                  <button key={kind} type="button" onClick={() => setQuickKind(kind)}
                    className={`rounded-lg border px-2 py-2 text-xs transition ${quickKind === kind ? 'border-[var(--accent-secondary)] bg-[var(--surface-raised)] text-[var(--text-primary)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <input type="text" required autoFocus value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder={quickKind === 'appointment' ? 'Waarvoor is de afspraak?' : 'Wat wil je vastleggen?'}
                className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
              <textarea value={quickDetails} onChange={(e) => setQuickDetails(e.target.value)}
                placeholder={quickKind === 'note' ? 'Je notitie…' : 'Extra context (optioneel)'}
                rows={3} className="w-full resize-y rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
              {(quickKind === 'task' || quickKind === 'reminder' || quickKind === 'appointment') && (
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                    <span>Datum</span>
                    <input type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-2 text-xs text-[var(--text-primary)]" />
                  </label>
                  {quickKind === 'appointment' && <label className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                    <span>Startuur</span>
                    <input type="time" value={quickStartTime} onChange={(e) => setQuickStartTime(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface-2)] px-2 py-2 text-xs text-[var(--text-primary)]" />
                  </label>}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setQuickRealm('personal')}
                  className={`flex-1 rounded-lg border py-2 text-xs transition ${quickRealm === 'personal' ? 'border-[#39776D] bg-[#172F2B] text-[#E8DCC7]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>Privé</button>
                <button type="button" onClick={() => setQuickRealm('mariluna')}
                  className={`flex-1 rounded-lg border py-2 text-xs transition ${quickRealm === 'mariluna' ? 'border-[#873F5B] bg-[#321F32] text-[#E8DCC7]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>Mariluna</button>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsQuickTaskModalOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">Annuleren</button>
                <button type="submit" className={`rounded-lg px-4 py-2 text-xs font-semibold text-[#E8DCC7] hover:brightness-110 ${quickRealm === 'mariluna' ? 'bg-[#873F5B]' : 'bg-[#245047]'}`}>Bewaren</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Morning Check-In Modal on first daily app launch */}
      {isMorningModalOpen && (
        <MorningCheckInModal
          isOpen={isMorningModalOpen}
          onClose={handleDismissMorningModal}
          onSaveCheckIn={handleSaveDailyCheckIn}
          existingCheckIn={state.dailyCheckIns?.find((c) => c.date === getLocalDateString())}
          todayIntention={(state.intentions || []).find((i) => i.date === getLocalDateString())}
          lang="nl"
        />
      )}
    </div>
  );
}
