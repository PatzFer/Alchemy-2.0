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
  CheckInFeeling,
  CheckInDriver,
  ProactiveSuggestion,
  WellbeingState,
  FoundationData,
  Language,
  WeatherInfo,
} from '../../types';
import { calculateDayCapacity } from '../../lib/planningEngine';
import { calculateCycleStatus } from '../../lib/cycleUtils';
import { fetchLiveWeather } from '../../lib/weatherService';
import { getRelevantCelestialNote, CelestialEvent } from '../../lib/celestialUtils';

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
  proactiveSuggestions?: ProactiveSuggestion[];
  onDismissSuggestion?: (id: string) => void;
  onSelectTab?: (tab: any) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  wellbeing?: WellbeingState;
  foundation?: FoundationData;
  onUpdateFoundation?: (foundation: FoundationData) => void;
  lang?: Language;
  onOpenSetup?: () => void;
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
  proactiveSuggestions = [],
  onDismissSuggestion,
  onSelectTab,
  onOpenAssistantWithPrompt,
  foundation,
  onUpdateFoundation,
  lang = 'nl',
  onOpenSetup,
}) => {
  const safeLang: Language = lang === 'en' ? 'en' : 'nl';
  const isNl = safeLang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];
  const dateObj = new Date();

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
    return calendarEvents
      .filter((e) => e.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [calendarEvents, todayStr]);

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
    <div className="max-w-2xl mx-auto space-y-7 px-3 sm:px-4 py-4 sm:py-6 pb-24 text-[#2C2825]">
      {/* ============================================================ */}
      {/* 1. DATE + WEATHER                                            */}
      {/* ============================================================ */}
      <header className="space-y-1 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-[#8C8377] font-sans block capitalize">
              {dayName}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#2C2825] font-normal tracking-tight mt-0.5">
              {formattedDate}
            </h1>
          </div>

          {/* Weather compact block */}
          <div className="text-right shrink-0">
            {isLoadingWeather ? (
              <div className="inline-flex items-center gap-1.5 text-xs text-[#8C8377] animate-pulse">
                <CloudSun className="w-3.5 h-3.5 text-[#B5ABA0]" />
                <span>{isNl ? 'Weer laden...' : 'Loading weather...'}</span>
              </div>
            ) : weather ? (
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="group inline-flex items-center gap-1.5 text-xs text-[#524B43] hover:text-[#2C2825] transition cursor-pointer"
                title={isNl ? 'Klik om locatie te wijzigen' : 'Click to change location'}
              >
                <CloudSun className="w-4 h-4 text-[#7E694E] group-hover:scale-105 transition" />
                <span className="font-medium text-[#2C2825]">
                  {weather.temperature}°C
                </span>
                <span className="text-[#8C8377]">·</span>
                <span className="text-[#6D6356]">{weather.description}</span>
                <span className="text-[10px] text-[#A69C8E] hidden sm:inline">
                  ({weather.locationName})
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer px-2 py-1 rounded-lg hover:bg-[#F2ECE1]"
              >
                <MapPin className="w-3 h-3 text-[#A89F93]" />
                <span>{isNl ? 'Locatie instellen voor weer' : 'Set location for weather'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Location Setup Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {isNl ? 'Locatie voor Weer' : 'Location for Weather'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-full text-[#8C8377] hover:text-[#2C2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#7A7167]">
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
                className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#D5CCBE] text-xs text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DD] transition"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                disabled={!newLocationInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition disabled:opacity-50"
              >
                {isNl ? 'Opslaan' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Foundation Setup Prompt */}
      {onOpenSetup && (!foundation?.configuredSections || foundation.configuredSections.length === 0) && (
        <div className="p-4 rounded-2xl bg-[#F7F3EB] border border-[#E0D4C2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-serif font-medium text-[#2C2825] block">
              {isNl ? 'Welkom bij Alchemy' : 'Welcome to Alchemy'}
            </span>
            <p className="text-[#7A6D5E] font-light">
              {isNl
                ? 'Configureer jouw levensritme, doelen en welzijn via de First-Time Onboarding Wizard.'
                : 'Configure your life rhythm, goals, and wellbeing via the First-Time Onboarding Wizard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSetup}
            className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs self-start sm:self-auto"
          >
            {isNl ? 'Start Setup Wizard →' : 'Start Setup Wizard →'}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. TODAY'S CALENDAR (Comes FIRST before tasks!)              */}
      {/* ============================================================ */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-medium text-[#2C2825]">
              {isNl ? 'Agenda van vandaag' : "Today's Calendar"}
            </h2>
            <span className="text-[11px] text-[#8C8377] font-sans">
              ({capacity.formattedFreeTime} {isNl ? 'vrije tijd' : 'free capacity'})
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setIsAddEventOpen(!isAddEventOpen)}
              className="text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Afspraak' : 'Event'}</span>
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('calendar')}
                className="text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
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
            className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD4C5] shadow-xs space-y-3 text-xs"
          >
            <div className="font-medium text-[#2C2825]">
              {isNl ? 'Nieuwe afspraak voor vandaag' : 'New appointment for today'}
            </div>
            <input
              type="text"
              placeholder={isNl ? 'Titel afspraak (bijv. Werk, Familiefeest, Tandarts)' : 'Title (e.g. Work, Family gathering)'}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DDD4C5] text-[#2C2825] focus:outline-none focus:border-[#7E694E]"
              autoFocus
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase tracking-wider block mb-1">
                  {isNl ? 'Starttijd' : 'Start'}
                </label>
                <input
                  type="time"
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DDD4C5] text-[#2C2825]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8C8377] uppercase tracking-wider block mb-1">
                  {isNl ? 'Eindtijd' : 'End'}
                </label>
                <input
                  type="time"
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DDD4C5] text-[#2C2825]"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] text-[#8C8377] uppercase tracking-wider block mb-1">
                  {isNl ? 'Domein' : 'Domain'}
                </label>
                <select
                  value={eventRealm}
                  onChange={(e) => setEventRealm(e.target.value as 'personal' | 'mariluna')}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F3] border border-[#DDD4C5] text-[#2C2825]"
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
                className="px-3 py-1 rounded-xl text-xs text-[#7A7167] hover:bg-[#F2ECE1]"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={!eventTitle.trim()}
                className="px-3.5 py-1 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] disabled:opacity-40"
              >
                {isNl ? 'Toevoegen' : 'Add'}
              </button>
            </div>
          </form>
        )}

        {/* Real Calendar Events List */}
        {todayEvents.length === 0 ? (
          <div className="p-4 rounded-2xl border border-dashed border-[#DDD4C5] bg-[#FAF8F4] text-xs text-[#7A7167] flex items-center justify-between">
            <span>{isNl ? 'Geen afspraken vandaag' : 'No appointments today'}</span>
            <span className="text-[11px] text-[#A69C8E]">
              {isNl ? 'Volledige agenda is vrij' : 'All hours free'}
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3.5 rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#7E694E] flex items-center justify-center shrink-0 border border-[#E8E0D1]">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-[#2C2825] truncate">
                      {event.title}
                    </div>
                    <div className="text-[11px] text-[#7A7167] mt-0.5 flex items-center gap-2">
                      <span className="font-medium text-[#2C2825]">
                        {event.startTime}–{event.endTime}
                      </span>
                      {event.location && (
                        <>
                          <span className="text-[#D0C7B7]">•</span>
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                    event.realm === 'mariluna'
                      ? 'bg-[#2C2825] text-[#F9F7F2]'
                      : 'bg-[#EAE3D4] text-[#554C42]'
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
      <section className="rounded-2xl border border-[#E5DFD3] bg-[#FAF6EE] p-4 sm:p-4.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7E694E] font-sans">
              {isNl ? 'DAGELIJKSE CHECK-IN' : 'DAILY CHECK-IN'}
            </span>
            <h3 className="font-serif text-base text-[#2C2825]">
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
              className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EFE8DC] text-[#6E5D47] hover:bg-[#E4DBCB] font-medium transition cursor-pointer"
            >
              {isNl ? 'Wijzigen' : 'Change'}
            </button>
          )}
        </div>

        {/* If Check-In is recorded and not currently editing */}
        {todayCheckIn && !isEditingCheckIn ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 font-medium text-[#2C2825]">
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
              <p className="text-[11px] text-[#7A6D5E] font-light leading-relaxed">
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
                    ? 'bg-[#FFFFFF] border-[#7E694E] ring-1 ring-[#7E694E]'
                    : 'bg-[#FFFFFF] border-[#E3D9C9] hover:border-[#7E694E] hover:bg-[#FDFBF7]'
                }`}
              >
                <span className="text-lg leading-none">🙂</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2C2825]">
                    {isNl ? 'Goed' : 'Good'}
                  </div>
                  <div className="text-[11px] text-[#7A7167]">
                    {isNl ? 'Ik voel me normaal / goed' : 'I feel normal / energetic'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('lower')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'lower'
                    ? 'bg-[#FFFFFF] border-[#7E694E] ring-1 ring-[#7E694E]'
                    : 'bg-[#FFFFFF] border-[#E3D9C9] hover:border-[#7E694E] hover:bg-[#FDFBF7]'
                }`}
              >
                <span className="text-lg leading-none">😐</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2C2825]">
                    {isNl ? 'Lager dan normaal' : 'Lower than normal'}
                  </div>
                  <div className="text-[11px] text-[#7A7167]">
                    {isNl ? 'Ik ben moe, gestrest of heb minder energie' : 'Tired, stressed, or lower energy'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('sick')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'sick'
                    ? 'bg-[#FFFFFF] border-[#7E694E] ring-1 ring-[#7E694E]'
                    : 'bg-[#FFFFFF] border-[#E3D9C9] hover:border-[#7E694E] hover:bg-[#FDFBF7]'
                }`}
              >
                <span className="text-lg leading-none">🤒</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2C2825]">
                    {isNl ? 'Ziek / niet oké' : 'Sick / unwell'}
                  </div>
                  <div className="text-[11px] text-[#7A7167]">
                    {isNl ? 'Mijn lichaam vraagt vandaag om rust' : 'My body needs complete rest today'}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeeling('mentally_heavy')}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                  pendingFeeling === 'mentally_heavy'
                    ? 'bg-[#FFFFFF] border-[#7E694E] ring-1 ring-[#7E694E]'
                    : 'bg-[#FFFFFF] border-[#E3D9C9] hover:border-[#7E694E] hover:bg-[#FDFBF7]'
                }`}
              >
                <span className="text-lg leading-none">😔</span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2C2825]">
                    {isNl ? 'Mentaal zwaar' : 'Mentally heavy'}
                  </div>
                  <div className="text-[11px] text-[#7A7167]">
                    {isNl ? 'Ik voel me emotioneel of mentaal uitgeput' : 'Emotionally or mentally drained'}
                  </div>
                </div>
              </button>
            </div>

            {/* ONE Short Follow-Up Question when useful */}
            {pendingFeeling && pendingFeeling !== 'good' && (
              <div className="pt-2 border-t border-[#EAE1D3] space-y-2">
                <span className="text-xs font-medium text-[#2C2825] block">
                  {isNl ? 'Wat beïnvloedt je vandaag voornamelijk?' : 'What is mainly affecting you today?'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('poor_sleep')}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD3C2] hover:border-[#7E694E] hover:bg-[#FAF8F4] text-xs text-[#2C2825] transition cursor-pointer"
                  >
                    😴 {isNl ? 'Slecht geslapen' : 'Poor sleep'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('low_energy')}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD3C2] hover:border-[#7E694E] hover:bg-[#FAF8F4] text-xs text-[#2C2825] transition cursor-pointer"
                  >
                    🔋 {isNl ? 'Weinig energie' : 'Low energy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('cycle')}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD3C2] hover:border-[#7E694E] hover:bg-[#FAF8F4] text-xs text-[#2C2825] transition cursor-pointer"
                  >
                    🩸 {isNl ? 'Cyclus' : 'Cycle'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('stress')}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD3C2] hover:border-[#7E694E] hover:bg-[#FAF8F4] text-xs text-[#2C2825] transition cursor-pointer"
                  >
                    🧠 {isNl ? 'Stress' : 'Stress'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDriver('other')}
                    className="px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD3C2] hover:border-[#7E694E] hover:bg-[#FAF8F4] text-xs text-[#2C2825] transition cursor-pointer"
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
            <h2 className="font-serif text-lg font-medium text-[#2C2825]">
              {isNl ? 'Taken voor vandaag' : "Today's Tasks"}
            </h2>
            <span className="text-xs text-[#8C8377] font-sans">
              ({todayTasks.filter((t) => t.status !== 'completed').length}{' '}
              {isNl ? 'open' : 'remaining'})
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={onOpenTaskModal}
              className="text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Taak toevoegen' : 'Add task'}</span>
            </button>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('tasks')}
                className="text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
              >
                {isNl ? 'Alle taken →' : 'All Tasks →'}
              </button>
            )}
          </div>
        </div>

        {/* Reschedule Suggestion Banner (Adaptive AI interpretation) */}
        {capacity.rescheduleCandidate && (
          <div className="p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E4DC CE] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-[#2C2825] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#7E694E] shrink-0" />
                {isNl ? 'Alchemy suggestie:' : 'Alchemy suggestion:'}
              </span>
              <p className="text-[#6D6356] font-light leading-relaxed">
                {isNl
                  ? `Je energie is lager of je dag zit vol. Wil je "${capacity.rescheduleCandidate.title}" verplaatsen naar morgen om ademruimte te creëren?`
                  : `Your capacity is tight. Would you like to reschedule "${capacity.rescheduleCandidate.title}" to tomorrow to preserve breathing room?`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleMoveToTomorrow(capacity.rescheduleCandidate!.id)}
              className="shrink-0 px-3.5 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs self-start sm:self-auto"
            >
              {isNl ? 'Verplaats naar morgen' : 'Move to tomorrow'}
            </button>
          </div>
        )}

        {/* Task List */}
        {todayTasks.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#DDD4C5] text-center bg-[#FAF8F4] space-y-1.5">
            <p className="text-xs text-[#7A7167]">
              {isNl ? 'Geen taken gepland voor vandaag.' : 'No tasks scheduled for today.'}
            </p>
            <p className="text-[11px] text-[#A69C8E]">
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
                      ? 'bg-[#F5F2EC]/60 border-[#E2DBD0] opacity-60'
                      : 'bg-[#FFFFFF] border-[#E5DFD3] hover:border-[#C4BEB3] shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    {/* Checkbox and Task Details */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="mt-0.5 text-[#8C7654] hover:text-[#2C2825] transition cursor-pointer shrink-0"
                        title={isDone ? 'Markeer onvoltooid' : 'Markeer voltooid'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-[#8C7654]" />
                        ) : (
                          <Circle className="w-5 h-5 text-[#B5ABA0] group-hover:text-[#2C2825]" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs sm:text-sm font-medium ${
                              isDone ? 'line-through text-[#8C8377]' : 'text-[#2C2825]'
                            }`}
                          >
                            {task.title}
                          </span>

                          {/* Realm Badge */}
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                              task.realm === 'mariluna'
                                ? 'bg-[#2C2825] text-[#F9F7F2]'
                                : 'bg-[#EAE3D4] text-[#554C42]'
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
                                  ? 'bg-[#F2ECE1] text-[#7E694E] border-[#D8CEBF]'
                                  : task.priority === 'low'
                                  ? 'bg-[#F7F5F0] text-[#8C8377] border-[#E8E2D6]'
                                  : 'bg-[#FAF8F4] text-[#6D6356] border-[#DDD4C5]'
                              }`}
                            >
                              <option value="high">{isNl ? 'Hoge Prioriteit' : 'High Priority'}</option>
                              <option value="medium">{isNl ? 'Normaal' : 'Normal'}</option>
                              <option value="low">{isNl ? 'Lage Prioriteit' : 'Low Priority'}</option>
                            </select>
                          </div>
                        </div>

                        {/* Metadata row */}
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#8A8175] flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#A89F93]" />
                            {task.estimatedDuration}m
                          </span>

                          {task.category && (
                            <span className="capitalize">{task.category}</span>
                          )}

                          {project && (
                            <span className="text-[#7E694E] truncate max-w-[140px]">
                              📁 {project.title}
                            </span>
                          )}

                          {task.recurring && task.recurring !== 'none' && (
                            <span className="flex items-center gap-1 text-[#8C8377]">
                              <Repeat className="w-3 h-3" />
                              <span className="capitalize">{task.recurring}</span>
                            </span>
                          )}

                          {task.notes && (
                            <span className="text-[#998E80] truncate max-w-[200px]">
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
                        className="p-1 rounded-lg hover:bg-[#F2ECE1] text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
                        title={isNl ? 'Taakopties & Verplaatsen' : 'Task options'}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeTaskMenuId === task.id && (
                        <div className="absolute right-0 top-7 z-30 w-48 bg-[#FFFFFF] border border-[#DDD4C5] rounded-2xl shadow-lg p-1.5 space-y-1 text-xs text-[#2C2825]">
                          <button
                            type="button"
                            onClick={() => handleMoveToTomorrow(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#F7F4EE] transition flex items-center gap-2"
                          >
                            <CalendarDays className="w-3.5 h-3.5 text-[#7E694E]" />
                            <span>{isNl ? 'Verplaats naar morgen' : 'Move to tomorrow'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSnoozeTwoDays(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#F7F4EE] transition flex items-center gap-2"
                          >
                            <Clock className="w-3.5 h-3.5 text-[#7E694E]" />
                            <span>{isNl ? 'Sluimeren (+2 dagen)' : 'Snooze (+2 days)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeepForLater(task.id)}
                            className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-[#F7F4EE] transition flex items-center gap-2"
                          >
                            <Repeat className="w-3.5 h-3.5 text-[#7E694E]" />
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
          <h2 className="font-serif text-lg font-medium text-[#2C2825]">
            {isNl ? 'Volgende & Later' : 'Upcoming & Next'}
          </h2>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
            >
              {isNl ? 'Volledige agenda →' : 'Full Calendar →'}
            </button>
          )}
        </div>

        {upcomingItems.length === 0 ? (
          <div className="p-3.5 rounded-2xl border border-[#E8E2D6] bg-[#FAF8F4] text-xs text-[#7A7167]">
            {isNl
              ? 'Geen directe verplichtingen later deze week.'
              : 'No immediate scheduled commitments upcoming later this week.'}
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-[#E6DFD3] bg-[#FFFFFF] shadow-2xs flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase font-semibold text-[#8C8377] tracking-wider block">
                    {item.label}
                  </span>
                  <div className="font-medium text-[#2C2825] truncate">{item.title}</div>
                </div>

                <div className="text-right shrink-0 text-[11px] text-[#7A7167]">
                  {item.time && <div className="font-medium text-[#2C2825]">{item.time}</div>}
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
      <section className="rounded-2xl border border-[#DDD3C2] bg-gradient-to-b from-[#FAF7F0] to-[#F4EEE2] p-4.5 sm:p-5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#7E694E]">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-wider font-sans">
              {isNl ? 'Alchemy Inzicht' : 'Alchemy Insight'}
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-[#2C2825]">
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
                  onOpenAssistantWithPrompt(smallInsight.actionPrompt);
                } else {
                  onOpenAssistant();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7E694E] hover:text-[#2C2825] transition cursor-pointer"
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
        <section className="rounded-2xl border border-[#E3DACB] bg-[#FAF8F3] p-4 text-xs space-y-1.5 text-[#524B43]">
          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-medium text-[#2C2825]">
              {celestialNote.title}
            </span>
            <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider bg-[#EAE3D4] text-[#554C42]">
              {isNl ? 'Astronomisch' : 'Astronomical'}
            </span>
          </div>

          <p className="text-[11px] text-[#6D6356] leading-relaxed">
            {celestialNote.astronomicalFact}
          </p>

          {celestialNote.optionalAstrologicalNote && (
            <p className="text-[11px] text-[#8C8377] italic pt-1 border-t border-[#ECE3D4]">
              {celestialNote.optionalAstrologicalNote}
            </p>
          )}
        </section>
      )}
    </div>
  );
};
