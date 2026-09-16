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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formRealm, setFormRealm] = useState<Realm>('personal');
  const [formCategory, setFormCategory] = useState('self-care');
  const [formPriority, setFormPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formRecurring, setFormRecurring] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [formSubtasks, setFormSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
    setFormCategory(activeWorld === 'mariluna' ? 'content' : 'self-care');
    setFormPriority('medium');
    setFormDuration(30);
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormRecurring('none');
    setFormSubtasks([]);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormRealm(task.realm);
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormDuration(task.estimatedDuration);
    setFormDueDate(task.dueDate);
    setFormRecurring(task.recurring);
    setFormSubtasks(task.subtasks || []);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const taskPayload: Partial<Task> = {
      id: editingTask ? editingTask.id : 't-' + Date.now(),
      title: formTitle,
      description: formDesc,
      realm: formRealm,
      category: formCategory,
      priority: formPriority,
      estimatedDuration: Number(formDuration) || 30,
      dueDate: formDueDate,
      recurring: formRecurring,
      subtasks: formSubtasks,
      status: editingTask ? editingTask.status : 'todo',
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveTask(taskPayload);
    setIsModalOpen(false);
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setFormSubtasks([
      ...formSubtasks,
      { id: 'st-' + Date.now(), title: subtaskInput.trim(), completed: false },
    ]);
    setSubtaskInput('');
  };

  // AI Subtask Generator
  const handleAISubtaskGeneration = async () => {
    if (!formTitle.trim()) return;
    setIsGeneratingSubtasks(true);

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

      if (res.ok) {
        const data = await res.json();
        const lines = data.content
          .split('\n')
          .map((l: string) => l.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter((l: string) => l.length > 0)
          .slice(0, 4);

        const newSubtasks = lines.map((title: string) => ({
          id: 'st-' + Math.random().toString(36).substr(2, 9),
          title,
          completed: false,
        }));

        setFormSubtasks([...formSubtasks, ...newSubtasks]);
      }
    } catch (err) {
      console.warn('Fallback subtasks generation:', err);
      setFormSubtasks([
        ...formSubtasks,
        { id: 'st-1', title: 'Prepare foundational materials', completed: false },
        { id: 'st-2', title: 'Core focused implementation', completed: false },
        { id: 'st-3', title: 'Final review and clean closing', completed: false },
      ]);
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    // World filter
    if (activeWorld !== 'all' && t.realm !== activeWorld) return false;
    // Status filter
    if (filterStatus === 'active' && t.status === 'completed') return false;
    if (filterStatus === 'completed' && t.status !== 'completed') return false;
    // Priority filter
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D5] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#2C2825]">Focus & Tasks</h1>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Intentional commitments for personal life and Mariluna studio.
          </p>
        </div>

        <button
          onClick={openNewTaskModal}
          id="new-task-btn"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 rounded-full border border-[#E3DCD1] bg-[#F1ECE3] p-0.5">
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                : 'text-[#7A7167]'
            }`}
          >
            Active ({tasks.filter((t) => t.status !== 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                : 'text-[#7A7167]'
            }`}
          >
            Completed ({tasks.filter((t) => t.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-full transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#FFFFFF] text-[#2C2825] shadow-xs font-medium'
                : 'text-[#7A7167]'
            }`}
          >
            All
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#8C8377] text-[11px]">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-lg border border-[#DDD5C7] bg-[#FFFFFF] px-2.5 py-1 text-xs text-[#2C2825] focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-[#DDD5C7] bg-[#FAF8F3]">
            <p className="text-xs text-[#7A7167]">No tasks found under current criteria.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = task.status === 'completed';
            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-[#F4F1EA]/50 border-[#E2DBD0] opacity-60'
                    : 'bg-[#FFFFFF] border-[#E8E1D4] hover:border-[#C4B9A7] shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="mt-0.5 text-[#8C7654] hover:text-[#2C2825] transition cursor-pointer"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-[#8C7654]" />
                      ) : (
                        <Circle className="w-5 h-5 text-[#A89F93] hover:text-[#2C2825]" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm sm:text-base font-medium ${
                            isCompleted ? 'line-through text-[#8C8377]' : 'text-[#2C2825]'
                          }`}
                        >
                          {task.title}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            task.realm === 'mariluna'
                              ? 'bg-[#2C2825] text-[#F9F7F2]'
                              : 'bg-[#EAE4D7] text-[#554C42]'
                          }`}
                        >
                          {task.realm === 'mariluna' ? 'Mariluna' : 'Personal'}
                        </span>

                        <span className="text-[10px] text-[#8C8377] capitalize">
                          {task.category}
                        </span>

                        {task.priority === 'high' && (
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-[#8C7654] bg-[#F7F2E8] px-2 py-0.5 rounded-full">
                            High
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#6C6357] mt-1.5 font-light leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Subtasks listing */}
                      {task.subtasks.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#F0EBE1] space-y-1.5">
                          {task.subtasks.map((st) => (
                            <div
                              key={st.id}
                              className="flex items-center gap-2 text-xs text-[#554C42]"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  st.completed ? 'bg-[#8C7654]' : 'bg-[#DDD4C6]'
                                }`}
                              />
                              <span className={st.completed ? 'line-through text-[#9E958B]' : ''}>
                                {st.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3 text-[11px] text-[#8C8377]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A89F93]" />
                          {task.estimatedDuration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#A89F93]" />
                          Due: {task.dueDate}
                        </span>
                        {task.recurring !== 'none' && (
                          <span className="flex items-center gap-1 capitalize">
                            <RefreshCw className="w-3 h-3 text-[#A89F93]" />
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
                      className="p-1.5 rounded-lg text-[#8C8377] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
                      title="Edit task"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-[#8C8377] hover:text-[#733] hover:bg-[#F2ECE1] transition cursor-pointer"
                      title="Delete task"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-6 shadow-2xl my-8">
            <h2 className="font-serif text-xl font-medium text-[#2C2825] mb-4">
              {editingTask ? 'Edit Focus Item' : 'New Focus Item'}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Curate autumn capsule wardrobe"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Additional context or intentions..."
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">World</label>
                  <select
                    value={formRealm}
                    onChange={(e) => setFormRealm(e.target.value as Realm)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="personal">Personal</option>
                    <option value="mariluna">Mariluna Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g. content, self-care"
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-2.5 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">Recurring</label>
                  <select
                    value={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.value as any)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-2.5 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">Due Date</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                />
              </div>

              {/* Subtasks & AI Generator */}
              <div className="pt-2 border-t border-[#E8E2D6]">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#5A524A]">Subtasks</label>
                  <button
                    type="button"
                    onClick={handleAISubtaskGeneration}
                    disabled={!formTitle.trim() || isGeneratingSubtasks}
                    className="flex items-center gap-1.5 text-xs text-[#8C7654] hover:text-[#2C2825] disabled:opacity-40 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#C5A880]" />
                    <span>{isGeneratingSubtasks ? 'Thinking...' : 'AI Suggest Subtasks'}</span>
                  </button>
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
                    placeholder="Add step..."
                    className="flex-1 bg-[#FFFFFF] border border-[#D5CCBE] rounded-lg px-3 py-1.5 text-xs text-[#2C2825]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-lg bg-[#EFE9DE] text-xs font-medium text-[#2C2825] hover:bg-[#E5DEC7] transition"
                  >
                    Add
                  </button>
                </div>

                {formSubtasks.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {formSubtasks.map((st, i) => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#F3ECE1]"
                      >
                        <span>{st.title}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormSubtasks(formSubtasks.filter((_, idx) => idx !== i))
                          }
                          className="text-[#8C8377] hover:text-[#733]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EFE9DE] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer"
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
