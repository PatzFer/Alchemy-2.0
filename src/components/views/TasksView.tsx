import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Task, Realm, ActiveWorldFilter, Goal, Project } from '../../types';
import { filterTaskList } from '../../lib/taskListFilters';
import { validateTaskInput } from '../../lib/taskValidation';
import { isValidCalendarDate } from '../../lib/calendarDate';

const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TasksViewProps {
  tasks: Task[];
  goals: Goal[];
  projects: Project[];
  activeWorld: ActiveWorldFilter;
  onToggleTask: (taskId: string) => void;
  onSaveTask: (task: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  goals,
  projects,
  activeWorld,
  onToggleTask,
  onSaveTask,
  onDeleteTask,
}) => {
  const [filterStatus, setFilterStatus] = useState<'active' | 'completed' | 'all'>('active');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRealm, setFormRealm] = useState<Realm>('personal');
  const [formProjectId, setFormProjectId] = useState('');
  const [formGoalId, setFormGoalId] = useState('');
  const [formCategory, setFormCategory] = useState('self-care');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formDueDate, setFormDueDate] = useState(getLocalDateString());
  const [formRecurring, setFormRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const [subtaskGenerationError, setSubtaskGenerationError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
    setFormProjectId('');
    setFormGoalId('');
    setFormCategory(activeWorld === 'mariluna' ? 'content' : 'self-care');
    setFormPriority('medium');
    setFormDuration(30);
    setFormDueDate(getLocalDateString());
    setFormRecurring('none');
    setFormSubtasks([]);
    setSubtaskGenerationError(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormRealm(task.realm);
    setFormProjectId(task.projectId || '');
    setFormGoalId(task.goalId || '');
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormDuration(task.estimatedDuration);
    setFormDueDate(task.dueDate);
    setFormRecurring(task.recurring);
    setFormSubtasks(task.subtasks || []);
    setSubtaskGenerationError(null);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTaskInput({
      title: formTitle,
      description: formDesc,
      dueDate: formDueDate,
      estimatedDuration: Number(formDuration),
      subtasks: formSubtasks,
    });
    if (validationError) {
      const messages: Record<typeof validationError, string> = {
        title_required: 'Geef je taak een titel.',
        title_too_long: 'De titel mag maximaal 160 tekens bevatten.',
        description_too_long: 'De omschrijving mag maximaal 5000 tekens bevatten.',
        invalid_due_date: 'Kies een geldige deadline.',
        invalid_duration: 'De geschatte duur moet tussen 5 minuten en 24 uur liggen.',
        too_many_subtasks: 'Je kunt maximaal 30 subtaken toevoegen.',
        subtask_title_invalid: 'Elke subtaak moet een naam hebben van maximaal 160 tekens.',
      };
      setFormError(messages[validationError]);
      return;
    }
    setFormError(null);

    const taskPayload: Partial<Task> = {
      id: editingTask ? editingTask.id : 't-' + Date.now(),
      title: formTitle,
      description: formDesc,
      realm: formRealm,
      category: formCategory,
      projectId: formProjectId || undefined,
      goalId: formGoalId || undefined,
      priority: formPriority,
      estimatedDuration: Math.max(5, Math.min(1440, Math.round(Number(formDuration) || 30))),
      dueDate: formDueDate,
      recurring: formRecurring,
      subtasks: formSubtasks,
      status: editingTask ? editingTask.status : 'todo',
      createdAt: editingTask ? editingTask.createdAt : getLocalDateString(),
    };

    onSaveTask(taskPayload);
    setIsModalOpen(false);
  };

  const handleAddSubtask = () => {
    const title = subtaskInput.trim();
    if (!title || title.length > 160 || formSubtasks.length >= 30) return;
    setFormSubtasks((current) => [
      ...current,
      { id: 'st-' + Date.now(), title, completed: false },
    ]);
    setSubtaskInput('');
    setFormError(null);
  };

  // AI Subtask Generator
  const handleAISubtaskGeneration = async () => {
    if (!formTitle.trim()) return;
    setIsGeneratingSubtasks(true);
    setSubtaskGenerationError(null);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Given this task: "${formTitle}", provide 3 small, logical, unhurried subtasks. Return only a simple bulleted list with no commentary.`,
            },
          ],
        }),
      });

      {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Jarvis kon geen subtaken maken.');
        const responseText = typeof data.content === 'string' ? data.content : '';
        const lines = responseText
          .split('\n')
          .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter((l: string) => l.length > 0 && l.length <= 160)
          .slice(0, Math.max(0, 30 - formSubtasks.length));
        const newSubtasks = lines.map((title: string) => ({
          id: 'st-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9),
          title,
          completed: false,
        }));

        if (newSubtasks.length === 0) {
          throw new Error('Jarvis gaf geen bruikbare subtaken terug. Probeer het opnieuw of voeg ze zelf toe.');
        }
        setFormSubtasks((current) => [...current, ...newSubtasks].slice(0, 30));
      }
    } catch (err) {
      console.warn('Jarvis subtask generation failed:', err);
      setSubtaskGenerationError(err instanceof Error ? err.message : 'Jarvis kon geen subtaken maken. Probeer het opnieuw of voeg ze zelf toe.');
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  // Keep counts scoped to the active workspace; search only changes the visible result set.
  const scopedTasks = tasks.filter((task) => activeWorld === 'all' || task.realm === activeWorld);
  const filteredTasks = filterTaskList(tasks, {
    activeWorld,
    status: filterStatus,
    priority: filterPriority as 'all' | Task['priority'],
    query: searchQuery,
    projects,
    goals,
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">Focus & Taken</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
            Bewuste afspraken voor je privéleven en Mariluna.
          </p>
        </div>

        <button
          onClick={openNewTaskModal}
          id="new-task-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-primary)] text-[#171916] text-xs font-medium hover:bg-[var(--surface-raised)] transition shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>Nieuwe taak</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] p-0.5">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Actief ({scopedTasks.filter((t) => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Afgerond ({scopedTasks.filter((t) => t.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs font-medium'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Alles
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-[11px]">Prioriteit:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-hidden"
          >
            <option value="all">Alle prioriteiten</option>
            <option value="high">Hoge prioriteit</option>
            <option value="medium">Gemiddeld</option>
            <option value="low">Laag</option>
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek in taken, notities en subtaken..."
          aria-label="Zoek in taken"
          className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-secondary)]"
        />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)]">
            <p className="text-xs text-[var(--text-secondary)]">Geen taken gevonden voor deze filters.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            const isOverdue = !isCompleted && isValidCalendarDate(task.dueDate) && task.dueDate < getLocalDateString();
            const formattedDueDate = isValidCalendarDate(task.dueDate)
              ? new Date(Number(task.dueDate.slice(0, 4)), Number(task.dueDate.slice(5, 7)) - 1, Number(task.dueDate.slice(8, 10))).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Geen geldige datum';
            const linkedProject = projects.find((project) => project.id === task.projectId);
            const linkedGoal = goals.find((goal) => goal.id === task.goalId);
            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-[var(--surface-2)]/50 border-[var(--border-subtle)] opacity-60'
                    : 'bg-[var(--surface-raised)] border-[var(--border-subtle)] hover:border-[var(--text-muted)] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-[var(--accent-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--accent-secondary)]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--text-primary)]" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm sm:text-base font-medium ${
                            isCompleted ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.realm === 'mariluna'
                              ? 'bg-[#263D35] text-[#F0EBDD]'
                              : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
                          }`}
                        >
                          {task.realm === 'mariluna' ? 'Mariluna' : 'Personal'}
                        </span>

                        <span className="text-[10px] text-[var(--text-muted)] capitalize">
                          {task.category}
                        </span>

                        {task.priority === 'high' && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--accent-secondary)] bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                            High
                          </span>
                        )}

                        {linkedProject && (
                          <span className="text-[10px] rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[var(--text-secondary)]">
                            Project: {linkedProject.title}
                          </span>
                        )}
                        {linkedGoal && (
                          <span className="text-[10px] rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[var(--text-secondary)]">
                            Doel: {linkedGoal.title}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-light leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks listing */}
                      {(task.subtasks || []).length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5">
                          {(task.subtasks || []).map((st) => (
                            <label
                              key={st.id}
                              className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={!!st.completed}
                                onChange={() => onSaveTask({
                                  id: task.id,
                                  subtasks: (task.subtasks || []).map((item) =>
                                    item.id === st.id ? { ...item, completed: !item.completed } : item
                                  ),
                                })}
                                aria-label={`Subtaak ${st.title} afgerond`}
                                className="accent-[var(--accent-secondary)]"
                              />
                              <span className={st.completed ? 'line-through text-[var(--text-muted)]' : ''}>
                                {st.title}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-[11px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          {task.estimatedDuration} min
                        </span>
                        <span className={`flex items-center gap-1 ${isOverdue ? 'font-semibold text-amber-600 dark:text-amber-300' : ''}`}>
                          <Calendar className="w-3 h-3" />
                          {isOverdue ? 'Achterstallig · ' : 'Deadline · '}{formattedDueDate}
                        </span>
                        {task.recurring !== 'none' && (
                          <span className="flex items-center gap-1 capitalize">
                            <RefreshCw className="w-3 h-3 text-[var(--text-muted)]" />
                            {task.recurring}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                      title="Taak bewerken"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[#E29B8D] hover:bg-[var(--surface-2)] transition cursor-pointer"
                      title="Taak verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Creation / Editing Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-bg)]/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6 shadow-2xl my-8">
            <h2 className="font-serif text-xl font-medium text-[var(--text-primary)] mb-4">
              {editingTask ? 'Edit Focus Item' : 'New Focus Item'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {formError}
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Title</label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Curate autumn capsule wardrobe"
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  maxLength={5000}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Additional context or intentions..."
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">World</label>
                  <select
                    value={formRealm}
                    onChange={(e) => { setFormRealm(e.target.value as Realm); setFormProjectId(''); setFormGoalId(''); }}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="personal">Personal</option>
                    <option value="mariluna">Mariluna Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. content, self-care"
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Recurring</label>
                  <select
                    value={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.value as any)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-2.5 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Project koppelen</label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Geen project</option>
                    {projects.filter((project) => project.realm === formRealm && project.status !== 'archived').map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Doel koppelen</label>
                  <select
                    value={formGoalId}
                    onChange={(e) => setFormGoalId(e.target.value)}
                    className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="">Geen doel</option>
                    {goals.filter((goal) => goal.realm === formRealm && goal.status !== 'archived' && goal.status !== 'completed' && goal.status !== 'achieved').map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Deadline</label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Subtasks & AI Generator */}
              <div className="pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Subtasks</label>
                  <button
                    type="button"
                    onClick={handleAISubtaskGeneration}
                    disabled={!formTitle.trim() || isGeneratingSubtasks}
                    className="flex items-center gap-1.5 text-xs text-[var(--accent-secondary)] hover:text-[var(--text-primary)] disabled:opacity-40 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[var(--accent-secondary)]" />
                    <span>{isGeneratingSubtasks ? 'Thinking...' : 'AI Suggest Subtasks'}</span>
                  </button>
                  {subtaskGenerationError && (
                    <p role="alert" className="mt-2 text-[11px] text-[#A33A32]">{subtaskGenerationError}</p>
                  )}
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={subtaskInput}
                    onChange={(e) => setSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Stap toevoegen..."
                    className="flex-1 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-lg bg-[var(--surface-2)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition"
                  >
                    Add
                  </button>
                </div>

                {formSubtasks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formSubtasks.map((st, i) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--surface-2)]"
                      >
                        <span>{st.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormSubtasks(formSubtasks.filter((_, idx) => idx !== i))
                          }
                          className="text-[var(--text-muted)] hover:text-[#E29B8D]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--accent-primary)] text-[#171916] text-xs font-medium hover:bg-[var(--surface-raised)] transition cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
