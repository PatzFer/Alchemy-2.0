import React, { useState, useEffect } from 'react';
import { Scissors, X, Plus, Clock, Check, Loader2 } from 'lucide-react';
import { splitTaskWithBrain } from '../../lib/brain/aiProvider';

interface TaskSplitModalProps {
  isOpen: boolean;
  taskId: string;
  taskTitle: string;
  onClose: () => void;
  onConfirmSplit: (taskId: string, subtasks: { title: string; durationMinutes: number }[]) => void;
  isNl?: boolean;
}

export const TaskSplitModal: React.FC<TaskSplitModalProps> = ({
  isOpen,
  taskId,
  taskTitle,
  onClose,
  onConfirmSplit,
  isNl = true,
}) => {
  const [subtasks, setSubtasks] = useState<{ title: string; durationMinutes: number; selected: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskDuration, setNewSubtaskDuration] = useState(15);

  useEffect(() => {
    if (!isOpen || !taskTitle) return;

    setLoading(true);
    splitTaskWithBrain(taskTitle)
      .then((res) => {
        setSubtasks(
          (res.subtasks || []).map((s) => ({
            title: s.title,
            durationMinutes: s.durationMinutes || 15,
            selected: true,
          }))
        );
      })
      .catch(() => {
        setSubtasks([
          { title: `Voorbereiding voor: ${taskTitle}`, durationMinutes: 15, selected: true },
          { title: `Kernuitvoering voor: ${taskTitle}`, durationMinutes: 30, selected: true },
          { title: `Afronden en controleren: ${taskTitle}`, durationMinutes: 15, selected: true },
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, taskTitle]);

  if (!isOpen) return null;

  const handleToggleSubtask = (idx: number) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleUpdateTitle = (idx: number, title: string) => {
    setSubtasks((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, title } : s))
    );
  };

  const handleAddCustomSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { title: newSubtaskTitle.trim(), durationMinutes: newSubtaskDuration, selected: true },
    ]);
    setNewSubtaskTitle('');
  };

  const handleConfirm = () => {
    const chosen = subtasks.filter((s) => s.selected && s.title.trim().length > 0);
    if (chosen.length === 0) return;
    onConfirmSplit(
      taskId,
      chosen.map((s) => ({ title: s.title, durationMinutes: s.durationMinutes }))
    );
    onClose();
  };

  const totalMinutes = subtasks
    .filter((s) => s.selected)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2825]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-[#FFFFFF] border border-[#E8E1D4] shadow-xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="p-5 border-b border-[#F2ECE1] flex items-center justify-between bg-[#FAF8F5]">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-[#8C7654]" />
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                {isNl ? 'Taak opdelen in behapbare stappen' : 'Split Task into Micro-Steps'}
              </h3>
            </div>
            <p className="text-xs text-[#7A7267]">
              {isNl ? 'Alchemy stelt voor, jij kiest welke deeltaken je overneemt.' : 'Alchemy proposes, you decide what to keep.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E958B] hover:text-[#2C2825] p-1.5 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Original Task Card */}
          <div className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EFE9DE] space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7654]">
              {isNl ? 'Hoofdtaak' : 'Main Task'}
            </span>
            <p className="text-sm font-medium text-[#2C2825]">{taskTitle}</p>
          </div>

          {/* Subtask Suggestions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#7A7267]">
              <span>{isNl ? 'Voorgestelde deeltaken:' : 'Proposed micro-steps:'}</span>
              <span className="flex items-center gap-1 font-medium text-[#8C7654]">
                <Clock className="w-3.5 h-3.5" />
                {totalMinutes} min totaal
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs text-[#8A8175]">
                <Loader2 className="w-5 h-5 animate-spin text-[#8C7654]" />
                <span>{isNl ? 'Micro-stappen genereren met Alchemy Brain...' : 'Generating micro-steps...'}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {subtasks.map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border transition flex items-center gap-3 ${
                      st.selected
                        ? 'bg-[#FFFFFF] border-[#D5CCBE]'
                        : 'bg-[#FAF8F5] border-transparent opacity-60'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={st.selected}
                      onChange={() => handleToggleSubtask(idx)}
                      className="rounded border-[#D5CCBE] text-[#8C7654] focus:ring-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                      className="flex-1 bg-transparent text-xs text-[#2C2825] focus:outline-hidden"
                    />
                    <span className="text-[11px] text-[#9E958B] shrink-0">
                      {st.durationMinutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add custom step form */}
          <form onSubmit={handleAddCustomSubtask} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder={isNl ? 'Eigen deeltaak toevoegen...' : 'Add custom subtask...'}
              className="flex-1 bg-[#FAF8F5] border border-[#E8E1D4] rounded-xl px-3 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
            />
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={newSubtaskDuration}
              onChange={(e) => setNewSubtaskDuration(Number(e.target.value))}
              className="w-16 bg-[#FAF8F5] border border-[#E8E1D4] rounded-xl px-2 py-2 text-xs text-center text-[#2C2825] focus:outline-hidden"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E1D4] text-[#554C42] hover:bg-[#F0ECE1] transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F2ECE1] bg-[#FAF8F5] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D5CCBE] text-xs font-medium text-[#554C42] hover:bg-[#F2ECE1] transition cursor-pointer"
          >
            {isNl ? 'Behoud zoals het is' : 'Keep as is'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={subtasks.filter((s) => s.selected).length === 0}
            className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#453E38] disabled:opacity-40 transition cursor-pointer"
          >
            {isNl ? 'Opsplitsen bevestigen' : 'Confirm split'}
          </button>
        </div>
      </div>
    </div>
  );
};
