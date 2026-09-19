import React, { useState } from 'react';
import {
  Activity,
  Clock,
  CheckCircle2,
  Sparkles,
  Sliders,
  ChevronRight,
  Flame,
  RotateCcw,
  Zap,
  Info,
  Calendar,
  Check,
  Plus,
  Compass,
  X,
} from 'lucide-react';
import {
  WellbeingState,
  MovementSession,
  MovementExercise,
  EnergyLevel,
  DailyCheckIn,
  CycleProfile,
  MovementActivityType,
} from '../../types';
import { adaptMovementSession } from '../../lib/wellbeingData';
import { HomeWorkoutGenerator } from '../health/HomeWorkoutGenerator';

interface WellbeingMovementSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  todayCheckIn?: DailyCheckIn;
  cycleProfile?: CycleProfile;
}

export const WellbeingMovementSection: React.FC<WellbeingMovementSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
  todayCheckIn,
  cycleProfile,
}) => {
  const [selectedTime, setSelectedTime] = useState<number>(25);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('normal');
  const [isAdaptingModal, setIsAdaptingModal] = useState(false);
  const [adaptationReasonInput, setAdaptationReasonInput] = useState('');

  // Quick manual log modal
  const [isManualLogModalOpen, setIsManualLogModalOpen] = useState(false);
  const [manualActivityType, setManualActivityType] = useState<MovementActivityType>('walking');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState('30');
  const [manualNotes, setManualNotes] = useState('');

  // Find today's session or the primary pending session in the weekly movement plan
  const todaySession = wellbeing.currentWeeklyMovement.sessions[0] || null;

  const handleToggleComplete = (sessionId: string) => {
    onUpdateWellbeing((prev) => {
      const updatedSessions = prev.currentWeeklyMovement.sessions.map((s) => {
        if (s.id === sessionId) {
          const nextState = !s.completed;
          return { ...s, completed: nextState };
        }
        return s;
      });

      // If completing, also add to history if not present
      const target = updatedSessions.find((s) => s.id === sessionId);
      let updatedHistory = prev.movementHistory;
      if (target && target.completed && !prev.movementHistory.some((h) => h.id === `h-${target.id}`)) {
        updatedHistory = [
          {
            ...target,
            id: `h-${target.id}`,
            activityType: target.activityType || 'home_workout',
            actualDurationMins: target.plannedDurationMins,
            perceivedExertion: 'pleasantly_challenged',
          },
          ...prev.movementHistory,
        ];
      }

      return {
        ...prev,
        currentWeeklyMovement: {
          ...prev.currentWeeklyMovement,
          sessions: updatedSessions,
        },
        movementHistory: updatedHistory,
      };
    });
  };

  const handleApplyAdaptation = (minutes: number, energy: EnergyLevel) => {
    if (!todaySession) return;
    const adapted = adaptMovementSession(todaySession, minutes, energy);
    if (adaptationReasonInput.trim()) {
      adapted.adaptationReason = adaptationReasonInput.trim();
    }

    onUpdateWellbeing((prev) => ({
      ...prev,
      currentWeeklyMovement: {
        ...prev.currentWeeklyMovement,
        sessions: prev.currentWeeklyMovement.sessions.map((s, idx) => (idx === 0 ? adapted : s)),
      },
    }));

    setIsAdaptingModal(false);
    setAdaptationReasonInput('');
  };

  const handleLogFromGenerator = (sessionData: Partial<MovementSession>) => {
    const newSession: MovementSession = {
      id: sessionData.id || `ms-${Date.now()}`,
      date: sessionData.date || new Date().toISOString().split('T')[0],
      title: sessionData.title || 'Home Workout',
      type: sessionData.type || 'pilates',
      activityType: sessionData.activityType || 'home_workout',
      plannedDurationMins: sessionData.plannedDurationMins || 20,
      actualDurationMins: sessionData.actualDurationMins || 20,
      intensity: sessionData.intensity || 'moderate',
      exercises: sessionData.exercises || [],
      equipment: sessionData.equipment || [],
      completed: true,
      perceivedExertion: sessionData.perceivedExertion || 'pleasantly_challenged',
      notes: sessionData.notes,
    };

    onUpdateWellbeing((prev) => ({
      ...prev,
      movementHistory: [newSession, ...prev.movementHistory],
    }));
  };

  const handleSaveManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    const durationNum = parseInt(manualDuration, 10) || 20;
    const defaultTitles: Record<string, string> = {
      home_workout: 'Thuis Workout & Core',
      walking: 'Rustige Buitenwandeling',
      swimming: 'Baantjes Zwemmen',
      paddling: 'Kano / Suppen',
      yoga: 'Yogaflow & Ademhaling',
      other: 'Vrije Beweging',
    };

    const typeMap: Record<string, MovementSession['type']> = {
      home_workout: 'pilates',
      walking: 'walking',
      swimming: 'cardio',
      paddling: 'cardio',
      yoga: 'yoga_stretch',
      other: 'walking',
    };

    const newSession: MovementSession = {
      id: `ms-manual-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      title: manualTitle.trim() || defaultTitles[manualActivityType] || 'Beweging',
      type: typeMap[manualActivityType] || 'walking',
      activityType: manualActivityType,
      plannedDurationMins: durationNum,
      actualDurationMins: durationNum,
      intensity: 'moderate',
      exercises: [],
      completed: true,
      perceivedExertion: 'pleasantly_challenged',
      notes: manualNotes.trim() || undefined,
    };

    onUpdateWellbeing((prev) => ({
      ...prev,
      movementHistory: [newSession, ...prev.movementHistory],
    }));

    setManualTitle('');
    setManualNotes('');
    setIsManualLogModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7654] font-serif font-medium">
            Intelligente Lichaamsflow
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Beweging & Thuis Workouts
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Beweging afgestemd op je werkelijke belastbaarheid, energie en cyclusritme. Nooit straffend, altijd opbouwend en grondend.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsManualLogModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs font-medium text-[#4A433A] hover:border-[#8C7654] transition cursor-pointer min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>+ Activiteit Loggen</span>
          </button>

          <button
            type="button"
            onClick={() =>
              onOpenAssistantWithPrompt(
                'Welke beweging past vandaag het beste bij mijn cyclusfase en huidige energieniveau?'
              )
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Vraag Alchemy om Advies</span>
          </button>
        </div>
      </div>

      {/* Non-Medical Guidance Disclaimer */}
      <div className="p-3.5 rounded-xl border border-[#E3D9C9] bg-[#FAF8F4] flex items-center gap-3 text-xs text-[#6A6054]">
        <Info className="w-4 h-4 text-[#8C8377] shrink-0" />
        <span className="font-light">
          <strong className="font-medium text-[#2C2825]">Leefstijl & Welzijn:</strong> Beweegsuggesties zijn bedoeld voor vitaliteit, ontspanning en houding. Ze vervangen geen fysiotherapeutische of medische begeleiding.
        </span>
      </div>

      {/* "Wat kan ik vandaag thuis doen?" Home Workout Generator */}
      <HomeWorkoutGenerator
        todayCheckIn={todayCheckIn}
        cycleProfile={cycleProfile}
        onLogCompletedWorkout={handleLogFromGenerator}
        lang="nl"
      />

      {/* Planned Weekly Movement Session */}
      {todaySession && (
        <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#6E6353]">
                  Geplande Weekflow
                </span>
                <span className="text-xs text-[#8C8377]">
                  {todaySession.type.replace('_', ' ').toUpperCase()} • {todaySession.intensity.toUpperCase()}
                </span>
              </div>
              <h3 className="text-xl font-serif text-[#2C2825] mt-1.5">{todaySession.title}</h3>
              {todaySession.adaptationReason && (
                <div className="mt-2 text-xs text-[#7E694E] bg-[#F7F4EE] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 border border-[#E8E2D6]">
                  <RotateCcw className="w-3 h-3" />
                  <span>{todaySession.adaptationReason}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAdaptingModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#DED6C7] text-xs text-[#4A433A] hover:bg-[#F7F4EE] transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Sessie Aanpassen</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleComplete(todaySession.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  todaySession.completed
                    ? 'bg-[#EAE4D8] text-[#554C40]'
                    : 'bg-[#2C2825] text-[#FAF8F3] hover:bg-[#1A1816]'
                }`}
              >
                {todaySession.completed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#7E694E]" />
                    <span>Voltooid</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Markeer Voltooid</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Planned Exercises Checklist */}
          {todaySession.exercises.length > 0 && (
            <div className="border-t border-[#F2ECE1] pt-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A6054] mb-3">
                Oefeningenreeks ({todaySession.plannedDurationMins} minuten)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {todaySession.exercises.map((ex, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EFE8DC] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EAE3D5] text-[#5C5245] flex items-center justify-center text-[10px] font-medium">
                        {i + 1}
                      </span>
                      <span className="font-medium text-[#2C2825]">{ex.name}</span>
                    </div>
                    <span className="text-[11px] text-[#7A7167]">
                      {ex.durationMins ? `${ex.durationMins}m` : `${ex.sets} sets × ${ex.reps}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {todaySession.notes && (
            <p className="text-xs text-[#7A7167] font-light italic">
              Context: {todaySession.notes}
            </p>
          )}
        </div>
      )}

      {/* Movement History Log */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium font-serif">
                Historie & Consistentie
              </span>
              <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
              <span className="text-[10px] text-[#7A7167]">Geregistreerde Sessies</span>
            </div>
            <h3 className="text-lg font-serif text-[#2C2825] mt-0.5">
              Bewegingslogboek
            </h3>
          </div>

          <span className="text-xs text-[#7A7167] bg-[#FAF8F3] px-3 py-1 rounded-full border border-[#ECE5D8]">
            {wellbeing.movementHistory.length} sessies
          </span>
        </div>

        {/* Empty state: Nog geen beweging geregistreerd. */}
        {wellbeing.movementHistory.length === 0 ? (
          <div className="py-12 text-center space-y-2 border border-dashed border-[#E8E2D6] rounded-2xl bg-[#FAF8F4]">
            <Activity className="w-6 h-6 text-[#A89E92] mx-auto" />
            <div className="text-sm font-serif text-[#2C2825]">Nog geen beweging geregistreerd.</div>
            <p className="text-xs text-[#7A7167] max-w-sm mx-auto font-light">
              Gebruik de knop &apos;Wat kan ik vandaag thuis doen?&apos; of voeg handmatig een wandeling of sessie toe.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {wellbeing.movementHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-[#ECE5D8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EAE3D5] text-[#5C5245] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[#2C2825]">{item.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5DDCF] text-[#4A433A] font-medium">
                        {item.activityType || 'Home workout'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#7A7167]">
                      <span>{item.date}</span>
                      <span>•</span>
                      <span>{item.actualDurationMins || item.plannedDurationMins} min</span>
                      {item.intensity && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{item.intensity}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-[#8C8377] italic max-w-sm">{item.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Activity Log Modal */}
      {isManualLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Beweging Loggen</h3>
              <button
                type="button"
                onClick={() => setIsManualLogModalOpen(false)}
                className="w-7 h-7 rounded-full border border-[#DCD3C4] bg-[#FFFFFF] flex items-center justify-center text-[#7A7167]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveManualLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1.5">Type Activiteit</label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'home_workout',
                      'walking',
                      'swimming',
                      'paddling',
                      'yoga',
                      'other',
                    ] as MovementActivityType[]
                  ).map((act) => {
                    const labels: Record<string, string> = {
                      home_workout: 'Home Workout',
                      walking: 'Wandelen',
                      swimming: 'Zwemmen',
                      paddling: 'Kano / Suppen',
                      yoga: 'Yoga',
                      other: 'Overig',
                    };
                    return (
                      <button
                        key={act}
                        type="button"
                        onClick={() => setManualActivityType(act)}
                        className={`py-2 px-2 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                          manualActivityType === act
                            ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                            : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                        }`}
                      >
                        {labels[act]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Titel (Optioneel)</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="bv. Avondwandeling langs het bos"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Duur (minuten)</label>
                <input
                  type="number"
                  value={manualDuration}
                  onChange={(e) => setManualDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Notitie</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="bv. Frisse lucht, rustig ademen"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsManualLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adapt Workout Modal */}
      {isAdaptingModal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Sessie Aanpassen</h3>
              <button
                type="button"
                onClick={() => setIsAdaptingModal(false)}
                className="text-xs text-[#8C8377]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Beschikbare Tijd Vandaag</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 35, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedTime(m)}
                      className={`py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        selectedTime === m
                          ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                          : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Gevoelsenergie</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'high'] as EnergyLevel[]).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setSelectedEnergy(e)}
                      className={`py-2 rounded-xl text-xs font-medium border capitalize transition cursor-pointer ${
                        selectedEnergy === e
                          ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                          : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Notitie / Omstandigheid</label>
                <input
                  type="text"
                  value={adaptationReasonInput}
                  onChange={(e) => setAdaptationReasonInput(e.target.value)}
                  placeholder="bv. Gevoelige onderrug, vermoeide schouders"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdaptingModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyAdaptation(selectedTime, selectedEnergy)}
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Flow Aanpassen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
