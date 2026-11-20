import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Lock,
  Plus,
  Edit3,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronRight,
  Sliders,
  RotateCcw,
  Activity,
  Heart,
  Moon,
  Compass,
} from 'lucide-react';
import {
  CycleProfile,
  CyclePhase,
  DailyCheckIn,
  EnergyLevel,
  MoodState,
  AppetiteLevel,
  PhysicalComfort,
  CycleEntry,
} from '../../types';
import {
  calculateCycleStatus,
  hasValidCycleAnchor,
  getWeeklyCycleInsight,
  PHASE_DETAILS,
  synthesizeEnergyAndCycleGuidance,
} from '../../lib/cycleUtils';

const getMoonPhase = (date: Date) => {
  // Approximate astronomical phase using the known January 2000 new moon.
  const synodicMonth = 29.530588853;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const daysSince = (date.getTime() - knownNewMoon) / 86400000;
  const phase = ((daysSince % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;
  const illumination = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const names = [
    'Nieuwe maan', 'Wassende sikkel', 'Eerste kwartier', 'Wassende maan',
    'Volle maan', 'Afnemende maan', 'Laatste kwartier', 'Afnemende sikkel',
  ];
  const index = Math.round(phase * 8) % 8;
  return { name: names[index], illumination: Math.round(illumination * 100), phase };
};

interface CycleViewProps {
  cycleProfile: CycleProfile;
  onUpdateCycleProfile: (profile: CycleProfile) => void;
  dailyCheckIns: DailyCheckIn[];
  onSaveDailyCheckIn: (checkIn: DailyCheckIn) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
}

export const CycleView: React.FC<CycleViewProps> = ({
  cycleProfile,
  onUpdateCycleProfile,
  dailyCheckIns,
  onSaveDailyCheckIn,
  onOpenAssistantWithPrompt,
}) => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const moon = getMoonPhase(new Date());
  const hasCycleAnchor = cycleProfile.trackingEnabled && hasValidCycleAnchor(cycleProfile, todayStr);
  // Keep calculations finite before the owner has logged a first period date.
  const cycleStatus = calculateCycleStatus({
    ...cycleProfile,
    lastPeriodStartDate: hasCycleAnchor ? cycleProfile.lastPeriodStartDate : todayStr,
    overridePhase: hasCycleAnchor ? cycleProfile.overridePhase : undefined,
  }, todayStr);
  const weeklyInsight = getWeeklyCycleInsight(cycleStatus);
  const activePhaseDetails = PHASE_DETAILS[cycleStatus.activePhase];

  const todayCheckIn = dailyCheckIns.find((c) => c.date === todayStr);
  const energyGuidance = synthesizeEnergyAndCycleGuidance(cycleStatus, todayCheckIn);

  // Modal / Accordion States
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [showLogPeriodModal, setShowLogPeriodModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Settings form state
  const [cycleLengthInput, setCycleLengthInput] = useState(cycleProfile.averageCycleLength);
  const [periodLengthInput, setPeriodLengthInput] = useState(cycleProfile.averagePeriodLength);
  const [lastStartInput, setLastStartInput] = useState(cycleProfile.lastPeriodStartDate);
  const [overridePhaseInput, setOverridePhaseInput] = useState<CyclePhase | 'auto'>(
    cycleProfile.overridePhase || 'auto'
  );

  // New period log form state
  const [newLogStartDate, setNewLogStartDate] = useState(todayStr);
  const [newLogEndDate, setNewLogEndDate] = useState('');
  const [newLogNotes, setNewLogNotes] = useState('');
  const [periodLogError, setPeriodLogError] = useState<string | null>(null);

  // Daily energy check-in state
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>(todayCheckIn?.energy || 'normal');
  const [mood, setMood] = useState<MoodState | undefined>(todayCheckIn?.mood);
  const [hunger, setHunger] = useState<AppetiteLevel | undefined>(todayCheckIn?.hunger);
  const [comfort, setComfort] = useState<PhysicalComfort | undefined>(todayCheckIn?.physicalDiscomfort);
  const [checkInNotes, setCheckInNotes] = useState(todayCheckIn?.notes || '');
  const [checkInSavedNotice, setCheckInSavedNotice] = useState(false);

  const handleSaveCheckIn = () => {
    const updated: DailyCheckIn = {
      id: todayCheckIn?.id || `dci-${todayStr}`,
      date: todayStr,
      energy: energyLevel,
      mood,
      hunger,
      physicalDiscomfort: comfort,
      notes: checkInNotes,
      timestamp: new Date().toISOString(),
    };
    onSaveDailyCheckIn(updated);
    setCheckInSavedNotice(true);
    setTimeout(() => setCheckInSavedNotice(false), 2500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(cycleLengthInput) || cycleLengthInput < 21 || cycleLengthInput > 45) return;
    if (!Number.isInteger(periodLengthInput) || periodLengthInput < 2 || periodLengthInput > 10) return;
    if (!lastStartInput || lastStartInput > todayStr) return;
    const updated: CycleProfile = {
      ...cycleProfile,
      averageCycleLength: Number(cycleLengthInput),
      averagePeriodLength: Number(periodLengthInput),
      lastPeriodStartDate: lastStartInput,
      trackingEnabled: Boolean(lastStartInput),
      overridePhase: overridePhaseInput === 'auto' ? undefined : overridePhaseInput,
      lastUpdated: todayStr,
    };
    onUpdateCycleProfile(updated);
    setIsEditingSettings(false);
  };

  const handleLogNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogStartDate || newLogStartDate > todayStr) {
      setPeriodLogError('Kies een geldige startdatum die vandaag of eerder valt.');
      return;
    }
    if (newLogEndDate && (newLogEndDate < newLogStartDate || newLogEndDate > todayStr)) {
      setPeriodLogError('De einddatum moet op of na de startdatum liggen en mag niet in de toekomst vallen.');
      return;
    }
    if (cycleProfile.history.some((entry) => entry.startDate === newLogStartDate)) {
      setPeriodLogError('Deze startdatum staat al in je cyclusgeschiedenis.');
      return;
    }
    setPeriodLogError(null);
    const newEntry: CycleEntry = {
      id: `ce-${Date.now()}`,
      startDate: newLogStartDate,
      endDate: newLogEndDate || undefined,
      notes: newLogNotes,
      confirmedByUser: true,
    };

    const updatedHistory = [...cycleProfile.history, newEntry].sort((a, b) => b.startDate.localeCompare(a.startDate));
    const latestKnownStart = [cycleProfile.lastPeriodStartDate, ...updatedHistory.map((entry) => entry.startDate)]
      .filter((date) => Boolean(date) && date <= todayStr)
      .sort((a, b) => b.localeCompare(a))[0] || newLogStartDate;
    const updated: CycleProfile = {
      ...cycleProfile,
      lastPeriodStartDate: latestKnownStart,
      trackingEnabled: true,
      history: updatedHistory,
      overridePhase: undefined, // Clear override upon logging actual date
      lastUpdated: todayStr,
    };

    onUpdateCycleProfile(updated);
    setShowLogPeriodModal(false);
    setNewLogNotes('');
    setNewLogEndDate('');
    setPeriodLogError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-widest text-[var(--accent-secondary)] font-medium">
              Personal Sanctuary
            </span>
            <span className="text-[#C5BAA8]">•</span>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-[var(--accent-secondary)]" />
              <span>Private to Personal Realm</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[var(--text-primary)]">
            Cycle Intelligence
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-xl font-light">
            A calm, grounded rhythm for energy pacing and lifestyle planning. Designed to honor your natural ebb and flow without rigid prescriptions.
          </p>
        </div>

        {/* Action buttons: Settings & Log Period */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => { setPeriodLogError(null); setShowLogPeriodModal(true); }}
            id="log-period-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#74334D] text-[#FFF4F0] text-xs font-medium hover:bg-[#87405B] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Log Period Date</span>
          </button>
          <button
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            id="cycle-settings-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[var(--surface-2)] flex items-center justify-center text-2xl" aria-hidden="true">
          {moon.phase < 0.03 || moon.phase > 0.97 ? '🌑' : moon.phase < 0.25 ? '🌒' : moon.phase < 0.28 ? '🌓' : moon.phase < 0.48 ? '🌔' : moon.phase < 0.53 ? '🌕' : moon.phase < 0.75 ? '🌖' : moon.phase < 0.78 ? '🌗' : '🌘'}
        </div>
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-widest text-[var(--accent-secondary)] font-semibold">Natuurlijk ritme · Maanfase</div>
          <h3 className="font-serif text-lg text-[var(--text-primary)]">{moon.name}</h3>
          <p className="text-xs text-[var(--text-secondary)]">{moon.illumination}% verlicht · Een astronomische indicatie als reflectie- en natuurkader, geen medische of bewezen cyclusvoorspelling.</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenAssistantWithPrompt?.(`Help me op een nuchtere, reflectieve manier mijn huidige cyclusfase (${activePhaseDetails.title}) en de huidige maanstand (${moon.name}) naast elkaar te bekijken. Maak duidelijk onderscheid tussen fysiologische kennis en symbolische reflectie. Geef me enkele haalbare suggesties voor vandaag.`)}
          className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >Reflecteer met Jarvis</button>
      </section>

      {/* Edit Profile / Override Accordion */}
      {isEditingSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D5]">
            <h3 className="font-serif text-base font-medium text-[var(--text-primary)]">
              Cycle Parameters & Calibration
            </h3>
            <span className="text-[11px] text-[#7E756C]">Values adjust estimates gracefully</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Last Period Start Date
              </label>
              <input
                type="date"
                value={lastStartInput}
                onChange={(e) => setLastStartInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Average Cycle Length (Days)
              </label>
              <input
                type="number"
                min="21"
                max="45"
                value={cycleLengthInput}
                onChange={(e) => setCycleLengthInput(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Average Period Duration (Days)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={periodLengthInput}
                onChange={(e) => setPeriodLengthInput(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-secondary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Phase Override (Manual)
              </label>
              <select
                value={overridePhaseInput}
                onChange={(e) => setOverridePhaseInput(e.target.value as CyclePhase | 'auto')}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-secondary)]"
              >
                <option value="auto">Auto Model Estimate ({cycleStatus.estimatedPhase})</option>
                <option value="menstrual">Force Menstrual</option>
                <option value="follicular">Force Follicular</option>
                <option value="ovulatory">Force Ovulatory</option>
                <option value="luteal">Force Luteal</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingSettings(false)}
              className="px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#74334D] text-[#FFF4F0] text-xs font-medium hover:bg-[#87405B] transition"
            >
              Update Parameters
            </button>
          </div>
        </form>
      )}

      {hasCycleAnchor ? <>
      {/* Main Cycle Status Dashboard Hero */}
      <div className="rounded-3xl border border-[var(--border-subtle)] bg-radial from-[var(--surface-1)] to-[var(--surface-2)] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative motif */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#E8DEC8]/25 blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Phase & Day Counter */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-[var(--surface-2)]/80 border border-[var(--border-subtle)] text-[var(--text-secondary)] shadow-2xs">
                Day {cycleStatus.cycleDay} of {cycleStatus.totalCycleLength}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                  cycleStatus.isOverridden
                    ? 'bg-[#E3DCCE] text-[var(--text-primary)]'
                    : 'bg-[#EBF1E8] text-[#3E5C38]'
                }`}
              >
                {cycleStatus.isOverridden ? 'Manual Override' : cycleStatus.phaseConfidence}
              </span>
            </div>

            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[var(--text-primary)] font-normal tracking-tight">
                {activePhaseDetails.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] font-light">
                {activePhaseDetails.subheading}
              </p>
            </div>

            <p className="text-sm text-[var(--text-primary)] leading-relaxed max-w-lg font-normal">
              {activePhaseDetails.generalExperiences[0]}
            </p>

            {/* Cycle Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Cycle Rhythm Progress</span>
                <span className="font-mono text-[11px] text-[var(--text-primary)]">{cycleStatus.cycleProgressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E5DDCF] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-[var(--accent-secondary)] transition-all duration-500"
                  style={{ width: `${cycleStatus.cycleProgressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Next phase & next period metrics */}
            <div className="pt-2 grid grid-cols-2 gap-4 border-t border-[#E5DDCF]/80">
              <div>
                <span className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Upcoming Shift</span>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {cycleStatus.nextPhase.phase.charAt(0).toUpperCase() + cycleStatus.nextPhase.phase.slice(1)} in ~{cycleStatus.nextPhase.daysUntil} day{cycleStatus.nextPhase.daysUntil > 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Next Period Window</span>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  Estimated {cycleStatus.nextPeriodDate} (~{cycleStatus.daysUntilNextPeriod} days)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Phases Map */}
          <div className="lg:col-span-5 bg-[var(--surface-2)]/70 rounded-2xl border border-[var(--border-subtle)] p-5 shadow-xs space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-[var(--accent-secondary)] font-medium block">
              Four Phase Cadence
            </span>

            <div className="space-y-2">
              {(['menstrual', 'follicular', 'ovulatory', 'luteal'] as CyclePhase[]).map((phaseKey) => {
                const isCurrent = cycleStatus.activePhase === phaseKey;
                const details = PHASE_DETAILS[phaseKey];
                return (
                  <div
                    key={phaseKey}
                    className={`p-3 rounded-xl transition border text-xs flex items-center justify-between ${
                      isCurrent
                        ? 'bg-[var(--surface-2)] border-[#BFA785] text-[var(--text-primary)] shadow-xs'
                        : 'bg-[var(--surface-1)]/60 border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]"></span>}
                        <span className={`font-medium ${isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {details.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">{details.contextualTone}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-medium text-[var(--accent-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                        Current
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A69C8E]">Upcoming</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      </> : (
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 sm:p-8 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-[var(--accent-secondary)] font-semibold">Cyclusregistratie</div>
          <h2 className="font-serif text-2xl text-[var(--text-primary)]">Begin met jouw eigen cyclusgegevens</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">Log een menstruatiestartdatum om een persoonlijke cyclusinschatting te zien. Zonder die datum tonen we geen fase of volgende menstruatie alsof we die kennen.</p>
          <button type="button" onClick={() => { setPeriodLogError(null); setShowLogPeriodModal(true); }} className="px-4 py-2 rounded-xl bg-[#74334D] text-[#FFF4F0] text-xs font-medium">Eerste menstruatiedatum toevoegen</button>
        </div>
      )}

      {/* Daily User-Reported Energy Check-in */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-secondary)]" />
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Today’s Energy Check-In
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              Your actual experience takes absolute precedence over theoretical cycle predictions in all daily planning.
            </p>
          </div>
          {checkInSavedNotice && (
            <span className="text-xs text-[#3E5C38] flex items-center gap-1 bg-[#EBF1E8] px-2.5 py-1 rounded-full animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Check-in honored
            </span>
          )}
        </div>

        <div className="space-y-4">
          {/* Energy Rating Scale */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              How is your energy feeling today?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { val: 'very_low', label: 'Very Low', desc: 'Rest sanctuary' },
                { val: 'low', label: 'Low', desc: 'Gentle cadence' },
                { val: 'normal', label: 'Normal', desc: 'Sustainable flow' },
                { val: 'good', label: 'Good', desc: 'Steady focus' },
                { val: 'high', label: 'High', desc: 'Expansive capacity' },
              ].map((item) => {
                const isSelected = energyLevel === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setEnergyLevel(item.val as EnergyLevel)}
                    style={{
                      backgroundColor: isSelected ? '#74334D' : 'var(--surface-2)',
                      color: isSelected ? '#FFF4F0' : 'var(--text-secondary)',
                      borderColor: isSelected ? '#C77A99' : 'var(--border-subtle)',
                      boxShadow: isSelected ? '0 0 0 1px rgba(199,122,153,0.18)' : 'none',
                    }}
                    className="p-3 rounded-xl border text-left transition cursor-pointer hover:border-[#E18449]"
                  >
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span style={{ color: isSelected ? '#F1DCE4' : 'var(--text-muted)' }} className="block text-[10px] mt-0.5">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Mood & Physical Comfort Nuances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Mood Nuance (Optional)
              </label>
              <select
                value={mood || ''}
                onChange={(e) => setMood((e.target.value as MoodState) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">Select mood...</option>
                <option value="calm">Calm & Centered</option>
                <option value="focused">Deeply Focused</option>
                <option value="reflective">Reflective / Introspective</option>
                <option value="sensitive">Sensory Sensitive</option>
                <option value="expansive">Expansive & Sociable</option>
                <option value="overstimulated">Overstimulated</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Appetite & Satiety (Optional)
              </label>
              <select
                value={hunger || ''}
                onChange={(e) => setHunger((e.target.value as AppetiteLevel) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="">Normal appetite...</option>
                <option value="low">Lower appetite</option>
                <option value="normal">Normal, balanced</option>
                <option value="increased">Increased cravings / hunger</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Physical Comfort (Optional)
              </label>
              <select
                value={comfort || ''}
                onChange={(e) => setComfort((e.target.value as PhysicalComfort) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none"
              >
                <option value="comfortable">Comfortable baseline</option>
                <option value="mild_cramps">Mild cramps / aches</option>
                <option value="fatigue">Physical fatigue</option>
                <option value="tension">Tension or tightness</option>
                <option value="restorative">Restorative / light</option>
              </select>
            </div>
          </div>

          {/* Quick reflection note */}
          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
              Personal Reflection or Physical Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Slept 8 hours, morning clarity, need unhurried evening"
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-secondary)]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-[var(--text-secondary)]">
              Synthesis: <strong className="font-medium text-[var(--text-primary)]">{hasCycleAnchor ? energyGuidance.headline : 'Je eigen energie-inschatting staat centraal. Voeg een menstruatiestartdatum toe voor cycluscontext.'}</strong>
            </div>
            <button
              type="button"
              onClick={handleSaveCheckIn}
              id="save-daily-checkin-btn"
              className="px-4 py-2 rounded-xl bg-[#74334D] text-[#FFF4F0] border border-[#C77A99] text-xs font-medium hover:bg-[#87405B] transition shadow-xs cursor-pointer"
            >
              Record Today’s Check-In
            </button>
          </div>
        </div>
      </div>

      {hasCycleAnchor && <>
      {/* Weekly Cycle Insight Section: "Your Week" */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--accent-secondary)]" />
            <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
              Your Week: Strategic Rhythm
            </h3>
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] bg-[#EDE6D7] px-2.5 py-0.5 rounded-full font-medium">
            {weeklyInsight.phaseLabel}
          </span>
        </div>

        <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
          {weeklyInsight.headline}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2">
            <span className="font-medium text-[var(--text-primary)] block text-xs">What you might notice</span>
            <p className="text-[var(--text-secondary)] leading-relaxed">{weeklyInsight.whatYouMightNotice}</p>
            <span className="font-medium text-[var(--text-primary)] block text-xs pt-2">What could be useful</span>
            <p className="text-[var(--text-secondary)] leading-relaxed">{weeklyInsight.whatCouldBeUseful}</p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] space-y-2">
            <span className="font-medium text-[var(--text-primary)] block text-xs">Recommended Priorities</span>
            <p className="text-[var(--text-secondary)] leading-relaxed">{weeklyInsight.whatToPrioritize}</p>
            <span className="font-medium text-[var(--text-primary)] block text-xs pt-2">What to avoid overloading</span>
            <p className="text-[var(--text-secondary)] leading-relaxed">{weeklyInsight.whatToAvoid}</p>
          </div>
        </div>

        {/* 1-2 Practical Suggestions */}
        <div className="p-3.5 rounded-xl bg-[#EDE7DB] border border-[var(--border-subtle)] space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6C5E48] block">
            Practical Suggestions for this Week
          </span>
          <ul className="space-y-1 text-xs text-[var(--text-primary)]">
            {weeklyInsight.practicalSuggestions.map((sug, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[var(--accent-secondary)] font-bold">•</span>
                <span>{sug}</span>
              </li>
            ))}
          </ul>
        </div>

        {onOpenAssistantWithPrompt && (
          <div className="flex justify-end pt-1">
            <button
              onClick={() =>
                onOpenAssistantWithPrompt(
                  `Partner with me to optimize this week's schedule considering my ${cycleStatus.activePhase} cycle phase and today's energy report.`
                )
              }
              className="flex items-center gap-1.5 text-xs text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Discuss week alignment with JARVIS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      </>}

      {hasCycleAnchor && <>
      {/* Cycle Education & Context */}
      <div className="rounded-2xl border border-[#E4DCCE] bg-[var(--surface-1)] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EAE4D7]">
          <Info className="w-4 h-4 text-[var(--accent-secondary)]" />
          <h3 className="font-serif text-base font-medium text-[var(--text-primary)]">
            Phase Context & Experiences
          </h3>
        </div>

        <div className="space-y-3 text-xs text-[var(--text-secondary)]">
          <p className="leading-relaxed">
            In {activePhaseDetails.title}, hormone levels adapt dynamically. Here is what is commonly experienced without obligation:
          </p>
          <ul className="space-y-2">
            {activePhaseDetails.generalExperiences.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[var(--accent-secondary)] mt-0.5">•</span>
                <span className="leading-relaxed">{exp}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[#E0D7C7] text-[var(--text-secondary)]">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-[var(--accent-secondary)]">
              Nourishment Nuance
            </span>
            <p className="mt-0.5 text-xs">{activePhaseDetails.nourishmentNuance}</p>
          </div>
        </div>
      </div>

      </>}

      {/* Cycle History & Privacy Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cycle History card */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-sm font-medium text-[var(--text-primary)]">
              Recorded Cycle History
            </h4>
            <button
              onClick={() => setShowLogPeriodModal(true)}
              className="text-xs text-[var(--accent-secondary)] hover:underline"
            >
              + Log
            </button>
          </div>

          <div className="space-y-2">
            {cycleProfile.history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-3 text-center">No past entries recorded yet.</p>
            ) : (
              cycleProfile.history.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg border border-[#E5DFD4] bg-[var(--surface-2)] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{entry.startDate}</span>
                    {entry.endDate && (
                      <span className="text-[var(--text-secondary)] text-[11px] ml-1">to {entry.endDate}</span>
                    )}
                    {entry.notes && (
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate max-w-xs">{entry.notes}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#4E6845] bg-[#EEF4ED] px-2 py-0.5 rounded-full font-medium">
                    {entry.confirmedByUser ? 'Confirmed' : 'Estimated'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Privacy & Medical Safeguards */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[var(--text-primary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-secondary)]" />
            <h4 className="font-serif text-sm font-medium">Sanctuary Privacy & Safety</h4>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            <strong>Absolute Realm Containment:</strong> Your cycle dates and physical check-ins are restricted exclusively to your Personal sanctuary. They are never transmitted to Mariluna studio or third parties.
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed border-t border-[#E5DFD4] pt-2">
            <strong>Non-Medical Clarification:</strong> P & M Alchemy offers educational context for lifestyle pacing. It does not diagnose medical conditions or predict fertility. Your reported energy always overrides automated algorithms.
          </p>
        </div>
      </div>

      {/* Log Period Modal */}
      {showLogPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6 shadow-2xl space-y-4 text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="font-serif text-lg font-medium">Record Period Onset</h3>
              <button
                onClick={() => setShowLogPeriodModal(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleLogNewPeriod} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Period Start Date</label>
                <input
                  type="date"
                  value={newLogStartDate}
                  onChange={(e) => { setNewLogStartDate(e.target.value); setPeriodLogError(null); }}
                  max={todayStr}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Period End Date (Optional)</label>
                <input
                  type="date"
                  value={newLogEndDate}
                  onChange={(e) => { setNewLogEndDate(e.target.value); setPeriodLogError(null); }}
                  min={newLogStartDate}
                  max={todayStr}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--text-secondary)] mb-1">Notes / Physical Sensations (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Mild fatigue, gentle warm tea helped, restful sleep"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-primary)]"
                />
              </div>

              {periodLogError && (
                <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                  {periodLogError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogPeriodModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#74334D] text-[#FFF4F0] font-medium hover:bg-[#87405B] transition"
                >
                  Confirm & Update Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
