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
  getWeeklyCycleInsight,
  PHASE_DETAILS,
  synthesizeEnergyAndCycleGuidance,
} from '../../lib/cycleUtils';

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
  const todayStr = new Date().toISOString().split('T')[0];
  const cycleStatus = calculateCycleStatus(cycleProfile, todayStr);
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
    const updated: CycleProfile = {
      ...cycleProfile,
      averageCycleLength: Number(cycleLengthInput),
      averagePeriodLength: Number(periodLengthInput),
      lastPeriodStartDate: lastStartInput,
      overridePhase: overridePhaseInput === 'auto' ? undefined : overridePhaseInput,
      lastUpdated: todayStr,
    };
    onUpdateCycleProfile(updated);
    setIsEditingSettings(false);
  };

  const handleLogNewPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: CycleEntry = {
      id: `ce-${Date.now()}`,
      startDate: newLogStartDate,
      endDate: newLogEndDate || undefined,
      notes: newLogNotes,
      confirmedByUser: true,
    };

    const updatedHistory = [newEntry, ...cycleProfile.history];
    const updated: CycleProfile = {
      ...cycleProfile,
      lastPeriodStartDate: newLogStartDate,
      history: updatedHistory,
      overridePhase: undefined, // Clear override upon logging actual date
      lastUpdated: todayStr,
    };

    onUpdateCycleProfile(updated);
    setShowLogPeriodModal(false);
    setNewLogNotes('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] uppercase tracking-widest text-[#8C7654] font-medium">
              Personal Sanctuary
            </span>
            <span className="text-[#C5BAA8]">•</span>
            <div className="flex items-center gap-1 text-[11px] text-[#7A7167] bg-[#F1ECE1] px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3 text-[#8C7654]" />
              <span>Private to Personal Realm</span>
            </div>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#2C2825]">
            Cycle Intelligence
          </h1>
          <p className="mt-1 text-sm text-[#6C6358] max-w-xl font-light">
            A calm, grounded rhythm for energy pacing and lifestyle planning. Designed to honor your natural ebb and flow without rigid prescriptions.
          </p>
        </div>

        {/* Action buttons: Settings & Log Period */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowLogPeriodModal(true)}
            id="log-period-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#3D3730] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Log Period Date</span>
          </button>
          <button
            onClick={() => setIsEditingSettings(!isEditingSettings)}
            id="cycle-settings-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#DDD5C7] bg-[#F4EFE6] text-xs text-[#4A433B] hover:bg-[#EBE5D9] transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#7A7167]" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Edit Profile / Override Accordion */}
      {isEditingSettings && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-[#DCD3C3] bg-[#FAF7F0] p-5 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D5]">
            <h3 className="font-serif text-base font-medium text-[#2C2825]">
              Cycle Parameters & Calibration
            </h3>
            <span className="text-[11px] text-[#7E756C]">Values adjust estimates gracefully</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#554C42] mb-1">
                Last Period Start Date
              </label>
              <input
                type="date"
                value={lastStartInput}
                onChange={(e) => setLastStartInput(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#554C42] mb-1">
                Average Cycle Length (Days)
              </label>
              <input
                type="number"
                min="21"
                max="45"
                value={cycleLengthInput}
                onChange={(e) => setCycleLengthInput(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#554C42] mb-1">
                Average Period Duration (Days)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={periodLengthInput}
                onChange={(e) => setPeriodLengthInput(Number(e.target.value))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#554C42] mb-1">
                Phase Override (Manual)
              </label>
              <select
                value={overridePhaseInput}
                onChange={(e) => setOverridePhaseInput(e.target.value as CyclePhase | 'auto')}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
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
              className="px-3.5 py-1.5 rounded-lg text-xs text-[#6C6358] hover:bg-[#EDE6D8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E37] transition"
            >
              Update Parameters
            </button>
          </div>
        </form>
      )}

      {/* Main Cycle Status Dashboard Hero */}
      <div className="rounded-3xl border border-[#E4DCCF] bg-radial from-[#FAF7F0] to-[#F2EDE2] p-6 sm:p-8 shadow-xs relative overflow-hidden">
        {/* Subtle decorative motif */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#E8DEC8]/25 blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Phase & Day Counter */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-[#FFFFFF]/80 border border-[#DDD5C7] text-[#554C42] shadow-2xs">
                Day {cycleStatus.cycleDay} of {cycleStatus.totalCycleLength}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${
                  cycleStatus.isOverridden
                    ? 'bg-[#E3DCCE] text-[#3D3730]'
                    : 'bg-[#EBF1E8] text-[#3E5C38]'
                }`}
              >
                {cycleStatus.isOverridden ? 'Manual Override' : cycleStatus.phaseConfidence}
              </span>
            </div>

            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#2C2825] font-normal tracking-tight">
                {activePhaseDetails.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#7A6E5F] font-light">
                {activePhaseDetails.subheading}
              </p>
            </div>

            <p className="text-sm text-[#4E463D] leading-relaxed max-w-lg font-normal">
              {activePhaseDetails.generalExperiences[0]}
            </p>

            {/* Cycle Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-[#7A7167]">
                <span>Cycle Rhythm Progress</span>
                <span className="font-mono text-[11px] text-[#4E463D]">{cycleStatus.cycleProgressPercent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#E5DDCF] overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-[#8C7654] transition-all duration-500"
                  style={{ width: `${cycleStatus.cycleProgressPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Next phase & next period metrics */}
            <div className="pt-2 grid grid-cols-2 gap-4 border-t border-[#E5DDCF]/80">
              <div>
                <span className="block text-[11px] text-[#8C8377] uppercase tracking-wider">Upcoming Shift</span>
                <span className="text-xs font-medium text-[#2C2825]">
                  {cycleStatus.nextPhase.phase.charAt(0).toUpperCase() + cycleStatus.nextPhase.phase.slice(1)} in ~{cycleStatus.nextPhase.daysUntil} day{cycleStatus.nextPhase.daysUntil > 1 ? 's' : ''}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-[#8C8377] uppercase tracking-wider">Next Period Window</span>
                <span className="text-xs font-medium text-[#2C2825]">
                  Estimated {cycleStatus.nextPeriodDate} (~{cycleStatus.daysUntilNextPeriod} days)
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Phases Map */}
          <div className="lg:col-span-5 bg-[#FFFFFF]/70 rounded-2xl border border-[#DDD5C7] p-5 shadow-xs space-y-3">
            <span className="text-[11px] uppercase tracking-wider text-[#8C7654] font-medium block">
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
                        ? 'bg-[#F4EFE6] border-[#BFA785] text-[#2C2825] shadow-xs'
                        : 'bg-[#FAF8F3]/60 border-transparent text-[#7A7167]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]"></span>}
                        <span className={`font-medium ${isCurrent ? 'text-[#2C2825]' : 'text-[#5C5348]'}`}>
                          {details.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#8C8377] block mt-0.5">{details.contextualTone}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] font-medium text-[#8C7654] bg-[#FFFFFF] px-2 py-0.5 rounded-full border border-[#D5CCBF]">
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

      {/* Daily User-Reported Energy Check-in */}
      <div className="rounded-2xl border border-[#E2DDD2] bg-[#FAF8F3] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE4D8] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8C7654]" />
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                Today’s Energy Check-In
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#7A7167]">
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
            <label className="block text-xs font-medium text-[#4A433B] mb-2">
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
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C2825] text-[#F9F7F2] border-[#2C2825] shadow-xs'
                        : 'bg-[#FFFFFF] text-[#4A433B] border-[#DDD5C7] hover:border-[#BFAF98]'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{item.label}</span>
                    <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-[#DDD5C7]' : 'text-[#8C8377]'}`}>
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
              <label className="block text-[11px] font-medium text-[#5A524A] mb-1">
                Mood Nuance (Optional)
              </label>
              <select
                value={mood || ''}
                onChange={(e) => setMood((e.target.value as MoodState) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none"
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
              <label className="block text-[11px] font-medium text-[#5A524A] mb-1">
                Appetite & Satiety (Optional)
              </label>
              <select
                value={hunger || ''}
                onChange={(e) => setHunger((e.target.value as AppetiteLevel) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none"
              >
                <option value="">Normal appetite...</option>
                <option value="low">Lower appetite</option>
                <option value="normal">Normal, balanced</option>
                <option value="increased">Increased cravings / hunger</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#5A524A] mb-1">
                Physical Comfort (Optional)
              </label>
              <select
                value={comfort || ''}
                onChange={(e) => setComfort((e.target.value as PhysicalComfort) || undefined)}
                className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none"
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
            <label className="block text-[11px] font-medium text-[#5A524A] mb-1">
              Personal Reflection or Physical Notes
            </label>
            <input
              type="text"
              placeholder="e.g., Slept 8 hours, morning clarity, need unhurried evening"
              value={checkInNotes}
              onChange={(e) => setCheckInNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-none focus:ring-1 focus:ring-[#8C7654]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-[#7A7167]">
              Synthesis: <strong className="font-medium text-[#2C2825]">{energyGuidance.headline}</strong>
            </div>
            <button
              type="button"
              onClick={handleSaveCheckIn}
              id="save-daily-checkin-btn"
              className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#3E3831] transition shadow-xs cursor-pointer"
            >
              Record Today’s Check-In
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Cycle Insight Section: "Your Week" */}
      <div className="rounded-2xl border border-[#E0D9CB] bg-[#F7F4EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D4] pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#8C7654]" />
            <h3 className="font-serif text-lg font-medium text-[#2C2825]">
              Your Week: Strategic Rhythm
            </h3>
          </div>
          <span className="text-[11px] text-[#7A7167] bg-[#EDE6D7] px-2.5 py-0.5 rounded-full font-medium">
            {weeklyInsight.phaseLabel}
          </span>
        </div>

        <p className="text-xs text-[#554C42] italic leading-relaxed">
          {weeklyInsight.headline}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2DDD2] space-y-2">
            <span className="font-medium text-[#2C2825] block text-xs">What you might notice</span>
            <p className="text-[#645C52] leading-relaxed">{weeklyInsight.whatYouMightNotice}</p>
            <span className="font-medium text-[#2C2825] block text-xs pt-2">What could be useful</span>
            <p className="text-[#645C52] leading-relaxed">{weeklyInsight.whatCouldBeUseful}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E2DDD2] space-y-2">
            <span className="font-medium text-[#2C2825] block text-xs">Recommended Priorities</span>
            <p className="text-[#645C52] leading-relaxed">{weeklyInsight.whatToPrioritize}</p>
            <span className="font-medium text-[#2C2825] block text-xs pt-2">What to avoid overloading</span>
            <p className="text-[#645C52] leading-relaxed">{weeklyInsight.whatToAvoid}</p>
          </div>
        </div>

        {/* 1-2 Practical Suggestions */}
        <div className="p-3.5 rounded-xl bg-[#EDE7DB] border border-[#DDD5C7] space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6C5E48] block">
            Practical Suggestions for this Week
          </span>
          <ul className="space-y-1 text-xs text-[#3E3832]">
            {weeklyInsight.practicalSuggestions.map((sug, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-[#8C7654] font-bold">•</span>
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
              className="flex items-center gap-1.5 text-xs text-[#7E694E] hover:text-[#2C2825] font-medium transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Discuss week alignment with JARVIS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Cycle Education & Context */}
      <div className="rounded-2xl border border-[#E4DCCE] bg-[#FAF8F3] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#EAE4D7]">
          <Info className="w-4 h-4 text-[#8C7654]" />
          <h3 className="font-serif text-base font-medium text-[#2C2825]">
            Phase Context & Experiences
          </h3>
        </div>

        <div className="space-y-3 text-xs text-[#4A433B]">
          <p className="leading-relaxed">
            In {activePhaseDetails.title}, hormone levels adapt dynamically. Here is what is commonly experienced without obligation:
          </p>
          <ul className="space-y-2">
            {activePhaseDetails.generalExperiences.map((exp, idx) => (
              <li key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-[#8C7654] mt-0.5">•</span>
                <span className="leading-relaxed">{exp}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 p-3 rounded-xl bg-[#F2EDE2] border border-[#E0D7C7] text-[#554C42]">
            <span className="font-semibold block text-[11px] uppercase tracking-wider text-[#7E694E]">
              Nourishment Nuance
            </span>
            <p className="mt-0.5 text-xs">{activePhaseDetails.nourishmentNuance}</p>
          </div>
        </div>
      </div>

      {/* Cycle History & Privacy Safeguards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cycle History card */}
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#FAF8F3] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif text-sm font-medium text-[#2C2825]">
              Recorded Cycle History
            </h4>
            <button
              onClick={() => setShowLogPeriodModal(true)}
              className="text-xs text-[#8C7654] hover:underline"
            >
              + Log
            </button>
          </div>

          <div className="space-y-2">
            {cycleProfile.history.length === 0 ? (
              <p className="text-xs text-[#8C8377] py-3 text-center">No past entries recorded yet.</p>
            ) : (
              cycleProfile.history.slice(0, 3).map((entry) => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg border border-[#E5DFD4] bg-[#FFFFFF] text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-[#2C2825]">{entry.startDate}</span>
                    {entry.endDate && (
                      <span className="text-[#7A7167] text-[11px] ml-1">to {entry.endDate}</span>
                    )}
                    {entry.notes && (
                      <p className="text-[11px] text-[#8C8377] mt-0.5 truncate max-w-xs">{entry.notes}</p>
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
        <div className="rounded-2xl border border-[#E2DDD2] bg-[#F5EFE4] p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-[#3D3730]">
            <ShieldCheck className="w-4 h-4 text-[#8C7654]" />
            <h4 className="font-serif text-sm font-medium">Sanctuary Privacy & Safety</h4>
          </div>
          <p className="text-xs text-[#554C42] leading-relaxed">
            <strong>Absolute Realm Containment:</strong> Your cycle dates and physical check-ins are restricted exclusively to your Personal sanctuary. They are never transmitted to Mariluna studio or third parties.
          </p>
          <p className="text-[11px] text-[#7A7167] leading-relaxed border-t border-[#E5DFD4] pt-2">
            <strong>Non-Medical Clarification:</strong> P & M Alchemy offers educational context for lifestyle pacing. It does not diagnose medical conditions or predict fertility. Your reported energy always overrides automated algorithms.
          </p>
        </div>
      </div>

      {/* Log Period Modal */}
      {showLogPeriodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F3] border border-[#DDD5C7] p-6 shadow-2xl space-y-4 text-[#2C2825]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D8]">
              <h3 className="font-serif text-lg font-medium">Record Period Onset</h3>
              <button
                onClick={() => setShowLogPeriodModal(false)}
                className="text-xs text-[#7A7167] hover:text-[#2C2825]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleLogNewPeriod} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#4A433B] mb-1">Period Start Date</label>
                <input
                  type="date"
                  value={newLogStartDate}
                  onChange={(e) => setNewLogStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A433B] mb-1">Period End Date (Optional)</label>
                <input
                  type="date"
                  value={newLogEndDate}
                  onChange={(e) => setNewLogEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#4A433B] mb-1">Notes / Physical Sensations (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Mild fatigue, gentle warm tea helped, restful sleep"
                  value={newLogNotes}
                  onChange={(e) => setNewLogNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D5CCBF] bg-[#FFFFFF] text-xs text-[#2C2825]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogPeriodModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-[#6C6358] hover:bg-[#EDE6D8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] font-medium hover:bg-[#433D37] transition"
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
