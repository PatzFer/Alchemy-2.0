import React, { useState, useEffect } from 'react';
import {
  Navigation,
  NavTab,
} from './components/Navigation';
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
import {
  loadState,
  saveState,
  resetState,
  AppState,
  INITIAL_STATE,
  DEFAULT_INTEGRATIONS_STATE,
} from './lib/storage';
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
  NotificationSettings,
  SmartNotification,
  ProactiveSuggestion,
  FoundationData,
} from './types';
import { evaluateSmartNotifications } from './lib/notificationEngine';
import { applyFoundationToAppState } from './lib/foundationDefaults';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [currentTab, setCurrentTab] = useState<NavTab>('today');
  const [activeWorld, setActiveWorld] = useState<ActiveWorldFilter>('all');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // SECURITY ARCHITECTURE NOTE:
  // Active perimeter locking, biometric lock screens, and inactivity timeouts are temporarily dormant
  // during this development phase so the entire application is directly accessible.
  // Full WebAuthn / FIDO2 security will be activated in the final development phase.
  const [securityLevel] = useState<1 | 2 | 3>(2);
  const [isSensitiveUnlocked] = useState<boolean>(true);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);

  const handleLockApp = () => {
    // Dormant during development phase
  };

  // Quick Task Modal from Today view
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickRealm, setQuickRealm] = useState<'personal' | 'mariluna'>('personal');

  // Automatically persist changes to local storage
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Periodic evaluation of smart notifications
  useEffect(() => {
    if (!state.notificationSettings?.enabled) return;
    const generated = evaluateSmartNotifications({
      settings: state.notificationSettings,
      existingNotifications: state.notifications || [],
      tasks: state.tasks || [],
      calendarEvents: state.calendarEvents || [],
      ideas: state.ideas || [],
      goals: state.goals || [],
      cycleProfile: state.cycleProfile,
      todayCheckIn: (state.dailyCheckIns || []).find(
        (c) => c.date === new Date().toISOString().split('T')[0]
      ),
    });
    if (generated && generated.length > 0) {
      setState((prev) => {
        const existingIds = new Set((prev.notifications || []).map((n) => n.id));
        const newOnes = generated.filter((n) => !existingIds.has(n.id));
        if (newOnes.length === 0) return prev;
        return {
          ...prev,
          notifications: [...newOnes, ...(prev.notifications || [])].slice(0, 30),
        };
      });
    }
  }, [state.tasks, state.ideas, state.goals, state.dailyCheckIns, state.notificationSettings?.enabled]);

  const unreadNotificationCount = (state.notifications || []).filter(
    (n) => !n.read && !n.isRead
  ).length;

  // Tasks handlers
  const handleToggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const newStatus = t.status === 'completed' ? 'todo' : 'completed';
        return {
          ...t,
          status: newStatus,
          missed: false,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
        };
      }),
    }));
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
  const handleAddCalendarEvent = (evt: Partial<CalendarEvent>) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: [...prev.calendarEvents, evt as CalendarEvent],
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
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.completed).length;
        const progress = Math.round((completedCount / updatedMilestones.length) * 100);
        return {
          ...g,
          milestones: updatedMilestones,
          progress,
        };
      }),
    }));
  };

  // Ideas handlers
  const handleSaveIdea = (ideaPayload: Partial<Idea>) => {
    setState((prev) => ({
      ...prev,
      ideas: [ideaPayload as Idea, ...prev.ideas],
    }));
  };

  const handleConvertToProject = (ideaId: string) => {
    const idea = state.ideas.find((i) => i.id === ideaId);
    if (!idea) return;

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
        i.id === ideaId ? { ...i, status: 'converted_to_project' as const } : i
      ),
    }));

    setCurrentTab('mariluna');
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
      const existingIndex = prev.dailyCheckIns.findIndex((c) => c.date === checkIn.date);
      let updated: DailyCheckIn[];
      if (existingIndex >= 0) {
        updated = [...prev.dailyCheckIns];
        updated[existingIndex] = checkIn;
      } else {
        updated = [checkIn, ...prev.dailyCheckIns];
      }
      return { ...prev, dailyCheckIns: updated };
    });
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
    if (action.type === 'SUGGEST_TASK' || action.type === 'ADD_TASK') {
      const payload = action.payload || {};
      handleSaveTask({
        id: 't-' + Date.now(),
        title: payload.title || 'Recommended Action',
        description: payload.description || '',
        realm: payload.realm || 'mariluna',
        category: payload.category || 'strategy',
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0],
        estimatedDuration: payload.duration || 30,
        recurring: 'none',
        status: 'todo',
        subtasks: [],
        createdAt: new Date().toISOString().split('T')[0],
      });
      setIsAssistantOpen(false);
      setCurrentTab('tasks');
    } else if (action.type === 'RESCHEDULE_TASK') {
      if (action.payload?.taskId) {
        handleRescheduleTask(action.payload.taskId, action.payload.newDate);
      }
    } else if (action.type === 'ADD_MEMORY') {
      handleAddMemory({
        content: action.payload?.content || '',
        category: action.payload?.category || 'Insight',
        realm: action.payload?.realm || 'mariluna',
      });
    }
  };

  // Sample data & backup handlers
  const handleToggleSampleData = () => {
    if (state.isSampleData) {
      setState((prev) => ({
        ...prev,
        isSampleData: false,
        tasks: [],
        ideas: [],
      }));
    } else {
      setState(INITIAL_STATE);
    }
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pm-alchemy-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setState(parsed);
          alert('Backup restored successfully.');
        } catch (err) {
          alert('Failed to parse backup JSON.');
        }
      };
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset all data to default initial state?')) {
      setState(resetState());
    }
  };

  const openAssistantWithPrompt = (prompt: string) => {
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

  // Optional First-Time Setup Wizard (launched when requested by user)
  if (isSetupWizardOpen) {
    return (
      <div className="relative min-h-screen bg-[#FAF8F3]">
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setIsSetupWizardOpen(false)}
            className="px-4 py-2 rounded-full bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#2C2825] hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer flex items-center gap-1.5"
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
    <div className="min-h-screen bg-[#FAF8F4] text-[#2C2825] font-sans antialiased selection:bg-[#E2D8C7] selection:text-[#2C2825]">
      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Top Header & Mobile Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-24 lg:pb-16">
        {currentTab === 'today' && (
          <TodayView
            tasks={state.tasks}
            onToggleTask={handleToggleTask}
            onSaveTask={handleSaveTask}
            calendarEvents={state.calendarEvents}
            onAddCalendarEvent={handleAddCalendarEvent}
            goals={state.goals}
            projects={state.projects}
            lifeProfile={state.lifeProfile}
            activeWorld={activeWorld}
            onOpenAssistant={() => setIsAssistantOpen(true)}
            onOpenTaskModal={() => setIsQuickTaskModalOpen(true)}
            onRescheduleTask={handleRescheduleTask}
            onSimplifyTask={handleSimplifyTask}
            onRemoveTask={handleDeleteTask}
            cycleProfile={state.cycleProfile}
            dailyCheckIns={state.dailyCheckIns}
            onSaveDailyCheckIn={handleSaveDailyCheckIn}
            proactiveSuggestions={state.proactiveSuggestions}
            onDismissSuggestion={handleDismissSuggestion}
            onSelectTab={setCurrentTab}
            onOpenAssistantWithPrompt={openAssistantWithPrompt}
            wellbeing={state.wellbeing}
            foundation={state.foundation}
            onUpdateFoundation={handleUpdateFoundation}
            lang={userLang}
            onOpenSetup={() => setIsSetupWizardOpen(true)}
            integrations={state.integrations}
            nutrition={state.nutrition}
            onAddMemory={handleAddMemory}
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
            lifeProfile={state.lifeProfile}
            activeWorld={activeWorld}
            onAddEvent={handleAddCalendarEvent}
            integrations={state.integrations}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsView
            goals={state.goals}
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
            adminState={state.marilunaAdmin}
            onUpdateAdminState={(admin) => setState((prev) => ({ ...prev, marilunaAdmin: admin }))}
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

        {(currentTab === 'prive' || currentTab === 'mylife') && (
          <PriveDomainView
            initialSubTab="overview"
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

        {currentTab === 'settings' && (
          <SettingsView
            memories={state.memories}
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
        onClose={() => setIsAssistantOpen(false)}
        messages={state.chatHistory}
        onAddMessage={handleAddAssistantMessage}
        tasks={state.tasks}
        goals={state.goals}
        ideas={state.ideas}
        lifeProfile={state.lifeProfile}
        memories={state.memories}
        activeWorld={activeWorld}
        onExecuteAction={handleExecuteAssistantAction}
        wellbeing={state.wellbeing}
      />

      {/* Quick Add Task Modal */}
      {isQuickTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-5 shadow-2xl">
            <h3 className="font-serif text-lg font-medium text-[#2C2825] mb-3">
              Add Today's Focus
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickTitle.trim()) return;
                handleSaveTask({
                  id: 't-' + Date.now(),
                  title: quickTitle.trim(),
                  description: '',
                  realm: quickRealm,
                  category: quickRealm === 'mariluna' ? 'business' : 'personal',
                  priority: 'high',
                  dueDate: new Date().toISOString().split('T')[0],
                  estimatedDuration: 30,
                  recurring: 'none',
                  status: 'todo',
                  subtasks: [],
                  createdAt: new Date().toISOString().split('T')[0],
                });
                setQuickTitle('');
                setIsQuickTaskModalOpen(false);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                autoFocus
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="e.g. Confirm guest speaker, swim at noon"
                className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickRealm('personal')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    quickRealm === 'personal'
                      ? 'bg-[#FFFFFF] border border-[#D5CCBE] text-[#2C2825] shadow-xs'
                      : 'text-[#8C8377]'
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setQuickRealm('mariluna')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${
                    quickRealm === 'mariluna'
                      ? 'bg-[#2C2825] text-[#F9F7F2]'
                      : 'text-[#8C8377]'
                  }`}
                >
                  Mariluna Studio
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickTaskModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#7A7167] hover:bg-[#EFE9DE] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#2C2825] text-[#F9F7F2] text-xs font-medium rounded-lg hover:bg-[#453E38]"
                >
                  Save Focus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
