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
  Pencil,
} from 'lucide-react';
import { Goal, Milestone, Realm, ActiveWerkruimteFilter, GoalStatus } from '../../types';
import { requestGoalBreakdown } from '../../lib/aiService';

interface GoalsViewProps {
  goals: Goal[];
  activeWerkruimte: ActiveWerkruimteFilter;
  onSaveGoal: (goal: Partial<Goal>) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  activeWerkruimte,
  onSaveGoal,
  onToggleMilestone,
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiBreakingDown, setIsAiBreakingDown] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<GoalStatus>('active');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRealm, setFormRealm] = useState<Realm>(activeWerkruimte === 'mariluna' ? 'mariluna' : 'personal');
  const [formTimeframe, setFormTimeframe] = useState<Goal['timeframe']>('quarterly');
  const [formTargetDate, setFormTargetDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [formMilestones, setFormMilestones] = useState<Milestone[]>([]);

  const openNewGoalModal = () => {
    setEditingGoalId(null);
    setFormStatus('active');
    setFormRealm(activeWerkruimte === 'mariluna' ? 'mariluna' : 'personal');
    setFormTitle('');
    setFormDesc('');
    setFormTimeframe('quarterly');
    setFormTargetDate(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    setFormMilestones([]);
    setIsModalOpen(true);
  };

  const openEditGoalModal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setFormTitle(goal.title);
    setFormDesc(goal.description || '');
    setFormRealm(goal.realm);
    setFormTimeframe(goal.timeframe);
    setFormTargetDate(goal.targetDate || '');
    setFormMilestones(goal.milestones || []);
    setFormStatus(goal.status || 'active');
    setIsModalOpen(true);
  };

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

    const existingGoal = editingGoalId ? goals.find((goal) => goal.id === editingGoalId) : undefined;
    onSaveGoal({
      id: editingGoalId || 'g-' + Date.now(),
      title: formTitle,
      description: formDesc,
      realm: formRealm,
      timeframe: formTimeframe,
      status: formStatus,
      progress: editingGoalId ? (goals.find((goal) => goal.id === editingGoalId)?.progress ?? 0) : 0,
      targetDate: formTargetDate,
      startDate: existingGoal?.startDate,
      endDate: existingGoal?.endDate,
      priority: existingGoal?.priority,
      notes: existingGoal?.notes,
      measurableTarget: existingGoal?.measurableTarget,
      connectedTaskIds: existingGoal?.connectedTaskIds || [],
      connectedProjectIds: existingGoal?.connectedProjectIds || [],
      connectedContentIds: existingGoal?.connectedContentIds || [],
      milestones: formMilestones,
    });

    setIsModalOpen(false);
    setEditingGoalId(null);
    setFormStatus('active');
    setFormTitle('');
    setFormDesc('');
    setFormRealm(activeWerkruimte === 'mariluna' ? 'mariluna' : 'personal');
    setFormTargetDate(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    setFormMilestones([]);
  };

  const filteredGoals = goals.filter((g) => {
    if (activeWerkruimte !== 'all' && g.realm !== activeWerkruimte) return false;
    if (selectedHorizon !== 'all' && g.timeframe !== selectedHorizon) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
            Doelen & vooruitgang
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
            Maak je doelen haalbaar met kleine tussenstappen en zichtbare vooruitgang.
          </p>
        </div>

        <button
          onClick={openNewGoalModal}
          id="new-goal-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuw doel</span>
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
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {horizon}
          </button>
        ))}
      </div>

      {/* Goal Cards */}
      {filteredGoals.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] space-y-2">
          <p className="font-serif text-base text-[var(--text-primary)]">Geen doelen gevonden</p>
          <p className="text-xs text-[var(--text-secondary)] font-light max-w-md mx-auto">
            Alchemy ondersteunt een rustige, weloverwogen focus. Voeg doelen toe wanneer je heldere intenties wilt vastleggen.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const milestones = goal.milestones || [];
          const completedCount = milestones.filter((m) => m.completed).length;
          const calculatedProgress =
            milestones.length > 0
              ? Math.round((completedCount / milestones.length) * 100)
              : goal.progress;

          return (
            <div
              key={goal.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        goal.realm === 'mariluna'
                          ? 'bg-[var(--text-primary)] text-[var(--text-primary)]'
                          : 'bg-[#EAE4D7] text-[#554C42]'
                      }`}
                    >
                      {goal.realm}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                      {goal.timeframe} Horizon
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)]">
                      {goal.targetDate ? `Doel: ${goal.targetDate}` : 'Geen einddatum'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditGoalModal(goal)}
                      aria-label={`Bewerk doel ${goal.title}`}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-serif text-xl font-medium text-[var(--text-primary)] mt-2">
                  {goal.title}
                </h3>
                {goal.description && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-light leading-relaxed">
                    {goal.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
                  <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-1.5">
                    <span>Voortgang</span>
                    <span className="font-medium text-[var(--text-primary)]">{calculatedProgress}%</span>
                  </div>
                  {milestones.length === 0 && (
                    <div className="mb-3 flex items-center gap-3">
                      <label htmlFor={`goal-progress-${goal.id}`} className="text-[10px] text-[var(--text-muted)] shrink-0">
                        Voortgang aanpassen
                      </label>
                      <input
                        id={`goal-progress-${goal.id}`}
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={Math.max(0, Math.min(100, goal.progress || 0))}
                        onChange={(e) => onSaveGoal({ id: goal.id, progress: Number(e.target.value) })}
                        className="w-full accent-[var(--accent-secondary)]"
                        aria-label={`Voortgang van ${goal.title}`}
                      />
                    </div>
                  )}
                  <div className="h-2 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${calculatedProgress}%` }}
                      className="h-full bg-[#C5A880] rounded-full transition-all"
                    />
                  </div>
                </div>

                {/* Milestones / Micro-tasks */}
                {milestones.length > 0 && (
                  <div className="mt-5 space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--text-muted)] block">
                      Tussenstappen ({completedCount}/{milestones.length})
                    </span>
                    {milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] hover:border-[#DDD4C6] transition"
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            onClick={() => onToggleMilestone(goal.id, milestone.id)}
                            className="mt-0.5 text-[var(--accent-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                          >
                            {milestone.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[var(--accent-secondary)]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#B5ABA0]" />
                            )}
                          </button>
                          <span
                            className={`text-xs ${
                              milestone.completed
                                ? 'line-through text-[var(--text-muted)]'
                                : 'text-[var(--text-primary)] font-medium'
                            }`}
                          >
                            {milestone.title}
                          </span>
                        </div>

                        {milestone.suggestedDay && (
                          <span className="text-[10px] text-[var(--text-muted)] px-2 py-0.5 rounded-md bg-[var(--surface-2)] shrink-0 font-sans">
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
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface-1)] border border-[#E3DCD0] p-6 shadow-2xl my-8">
            <h2 className="font-serif text-xl font-medium text-[var(--text-primary)] mb-4">
              {editingGoalId ? 'Bewerk doel' : 'Nieuw doel'}
            </h2>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Naam van je doel
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Bijvoorbeeld: vaker bewegen, een ritme vinden dat bij mij past"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Waarom is dit belangrijk?
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Waarom is dit belangrijk voor jou?"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Werkruimte
                  </label>
                  <select
                    value={formRealm}
                    onChange={(e) => setFormRealm(e.target.value as Realm)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="mariluna">Mariluna</option>
                    <option value="personal">Privé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Periode
                  </label>
                  <select
                    value={formTimeframe}
                    onChange={(e) => setFormTimeframe(e.target.value as any)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
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
                <label className="block text-xs font-medium text-[#5A524A] mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as GoalStatus)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                >
                  <option value="active">Actief</option>
                  <option value="paused">Gepauzeerd</option>
                  <option value="completed">Afgerond</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Streefdatum
                </label>
                <input
                  type="date"
                  value={formTargetDate}
                  onChange={(e) => setFormTargetDate(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* AI Goal Breakdown Assistant */}
              <div className="p-4 rounded-xl border border-[#DFD6C7] bg-[var(--surface-2)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[var(--accent-secondary)]">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      AI Micro-Action Planner
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAiBreakdown}
                    disabled={!formTitle.trim() || isAiBreakingDown}
                    className="px-3 py-1 rounded-lg bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[#433D37] disabled:opacity-40 transition cursor-pointer"
                  >
                    {isAiBreakingDown ? 'Deconstructing...' : 'Deconstruct Goal'}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-light">
                  Let the assistant divide this aspiration into calm, doable micro-sessions.
                </p>

                {formMilestones.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {formMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="text-xs p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex justify-between"
                      >
                        <span>{m.title}</span>
                        <span className="text-[var(--text-muted)] text-[10px]">{m.suggestedDay}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--text-primary)] text-xs font-medium hover:bg-[#453E38]"
                >
                  {editingGoalId ? 'Wijzigingen bewaren' : 'Doel bewaren'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
