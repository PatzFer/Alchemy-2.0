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
import { Goal, Milestone, Realm, ActiveWorldFilter, GoalStatus } from '../../types';
import { requestGoalBreakdown } from '../../lib/aiService';
import { validateGoalInput } from '../../lib/goalValidation';

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
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<GoalStatus>('active');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRealm, setFormRealm] = useState<Realm>(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
  const [formTimeframe, setFormTimeframe] = useState<Goal['timeframe']>('quarterly');
  const [formTargetDate, setFormTargetDate] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [formMilestones, setFormMilestones] = useState<Milestone[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [milestoneInput, setMilestoneInput] = useState('');

  const openNewGoalModal = () => {
    setEditingGoalId(null);
    setFormStatus('active');
    setFormRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
    setFormTitle('');
    setFormDesc('');
    setFormTimeframe('quarterly');
    setFormTargetDate(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    setFormMilestones([]);
    setMilestoneInput('');
    setFormError(null);
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
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddMilestone = () => {
    const title = milestoneInput.trim();
    if (!title || formMilestones.length >= 50 || title.length > 160) return;
    setFormMilestones((current) => [
      ...current,
      { id: 'm-' + Date.now() + '-' + current.length, title, completed: false },
    ]);
    setMilestoneInput('');
    setFormError(null);
  };

  const handleAiBreakdown = async () => {
    if (!formTitle.trim()) return;
    setIsAiBreakingDown(true);

    try {
      const result = await requestGoalBreakdown(formTitle, formRealm, formTimeframe);
      if (result && Array.isArray(result.milestones)) {
        const generated: Milestone[] = result.milestones
          .filter((milestone: any) =>
            typeof milestone?.title === 'string' &&
            milestone.title.trim().length > 0 &&
            milestone.title.trim().length <= 160
          )
          .slice(0, 50)
          .map((milestone: any, index: number) => ({
            id: 'm-gen-' + Date.now() + '-' + index,
            title: milestone.title.trim(),
            completed: false,
            suggestedDay: typeof milestone.suggestedDay === 'string' ? milestone.suggestedDay.slice(0, 80) : 'Binnenkort',
            durationMins: Number.isFinite(milestone.durationMins)
              ? Math.max(5, Math.min(1440, Math.round(milestone.durationMins)))
              : 45,
          }));
        setFormMilestones((current) => [...current, ...generated].slice(0, 50));
      }
    } catch (err) {
      console.warn('AI breakdown error:', err);
    } finally {
      setIsAiBreakingDown(false);
    }
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateGoalInput({
      title: formTitle,
      description: formDesc,
      targetDate: formTargetDate,
      milestones: formMilestones,
    });
    if (validationError) {
      const messages: Record<typeof validationError, string> = {
        title_required: 'Geef je doel een naam.',
        title_too_long: 'De naam van je doel mag maximaal 160 tekens bevatten.',
        description_too_long: 'De omschrijving mag maximaal 5000 tekens bevatten.',
        invalid_target_date: 'Kies een geldige streefdatum.',
        too_many_milestones: 'Je kunt maximaal 50 tussenstappen toevoegen.',
        milestone_title_invalid: 'Elke tussenstap moet een naam hebben van maximaal 160 tekens.',
      };
      setFormError(messages[validationError]);
      return;
    }
    setFormError(null);

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
    setFormRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
    setFormTargetDate(() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
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
              {formError && (
                <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Naam van je doel
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
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
                  maxLength={5000}
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

              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4 space-y-2">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">Tussenstappen</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={160}
                    value={milestoneInput}
                    onChange={(e) => setMilestoneInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddMilestone(); } }}
                    placeholder="Voeg zelf een kleine stap toe..."
                    aria-label="Nieuwe tussenstap"
                    className="min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    disabled={!milestoneInput.trim() || formMilestones.length >= 50 || milestoneInput.trim().length > 160}
                    className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-primary)] disabled:opacity-40"
                  >
                    Toevoegen
                  </button>
                </div>
                {formMilestones.length > 0 && (
                  <div className="space-y-1">
                    {formMilestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--surface-1)] px-3 py-2 text-xs">
                        <span className="min-w-0 flex-1 text-[var(--text-primary)]">{milestone.title}</span>
                        <button
                          type="button"
                          onClick={() => setFormMilestones((current) => current.filter((item) => item.id !== milestone.id))}
                          aria-label={`Verwijder tussenstap ${milestone.title}`}
                          className="text-[var(--text-muted)] hover:text-rose-400"
                        >
                          Verwijderen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-[var(--text-muted)]">Je kunt maximaal 50 tussenstappen toevoegen, zelf of met Jarvis.</p>
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
