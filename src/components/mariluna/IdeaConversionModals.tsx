import React, { useState, useEffect } from 'react';
import { X, FileText, Briefcase, CheckSquare, Sparkles, ArrowRight } from 'lucide-react';
import { Idea, ContentPost, Project, Task, ContentPlan } from '../../types';
import { normalizePillars, normalizePlatforms, DEFAULT_FORMATS } from './pillarUtils';

interface ConvertToContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  contentPlan: ContentPlan;
  projects: Project[];
  onConfirm: (contentPost: ContentPost, ideaId: string) => void;
  isNl?: boolean;
}

export const ConvertToContentModal: React.FC<ConvertToContentModalProps> = ({
  isOpen,
  onClose,
  idea,
  contentPlan,
  projects,
  onConfirm,
  isNl = true,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState('');
  const [format, setFormat] = useState('Carousel');
  const [platform, setPlatform] = useState('Instagram');
  const [scheduledDate, setScheduledDate] = useState('');
  const [projectId, setProjectId] = useState('');
  const [campaign, setCampaign] = useState('');

  const activePillars = normalizePillars(contentPlan.pillars);
  const activePlatforms = normalizePlatforms(contentPlan.platforms);

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.content || '');
      setPillar(idea.contentPillar || activePillars[0]?.name || '');
      setProjectId(idea.connectedProjectId || '');
    }
  }, [idea]);

  if (!isOpen || !idea) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPost: ContentPost = {
      id: 'cp-' + Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      pillar: pillar || (activePillars[0]?.name || 'Algemeen'),
      format,
      platform,
      scheduledDate: scheduledDate || undefined,
      status: 'draft',
      campaign: campaign.trim() || undefined,
      relatedIdeaId: idea.id,
      relatedProjectId: projectId || undefined,
      priority: idea.priority || 'normal',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    onConfirm(newPost, idea.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825]">
        <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D5]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#8C7654]" />
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Zet Idee om naar Content' : 'Convert Idea to Content'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#F2ECE1] text-xs text-[#554C42] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7654]">
            Origineel Idee Behouden
          </span>
          <p className="font-serif font-medium text-[#2C2825]">{idea.title}</p>
          <p className="text-[11px] text-[#7A7167]">
            Het idee blijft bewaard en wordt gekoppeld aan het nieuwe contentbericht.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              {isNl ? 'Titel van het Bericht *' : 'Title *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                {isNl ? 'Platform' : 'Platform'}
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                {activePlatforms.map((plat) => (
                  <option key={plat} value={plat}>
                    {plat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                {isNl ? 'Format' : 'Format'}
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                {DEFAULT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                {isNl ? 'Pijler' : 'Pillar'}
              </label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                {activePillars.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                {isNl ? 'Geplande Datum (optioneel)' : 'Date'}
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              {isNl ? 'Inhoud / Concepttekst' : 'Concept Text'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EAE4D7]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37]"
            >
              Maak Contentbericht
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConvertToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onConfirm: (project: Partial<Project>, ideaId: string) => void;
  isNl?: boolean;
}

export const ConvertToProjectModal: React.FC<ConvertToProjectModalProps> = ({
  isOpen,
  onClose,
  idea,
  onConfirm,
  isNl = true,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.content || '');
    }
  }, [idea]);

  if (!isOpen || !idea) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newProject: Partial<Project> = {
      id: 'proj-' + Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      realm: 'mariluna',
      status: 'active',
      deadline: targetDate || undefined,
      progress: 0,
      taskIds: [],
      ideaIds: [idea.id],
    };

    onConfirm(newProject, idea.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825]">
        <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D5]">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#8C7654]" />
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Zet Idee om naar Project' : 'Convert Idea to Project'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#F2ECE1] text-xs text-[#554C42] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7654]">
            Koppeling: IDEA → PROJECT
          </span>
          <p className="font-serif font-medium text-[#2C2825]">{idea.title}</p>
          <p className="text-[11px] text-[#7A7167]">
            Er worden geen overbodige standaardtaken aangemaakt; jij houdt de regie.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              Projecttitel *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              Projectomschrijving & Doel
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              Streefdatum Afronding (optioneel)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EAE4D7]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37]"
            >
              Maak Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface ConvertToTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: Idea | null;
  onConfirm: (task: Partial<Task>, ideaId: string) => void;
  isNl?: boolean;
}

export const ConvertToTaskModal: React.FC<ConvertToTaskModalProps> = ({
  isOpen,
  onClose,
  idea,
  onConfirm,
  isNl = true,
}) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');

  useEffect(() => {
    if (idea) {
      setTaskTitle(`Werk idee uit: ${idea.title}`);
      setPriority(idea.priority || 'normal');
      setDueDate(new Date().toISOString().split('T')[0]);
    }
  }, [idea]);

  if (!isOpen || !idea) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: Partial<Task> = {
      id: 'task-' + Date.now(),
      title: taskTitle.trim(),
      description: idea.content,
      realm: 'mariluna',
      category: 'work',
      status: 'todo',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      priority,
      subtasks: [],
      estimatedDuration: 30,
      recurring: 'none',
      createdAt: new Date().toISOString(),
    };

    onConfirm(newTask, idea.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825]">
        <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D5]">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#8C7654]" />
            <h3 className="font-serif text-lg text-[#2C2825]">
              {isNl ? 'Zet Idee om naar Taak' : 'Convert Idea to Task'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[#F2ECE1] text-xs text-[#554C42] space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C7654]">
            Koppeling: IDEA → TAAK
          </span>
          <p className="font-serif font-medium text-[#2C2825]">{idea.title}</p>
          <p className="text-[11px] text-[#7A7167]">
            Bevestig de concrete actie voor je takenlijst.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
              Taakbeschrijving *
            </label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                Vervaldatum
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                Prioriteit
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              >
                <option value="normal">Normaal</option>
                <option value="high">Hoog</option>
                <option value="low">Laag</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EAE4D7]"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37]"
            >
              Maak Taak
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
