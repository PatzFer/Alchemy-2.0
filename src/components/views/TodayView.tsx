import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  MoreVertical,
  CalendarDays,
  CloudSun,
  MapPin,
  ChevronDown,
  Repeat,
  AlertCircle,
  X,
  Check,
  Footprints,
  Activity,
} from 'lucide-react';
import {
  Task,
  CalendarEvent,
  Goal,
  Project,
  LifeProfile,
  ActiveWorldFilter,
  CycleProfile,
  DailyCheckIn,
  DailyIntention,
  Realm,
  CheckInFeeling,
  CheckInDriver,
  ProactiveSuggestion,
  WellbeingState,
  FoundationData,
  Language,
  WeatherInfo,
  IntegrationsState,
  DailyAlchemyBrief,
  BrainSuggestion,
  NutritionState,
  MemoryItem,
} from '../../types';
import { calculateDayCapacity } from '../../lib/planningEngine';
import { calculateCycleStatus } from '../../lib/cycleUtils';
import { fetchLiveWeather } from '../../lib/weatherService';
import { getRelevantCelestialNote, CelestialEvent } from '../../lib/celestialUtils';
import { AlchemyBriefCard } from '../brain/AlchemyBriefCard';
import { TaskSplitModal } from '../brain/TaskSplitModal';
import { generateDeterministicBrief, getOrRefreshAlchemyBrief } from '../../lib/brain/briefService';
import { snoozeSuggestion, isSuggestionSnoozed } from '../../lib/snoozeStore';

interface TodayViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onSaveTask?: (task: Partial<Task>) => void;
  onRescheduleTask?: (taskId: string, newDate: string) => void;
  onSimplifyTask?: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent?: (event: Partial<CalendarEvent>) => void;
  goals?: Goal[];
  projects?: Project[];
  lifeProfile: LifeProfile;
  activeWorld: ActiveWorldFilter;
  onOpenAssistant: () => void;
  onOpenTaskModal: () => void;
  cycleProfile?: CycleProfile;
  dailyCheckIns?: DailyCheckIn[];
  onSaveDailyCheckIn?: (checkIn: DailyCheckIn) => void;
  intentions?: DailyIntention[];
  onSaveIntention?: (title: string, realm?: Realm, dateStr?: string) => void;
  onCompleteIntention?: (id: string) => void;
  onSnoozeIntention?: (id: string) => void;
  onDismissIntention?: (id: string) => void;
  proactiveSuggestions?: ProactiveSuggestion[];
  onDismissSuggestion?: (id: string) => void;
  onSelectTab?: (tab: any) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  wellbeing?: WellbeingState;
  foundation?: FoundationData;
  onUpdateFoundation?: (foundation: FoundationData) => void;
  lang?: Language;
  onOpenSetup?: () => void;
  integrations?: IntegrationsState;
  nutrition?: NutritionState;
  onAddMemory?: (memory: Partial<MemoryItem>) => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onToggleTask,
  onSaveTask,
  onRescheduleTask,
  onRemoveTask,
  calendarEvents,
  onAddCalendarEvent,
  projects = [],
  lifeProfile,
  activeWorld,
  onOpenAssistant,
  onOpenTaskModal,
  cycleProfile,
  dailyCheckIns = [],
  onSaveDailyCheckIn,
  intentions = [],
  onSaveIntention,
  onCompleteIntention,
  onSnoozeIntention,
  onDismissIntention,
  proactiveSuggestions = [],
  onDismissSuggestion,
  onSelectTab,
  onOpenAssistantWithPrompt,
  foundation,
  onUpdateFoundation,
  lang = 'nl',
  onOpenSetup,
  integrations,
  nutrition,
  onAddMemory,
  wellbeing,
}) => {
  const safeLang: Language = lang === 'en' ? 'en' : 'nl';
  const isNl = safeLang === 'nl';
  const dateObj = new Date();
  const todayStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

  // 1. DATE FORMATTING
  const dayName = dateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', { weekday: 'long' });
  const formattedDate = dateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // 2. WEATHER STATE & LOCATION CONFIGURATION
  const userLocation = foundation?.aboutYou?.location?.trim();
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState(userLocation || '');

  useEffect(() => {
    if (userLocation) {
      setIsLoadingWeather(true);
      fetchLiveWeather(userLocation, safeLang).then((data) => {
        setWeather(data);
        setIsLoadingWeather(false);
      });
    } else {
      setWeather(null);
      setIsLoadingWeather(false);
    }
  }, [userLocation, safeLang]);

  const handleSaveLocation = () => {
    if (!newLocationInput.trim()) return;
    if (foundation && onUpdateFoundation) {
      onUpdateFoundation({
        ...foundation,
        aboutYou: {
          ...foundation.aboutYou,
          location: newLocationInput.trim(),
        },
      });
    }
    setIsLocationModalOpen(false);
  };

  // 2.5 TODAY'S INTENTION & PROACTIVE PROMPT STATE
  const todayIntention = useMemo(() => {
    return intentions.find(
      (i) => i.date === todayStr && (activeWorld === 'all' || i.realm === activeWorld)
    );
  }, [intentions, todayStr, activeWorld]);

  const [isIntentionInputOpen, setIsIntentionInputOpen] = useState(false);
  const [intentionInputText, setIntentionInputText] = useState('');

  const shouldShowProactivePrompt = useMemo(() => {
    if (!todayIntention) return false;
    if (todayIntention.completed || todayIntention.status === 'completed') return false;
    if (todayIntention.status === 'dismissed') return false;
    if (todayIntention.status === 'snoozed' && todayIntention.snoozedUntil) {
      if (new Date(todayIntention.snoozedUntil).getTime() > Date.now()) {
        return false;
      }
    }
    return true;
  }, [todayIntention]);

  // 2.5 ALCHEMY BRIEF 1.0 STATE & ENGINE
  const [brief, setBrief] = useState<DailyAlchemyBrief>(() => {
    const rawBrief = generateDeterministicBrief({
      foundation,
      calendarEvents,
      tasks,
      dailyCheckIns,
      projects,
      integrations,
      nutrition,
      wellbeing,
    } as any, todayStr);
    return {
      ...rawBrief,
      suggestions: (rawBrief.suggestions || []).filter((s) => !isSuggestionSnoozed(s.id)),
    };
  });

  const [splitModalTask, setSplitModalTask] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    getOrRefreshAlchemyBrief({
      foundation,
      calendarEvents,
      tasks,
      dailyCheckIns,
      projects,
      integrations,
      nutrition,
      wellbeing,
    } as any, todayStr).then((res) => {
      setBrief({
        ...res,
        suggestions: (res.suggestions || []).filter((s) => !isSuggestionSnoozed(s.id)),
      });
    });
  }, [
    todayStr,
    calendarEvents.length,
    tasks.length,
    dailyCheckIns?.length,
    integrations?.healthConnect?.todaySteps,
    nutrition?.activeWeeklyPlan?.days?.length,
  ]);

  const handleConfirmTaskSplit = (taskId: string, subtasks: { title: string; durationMinutes: number }[]) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const newSubtasks = subtasks.map((st, idx) => ({
      id: `st-${Date.now()}-${idx}`,
      title: st.title,
      completed: false,
      durationMinutes: st.durationMinutes,
    }));
    onSaveTask({
      ...targetTask,
      subtasks: [...(targetTask.subtasks || []), ...newSubtasks],
    });
  };

  const handleDismissBriefSuggestion = (sugId: string) => {
    // Persist snooze state so it survives navigation & re-render
    snoozeSuggestion(sugId, 4);
    setBrief((prev) => ({
      ...prev,
      suggestions: prev.suggestions.filter((s) => s.id !== sugId),
    }));
    if (onDismissSuggestion) {
      onDismissSuggestion(sugId);
    }
  };

  const handleSaveEveningReflection = (feeling: 'good' | 'okay' | 'heavy' | 'productive' | 'chaotic' | 'calm', note?: string) => {
    if (onSaveDailyCheckIn) {
      const feelingMap: Record<string, CheckInFeeling> = {
        good: 'good',
        okay: 'good',
        heavy: 'mentally_heavy',
        productive: 'good',
        chaotic: 'lower',
        calm: 'good',
      };
      onSaveDailyCheckIn({
        id: todayCheckIn?.id || `dci-${todayStr}`,
        date: todayStr,
        feeling: feelingMap[feeling] || 'good',
        timestamp: new Date().toISOString(),
        journalEntry: note,
      });
    }

    if (note && note.trim() && onAddMemory) {
      onAddMemory({
        content: `Reflectie / Context van ${todayStr}: ${note.trim()}`,
        category: 'Dagritme & Reflectie',
        realm: 'personal',
        dateAdded: todayStr,
        source: 'user_stated',
        type: 'temporary',
      });
    }
  };

  // 3. DAILY CHECK-IN STATE
  const todayCheckIn = dailyCheckIns.find((c) => c.date === todayStr);
  const [isEditingCheckIn, setIsEditingCheckIn] = useState(!todayCheckIn);
  const [pendingFeeling, setPendingFeeling] = useState<CheckInFeeling | null>(null);

  useEffect(() => {
    if (!todayCheckIn) {
      setIsEditingCheckIn(true);
    }
  }, [todayCheckIn]);

  const handleSelectFeeling = (feeling: CheckInFeeling) => {
    if (feeling === 'good') {
      // "Goed" needs no follow-up
      if (onSaveDailyCheckIn) {
        onSaveDailyCheckIn({
          id: todayCheckIn?.id || `dci-${todayStr}`,
          date: todayStr,
          feeling: 'good',
          energy: 'good',
          generalWellbeing: 'good',
          timestamp: new Date().toISOString(),
        });
      }
      setPendingFeeling(null);
      setIsEditingCheckIn(false);
    } else {
      // Requires ONE short follow-up
      setPendingFeeling(feeling);
    }
  };

  const handleSelectDriver = (driver: CheckInDriver) => {
    if (!pendingFeeling) return;
    const energyLevel =
      pendingFeeling === 'sick' ? 'very_low' : pendingFeeling === 'mentally_heavy' ? 'low' : 'low';

    if (onSaveDailyCheckIn) {
      onSaveDailyCheckIn({
        id: todayCheckIn?.id || `dci-${todayStr}`,
        date: todayStr,
        feeling: pendingFeeling,
        feelingDriver: driver,
        energy: energyLevel,
        generalWellbeing: pendingFeeling === 'sick' ? 'tired' : 'strained',
        timestamp: new Date().toISOString(),
      });
    }
    setPendingFeeling(null);
    setIsEditingCheckIn(false);
  };

  // 4. REALISTIC CAPACITY CALCULATION
  const capacity = calculateDayCapacity(
    tasks,
    calendarEvents,
    lifeProfile,
    todayStr,
    todayCheckIn,
    foundation,
    safeLang
  );

  // 5. CALENDAR EVENTS FOR TODAY
  const todayEvents = useMemo(() => {
    let rawEvents = calendarEvents.filter((e) => e.date === todayStr);
    if (activeWorld !== 'all') {
      rawEvents = rawEvents.filter((e) => e.realm === activeWorld);
    }
    const seen = new Set<string>();
    const deduplicated: CalendarEvent[] = [];

    for (const evt of rawEvents) {
      const key = evt.googleEventId || `${evt.date}-${evt.title.trim().toLowerCase()}-${evt.startTime}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(evt);
      }
    }

    return deduplicated.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [calendarEvents, todayStr, activeWorld]);

  // Quick Calendar Event entry
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStart, setEventStart] = useState('09:00');
  const [eventEnd, setEventEnd] = useState('10:00');
  const [eventRealm, setEventRealm] = useState<'personal' | 'mariluna'>('personal');

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !onAddCalendarEvent) return;
    onAddCalendarEvent({
      id: `evt-${Date.now()}`,
      title: eventTitle.trim(),
      startTime: eventStart,
      endTime: eventEnd,
      date: todayStr,
      realm: eventRealm,
      type: 'appointment',
    });
    setEventTitle('');
    setIsAddEventOpen(false);
  };

  // 6. TODAY'S TASKS & PRIORITY SORTING
  const todayTasks = useMemo(() => {
    const raw = tasks.filter(
      (t) =>
        t.dueDate === todayStr ||
        (t.status !== 'completed' && t.dueDate && t.dueDate < todayStr)
    );
    const filtered =
      activeWorld === 'all' ? raw : raw.filter((t) => t.realm === activeWorld);

    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };

    return [...filtered].sort((a, b) => {
      // Incomplete tasks first
      if (a.status !== b.status) {
        return a.status === 'completed' ? 1 : -1;
      }
      // High priority first, then normal, then low
      const pDiff = (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
      if (pDiff !== 0) return pDiff;
      // Secondary sort: shorter tasks or duration
      return (a.estimatedDuration || 30) - (b.estimatedDuration || 30);
    });
  }, [tasks, todayStr, activeWorld]);

  // Task actions dropdown state
  const [activeTaskMenuId, setActiveTaskMenuId] = useState<string | null>(null);
  const [customDatePickerTaskId, setCustomDatePickerTaskId] = useState<string | null>(null);

  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getInTwoDaysStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };

  const handleMoveToTomorrow = (taskId: string) => {
    if (onRescheduleTask) {
      onRescheduleTask(taskId, getTomorrowStr());
    }
    setActiveTaskMenuId(null);
  };

  const handleSnoozeTwoDays = (taskId: string) => {
    if (onRescheduleTask) {
      onRescheduleTask(taskId, getInTwoDaysStr());
    }
    setActiveTaskMenuId(null);
  };

  const handleKeepForLater = (taskId: string) => {
    if (onSaveTask) {
      onSaveTask({ id: taskId, dueDate: '' });
    }
    setActiveTaskMenuId(null);
  };

  const handleChangePriority = (taskId: string, newPriority: 'high' | 'medium' | 'low') => {
    if (onSaveTask) {
      onSaveTask({ id: taskId, priority: newPriority });
    }
  };

  // 7. UPCOMING / NEXT COMMITMENTS
  const upcomingItems = useMemo(() => {
    const items: Array<{
      id: string;
      label: string;
      title: string;
      time?: string;
      dateLabel: string;
      type: 'event' | 'task';
    }> = [];

    const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();

    // 1) Next event today
    const nextEventToday = todayEvents.find((e) => {
      const [eH, eM] = e.endTime.split(':').map(Number);
      return eH * 60 + eM >= currentMinutes;
    });

    if (nextEventToday) {
      items.push({
        id: nextEventToday.id,
        label: isNl ? 'Volgende afspraak vandaag' : 'Next today',
        title: nextEventToday.title,
        time: `${nextEventToday.startTime}–${nextEventToday.endTime}`,
        dateLabel: isNl ? 'Vandaag' : 'Today',
        type: 'event',
      });
    }

    // 2) Tomorrow's earliest event
    const tomorrowStr = getTomorrowStr();
    const tomorrowEvents = calendarEvents
      .filter((e) => e.date === tomorrowStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    if (tomorrowEvents.length > 0) {
      const firstTomorrow = tomorrowEvents[0];
      items.push({
        id: firstTomorrow.id,
        label: isNl ? 'Morgen in de agenda' : 'Tomorrow',
        title: firstTomorrow.title,
        time: `${firstTomorrow.startTime}–${firstTomorrow.endTime}`,
        dateLabel: isNl ? 'Morgen' : 'Tomorrow',
        type: 'event',
      });
    }

    // 3) Upcoming key tasks later this week (next 2-5 days)
    const futureHighTasks = tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        t.dueDate &&
        t.dueDate > todayStr &&
        t.dueDate !== tomorrowStr &&
        t.priority === 'high'
    );
    if (futureHighTasks.length > 0 && items.length < 3) {
      const topFuture = futureHighTasks[0];
      const futureDateObj = new Date(topFuture.dueDate);
      const dayLabel = futureDateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', {
        weekday: 'long',
      });
      items.push({
        id: topFuture.id,
        label: isNl ? 'Later deze week' : 'Later this week',
        title: topFuture.title,
        dateLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        type: 'task',
      });
    }

    return items;
  }, [todayEvents, calendarEvents, tasks, todayStr, isNl, dateObj]);

  // 8. ONE SMALL ALCHEMY INSIGHT
  const smallInsight = useMemo(() => {
    // Generate context-aware single insight
    if (todayCheckIn?.feeling === 'sick') {
      return {
        title: isNl ? 'Herstel heeft vandaag voorrang' : 'Recovery takes precedence today',
        body: isNl
          ? 'Je lichaam vraagt om rust. Niet-essentiële taken kunnen gerust wachten; concentreer je uitsluitend op wat strikt noodzakelijk is.'
          : 'Your body needs rest today. Non-essential tasks can safely wait; focus exclusively on essential recovery.',
        actionPrompt: isNl ? 'Help me mijn dag zo licht mogelijk te maken.' : 'Help me make today as light as possible.',
      };
    }

    if (todayCheckIn?.feeling === 'mentally_heavy') {
      return {
        title: isNl ? 'Zachte pacing voor je geest' : 'Gentle cognitive pacing',
        body: isNl
          ? 'Vandaag voelt mentaal zwaarder. We verminderen de cognitieve druk en houden de doelen eenvoudig en haalbaar.'
          : 'Today feels mentally heavier. We are reducing cognitive pressure and keeping expectations simple and kind.',
        actionPrompt: isNl ? 'Welke ene taak is vandaag écht genoeg?' : 'Which single task is genuinely enough today?',
      };
    }

    if (todayCheckIn?.feeling === 'lower' && todayCheckIn?.feelingDriver === 'poor_sleep') {
      return {
        title: isNl ? 'Rustig tempo na lichte nacht' : 'Calm pacing after poor sleep',
        body: isNl
          ? `Je energie is wat lager door slaapgebrek. Realistische vrije tijd: ${capacity.formattedFreeTime}. Bewaar je focus voor de ochtend en bescherm je avond.`
          : `Energy is lower from sleep deficit. Realistic free capacity: ${capacity.formattedFreeTime}. Focus on essentials this morning and strictly guard your evening.`,
        actionPrompt: isNl ? 'Maak mijn avond lichter.' : 'Make my evening lighter.',
      };
    }

    if (capacity.status === 'overcrowded') {
      return {
        title: isNl ? 'Agenda zit aan de grens' : 'Schedule at capacity limit',
        body: isNl
          ? `Met je vaste afspraken en taken blijft er ${capacity.formattedFreeTime} ademruimte over. Overweeg 1 taak door te schuiven.`
          : `With your calendar events and planned tasks, only ${capacity.formattedFreeTime} breathing room remains. Consider rescheduling 1 task.`,
        actionPrompt: isNl ? 'Welke taak kan ik het beste naar morgen verplaatsen?' : 'Which task is best moved to tomorrow?',
      };
    }

    if (proactiveSuggestions.length > 0) {
      const top = proactiveSuggestions[0];
      return {
        title: top.title,
        body: top.body,
        actionPrompt: top.actionPrompt || (isNl ? 'Waar moet ik me nu op richten?' : 'What should I focus on now?'),
      };
    }

    return {
      title: isNl ? 'Evenwichtig dagritme' : 'Harmonious daily rhythm',
      body: isNl
        ? `Realistische vrije tijd vandaag: ${capacity.formattedFreeTime}. Een helder ritme met voldoende ruimte tussen taken.`
        : `Realistic free time today: ${capacity.formattedFreeTime}. A clear rhythm with healthy breathing room between tasks.`,
      actionPrompt: isNl ? 'Waar moet ik me nu op richten?' : 'What should I focus on now?',
    };
  }, [todayCheckIn, capacity, proactiveSuggestions, isNl]);

  // 9. CELESTIAL NOTE (Genuine, factual astronomical calculation)
  const celestialNote: CelestialEvent | null = useMemo(() => {
    return getRelevantCelestialNote(dateObj, safeLang);
  }, [dateObj, safeLang]);

  return (
    <div className="max-w-2xl mx-auto space-y-7 px-3 sm:px-4 py-4 sm:py-6 pb-24 text-[var(--text-primary)]">
      {/* ============================================================ */}
      {/* 1. DATE + WEATHER                                            */}
      {/* ============================================================ */}
      <header className="space-y-1.5 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--text-muted)] font-sans block capitalize">
              {dayName}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] font-normal tracking-tight mt-0.5">
              {formattedDate}
            </h1>
          </div>

          {/* Weather compact block */}
          <div className="text-right shrink-0">
            {isLoadingWeather ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] animate-pulse">
                <CloudSun className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>{isNl ? 'Weer laden...' : 'Loading weather...'}</span>
              </div>
            ) : weather ? (
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="group inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                title={isNl ? 'Klik om locatie te wijzigen' : 'Click to change location'}
              >
                <CloudSun className="w-4 h-4 text-[var(--accent-secondary)] group-hover:scale-105 transition" />
                <span className="font-medium text-[var(--text-primary)]">
                  {weather.temperature}°C
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className="text-[var(--text-secondary)]">{weather.description}</span>
                <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline">
                  ({weather.locationName})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer px-2 py-1 rounded-lg hover:bg-[var(--surface-2)]"
              >
                <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                <span>{isNl ? 'Locatie instellen voor weer' : 'Set location for weather'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Subtle Today Check-In Status (Prompt 13) */}
        <div className="flex items-center gap-2 pt-0.5">
          {todayCheckIn ? (
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('prive')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3E6] border border-[#D2E4C9] text-[#2D5A27] text-xs font-medium hover:bg-[#E2EEE0] transition cursor-pointer"
              title={isNl ? 'Bekijk in Privé' : 'View in Private'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A27]" />
              <span>
                {isNl
                  ? `Vandaag ingecheckt · Energie: ${
                      todayCheckIn.energy === 'very_low'
                        ? 'Zeer laag'
                        : todayCheckIn.energy === 'low'
                        ? 'Laag'
                        : todayCheckIn.energy === 'normal'
                        ? 'Normaal'
                        : todayCheckIn.energy === 'good'
                        ? 'Goed'
                        : todayCheckIn.energy === 'high'
                        ? 'Hoog'
                        : 'Ingevuld'
                    }`
                  : `Checked in today · Energy: ${todayCheckIn.energy}`}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onSelectTab && onSelectTab('prive')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-2)] transition cursor-pointer"
              title={isNl ? 'Check-in invullen in Privé' : 'Complete check-in in Private'}
            >
              <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>{isNl ? 'Nog niet ingecheckt' : 'Not checked in yet'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Health Connect Daily Movement Context (Purely neutral context, non-judgmental) */}
      {integrations?.healthConnect?.status === 'connected' && (
        (() => {
          const stepCount = integrations.healthConnect.todaySteps ?? integrations.healthConnect.stepsToday ?? 0;
          if (stepCount <= 0) return null;
          return (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)] border border-[#E5DFD3] text-xs text-[var(--text-secondary)] w-fit shadow-2xs select-none">
              <Footprints className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>
                {isNl
                  ? `${stepCount.toLocaleString('nl-NL')} stappen vandaag`
                  : `${stepCount.toLocaleString('en-US')} steps today`}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">• Health Connect</span>
            </div>
          );
        })()
      )}

      {/* Location Setup Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[var(--text-primary)]">
                {isNl ? 'Locatie voor Weer' : 'Location for Weather'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {isNl
                ? 'Voer je woonplaats of regio in. We halen actuele weersinformatie rechtstreeks op zonder fictieve data.'
                : 'Enter your city or region. We fetch real weather data directly with zero fictional data.'}
            </p>
            <div className="space-y-2">
              <input
                type="text"
                placeholder={isNl ? 'bijv. Amsterdam, Gent, Utrecht' : 'e.g. London, Amsterdam, Paris'}
                value={newLocationInput}
                onChange={(e) => setNewLocationInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={!newLocationInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--text-primary)] transition disabled:opacity-50"
              >
                {isNl ? 'Opslaan' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Foundation Setup Prompt */}
      {onOpenSetup && (!foundation?.configuredSections || foundation.configuredSections.length === 0) && (
        <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[#E0D4C2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-serif font-medium text-[var(--text-primary)] block">
              {isNl ? 'Welkom bij Alchemy' : 'Welcome to Alchemy'}
            </span>
            <p className="text-[var(--text-secondary)] font-light">
              {isNl
                ? 'Configureer jouw levensritme, doelen en welzijn via de First-Time Onboarding Wizard.'
                : 'Configure your life rhythm, goals, and wellbeing via the First-Time Onboarding Wizard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSetup}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--text-primary)] transition cursor-pointer shadow-xs self-start sm:self-auto"
          >
            {isNl ? 'Start Setup Wizard →' : 'Start Setup Wizard →'}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1.5 ALCHEMY BRIEF 1.0 (Central Intelligence, Context & Plan)  */}
      {/* ============================================================ */}
      <AlchemyBriefCard
        brief={brief}
        onAcceptSuggestionAction={(suggestion, actionId) => {
          handleDismissBriefSuggestion(suggestion.id);
        }}
        onDismissSuggestion={handleDismissBriefSuggestion}
        onSaveEveningReflection={handleSaveEveningReflection}
        onOpenTaskSplitter={(taskId, taskTitle) => setSplitModalTask({ id: taskId, title: taskTitle })}
        onOpenPlanner={() => onSelectTab && onSelectTab('tasks')}
        onOpenMeals={() => onSelectTab && onSelectTab('meals')}
        onOpenProjects={() => onSelectTab && onSelectTab('projects')}
        isNl={isNl}
      />

      {/* ============================================================ */}
      {/* 1.6 TODAY'S INTENTION (Subtle Daily Focus Anchor)            */}
      {/* ============================================================ */}
      <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] shadow-xs space-y-2.5">
        <div className="flex items-center justify-between border-b border-[var(--surface-2)] pb-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
            <span className="font-serif font-medium text-[var(--text-primary)] uppercase tracking-wider text-[11px]">
              {isNl ? 'Dagelijkse Intentie' : "Today's Intention"}
            </span>
          </div>
          {todayIntention && (
            <button
              type="button"
              onClick={() => {
                setIntentionInputText(todayIntention.title);
                setIsIntentionInputOpen(true);
              }}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              {isNl ? 'Wijzigen' : 'Edit'}
            </button>
          )}
        </div>

        {todayIntention ? (
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div className="space-y-0.5">
              <p className="font-serif text-sm text-[var(--text-primary)] font-medium">
                "{todayIntention.title}"
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {todayIntention.completed
                  ? (isNl ? '✓ Vandaag gedaan' : '✓ Completed today')
                  : (isNl ? '○ Nog niet gedaan' : '○ Active focus')}
              </p>
            </div>

            {todayIntention.completed ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#EBF3E6] text-[#2D5A27] text-xs font-medium border border-[#D2E4C9]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isNl ? 'Vandaag gedaan' : 'Completed'}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onCompleteIntention && onCompleteIntention(todayIntention.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--text-primary)] transition cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5 text-[var(--border-subtle)]" />
                <span>{isNl ? 'Markeer als gedaan' : 'Mark as done'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="pt-1">
            {isIntentionInputOpen ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!intentionInputText.trim()) return;
                  onSaveIntention && onSaveIntention(intentionInputText, activeWorld === 'mariluna' ? 'mariluna' : 'personal');
                  setIsIntentionInputOpen(false);
                  setIntentionInputText('');
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={intentionInputText}
                  onChange={(e) => setIntentionInputText(e.target.value)}
                  placeholder={isNl ? 'bijv. Ademhaling, Rust, Vandaag niet haasten' : 'e.g. Breathing, Calm pacing, No rushing'}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--text-primary)] transition cursor-pointer shrink-0"
                >
                  {isNl ? 'Opslaan' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsIntentionInputOpen(false)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-light">
                  {isNl ? 'Nog geen intentie ingesteld voor vandaag.' : 'No intention set for today yet.'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsIntentionInputOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-[var(--accent-secondary)] font-medium hover:text-[var(--text-primary)] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Stel intentie in' : 'Set intention'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 1.7 PROACTIVE INTENTION PROMPT (Gentle Daily Follow-up)       */}
      {/* ============================================================ */}
      {shouldShowProactivePrompt && todayIntention && (
        <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] shadow-xs space-y-3 animate-fade-in text-[var(--text-primary)]">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-secondary)]" />
              <span className="font-serif font-medium text-xs text-[var(--accent-secondary)] uppercase tracking-wider">
                {isNl ? 'Proactieve Guidance' : 'Proactive Guidance'}
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light">
            Je had vandaag <strong className="font-medium text-[var(--text-primary)]">"{todayIntention.title}"</strong> als intentie gekozen.
            Heb je daar nu een moment voor?
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <button
              type="button"
              onClick={() => onCompleteIntention && onCompleteIntention(todayIntention.id)}
              className="px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] font-medium hover:bg-[var(--text-primary)] transition cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[var(--border-subtle)]" />
              <span>{isNl ? 'Ja, nu doen' : 'Yes, do now'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSnoozeIntention && onSnoozeIntention(todayIntention.id, 120)}
              className="px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium hover:bg-[var(--surface-2)] transition cursor-pointer flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>{isNl ? 'Snooze (2u)' : 'Snooze'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDismissIntention && onDismissIntention(todayIntention.id)}
              className="px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer font-light"
            >
              {isNl ? 'Niet vandaag' : 'Not today'}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TODAY'S CALENDAR (Comes FIRST before tasks!)              */}
      {/* ============================================================ */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              {isNl ? 'Agenda van vandaag' : "Today's Calendar"}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#EADFCF] text-[var(--text-secondary)] font-medium font-sans">
              {todayEvents.length} {isNl ? (todayEvents.length === 1 ? 'afspraak' : 'afspraken') : (todayEvents.length === 1 ? 'event' : 'events')}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-sans">
              ({capacity.formattedFreeTime} {isNl ? 'vrije tijd' : 'free capacity'})
            </span>
            {integrations?.calendar?.status === 'connected' && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#2D5A3C] border border-[#D0E2D4]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C] animate-pulse" />
                <span>Google Agenda</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsAddEventOpen(!isAddEventOpen)}
              className="text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Afspraak' : 'Event'}</span>
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                {isNl ? 'Agenda →' : 'Calendar →'}
              </button>
            )}
          </div>
        </div>

        {/* Inline Add Event Form */}
        {isAddEventOpen && (
          <form
            onSubmit={handleCreateEvent}
            className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-subtle)] shadow-xs space-y-3 text-xs"
          >
            <div className="font-medium text-[var(--text-primary)]">
              {isNl ? 'Nieuwe afspraak voor vandaag' : 'New appointment for today'}
            </div>
            <input
              type="text"
              placeholder={isNl ? 'Titel afspraak (bijv. Werk, Familiefeest, Tandarts)' : 'Title (e.g. Work, Family gathering)'}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-secondary)]"
              autoFocus
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  {isNl ? 'Starttijd' : 'Start'}
                </label>
                <input
                  type="time"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  {isNl ? 'Eindtijd' : 'End'}
                </label>
                <input
                  type="time"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                  {isNl ? 'Domein' : 'Domain'}
                </label>
                <select
                  value={eventRealm}
                  onChange={(e) => setEventRealm(e.target.value as 'personal' | 'mariluna')}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
                >
                  <option value="personal">{isNl ? 'Persoonlijk' : 'Personal'}</option>
                  <option value="mariluna">Mariluna</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddEventOpen(false)}
                className="px-3 py-1 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!eventTitle.trim()}
                className="px-3.5 py-1 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--text-primary)] disabled:opacity-40"
              >
                {isNl ? 'Toevoegen' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Real Calendar Events List */}
        {todayEvents.length === 0 ? (
          <div className="p-4 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] text-xs text-[var(--text-secondary)] flex items-center justify-between">
            <span>{isNl ? 'Geen afspraken vandaag' : 'No appointments today'}</span>
            <span className="text-[11px] text-[var(--text-muted)]">
              {isNl ? 'Volledige agenda is vrij' : 'All hours free'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3.5 rounded-2xl border border-[#E5DFD3] bg-[var(--surface-2)] shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-[var(--accent-secondary)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-[var(--text-primary)] truncate">
                      {event.title}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {event.startTime}–{event.endTime}
                      </span>
                      {event.location && (
                        <>
                          <span className="text-[var(--border-subtle)]">•</span>
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                    event.realm === 'mariluna'
                      ? 'bg-[var(--text-primary)] text-[var(--text-primary)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                  }`}
                >
                  {event.realm === 'mariluna' ? 'Mariluna' : (isNl ? 'Persoonlijk' : 'Personal')}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 3. DAILY CHECK-IN                                            */}
      {/* ============================================================ */}
      <section className="rounded-2xl border border-[#E5DFD3] bg-[var(--surface-2)] p-4 sm:p-4.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--accent-secondary)] font-sans">
              {isNl ? 'DAGELIJKSE CHECK-IN' : 'DAILY CHECK-IN'}
            </span>
            <h3 className="font-serif text-base text-[var(--text-primary)]">
              {isNl ? 'Hoe voel je je vandaag?' : 'How are you feeling today?'}
            </h3>
          </div>

          {todayCheckIn && !isEditingCheckIn && (
            <button
              type="button"
              onClick={() => {
                setIsEditingCheckIn(true);
                setPendingFeeling(null);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)] font-medium transition cursor-pointer"
            >
              {isNl ? 'Wijzigen' : 'Change'}
            </button>
          )}
        </div>

        {/* If Check-In is recorded and not currently editing */}
        {todayCheckIn && !isEditingCheckIn ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
              {todayCheckIn.feeling === 'good' && (
                <>
                  <span>🙂</span>
                  <span>{isNl ? 'Goed — Normaal / goed energieniveau' : 'Good — Normal / high vitality'}</span>
                </>
              )}
              {todayCheckIn.feeling === 'lower' && (
                <>
                  <span>😐</span>
                  <span>
                    {isNl ? 'Lager dan normaal' : 'Lower than normal'}
                    {todayCheckIn.feelingDriver === 'poor_sleep' && (isNl ? ' · 😴 Slecht geslapen' : ' · 😴 Poor sleep')}
                    {todayCheckIn.feelingDriver === 'low_energy' && (isNl ? ' · 🔋 Weinig energie' : ' · 🔋 Low energy')}
                    {todayCheckIn.feelingDriver === 'cycle' && (isNl ? ' · 🩸 Cyclusritme' : ' · 🩸 Cycle')}
                    {todayCheckIn.feelingDriver === 'stress' && (isNl ? ' · 🧠 Stress' : ' · 🧠 Stress')}
                    {todayCheckIn.feelingDriver === 'other' && (isNl ? ' · ❓ Iets anders' : ' · ❓ Other')}
                  </span>
                </>
              )}
              {todayCheckIn.feeling === 'sick' && (
                <>
                  <span>🤒</span>
                  <span>{isNl ? 'Ziek / niet oké — Lichaam vraagt om rust' : 'Sick / not well — Body asks for rest'}</span>
                </>
              )}
              {todayCheckIn.feeling === 'mentally_heavy' && (
                <>
                  <span>😔</span>
                  <span>{isNl ? 'Mentaal zwaar — Emotioneel / mentaal uitgeput' : 'Mentally heavy — Emotionally drained'}</span>
                </>
              )}
            </div>

            {capacity.explanation && (
              <p className="text-[11px] text-[var(--text-secondary)] font-light leading-relaxed">
                {capacity.explanation}
              </p>
            )}
          </div>
        ) : (
          /* Active Check-In Selection */
          <div className="space-y-3">
            {/* Exactly 4 Clear Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectFeeling('good')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'good'
                    ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]'
                    : 'bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)]'
                }`}
              >
                <span className="text-lg leading-none">🙂</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {isNl ? 'Goed' : 'Good'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isNl ? 'Ik voel me normaal / goed' : 'I feel normal / energetic'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('lower')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'lower'
                    ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]'
                    : 'bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)]'
                }`}
              >
                <span className="text-lg leading-none">😐</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {isNl ? 'Lager dan normaal' : 'Lower than normal'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isNl ? 'Ik ben moe, gestrest of heb minder energie' : 'Tired, stressed, or lower energy'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('sick')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'sick'
                    ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]'
                    : 'bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)]'
                }`}
              >
                <span className="text-lg leading-none">🤒</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {isNl ? 'Ziek / niet oké' : 'Sick / unwell'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isNl ? 'Mijn lichaam vraagt vandaag om rust' : 'My body needs complete rest today'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('mentally_heavy')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'mentally_heavy'
                    ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)] ring-1 ring-[var(--accent-secondary)]'
                    : 'bg-[var(--surface-2)] border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)]'
                }`}
              >
                <span className="text-lg leading-none">😔</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {isNl ? 'Mentaal zwaar' : 'Mentally heavy'}
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    {isNl ? 'Ik voel me emotioneel of mentaal uitgeput' : 'Emotionally or mentally drained'}
                  </div>
                </div>
              </button>
            </div>

            {/* ONE Short Follow-Up Question when useful */}
            {pendingFeeling && pendingFeeling !== 'good' && (
              <div className="pt-2 border-t border-[#EAE1D3] space-y-2">
                <span className="text-xs font-medium text-[var(--text-primary)] block">
                  {isNl ? 'Wat beïnvloedt je vandaag voornamelijk?' : 'What is mainly affecting you today?'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('poor_sleep')}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)] text-xs text-[var(--text-primary)] transition cursor-pointer"
                  >
                    😴 {isNl ? 'Slecht geslapen' : 'Poor sleep'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('low_energy')}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)] text-xs text-[var(--text-primary)] transition cursor-pointer"
                  >
                    🔋 {isNl ? 'Weinig energie' : 'Low energy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('cycle')}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)] text-xs text-[var(--text-primary)] transition cursor-pointer"
                  >
                    🩸 {isNl ? 'Cyclus' : 'Cycle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('stress')}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)] text-xs text-[var(--text-primary)] transition cursor-pointer"
                  >
                    🧠 {isNl ? 'Stress' : 'Stress'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('other')}
                    className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border-subtle)] hover:border-[var(--accent-secondary)] hover:bg-[var(--surface-1)] text-xs text-[var(--text-primary)] transition cursor-pointer"
                  >
                    ❓ {isNl ? 'Iets anders' : 'Something else'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 4. TODAY'S TASKS                                             */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              {isNl ? 'Taken voor vandaag' : "Today's Tasks"}
            </h2>
            <span className="text-xs text-[var(--text-muted)] font-sans">
              ({todayTasks.filter((t) => t.status !== 'completed').length}{' '}
              {isNl ? 'open' : 'remaining'})
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={onOpenTaskModal}
              className="text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Taak toevoegen' : 'Add task'}</span>
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('tasks')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                {isNl ? 'Alle taken →' : 'All Tasks →'}
              </button>
            )}
          </div>
        </div>

        {/* Reschedule Suggestion Banner (Adaptive AI interpretation) */}
        {capacity.rescheduleCandidate && (
          <div className="p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[#E4DC CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--accent-secondary)] shrink-0" />
                {isNl ? 'Alchemy suggestie:' : 'Alchemy suggestion:'}
              </span>
              <p className="text-[var(--text-secondary)] font-light leading-relaxed">
                {isNl
                  ? `Je energie is lager of je dag zit vol. Wil je "${capacity.rescheduleCandidate.title}" verplaatsen naar morgen om ademruimte te creëren?`
                  : `Your capacity is tight. Would you like to reschedule "${capacity.rescheduleCandidate.title}" to tomorrow to preserve breathing room?`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleMoveToTomorrow(capacity.rescheduleCandidate!.id)}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] font-medium hover:bg-[var(--text-primary)] transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              {isNl ? 'Verplaats naar morgen' : 'Move to tomorrow'}
            </button>
          </div>
        )}

        {/* Task List */}
        {todayTasks.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center bg-[var(--surface-1)] space-y-1.5">
            <p className="text-xs text-[var(--text-secondary)]">
              {isNl ? 'Geen taken gepland voor vandaag.' : 'No tasks scheduled for today.'}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isNl
                ? 'Geniet van de natuurlijke ruimte, of voeg bewust één taak toe.'
                : 'Enjoy the spaciousness, or choose one intentional task.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayTasks.map((task) => {
              const isDone = task.status === 'completed';
              const project = projects.find((p) => p.id === task.projectId);

              return (
                <div
                  key={task.id}
                  className={`group p-3.5 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-[#F5F2EC]/60 border-[var(--border-subtle)] opacity-60'
                      : 'bg-[var(--surface-2)] border-[#E5DFD3] hover:border-[var(--text-muted)] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Checkbox and Task Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-[var(--accent-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer shrink-0"
                        title={isDone ? 'Markeer onvoltooid' : 'Markeer voltooid'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              isDone ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Realm Badge */}
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                              task.realm === 'mariluna'
                                ? 'bg-[var(--text-primary)] text-[var(--text-primary)]'
                                : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {task.realm === 'mariluna' ? 'Mariluna' : (isNl ? 'Persoonlijk' : 'Personal')}
                          </span>

                          {/* Priority Badge */}
                          <div className="relative inline-block">
                            <select
                              value={task.priority}
                              onChange={(e) =>
                                handleChangePriority(
                                  task.id,
                                  e.target.value as 'high' | 'medium' | 'low'
                                )
                              }
                              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider cursor-pointer border appearance-none pr-3 ${
                                task.priority === 'high'
                                  ? 'bg-[var(--surface-2)] text-[var(--accent-secondary)] border-[var(--border-subtle)]'
                                  : task.priority === 'low'
                                  ? 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                                  : 'bg-[var(--surface-1)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                              }`}
                            >
                              <option value="high">{isNl ? 'Hoge Prioriteit' : 'High Priority'}</option>
                              <option value="medium">{isNl ? 'Normaal' : 'Normal'}</option>
                              <option value="low">{isNl ? 'Lage Prioriteit' : 'Low Priority'}</option>
                            </select>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                            {task.estimatedDuration}m
                          </span>

                          {task.category && (
                            <span className="capitalize">{task.category}</span>
                          )}

                          {project && (
                            <span className="text-[var(--accent-secondary)] truncate max-w-[140px]">
                              📁 {project.title}
                            </span>
                          )}

                          {task.recurring && task.recurring !== 'none' && (
                            <span className="flex items-center gap-1 text-[var(--text-muted)]">
                              <Repeat className="w-3 h-3" />
                              <span className="capitalize">{task.recurring}</span>
                            </span>
                          )}

                          {task.notes && (
                            <span className="text-[var(--text-muted)] truncate max-w-[200px]">
                              “{task.notes}”
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reschedule & Quick Actions Menu */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveTaskMenuId(
                            activeTaskMenuId === task.id ? null : task.id
                          )
                        }
                        className="p-1 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
                        title={isNl ? 'Taakopties & Verplaatsen' : 'Task options'}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeTaskMenuId === task.id && (
                        <div className="absolute right-0 top-7 z-30 w-48 bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-2xl shadow-lg p-1.5 space-y-1 text-xs text-[var(--text-primary)]">
                          <button
                            type="button"
                            onClick={() => handleMoveToTomorrow(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition flex items-center gap-2"
                          >
                            <CalendarDays className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                            <span>{isNl ? 'Verplaats naar morgen' : 'Move to tomorrow'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeTwoDays(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition flex items-center gap-2"
                          >
                            <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                            <span>{isNl ? 'Sluimeren (+2 dagen)' : 'Snooze (+2 days)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeepForLater(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[var(--surface-2)] transition flex items-center gap-2"
                          >
                            <Repeat className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                            <span>{isNl ? 'Bewaar voor later' : 'Keep for later'}</span>
                          </button>
                          <div className="border-t border-[#EAE1D3] my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              if (onRemoveTask) onRemoveTask(task.id);
                              setActiveTaskMenuId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#FBEBEB] text-[#9E3E3E] transition"
                          >
                            {isNl ? 'Verwijder taak' : 'Delete task'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 5. ALREADY PLANNED / UPCOMING                                */}
      {/* ============================================================ */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between pb-0.5">
          <h2 className="font-serif text-lg font-medium text-[var(--text-primary)]">
            {isNl ? 'Volgende & Later' : 'Upcoming & Next'}
          </h2>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition cursor-pointer"
            >
              {isNl ? 'Volledige agenda →' : 'Full Calendar →'}
            </button>
          )}
        </div>

        {upcomingItems.length === 0 ? (
          <div className="p-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-xs text-[var(--text-secondary)]">
            {isNl
              ? 'Geen directe verplichtingen later deze week.'
              : 'No immediate scheduled commitments upcoming later this week.'}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-[#E6DFD3] bg-[var(--surface-2)] shadow-2xs flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block">
                    {item.label}
                  </span>
                  <div className="font-medium text-[var(--text-primary)] truncate">{item.title}</div>
                </div>

                <div className="text-right shrink-0 text-[11px] text-[var(--text-secondary)]">
                  {item.time && <div className="font-medium text-[var(--text-primary)]">{item.time}</div>}
                  <div>{item.dateLabel}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. ONE SMALL ALCHEMY INSIGHT                                 */}
      {/* ============================================================ */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface-2)] p-4.5 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--accent-secondary)]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider font-sans">
              {isNl ? 'Alchemy Inzicht' : 'Alchemy Insight'}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">
            {smallInsight.title}
          </h3>
          <p className="text-xs text-[#5A5248] font-light leading-relaxed mt-1">
            {smallInsight.body}
          </p>
        </div>

        {smallInsight.actionPrompt && (
          <div className="pt-2 border-t border-[#ECE3D4] flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (onOpenAssistantWithPrompt) {
                  onOpenAssistantWithPrompt(
                    smallInsight.actionPrompt,
                    {
                      type: 'alchemy_insight',
                      title: smallInsight.title,
                      body: smallInsight.body,
                      actionPrompt: smallInsight.actionPrompt,
                    }
                  );
                } else {
                  onOpenAssistant();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer select-none"
            >
              <span>{isNl ? 'Bespreek met Alchemy' : 'Discuss with Alchemy'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 7. OPTIONAL CELESTIAL / ASTROLOGICAL NOTE                    */}
      {/* ============================================================ */}
      {celestialNote && (
        <section className="rounded-2xl border border-[#E3DACB] bg-[var(--surface-1)] p-4 text-xs space-y-1.5 text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium text-[var(--text-primary)]">
              {celestialNote.title}
            </span>
            <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider bg-[var(--surface-2)] text-[var(--text-secondary)]">
              {isNl ? 'Astronomisch' : 'Astronomical'}
            </span>
          </div>

          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
            {celestialNote.astronomicalFact}
          </p>

          {celestialNote.optionalAstrologicalNote && (
            <p className="text-[11px] text-[var(--text-muted)] italic pt-1 border-t border-[#ECE3D4]">
              {celestialNote.optionalAstrologicalNote}
            </p>
          )}
        </section>
      )}

      {splitModalTask && (
        <TaskSplitModal
          isOpen={!!splitModalTask}
          taskId={splitModalTask.id}
          taskTitle={splitModalTask.title}
          onClose={() => setSplitModalTask(null)}
          onConfirmSplit={handleConfirmTaskSplit}
          isNl={isNl}
        />
      )}
    </div>
  );
};
