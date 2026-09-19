import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Dumbbell,
  Heart,
  CheckCircle2,
  Check,
  RotateCcw,
  ShieldAlert,
  Sliders,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  DailyCheckIn,
  CycleProfile,
  MovementSession,
  MovementActivityType,
} from '../../types';
import {
  generateHomeWorkoutSuggestion,
  AVAILABLE_HOME_EQUIPMENT,
  WorkoutDuration,
} from '../../lib/healthUtils';
import { calculateCycleStatus } from '../../lib/cycleUtils';

interface HomeWorkoutGeneratorProps {
  todayCheckIn?: DailyCheckIn;
  cycleProfile?: CycleProfile;
  onLogCompletedWorkout: (session: Partial<MovementSession>) => void;
  lang?: 'nl' | 'en';
}

export const HomeWorkoutGenerator: React.FC<HomeWorkoutGeneratorProps> = ({
  todayCheckIn,
  cycleProfile,
  onLogCompletedWorkout,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];

  const cycleStatus = cycleProfile
    ? calculateCycleStatus(cycleProfile, todayStr)
    : undefined;

  // Selected parameters
  const [duration, setDuration] = useState<WorkoutDuration>(15);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([
    'bodyweight',
    'pilates_ring',
  ]);
  const [manualEnergyOverride, setManualEnergyOverride] = useState<
    'good' | 'lower' | 'sick' | 'heavy' | undefined
  >(undefined);

  // Active workout state
  const [currentWorkout, setCurrentWorkout] = useState<ReturnType<
    typeof generateHomeWorkoutSuggestion
  > | null>(null);

  // Completed exercise indices
  const [completedExercises, setCompletedExercises] = useState<number[]>([]);
  const [isLoggedSuccess, setIsLoggedSuccess] = useState(false);

  const effectiveEnergy =
    manualEnergyOverride ||
    (todayCheckIn?.feeling === 'sick'
      ? 'sick'
      : todayCheckIn?.feeling === 'lower' ||
        todayCheckIn?.energy === 'low' ||
        todayCheckIn?.energy === 'very_low'
      ? 'lower'
      : todayCheckIn?.feeling === 'mentally_heavy'
      ? 'heavy'
      : 'good');

  const handleToggleEquipment = (eqId: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const handleGenerateWorkout = () => {
    // Map selected equipment IDs to names matching healthUtils
    const equipNames = selectedEquipment.map((id) => {
      if (id === 'pilates_ring') return 'Pilates ring';
      if (id === 'resistance_bands') return 'Resistance bands';
      if (id === 'light_dumbbells') return 'Dumbbells (1-3 kg)';
      return 'Bodyweight / Mat';
    });

    const mockCheckIn: DailyCheckIn | undefined = manualEnergyOverride
      ? {
          id: `ci-override-${Date.now()}`,
          date: todayStr,
          energy:
            manualEnergyOverride === 'good'
              ? 'good'
              : manualEnergyOverride === 'lower'
              ? 'low'
              : 'very_low',
          feeling:
            manualEnergyOverride === 'sick'
              ? 'sick'
              : manualEnergyOverride === 'heavy'
              ? 'mentally_heavy'
              : manualEnergyOverride === 'lower'
              ? 'lower'
              : 'good',
          timestamp: new Date().toISOString(),
        }
      : todayCheckIn;

    const workout = generateHomeWorkoutSuggestion({
      durationMinutes: duration,
      selectedEquipment: equipNames,
      energyCheckIn: mockCheckIn,
      cycleProfile,
    });
    setCurrentWorkout(workout);
    setCompletedExercises([]);
    setIsLoggedSuccess(false);
  };

  const handleToggleExercise = (idx: number) => {
    setCompletedExercises((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleMarkWorkoutFinished = () => {
    if (!currentWorkout) return;

    onLogCompletedWorkout({
      id: `hw-${Date.now()}`,
      date: todayStr,
      title: currentWorkout.title,
      type: 'pilates',
      activityType: 'home_workout',
      plannedDurationMins: currentWorkout.durationMinutes,
      actualDurationMins: currentWorkout.durationMinutes,
      completed: true,
      perceivedExertion: 'pleasantly_challenged',
      exercises: currentWorkout.exercises.map((e) => ({
        name: e.name,
        sets: 3,
        reps: e.setsRepsOrDuration,
        notes: e.description,
      })),
      equipment: currentWorkout.equipmentNeeded,
      notes: currentWorkout.contextualNote,
    });

    setIsLoggedSuccess(true);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0EBE1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium font-serif">
              {isNl ? 'Thuisbeweging op Maat' : 'Home Movement'}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
            <span className="text-[10px] text-[#7A7167]">
              {isNl ? 'Gevoelig voor Energie & Cyclus' : 'Energy & Cycle Aware'}
            </span>
          </div>
          <h3 className="text-xl font-serif text-[#2C2825] mt-1">
            {isNl ? 'Wat kan ik vandaag thuis doen?' : 'What can I do at home today?'}
          </h3>
        </div>

        {/* Quick Trigger Button (Mobile First) */}
        <button
          type="button"
          onClick={handleGenerateWorkout}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs min-h-[44px]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{isNl ? 'Genereer Thuisflow' : 'Generate Home Flow'}</span>
        </button>
      </div>

      {/* Contextual Context Banner: Check-in + Cycle */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8] text-xs">
        <div className="flex items-center gap-2 text-[#6A6054]">
          <span className="w-2 h-2 rounded-full bg-[#8C7654]" />
          {todayCheckIn ? (
            <span className="text-[#3E3832]">
              {isNl ? 'Check-in vandaag:' : 'Today check-in:'}{' '}
              <strong>{todayCheckIn.energy} energie</strong>
              {todayCheckIn.feeling && <span> • {todayCheckIn.feeling}</span>}
            </span>
          ) : (
            <span className="text-[#8C8377] italic">
              {isNl ? 'Nog geen check-in vanmorgen (neutraal)' : 'No morning check-in yet'}
            </span>
          )}

          {cycleStatus && (
            <span className="text-[11px] text-[#7A7167] bg-[#F7F4EE] px-2.5 py-0.5 rounded-full border border-[#E8E2D6]">
              {cycleStatus.activePhase} {isNl ? 'fase' : 'phase'} ({isNl ? 'dag' : 'day'}{' '}
              {cycleStatus.cycleDay})
            </span>
          )}
        </div>

        {/* Manual Energy sensitivity selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[#8C8377]">
            {isNl ? 'Voel je je anders?' : 'Override:'}
          </span>
          {(['good', 'lower', 'sick', 'heavy'] as const).map((lvl) => {
            const labels = {
              good: '🙂 Goed',
              lower: '😐 Lager',
              sick: '🤒 Ziek',
              heavy: '😔 Zwaar',
            };
            const isSelected = effectiveEnergy === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setManualEnergyOverride(lvl)}
                className={`text-[10px] px-2 py-1 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825] font-medium'
                    : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                }`}
              >
                {labels[lvl]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parameter Controls: Duration & Equipment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Duration selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6A6054]">
            {isNl ? 'Beschikbare Tijd' : 'Available Duration'}
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {([5, 10, 15, 20, 30] as WorkoutDuration[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(m)}
                className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                  duration === m
                    ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                }`}
              >
                <span>{m}</span>
                <span className="text-[9px] opacity-80">min</span>
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#6A6054]">
            {isNl ? 'Beschikbare Hulpmiddelen' : 'Available Equipment'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_HOME_EQUIPMENT.map((eq) => {
              const isChecked = selectedEquipment.includes(eq.id);
              return (
                <button
                  key={eq.id}
                  type="button"
                  onClick={() => handleToggleEquipment(eq.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition cursor-pointer min-h-[44px] ${
                    isChecked
                      ? 'bg-[#FAF6EE] text-[#2C2825] border-[#8C7654]'
                      : 'bg-[#FFFFFF] text-[#7A7167] border-[#DED6C7] hover:bg-[#FAF8F4]'
                  }`}
                >
                  <span className="truncate">{isNl ? eq.nameNl : eq.name}</span>
                  <span
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-1.5 ${
                      isChecked
                        ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F3]'
                        : 'border-[#C8C0B2]'
                    }`}
                  >
                    {isChecked && <Check className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Output Workout Display */}
      {currentWorkout && (
        <div className="pt-4 border-t border-[#F0EBE1] space-y-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-[#FAF8F4] border border-[#E8E1D3] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    currentWorkout.isRestRecommended
                      ? 'bg-[#FEE2E2] text-[#991B1B]'
                      : 'bg-[#EAE4D8] text-[#554C40]'
                  }`}
                >
                  {currentWorkout.intensity}
                </span>
                <span className="text-xs text-[#7A7167]">
                  {currentWorkout.durationMinutes} min • {currentWorkout.equipmentNeeded.join(', ')}
                </span>
              </div>

              {/* Progress counter */}
              {!currentWorkout.isRestRecommended && (
                <span className="text-xs text-[#8C7654] font-medium">
                  {completedExercises.length} / {currentWorkout.exercises.length}{' '}
                  {isNl ? 'oefeningen afgerond' : 'exercises completed'}
                </span>
              )}
            </div>

            <h4 className="text-lg font-serif text-[#2C2825]">{currentWorkout.title}</h4>
            <p className="text-xs text-[#6A6054] font-light leading-relaxed">
              {currentWorkout.contextualNote}
            </p>
          </div>

          {/* Exercise List */}
          <div className="space-y-2.5">
            {currentWorkout.exercises.map((ex, idx) => {
              const isChecked = completedExercises.includes(idx);
              return (
                <div
                  key={ex.id}
                  onClick={() => handleToggleExercise(idx)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                    isChecked
                      ? 'bg-[#F4F1EA] border-[#D6CDBC] text-[#7A7167]'
                      : 'bg-[#FFFFFF] border-[#E8E2D6] hover:border-[#8C7654]'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition ${
                      isChecked
                        ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F3]'
                        : 'border-[#C8C0B2] bg-[#FAF8F3]'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h5
                        className={`text-xs font-medium ${
                          isChecked ? 'line-through text-[#8C8377]' : 'text-[#2C2825]'
                        }`}
                      >
                        {ex.name}
                      </h5>
                      <span className="text-[11px] font-mono text-[#8C7654] shrink-0">
                        {ex.setsRepsOrDuration}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7A7167] font-light mt-0.5 leading-relaxed">
                      {ex.description}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#8C8377]">
                      <span className="bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#ECE5D8]">
                        {ex.equipment}
                      </span>
                      <span>•</span>
                      <span>{ex.targetMuscle}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Log Workout Button (Mobile First) */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-[#7A7167] font-light">
              {isNl
                ? 'Sla deze sessie op in je bewegingslogboek om je continuïteit bij te houden.'
                : 'Save this session to movement history to reflect your consistency.'}
            </span>

            <button
              type="button"
              disabled={isLoggedSuccess}
              onClick={handleMarkWorkoutFinished}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer min-h-[44px] ${
                isLoggedSuccess
                  ? 'bg-[#EAE4D8] text-[#554C40] cursor-default'
                  : 'bg-[#2C2825] text-[#FAF8F3] hover:bg-[#1A1816] shadow-xs'
              }`}
            >
              {isLoggedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-[#7E694E]" />
                  <span>{isNl ? '✓ Opgeslagen in Historie' : '✓ Saved to History'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#C5A880]" />
                  <span>{isNl ? '✓ Workout voltooid' : '✓ Workout completed'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
