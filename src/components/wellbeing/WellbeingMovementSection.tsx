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
} from 'lucide-react';
import {
  WellbeingState,
  MovementSession,
  MovementExercise,
  EnergyLevel,
} from '../../types';
import { adaptMovementSession } from '../../lib/wellbeingData';

interface WellbeingMovementSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

export const WellbeingMovementSection: React.FC<WellbeingMovementSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
}) => {
  const [selectedTime, setSelectedTime] = useState<number>(25);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyLevel>('normal');
  const [isAdaptingModal, setIsAdaptingModal] = useState(false);
  const [adaptationReasonInput, setAdaptationReasonInput] = useState('');

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Intelligent Physical Flow
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Movement & Postural Alignment
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Movement structured around your real capacity, energy rhythms, and calendar buffer. Never punitive, always grounding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenAssistantWithPrompt('What movement should I do today based on my schedule and energy?')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Ask Alchemy for Workout</span>
          </button>
        </div>
      </div>

      {/* Non-Medical Guidance Disclaimer */}
      <div className="p-3.5 rounded-xl border border-[#E3D9C9] bg-[#FAF8F4] flex items-center gap-3 text-xs text-[#6A6054]">
        <Info className="w-4 h-4 text-[#8C8377] shrink-0" />
        <span className="font-light">
          <strong className="font-medium text-[#2C2825]">Lifestyle Movement Disclaimer:</strong> Recommendations are tailored for daily wellness and stress mitigation. They do not constitute physical therapy, medical diagnosis, or corrective prescription.
        </span>
      </div>

      {/* Today's Focus Card */}
      {todaySession && (
        <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#6E6353]">
                  Today's Session
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
                onClick={() => setIsAdaptingModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#DED6C7] text-xs text-[#4A433A] hover:bg-[#F7F4EE] transition cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adapt Session</span>
              </button>

              <button
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
                    <span>Completed</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Planned Exercises Checklist */}
          <div className="border-t border-[#F2ECE1] pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6A6054] mb-3">
              Flow Sequence ({todaySession.plannedDurationMins} minutes)
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

          {todaySession.notes && (
            <p className="text-xs text-[#7A7167] font-light italic">
              Context: {todaySession.notes}
            </p>
          )}
        </div>
      )}

      {/* Weekly Movement Plan Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium text-[#2C2825]">Weekly Movement Cadence</h3>
            <p className="text-[11px] text-[#7A7167] font-light">
              Focus Theme: <strong className="text-[#2C2825]">{wellbeing.currentWeeklyMovement.focusTheme}</strong> (Target: {wellbeing.currentWeeklyMovement.targetWeeklySessions} sessions)
            </p>
          </div>
          <button
            onClick={() => onOpenAssistantWithPrompt('Give me a realistic movement plan for this week, calibrated to my meeting load.')}
            className="text-xs text-[#7E694E] hover:underline flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" /> Re-plan Week with AI
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {wellbeing.currentWeeklyMovement.sessions.map((session, idx) => (
            <div
              key={session.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                session.completed
                  ? 'bg-[#FAF8F3] border-[#DED6C7]'
                  : idx === 0
                  ? 'bg-[#FFFFFF] border-[#2C2825] shadow-xs'
                  : 'bg-[#FFFFFF] border-[#E8E2D6]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8C8377]">
                    {session.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-[#6A6054] font-medium">
                    {session.plannedDurationMins}m
                  </span>
                </div>
                <h4 className="text-xs font-serif font-semibold text-[#2C2825] mt-1 line-clamp-2">
                  {session.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-[#F2ECE1] flex items-center justify-between text-[11px]">
                <span className="text-[#8C8377] capitalize">{session.intensity}</span>
                <button
                  onClick={() => handleToggleComplete(session.id)}
                  className={`text-xs px-2 py-0.5 rounded-lg font-medium cursor-pointer transition ${
                    session.completed
                      ? 'bg-[#EAE4D8] text-[#5C5245]'
                      : 'bg-[#FAF8F3] border border-[#DED6C7] text-[#2C2825] hover:bg-[#2C2825] hover:text-[#FAF8F3]'
                  }`}
                >
                  {session.completed ? 'Done' : 'Check Off'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Movement History Log */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-medium text-[#2C2825]">Completed Movement Logs</h3>
        <div className="divide-y divide-[#F2ECE1]">
          {wellbeing.movementHistory.map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EFE9DD] flex items-center justify-center text-[#7E694E] shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-medium text-[#2C2825]">{item.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-[#7A7167]">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.actualDurationMins || item.plannedDurationMins} mins</span>
                    {item.perceivedExertion && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{item.perceivedExertion.replace('_', ' ')}</span>
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
      </div>

      {/* Adapt Workout Modal */}
      {isAdaptingModal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Adapt Today's Session</h3>
              <button onClick={() => setIsAdaptingModal(false)} className="text-xs text-[#8C8377]">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Available Time Today</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 25, 35, 45].map((m) => (
                    <button
                      key={m}
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
                <label className="block text-[#6A6054] font-medium mb-1">Reported Energy Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'normal', 'high'] as EnergyLevel[]).map((e) => (
                    <button
                      key={e}
                      onClick={() => setSelectedEnergy(e)}
                      className={`py-2 rounded-xl text-xs font-medium border capitalize transition cursor-pointer ${
                        selectedEnergy === e
                          ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                          : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      {e} energy
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Circumstance / Note (Optional)</label>
                <input
                  type="text"
                  value={adaptationReasonInput}
                  onChange={(e) => setAdaptationReasonInput(e.target.value)}
                  placeholder="e.g. Tight shoulders, busy afternoon client call"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => setIsAdaptingModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApplyAdaptation(selectedTime, selectedEnergy)}
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Recalibrate Flow
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
