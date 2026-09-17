import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  ExternalLink,
  Activity,
  Heart,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Task,
  CalendarEvent,
  Goal,
  LifeProfile,
  ActiveWorldFilter,
  CycleProfile,
  DailyCheckIn,
  ProactiveSuggestion,
  WellbeingState,
  FoundationData,
  Language,
} from '../../types';
import { calculateDayCapacity } from '../../lib/planningEngine';
import { calculateCycleStatus } from '../../lib/cycleUtils';
import { DailyCheckInModal } from '../DailyCheckInModal';

interface TodayViewProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  calendarEvents: CalendarEvent[];
  goals?: Goal[];
  lifeProfile: LifeProfile;
  activeWorld: ActiveWorldFilter;
  onOpenAssistant: () => void;
  onOpenTaskModal: () => void;
  onRescheduleTask?: (taskId: string, newDate: string) => void;
  onSimplifyTask?: (taskId: string) => void;
  onRemoveTask?: (taskId: string) => void;
  cycleProfile?: CycleProfile;
  dailyCheckIns?: DailyCheckIn[];
  onSaveDailyCheckIn?: (checkIn: DailyCheckIn) => void;
  proactiveSuggestions?: ProactiveSuggestion[];
  onDismissSuggestion?: (id: string) => void;
  onSelectTab?: (tab: any) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  wellbeing?: WellbeingState;
  foundation?: FoundationData;
  lang?: Language;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  onToggleTask,
  calendarEvents,
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
  wellbeing,
  foundation,
  lang = 'nl',
}) => {
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];
  const dateObj = new Date();

  const dayName = dateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', { weekday: 'long' });
  const formattedDate = dateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const hour = dateObj.getHours();
  const greetingPrefix =
    hour < 12
      ? isNl ? 'Goedemorgen' : 'Good morning'
      : hour < 18
      ? isNl ? 'Goedemiddag' : 'Good afternoon'
      : isNl ? 'Goedenavond' : 'Good evening';

  const userName = foundation?.aboutYou?.name?.trim();
  const greeting = userName ? `${greetingPrefix}, ${userName}.` : `${greetingPrefix}.`;

  // 1. Capacity calculation
  const capacity = calculateDayCapacity(tasks, calendarEvents, lifeProfile, todayStr);

  // 2. Daily Check-in & Cycle status
  const todayCheckIn = dailyCheckIns.find((c) => c.date === todayStr);
  const cycleEnabled = foundation?.cycle?.enabled ?? !!cycleProfile?.lastPeriodDate;
  const cycleStatus = cycleEnabled && cycleProfile?.lastPeriodDate
    ? calculateCycleStatus(cycleProfile, todayStr)
    : null;

  // 3. TODAY'S FOCUS: Maximum 3 priorities for today
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const candidateTasks =
    activeWorld === 'all'
      ? todayTasks
      : todayTasks.filter((t) => t.realm === activeWorld);

  // Incomplete tasks first, strictly prioritizing today's explicitly planned tasks
  const priorityScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const sortedPriorities = [...candidateTasks].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'completed' ? 1 : -1;
    }
    return (priorityScore[b.priority] || 0) - (priorityScore[a.priority] || 0);
  });

  const focusTasks = sortedPriorities.slice(0, 3);

  // 4. NEXT: Show only the next relevant calendar event or commitment
  const currentMinutes = dateObj.getHours() * 60 + dateObj.getMinutes();
  const todayEvents = calendarEvents.filter((e) => e.date === todayStr);
  const sortedEvents = [...todayEvents].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const nextEvent =
    sortedEvents.find((e) => {
      const [eH, eM] = e.endTime.split(':').map(Number);
      return eH * 60 + eM >= currentMinutes;
    }) || sortedEvents[0] || null;

  // 5. ONE AI INSIGHT: At most one proactive insight
  const topAiInsight = proactiveSuggestions.length > 0 ? proactiveSuggestions[0] : null;

  const handlePromptClick = (promptText: string) => {
    if (onOpenAssistantWithPrompt) {
      onOpenAssistantWithPrompt(promptText);
    } else {
      onOpenAssistant();
    }
  };

  const getEnergyDisplay = (eLevel?: string) => {
    switch (eLevel) {
      case 'very_low':
        return isNl ? 'Zeer laag' : 'Very low';
      case 'low':
        return isNl ? 'Rustig / Laag' : 'Low';
      case 'normal':
        return isNl ? 'Stabiel' : 'Normal';
      case 'good':
        return isNl ? 'Goed' : 'Good';
      case 'high':
        return isNl ? 'Hoog' : 'High';
      default:
        return isNl ? 'Evenwichtig' : 'Balanced';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-7 px-3 sm:px-4 py-4 sm:py-6 pb-24 text-[#2C2825]">
      {/* 1. HEADER: Date + Personalized Greeting */}
      <header className="space-y-1.5 pt-1">
        <div className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-medium text-[#8C8377] font-sans capitalize">
          {dayName}, {formattedDate}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#2C2825] font-normal tracking-tight">
          {greeting}
        </h1>
      </header>

      {/* 2. RHYTHM & DAILY CHECK-IN BAR */}
      <div className="py-2.5 px-3.5 sm:px-4 rounded-xl bg-[#FAF6EE] border border-[#EAE1D3] flex items-center justify-between text-xs text-[#524B43]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8E8478] shrink-0" />
          {cycleStatus ? (
            <span className="font-medium text-[#2C2825]">
              {isNl ? `Dag ${cycleStatus.cycleDay}` : `Day ${cycleStatus.cycleDay}`} •{' '}
              {cycleStatus.activePhase.charAt(0).toUpperCase() + cycleStatus.activePhase.slice(1)}
            </span>
          ) : (
            <span className="font-medium text-[#2C2825]">
              {isNl ? 'Natuurlijk dagritme' : 'Natural Rhythm'}
            </span>
          )}
          <span className="text-[#D0C7B7] hidden xs:inline">•</span>
          <span>
            {isNl ? 'Energie:' : 'Energy:'}{' '}
            <strong className="font-medium text-[#2C2825]">
              {getEnergyDisplay(todayCheckIn?.energy)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-[#EFE8DC] text-[#6E5D47] hover:bg-[#E4DBCB] font-medium transition cursor-pointer"
          >
            {todayCheckIn ? (isNl ? 'Check-in wijzigen' : 'Edit check-in') : (isNl ? 'Dagelijkse check-in' : 'Daily check-in')}
          </button>
          {cycleStatus && onSelectTab && (
            <button
              onClick={() => onSelectTab('cycle')}
              className="text-[11px] text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer shrink-0"
            >
              {isNl ? 'Cyclus →' : 'Cycle →'}
            </button>
          )}
        </div>
      </div>

      {/* 3. TODAY'S FOCUS: Maximum 3 Priorities */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-medium text-[#2C2825]">
              {isNl ? 'Focus voor vandaag' : "Today's Focus"}
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-[#8C8377] font-sans font-medium">
              (Max 3)
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={onOpenTaskModal}
              id="today-add-priority-btn"
              className="text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? '+ Taak toevoegen' : 'Add Focus'}</span>
            </button>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('tasks')}
                className="text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
              >
                {isNl ? 'Alle taken →' : 'All Tasks →'}
              </button>
            )}
          </div>
        </div>

        {focusTasks.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-[#DDD5C7] text-center bg-[#FAF8F3] space-y-1">
            <p className="text-xs text-[#7A7167]">
              {isNl
                ? 'Geen prioriteiten vastgelegd voor vandaag.'
                : 'No high-leverage priorities assigned for today.'}
            </p>
            <p className="text-[11px] text-[#A69C8E]">
              {isNl
                ? 'Geniet van de natuurlijke ruimte, of voeg een bewuste taak toe.'
                : 'Enjoy the natural spaciousness, or choose one intentional task.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {focusTasks.map((task) => {
              const isDone = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`group p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                    isDone
                      ? 'bg-[#F4F1EA]/60 border-[#E2DBD0] opacity-60'
                      : 'bg-[#FFFFFF] border-[#E5DFD3] hover:border-[#C4BEB3] shadow-xs'
                  }`}
                >
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

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs sm:text-sm font-medium truncate ${
                          isDone ? 'line-through text-[#8C8377]' : 'text-[#2C2825]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                          task.realm === 'mariluna'
                            ? 'bg-[#2C2825] text-[#F9F7F2]'
                            : 'bg-[#EAE3D4] text-[#554C42]'
                        }`}
                      >
                        {task.realm === 'mariluna' ? 'Mariluna' : (isNl ? 'Persoonlijk' : 'Personal')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#8A8175]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#A89F93]" />
                        {task.estimatedDuration}m
                      </span>
                      <span className="capitalize">{task.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. NEXT: Only the Next Relevant Calendar Event */}
      <section className="space-y-2">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-medium text-[#2C2825]">
              {isNl ? 'Volgende afspraak' : 'Next'}
            </h2>
            <span className="text-[10px] uppercase tracking-wider text-[#8C8377] font-sans font-medium">
              {isNl ? 'Aankomend' : 'Upcoming'}
            </span>
          </div>
          {onSelectTab && (
            <button
              onClick={() => onSelectTab('calendar')}
              className="text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer"
            >
              {isNl ? 'Volledige agenda →' : 'Full Calendar →'}
            </button>
          )}
        </div>

        {nextEvent ? (
          <div className="p-4 rounded-2xl border border-[#E5DFD3] bg-[#FFFFFF] shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-[#7E694E] flex items-center justify-center shrink-0 border border-[#E8E0D1]">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#2C2825] truncate">
                  {nextEvent.title}
                </div>
                <div className="text-[11px] text-[#7A7167] mt-0.5 flex items-center gap-2">
                  <span className="font-medium text-[#2C2825]">
                    {nextEvent.startTime} — {nextEvent.endTime}
                  </span>
                  {nextEvent.location && (
                    <>
                      <span>•</span>
                      <span className="truncate">{nextEvent.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span
              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-semibold tracking-wider shrink-0 ${
                nextEvent.realm === 'mariluna'
                  ? 'bg-[#2C2825] text-[#F9F7F2]'
                  : 'bg-[#EAE3D4] text-[#554C42]'
              }`}
            >
              {nextEvent.type}
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-[#E8E2D6] bg-[#FAF8F4] text-xs text-[#7A7167] flex items-center justify-between">
            <span>
              {isNl
                ? 'Geen geplande afspraken meer voor vandaag.'
                : 'No scheduled commitments remaining today.'}
            </span>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('calendar')}
                className="text-[11px] text-[#7E694E] hover:text-[#2C2825] underline cursor-pointer"
              >
                {isNl ? 'Afspraak inplannen' : 'Schedule event'}
              </button>
            )}
          </div>
        )}
      </section>

      {/* 5. CAPACITY: Compact Statement */}
      <section className="py-3 px-4 rounded-2xl bg-[#FFFFFF] border border-[#E6DFD4] shadow-xs flex items-center justify-between text-xs text-[#524B43]">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              capacity.status === 'spacious'
                ? 'bg-[#4A6343]'
                : capacity.status === 'harmonious'
                ? 'bg-[#7E694E]'
                : 'bg-[#9E5D2A]'
            }`}
          />
          <span className="font-medium text-[#2C2825]">
            {isNl
              ? `Capaciteit: ~${(capacity.availableFreeMinutes / 60).toFixed(1)} uur realistische ademruimte beschikbaar`
              : `Capacity: ~${(capacity.availableFreeMinutes / 60).toFixed(1)} hrs realistic breathing room remaining`}
          </span>
          <span className="hidden sm:inline text-[#8C8377]">
            {isNl
              ? `voor jouw rusttijd (${lifeProfile.workingHoursEnd || '17:00'})`
              : `before your ${lifeProfile.workingHoursEnd || '17:00'} threshold`}
          </span>
        </div>
        <span className="text-[10px] uppercase font-semibold text-[#8C8377] tracking-wider shrink-0">
          {capacity.status}
        </span>
      </section>

      {/* 6. ONE AI INSIGHT */}
      {topAiInsight && (
        <section className="rounded-2xl border border-[#DCD3C2] bg-[#FAF6EE] p-4.5 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#7E694E]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {isNl ? 'Alchemy Inzicht' : 'Alchemy Insight'}
              </span>
            </div>
            {onDismissSuggestion && (
              <button
                onClick={() => onDismissSuggestion(topAiInsight.id)}
                className="text-[#A19586] hover:text-[#2C2825] transition cursor-pointer p-1"
                title="Sluit inzicht"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-[#2C2825]">
              {topAiInsight.title}
            </h3>
            <p className="text-xs text-[#5A5248] font-light leading-relaxed mt-1">
              {topAiInsight.body}
            </p>
          </div>

          {topAiInsight.actionPrompt && (
            <div className="pt-2 border-t border-[#ECE3D4] flex justify-end">
              <button
                onClick={() => handlePromptClick(topAiInsight.actionPrompt!)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7E694E] hover:text-[#2C2825] transition cursor-pointer"
              >
                <span>{topAiInsight.actionLabel || (isNl ? 'Bespreek met Alchemy' : 'Discuss with Alchemy')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>
      )}

      {/* 7. ASK ALCHEMY */}
      <section className="rounded-2xl border border-[#DDD3C2] bg-gradient-to-b from-[#FAF7F0] to-[#F4EEE2] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#EAE2D1] flex items-center justify-center text-[#7E694E] border border-[#DDD2C0]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-medium text-[#2C2825]">
                {isNl ? 'Vraag Alchemy' : 'Ask Alchemy'}
              </h3>
              <p className="text-[11px] text-[#7A7167] font-light">
                {isNl ? 'Contextbewuste rust en richting voor jouw dag' : 'Context-aware guidance for your day and energy'}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAssistant}
            id="today-open-dialogue-btn"
            className="text-xs font-medium text-[#7E694E] hover:text-[#2C2825] transition cursor-pointer flex items-center gap-1"
          >
            <span>{isNl ? 'Open Dialoog' : 'Open Dialogue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 core prompts in Dutch / English */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(isNl
            ? [
                'Waar moet ik me nu op richten?',
                'Ik heb 30 minuten. Wat kan ik nu doen?',
                'Maak mijn avond lichter.',
                'Wat kan ik voorbereiden voor morgen?',
              ]
            : [
                'What should I focus on?',
                'I have 30 minutes. What should I do?',
                'Make my evening lighter.',
                'What should I prepare for tomorrow?',
              ]
          ).map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => handlePromptClick(promptText)}
              className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3D9C9] hover:border-[#BFA885] hover:bg-[#FDFBF7] text-left text-xs text-[#3D3730] font-normal transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
            >
              <span>"{promptText}"</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#A89F93] group-hover:text-[#7E694E] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </section>

      {/* Daily Check-in Modal */}
      {onSaveDailyCheckIn && (
        <DailyCheckInModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onSaveCheckIn={onSaveDailyCheckIn}
          existingCheckIn={todayCheckIn}
          lang={lang}
        />
      )}
    </div>
  );
};
