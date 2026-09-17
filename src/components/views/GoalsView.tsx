import React, { useState } from 'react';
import {
  Target,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Goal, Milestone, Realm, ActiveWorldFilter } from '../../types';
import { requestGoalBreakdown } from '../../lib/aiService';

interface GoalsViewProps {
  goals: Goal[];
  activeWorld: ActiveWorldFilter;
  onSaveGoal: (goal: Partial<Goal>) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  activeWorld,
  onSaveGoal,
  onToggleMilestone,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRealm, setFormRealm] = useState<Realm>('mariluna');
  const [formTimeframe, setFormTimeframe] = useState<Goal['timeframe']>('quarterly');
  const [formTargetDate, setFormTargetDate] = useState('2026-11-30');
  const [formMilestones, setFormMilestones] = useState<Milestone[]>([]);

  const handleAiBreakdown = async () => {
    if (!formTitle.trim()) return;
    setIsAiBreakingDown(true);

    try {
      const result = await requestGoalBreakdown(formTitle, formRealm, formTimeframe);
      if (result && result.milestones) {
        const generated: Milestone[] = result.milestones.map((m: any, idx: number) => ({
          id: 'm-gen-' + idx + '-' + Date.now(),
          title: m.title,
          completed: false,
          suggestedDay: m.suggestedDay || 'Upcoming',
          durationMins: m.durationMins || 45,
        }));
        setFormMilestones(generated);
      }
    } catch (err) {
      console.warn('AI breakdown error:', err);
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    onSaveGoal({
      id: 'g-' + Date.now(),
      title: formTitle,
      description: formDesc,
      realm: formRealm,
      timeframe: formTimeframe,
      progress: 0,
      targetDate: formTargetDate,
      connectedTaskIds: [],
      connectedProjectIds: [],
      milestones: formMilestones,
    });

    setIsModalOpen(false);
    setFormTitle('');
    setFormDesc('');
    setFormMilestones([]);
  };

  const filteredGoals = goals.filter((g) => {
    if (activeWorld !== 'all' && g.realm !== activeWorld) return false;
    if (selectedHorizon !== 'all' && g.timeframe !== selectedHorizon) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D5] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
            Aspirational Horizons
          </h1>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Milestone goals broken into unhurried, realistic execution sprints.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          id="new-goal-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Define Goal</span>
        </button>
      </div>

      {/* Horizon selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['all', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'].map((horizon) => (
          <button
            key={horizon}
            onClick={() => setSelectedHorizon(horizon)}
            className={`px-3 py-1.5 rounded-full capitalize transition cursor-pointer shrink-0 ${
              selectedHorizon === horizon
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
            }`}
          >
            {horizon}
          </button>
        ))}
      </div>

      {/* Goal Cards */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#DDD5C7] bg-[#FAF8F3] space-y-2">
          <p className="font-serif text-base text-[#2C2825]">Geen doelen gevonden</p>
          <p className="text-xs text-[#7A7167] font-light max-w-md mx-auto">
            Alchemy ondersteunt een rustige, weloverwogen focus. Voeg doelen toe wanneer je heldere intenties wilt vastleggen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const completedCount = goal.milestones.filter((m) => m.completed).length;
          const calculatedProgress =
            goal.milestones.length > 0
              ? Math.round((completedCount / goal.milestones.length) * 100)
              : goal.progress;

          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        goal.realm === 'mariluna'
                          ? 'bg-[#2C2825] text-[#F9F7F2]'
                          : 'bg-[#EAE4D7] text-[#554C42]'
                      }`}
                    >
                      {goal.realm}
                    </span>
                    <span className="text-[10px] text-[#8C8377] uppercase tracking-wider font-semibold">
                      {goal.timeframe} Horizon
                    </span>
                  </div>
                  <span className="text-xs text-[#8C8377]">
                    Target: {goal.targetDate}
                  </span>
                </div>

                <h3 className="font-serif text-xl font-medium text-[#2C2825] mt-2">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-xs text-[#6C6357] mt-1 font-light leading-relaxed">
                    {goal.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
                  <div className="flex items-center justify-between text-xs text-[#7A7167] mb-1.5">
                    <span>Momentum</span>
                    <span className="font-medium text-[#2C2825]">{calculatedProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#EFE9DE] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${calculatedProgress}%` }}
                      className="h-full bg-[#C5A880] rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Milestones / Micro-tasks */}
                {goal.milestones.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8C8377] block">
                      Realistic Micro-Actions ({completedCount}/{goal.milestones.length})
                    </span>
                    {goal.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[#FAF8F4] border border-[#ECE5DA] hover:border-[#DDD4C6] transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => onToggleMilestone(goal.id, milestone.id)}
                            className="mt-0.5 text-[#8C7654] hover:text-[#2C2825] transition cursor-pointer"
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#B5ABA0]" />
                            )}
                          </button>
                          <span
                            className={`text-xs ${
                              milestone.completed
                                ? 'line-through text-[#9E958B]'
                                : 'text-[#3E3832] font-medium'
                            }`}
                          >
                            {milestone.title}
                          </span>
                        </div>

                        {milestone.suggestedDay && (
                          <span className="text-[10px] text-[#8C8377] px-2 py-0.5 rounded-md bg-[#F2ECE1] shrink-0 font-sans">
                            {milestone.suggestedDay}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create Goal Modal with AI Breakdown */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-6 shadow-2xl my-8">
            <h2 className="font-serif text-xl font-medium text-[#2C2825] mb-4">
              Set Aspirational Goal
            </h2>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Read two formative books, Host autumn retreat"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Vision & Context
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Why does this matter? How will it feel once accomplished?"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    World
                  </label>
                  <select
                    value={formRealm}
                    onChange={(e) => setFormRealm(e.target.value as Realm)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="mariluna">Mariluna Business</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Timeframe Horizon
                  </label>
                  <select
                    value={formTimeframe}
                    onChange={(e) => setFormTimeframe(e.target.value as any)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                />
              </div>

              {/* AI Goal Breakdown Assistant */}
              <div className="p-4 rounded-xl border border-[#DFD6C7] bg-[#F7F2E8]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#8C7654]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      AI Micro-Action Planner
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiBreakdown}
                    disabled={!formTitle.trim() || isAiBreakingDown}
                    className="px-3 py-1 rounded-lg bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#433D37] disabled:opacity-40 transition cursor-pointer"
                  >
                    {isAiBreakingDown ? 'Deconstructing...' : 'Deconstruct Goal'}
                  </button>
                </div>
                <p className="text-[11px] text-[#7A7167] mt-1 font-light">
                  Let the assistant divide this aspiration into calm, doable micro-sessions.
                </p>

                {formMilestones.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {formMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="text-xs p-2 rounded-lg bg-[#FFFFFF] border border-[#E8E1D4] text-[#3E3832] flex justify-between"
                      >
                        <span>{m.title}</span>
                        <span className="text-[#8C8377] text-[10px]">{m.suggestedDay}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38]"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
