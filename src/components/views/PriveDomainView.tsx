import React, { useState } from 'react';
import {
  Heart,
  Activity,
  User,
  Utensils,
  Shirt,
  Target,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  ArrowRight,
  Shield,
  Trash2,
  Smile,
  AlertCircle,
  Droplet,
} from 'lucide-react';
import {
  LifeProfile,
  PersonalStyleState,
  NutritionState,
  CycleProfile,
  DailyCheckIn,
  Task,
  CalendarEvent,
  WellbeingState,
  Goal,
  Language,
  RoutineItem,
  LifeCommitment,
} from '../../types';
import { CycleView } from './CycleView';
import { WellbeingView } from './WellbeingView';
import { calculateCycleStatus } from '../../lib/cycleUtils';
import { calculateWaterStats } from '../../lib/healthUtils';

export type PriveSubTab =
  | 'overview'
  | 'cycle'
  | 'wellbeing'
  | 'nutrition'
  | 'style'
  | 'goals'
  | 'routines';

interface PriveDomainViewProps {
  initialSubTab?: PriveSubTab;
  lifeProfile: LifeProfile;
  onUpdateProfile: (profile: LifeProfile) => void;
  personalStyle: PersonalStyleState;
  onUpdateStyle: (style: PersonalStyleState) => void;
  nutrition: NutritionState;
  onUpdateNutrition: (nutrition: NutritionState) => void;
  cycleProfile: CycleProfile;
  onUpdateCycleProfile: (profile: CycleProfile) => void;
  dailyCheckIns: DailyCheckIn[];
  onSaveDailyCheckIn: (checkIn: DailyCheckIn) => void;
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
  onSaveTask?: (task: Partial<Task>) => void;
  onDeleteTask?: (taskId: string) => void;
  calendarEvents: CalendarEvent[];
  onAddCalendarEvent?: (event: Partial<CalendarEvent>) => void;
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  goals: Goal[];
  onSaveGoal?: (goal: Partial<Goal>) => void;
  onToggleMilestone?: (goalId: string, milestoneId: string) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  onSelectTab?: (tab: any) => void;
  lang?: Language;
}

export const PriveDomainView: React.FC<PriveDomainViewProps> = ({
  initialSubTab = 'overview',
  lifeProfile,
  onUpdateProfile,
  personalStyle,
  onUpdateStyle,
  nutrition,
  onUpdateNutrition,
  cycleProfile,
  onUpdateCycleProfile,
  dailyCheckIns,
  onSaveDailyCheckIn,
  tasks,
  onToggleTask,
  onSaveTask,
  onDeleteTask,
  calendarEvents,
  onAddCalendarEvent,
  wellbeing,
  onUpdateWellbeing,
  goals,
  onSaveGoal,
  onToggleMilestone,
  onOpenAssistantWithPrompt,
  onSelectTab,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const [activeSubTab, setActiveSubTab] = useState<PriveSubTab>(initialSubTab);

  const todayStr = new Date().toISOString().split('T')[0];
  const personalTasks = tasks.filter((t) => t.realm === 'personal');
  const todayPersonalTasks = personalTasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate <= todayStr));
  const personalEvents = calendarEvents.filter((e) => e.realm === 'personal');
  const personalGoals = goals.filter((g) => g.realm === 'personal');

  // Cycle status for overview
  const cycleStatus = calculateCycleStatus(cycleProfile, todayStr);
  const todayCheckIn = dailyCheckIns.find((c) => c.date === todayStr);
  const waterStats = calculateWaterStats(wellbeing.waterTracker);

  // Forms for Routines & Commitments
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState<RoutineItem['timeOfDay']>('morning');
  const [newRoutineDuration, setNewRoutineDuration] = useState(30);

  // Form for New Personal Goal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');

  const subTabs: { id: PriveSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: isNl ? 'Overzicht' : 'Overview', icon: User },
    { id: 'cycle', label: isNl ? 'Cyclus' : 'Cycle', icon: Activity },
    { id: 'wellbeing', label: isNl ? 'Gezondheid' : 'Health & Body', icon: Heart },
    { id: 'nutrition', label: isNl ? 'Maaltijden' : 'Nutrition', icon: Utensils },
    { id: 'style', label: isNl ? 'Personal Styling' : 'Styling', icon: Shirt },
    { id: 'goals', label: isNl ? 'Doelen' : 'Goals', icon: Target },
    { id: 'routines', label: isNl ? 'Routines' : 'Routines', icon: Clock },
  ];

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;
    const newItem: RoutineItem = {
      id: 'r-' + Date.now(),
      title: newRoutineTitle.trim(),
      timeOfDay: newRoutineTime,
      durationMinutes: Number(newRoutineDuration),
      recurrence: 'permanent',
      realm: 'personal',
    };
    onUpdateProfile({
      ...lifeProfile,
      routines: [...lifeProfile.routines, newItem],
    });
    setNewRoutineTitle('');
  };

  const handleRemoveRoutine = (id: string) => {
    onUpdateProfile({
      ...lifeProfile,
      routines: lifeProfile.routines.filter((r) => r.id !== id),
    });
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || !onSaveGoal) return;
    onSaveGoal({
      id: 'g-' + Date.now(),
      title: newGoalTitle.trim(),
      description: '',
      realm: 'personal',
      targetDate: newGoalTargetDate || undefined,
      status: 'in_progress',
      progress: 0,
      milestones: [],
    });
    setNewGoalTitle('');
    setNewGoalTargetDate('');
    setIsGoalModalOpen(false);
  };

  return (
    <div className="space-y-7 pb-24 text-[#2C2825]">
      {/* Editorial Sanctuary Header */}
      <header className="rounded-3xl border border-[#DCD3C4] bg-[#FAF8F3] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8C7654] font-medium">
              <span>{isNl ? 'Persoonlijk Domein' : 'Personal Domain'}</span>
              <span>•</span>
              <span>Sanctuary</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2825] tracking-tight mt-1">
              {isNl ? 'Privé & Leven' : 'Private Life & Sanctuary'}
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7167] mt-2 max-w-xl font-light leading-relaxed">
              {isNl
                ? 'Je persoonlijke oase voor cyclus, gezondheid, voeding, styling en persoonlijke doelen. Volledig gescheiden van zakelijke context.'
                : 'Your sanctuary for biological rhythm, health, nutrition, styling, and personal aspirations. Strictly isolated from enterprise context.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onOpenAssistantWithPrompt(
                  isNl
                    ? 'Help me reflecteren op mijn persoonlijke balans, energie en welzijn van deze week.'
                    : 'Help me reflect on my personal rhythm, energy, and wellbeing this week.'
                )
              }
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>{isNl ? 'Persoonlijke Reflectie' : 'Personal Reflection'}</span>
            </button>
          </div>
        </div>

        {/* Clean Scrollable Secondary Sub-Navigation */}
        <nav
          className="mt-6 pt-4 border-t border-[#ECE5D8] flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          aria-label="Prive Subsections"
        >
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                    : 'text-[#6C6358] bg-[#F2ECE1]/70 hover:bg-[#EAE2D3] hover:text-[#2C2825]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C5A880]' : 'text-[#8C7654]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ============================================================ */}
      {/* 1. OVERVIEW (Personal Command Center)                         */}
      {/* ============================================================ */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Stats / Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Cycle Snapshot */}
            <div
              onClick={() => setActiveSubTab('cycle')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Cyclusstatus' : 'Cycle Status'}</span>
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825] capitalize">
                {cycleProfile.trackingEnabled
                  ? cycleStatus.activePhase === 'follicular'
                    ? isNl ? 'Folliculaire Fase' : 'Follicular Phase'
                    : cycleStatus.activePhase === 'ovulatory'
                    ? isNl ? 'Ovulatoire Fase' : 'Ovulatory Phase'
                    : cycleStatus.activePhase === 'luteal'
                    ? isNl ? 'Luteale Fase' : 'Luteal Phase'
                    : isNl ? 'Menstruele Fase' : 'Menstrual Phase'
                  : isNl ? 'Niet geactiveerd' : 'Not active'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {cycleProfile.trackingEnabled
                  ? `${isNl ? 'Dag' : 'Day'} ${cycleStatus.cycleDay} • ${cycleStatus.daysUntilNextPeriod} ${isNl ? 'dagen tot menstruatie' : 'days to period'}`
                  : isNl ? 'Tik om cyclus in te stellen' : 'Tap to set up cycle'}
              </p>
            </div>

            {/* Daily Energy & Check-in */}
            <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Dagelijkse Energie' : 'Daily Energy'}</span>
                <Smile className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825] capitalize">
                {todayCheckIn?.feeling
                  ? todayCheckIn.feeling === 'good'
                    ? isNl ? 'Goed & Energiek' : 'Good & Energetic'
                    : todayCheckIn.feeling === 'lower'
                    ? isNl ? 'Lager dan normaal' : 'Lower energy'
                    : todayCheckIn.feeling === 'sick'
                    ? isNl ? 'Rust & Herstel' : 'Sick / Rest'
                    : isNl ? 'Mentaal zwaar' : 'Mentally heavy'
                  : isNl ? 'Nog niet ingevuld' : 'Not recorded yet'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {todayCheckIn?.notes || (isNl ? 'Ingevuld via de Vandaag-pagina' : 'Recorded via Today screen')}
              </p>
            </div>

            {/* Water Tracker Snapshot */}
            <div
              onClick={() => setActiveSubTab('wellbeing')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Water (750ml)' : 'Water (750ml)'}</span>
                <Droplet className="w-3.5 h-3.5 text-[#3B82F6]" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {waterStats.todayVolumeL} L
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {waterStats.todayBottles} / {waterStats.targetBottles} {isNl ? 'flessen' : 'bottles'} ({waterStats.percentOfTarget}%)
              </p>
            </div>

            {/* Routines & Evening Protection */}
            <div
              onClick={() => setActiveSubTab('routines')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Vaste Routines' : 'Routines'}</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {lifeProfile.routines.length} {isNl ? 'rituelen actief' : 'active rituals'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {lifeProfile.preferences.protectEvenings
                  ? isNl ? 'Avondrust actief beschermd' : 'Evening rest guarded'
                  : isNl ? 'Flexibel dagritme' : 'Flexible rhythm'}
              </p>
            </div>
          </div>

          {/* Two Columns: Personal Tasks & Upcoming Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Personal Tasks */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base text-[#2C2825] font-medium">
                    {isNl ? 'Persoonlijke Taken' : 'Personal Tasks'}
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#5A5145] font-medium">
                  {todayPersonalTasks.length} {isNl ? 'open' : 'open'}
                </span>
              </div>

              {todayPersonalTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8377] italic">
                  {isNl ? 'Geen openstaande persoonlijke taken.' : 'No open personal tasks today.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {todayPersonalTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask && onToggleTask(task.id)}
                          className="text-[#B2A796] hover:text-[#2C2825] shrink-0"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="truncate text-[#2C2825]">{task.title}</span>
                      </div>
                      {task.estimatedDurationMinutes && (
                        <span className="text-[10px] text-[#8C8377] shrink-0">
                          {task.estimatedDurationMinutes}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Personal Calendar Events */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base text-[#2C2825] font-medium">
                    {isNl ? 'Persoonlijke Agenda' : 'Personal Calendar'}
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#5A5145] font-medium">
                  {personalEvents.length}
                </span>
              </div>

              {personalEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8377] italic">
                  {isNl ? 'Geen persoonlijke afspraken gepland.' : 'No personal events scheduled.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {personalEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-[#2C2825]">{event.title}</div>
                        <div className="text-[10px] text-[#8C8377]">{event.date}</div>
                      </div>
                      <span className="text-[11px] font-mono text-[#7A7167] bg-[#F5EFE4] px-2 py-0.5 rounded-md">
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nutrition & Personal Styling Teaser */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setActiveSubTab('nutrition')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FFFFFF] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#2C2825]">
                <Utensils className="w-4 h-4 text-[#8C7654]" />
                <span>{isNl ? 'Voeding & Maaltijden' : 'Nutrition & Meals'}</span>
              </div>
              <p className="text-xs text-[#7A7167]">
                {nutrition.dietaryNotes ||
                  (isNl ? 'Nog geen dieetvoorkeuren genoteerd.' : 'No dietary notes recorded.')}
              </p>
              <div className="text-[11px] text-[#8C7654] pt-1 flex items-center gap-1 font-medium">
                <span>{isNl ? 'Bekijk maaltijden' : 'View nutrition'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('style')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FFFFFF] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-[#2C2825]">
                <Shirt className="w-4 h-4 text-[#8C7654]" />
                <span>{isNl ? 'Personal Styling & Garderobe' : 'Personal Styling & Wardrobe'}</span>
              </div>
              <p className="text-xs text-[#7A7167]">
                {personalStyle.colorPalette.length > 0
                  ? `${personalStyle.colorPalette.length} ${isNl ? 'kleurenpaletten vastgelegd' : 'color palettes saved'}`
                  : isNl ? 'Nog geen stylingprofiel vastgelegd.' : 'No style preferences saved yet.'}
              </p>
              <div className="text-[11px] text-[#8C7654] pt-1 flex items-center gap-1 font-medium">
                <span>{isNl ? 'Bekijk styling' : 'View styling'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CYCLUS (Embeds full CycleView seamlessly)                  */}
      {/* ============================================================ */}
      {activeSubTab === 'cycle' && (
        <CycleView
          cycleProfile={cycleProfile}
          onUpdateCycleProfile={onUpdateCycleProfile}
          dailyCheckIns={dailyCheckIns}
          onSaveDailyCheckIn={onSaveDailyCheckIn}
          tasks={tasks}
          calendarEvents={calendarEvents}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
        />
      )}

      {/* ============================================================ */}
      {/* 3. GEZONDHEID & WELZIJN (Embeds WellbeingView seamlessly)     */}
      {/* ============================================================ */}
      {activeSubTab === 'wellbeing' && (
        <WellbeingView
          wellbeing={wellbeing}
          onUpdateWellbeing={onUpdateWellbeing}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          personalStyle={personalStyle}
          onUpdateStyle={onUpdateStyle}
          dailyCheckIns={dailyCheckIns}
          cycleProfile={cycleProfile}
        />
      )}

      {/* ============================================================ */}
      {/* 4. MAALTIJDEN & VOEDING                                       */}
      {/* ============================================================ */}
      {activeSubTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Voeding & Maaltijdritme' : 'Nutrition & Dining Rhythm'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-1 font-light">
                {isNl
                  ? 'Stem maaltijdplanning af op je energieniveau en kooktijd zonder restrictief gedrag.'
                  : 'Harmonize meals with available energy and cooking capacity.'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#2C2825] block mb-1">
                  {isNl ? 'Dieet- en voedingsnotities' : 'Dietary notes & preferences'}
                </label>
                <textarea
                  rows={3}
                  value={nutrition.dietaryNotes}
                  onChange={(e) => onUpdateNutrition({ ...nutrition, dietaryNotes: e.target.value })}
                  placeholder={
                    isNl
                      ? 'bijv. Mediterraan, focus op onbewerkte voeding, voldoende eiwitten...'
                      : 'e.g. Mediterranean, whole foods focus, balanced protein...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#2C2825] block mb-1">
                    {isNl ? 'Beschikbare kooktijd op doordeweekse dagen' : 'Cooking time on weekdays'}
                  </label>
                  <select
                    value={nutrition.cookingTimeAvailableWeekdays}
                    onChange={(e) =>
                      onUpdateNutrition({
                        ...nutrition,
                        cookingTimeAvailableWeekdays: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value={15}>15 {isNl ? 'minuten (snel & simpel)' : 'minutes (quick & simple)'}</option>
                    <option value={30}>30 {isNl ? 'minuten (evenwichtig)' : 'minutes (balanced)'}</option>
                    <option value={45}>45 {isNl ? 'minuten (uitgebreider)' : 'minutes (elaborate)'}</option>
                    <option value={60}>60+ {isNl ? 'minuten (ontspannen koken)' : 'minutes (relaxed cooking)'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#2C2825] block mb-1">
                    {isNl ? 'Gezamenlijke diners met partner' : 'Shared partner dinners'}
                  </label>
                  <input
                    type="text"
                    value={nutrition.partnerSharedDinners.join(', ')}
                    onChange={(e) =>
                      onUpdateNutrition({
                        ...nutrition,
                        partnerSharedDinners: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder={isNl ? 'bijv. Vrijdag, Zaterdag, Zondag' : 'e.g. Friday, Saturday'}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. PERSONAL STYLING                                           */}
      {/* ============================================================ */}
      {activeSubTab === 'style' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Personal Styling & Silhouetten' : 'Personal Styling & Silhouettes'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-1 font-light">
                {isNl
                  ? 'Je esthetische kompas, kleurenharmonie en behaaglijke silhouetten.'
                  : 'Your personal wardrobe palette, silhouettes, and occasions.'}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#2C2825] block mb-1">
                  {isNl ? 'Favoriete silhouetten & kledingstijl' : 'Preferred silhouettes & style'}
                </label>
                <input
                  type="text"
                  value={personalStyle.preferredSilhouettes.join(', ')}
                  onChange={(e) =>
                    onUpdateStyle({
                      ...personalStyle,
                      preferredSilhouettes: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={isNl ? 'bijv. Relaxed tailoring, linnen, natuurlijke stoffen, monochrome lagen' : 'e.g. Relaxed tailoring, linen, monochrome layers'}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#2C2825] block mb-1">
                  {isNl ? 'Maten & Notities' : 'Measurements & Fit notes'}
                </label>
                <textarea
                  rows={3}
                  value={personalStyle.measurementsNotes}
                  onChange={(e) => onUpdateStyle({ ...personalStyle, measurementsNotes: e.target.value })}
                  placeholder={isNl ? 'Persoonlijke voorkeuren over pasvorm, lengte en stoffen...' : 'Personal fit, length, and fabric preferences...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. DOELEN (Personal Goals)                                    */}
      {/* ============================================================ */}
      {activeSubTab === 'goals' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Persoonlijke Doelen' : 'Personal Aspirations'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl ? 'Rustige, betekenisvolle intenties voor je eigen leven.' : 'Calm, intentional aspirations for your private life.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Nieuw Doel' : 'New Goal'}</span>
            </button>
          </div>

          {personalGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen persoonlijke doelen.' : 'No personal goals recorded yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voeg je eerste persoonlijke doel toe' : '+ Add your first personal goal'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-base text-[#2C2825] font-medium">{goal.title}</h4>
                    {goal.targetDate && (
                      <span className="text-[10px] text-[#8C7654] bg-[#F2ECE1] px-2 py-0.5 rounded-md shrink-0">
                        {goal.targetDate}
                      </span>
                    )}
                  </div>
                  {goal.description && (
                    <p className="text-xs text-[#7A7167] leading-relaxed">{goal.description}</p>
                  )}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#ECE3D4]">
                      {goal.milestones.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs text-[#524B43]">
                          <button
                            type="button"
                            onClick={() => onToggleMilestone && onToggleMilestone(goal.id, m.id)}
                            className="text-[#8C7654] hover:text-[#2C2825]"
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#3A6B35]" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span className={m.completed ? 'line-through text-[#9E9588]' : ''}>
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Goal Modal */}
          {isGoalModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Nieuw Persoonlijk Doel' : 'New Personal Goal'}
                </h3>
                <form onSubmit={handleCreateGoal} className="space-y-3">
                  <input
                    type="text"
                    placeholder={isNl ? 'Titel doel (bijv. Dagelijks ochtendritueel behouden)' : 'Goal title'}
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    autoFocus
                  />
                  <input
                    type="date"
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsGoalModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!newGoalTitle.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
                    >
                      {isNl ? 'Opslaan' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. ROUTINES & LEVENSSTRUCTUUR                                */}
      {/* ============================================================ */}
      {activeSubTab === 'routines' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                  {isNl ? 'Vaste Rituelen & Levensstructuur' : 'Daily Rituals & Structure'}
                </h2>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  {isNl ? 'Routines die je dag dragen en rust inbouwen.' : 'Rituals that ground your day with spaciousness.'}
                </p>
              </div>
            </div>

            {/* Existing Routines */}
            <div className="space-y-2">
              {lifeProfile.routines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5DDD0] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span className="font-medium text-[#2C2825]">{routine.title}</span>
                    <span className="text-[10px] text-[#7A7167] bg-[#F2ECE1] px-2 py-0.5 rounded-md capitalize">
                      {routine.timeOfDay} • {routine.durationMinutes}m
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRoutine(routine.id)}
                    className="p-1 text-[#A89E90] hover:text-[#B44335] transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Routine Form */}
            <form onSubmit={handleAddRoutine} className="pt-3 border-t border-[#ECE3D4] flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder={isNl ? 'Nieuwe routine (bijv. Ochtendthee & ademhaling)' : 'New ritual title'}
                value={newRoutineTitle}
                onChange={(e) => setNewRoutineTitle(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
              <select
                value={newRoutineTime}
                onChange={(e) => setNewRoutineTime(e.target.value as any)}
                className="px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="morning">{isNl ? 'Ochtend' : 'Morning'}</option>
                <option value="afternoon">{isNl ? 'Middag' : 'Afternoon'}</option>
                <option value="evening">{isNl ? 'Avond' : 'Evening'}</option>
              </select>
              <input
                type="number"
                value={newRoutineDuration}
                onChange={(e) => setNewRoutineDuration(Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] text-center"
              />
              <button
                type="submit"
                disabled={!newRoutineTitle.trim()}
                className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
              >
                {isNl ? 'Toevoegen' : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
