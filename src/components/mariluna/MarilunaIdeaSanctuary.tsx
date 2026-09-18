import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Bookmark,
  FileText,
  Briefcase,
  CheckSquare,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react';
import { Idea, ContentPlan, Project, Task, IdeaStatus } from '../../types';
import {
  normalizePillars,
  getPillarName,
  IDEA_STATUSES,
  getIdeaStatusLabel,
} from './pillarUtils';

interface MarilunaIdeaSanctuaryProps {
  ideas: Idea[];
  contentPlan: ContentPlan;
  projects: Project[];
  tasks: Task[];
  onSaveIdea: (idea: Partial<Idea>) => void;
  onArchiveIdea?: (ideaId: string) => void;
  onOpenSparring: (idea: Idea) => void;
  onConvertToContent: (idea: Idea, initialTitle?: string, initialNotes?: string) => void;
  onConvertToProject: (idea: Idea, initialTitle?: string, initialDescription?: string) => void;
  onConvertToTask: (idea: Idea, initialTitle?: string) => void;
  isNl?: boolean;
}

export const MarilunaIdeaSanctuary: React.FC<MarilunaIdeaSanctuaryProps> = ({
  ideas,
  contentPlan,
  projects,
  tasks,
  onSaveIdea,
  onArchiveIdea,
  onOpenSparring,
  onConvertToContent,
  onConvertToProject,
  onConvertToTask,
  isNl = true,
}) => {
  // Capture box state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [category, setCategory] = useState('creative');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Editing existing idea
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const normalizedPillars = useMemo(
    () => normalizePillars(contentPlan.pillars),
    [contentPlan.pillars]
  );

  const marilunaIdeas = useMemo(() => {
    return ideas.filter((i) => i.realm === 'mariluna');
  }, [ideas]);

  // Filtered ideas
  const filteredIdeas = useMemo(() => {
    return marilunaIdeas.filter((idea) => {
      // Exclude archived by default unless specifically filtered
      if (statusFilter !== 'archived' && idea.status === 'archived') return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'new' && (idea.status === 'new' || idea.status === 'raw')) {
          // match
        } else if (
          statusFilter === 'converted' &&
          (idea.status === 'converted' || idea.status === 'converted_to_project')
        ) {
          // match
        } else if (idea.status !== statusFilter) {
          return false;
        }
      }

      // Pillar filter
      if (pillarFilter !== 'all' && idea.contentPillar !== pillarFilter) {
        return false;
      }

      // Project filter
      if (projectFilter !== 'all' && idea.connectedProjectId !== projectFilter) {
        return false;
      }

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = idea.title.toLowerCase().includes(q);
        const matchesContent = idea.content.toLowerCase().includes(q);
        const matchesNotes = idea.notes ? idea.notes.toLowerCase().includes(q) : false;
        const matchesTags = idea.tags ? idea.tags.some((t) => t.toLowerCase().includes(q)) : false;
        if (!matchesTitle && !matchesContent && !matchesNotes && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [marilunaIdeas, statusFilter, pillarFilter, projectFilter, searchQuery]);

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newIdea: Partial<Idea> = {
      id: 'idea-' + Date.now(),
      title: title.trim(),
      content: content.trim(),
      realm: 'mariluna',
      category: category || 'creative',
      status: 'new',
      contentPillar: selectedPillar || undefined,
      connectedProjectId: selectedProject || undefined,
      priority,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString().split('T')[0],
      lastRevisitedAt: new Date().toISOString().split('T')[0],
    };

    onSaveIdea(newIdea);

    // Reset capture form
    setTitle('');
    setContent('');
    setSelectedPillar('');
    setSelectedProject('');
    setTagsInput('');
    setNotes('');
    setShowOptionalFields(false);
  };

  const handleUpdateStatus = (ideaId: string, newStatus: IdeaStatus) => {
    const existing = ideas.find((i) => i.id === ideaId);
    if (!existing) return;
    onSaveIdea({
      ...existing,
      status: newStatus,
      lastRevisitedAt: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Mariluna Idea Sanctuary' : 'Mariluna Idea Sanctuary'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5 max-w-xl">
            {isNl
              ? 'Een ongedwongen ruimte om ruwe inspiratie, invalshoeken en concepten vast te leggen en strategisch te sparren met Alchemy.'
              : 'A sanctuary to rapidly capture creative sparks, concepts, and spar strategically with Alchemy.'}
          </p>
        </div>
      </div>

      {/* FAST CAPTURE BOX (+ Nieuw idee) */}
      <div className="rounded-3xl border border-[#D5C6AF] bg-[#FAF8F3] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-[#8C7654]" />
            <span>{isNl ? '+ Nieuw idee vastleggen' : '+ Capture New Spark'}</span>
          </div>
          <span className="text-[11px] text-[#8C7654]">
            {isNl ? 'Geen verplichte velden buiten titel' : 'Fast, frictionless capture'}
          </span>
        </div>

        <form onSubmit={handleCreateIdea} className="space-y-3">
          <input
            type="text"
            required
            placeholder={isNl ? 'Titel van je idee of vonk...' : 'Spark or idea title...'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs sm:text-sm text-[#2C2825] focus:outline-none focus:border-[#8C7654] shadow-2xs font-medium"
          />

          <textarea
            rows={2}
            placeholder={
              isNl
                ? 'Vrije tekst, gedachten, context of eerste gedachtestroom...'
                : 'Free-form idea text, context or initial brainstorm...'
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] shadow-2xs"
          />

          {/* Optional Fields Toggle */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="inline-flex items-center gap-1.5 text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
            >
              {showOptionalFields ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verberg optionele details' : 'Hide optional fields'}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>{isNl ? '+ Optioneel: Pijler, project, prioriteit & tags' : '+ Optional details'}</span>
                </>
              )}
            </button>

            {showOptionalFields && (
              <div className="mt-3 p-4 rounded-2xl bg-[#F2ECE1]/60 border border-[#E3DBD0] space-y-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#7A6E60] block mb-1">
                      {isNl ? 'Content Pijler' : 'Pillar'}
                    </label>
                    <select
                      value={selectedPillar}
                      onChange={(e) => setSelectedPillar(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      <option value="">{isNl ? 'Geen pijler (optioneel)' : 'None (optional)'}</option>
                      {normalizedPillars.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#7A6E60] block mb-1">
                      {isNl ? 'Gekoppeld Project' : 'Related Project'}
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      <option value="">{isNl ? 'Geen project (optioneel)' : 'None (optional)'}</option>
                      {projects
                        .filter((p) => p.realm === 'mariluna')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#7A6E60] block mb-1">
                      {isNl ? 'Prioriteit' : 'Priority'}
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      <option value="normal">{isNl ? 'Normaal' : 'Normal'}</option>
                      <option value="high">{isNl ? 'Hoog' : 'High'}</option>
                      <option value="low">{isNl ? 'Laag' : 'Low'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#7A6E60] block mb-1">
                      Tags (gescheiden door komma's)
                    </label>
                    <input
                      type="text"
                      placeholder="bijv. lancering, branding, essay"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase text-[#7A6E60] block mb-1">
                      Extra notities
                    </label>
                    <input
                      type="text"
                      placeholder="korte aantekening..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-[#EDE4D5]">
            <span className="text-[11px] text-[#7A7167]">
              {isNl ? 'Wordt bewaard in Mariluna domein.' : 'Stored in Mariluna domain.'}
            </span>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer disabled:opacity-40"
            >
              {isNl ? '+ Idee Vastleggen' : '+ Save Spark'}
            </button>
          </div>
        </form>
      </div>

      {/* SEARCH + FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FAF8F3] p-3 rounded-2xl border border-[#E5DFD3]">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C8377]" />
          <input
            type="text"
            placeholder={isNl ? 'Zoek in ideeën & tags...' : 'Search ideas...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
          >
            <option value="all">{isNl ? 'Alle statussen' : 'All statuses'}</option>
            <option value="new">NEW / Nieuw</option>
            <option value="exploring">EXPLORING</option>
            <option value="developing">DEVELOPING / In Uitwerking</option>
            <option value="ready_to_use">READY TO USE / Klaar</option>
            <option value="parked">PARKED / Geparkeerd</option>
            <option value="converted">CONVERTED / Omgezet</option>
            <option value="archived">{isNl ? 'Gearchiveerd' : 'Archived'}</option>
          </select>

          {/* Pillar Filter */}
          {normalizedPillars.length > 0 && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            >
              <option value="all">{isNl ? 'Alle pijlers' : 'All pillars'}</option>
              {normalizedPillars.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Project Filter */}
          {projects.filter((p) => p.realm === 'mariluna').length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            >
              <option value="all">{isNl ? 'Alle projecten' : 'All projects'}</option>
              {projects
                .filter((p) => p.realm === 'mariluna')
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          )}

          <span className="text-[11px] text-[#7A7167] font-medium ml-auto">
            {filteredIdeas.length} {isNl ? 'ideeën' : 'ideas'}
          </span>
        </div>
      </div>

      {/* IDEA CARDS LIST */}
      {filteredIdeas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DCD3C4] p-12 text-center space-y-3 bg-[#FAF8F3]/50">
          <Lightbulb className="w-8 h-8 text-[#8C7654] mx-auto opacity-50" />
          <h3 className="font-serif text-base font-medium text-[#2C2825]">
            {isNl ? 'Nog geen ideeën opgeslagen.' : 'No ideas saved yet.'}
          </h3>
          <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
            {isNl
              ? 'Gebruik het invoerveld hierboven om je eerste creatieve gedachte of strategische vonk vast te leggen.'
              : 'Capture your first concept spark using the form above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIdeas.map((idea) => {
            const connectedProj = projects.find((p) => p.id === idea.connectedProjectId);
            const connectedTask = tasks.find((t) => t.id === idea.assignedTaskId);
            const relatedContentCount = (idea.relatedContentIds || []).length;

            return (
              <div
                key={idea.id}
                className="rounded-3xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-3.5 shadow-xs flex flex-col justify-between hover:border-[#D5C6AF] transition"
              >
                <div className="space-y-2">
                  {/* Top Bar: Status Dropdown & Pillar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* State badge / selector */}
                      <select
                        value={idea.status === 'raw' ? 'new' : idea.status === 'converted_to_project' ? 'converted' : idea.status}
                        onChange={(e) => handleUpdateStatus(idea.id, e.target.value as IdeaStatus)}
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EFE8DC] border border-[#DDD4C5] text-[#554C42] cursor-pointer"
                      >
                        <option value="new">NEW (Nieuw)</option>
                        <option value="exploring">EXPLORING</option>
                        <option value="developing">DEVELOPING</option>
                        <option value="ready_to_use">READY TO USE</option>
                        <option value="parked">PARKED</option>
                        <option value="converted">CONVERTED</option>
                        <option value="archived">ARCHIVED</option>
                      </select>

                      {idea.contentPillar && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E3DBD0] text-[#7A6E60] font-medium">
                          {idea.contentPillar}
                        </span>
                      )}

                      {idea.priority === 'high' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F5E6E6] text-[#8C3A3A] font-semibold">
                          Hoog
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-[#8C8377] font-mono shrink-0">
                      {idea.createdAt}
                    </span>
                  </div>

                  {/* Title & Free-form text */}
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#2C2825] leading-snug">
                      {idea.title}
                    </h3>
                    {idea.content && (
                      <p className="text-xs text-[#5D5448] mt-1.5 leading-relaxed whitespace-pre-wrap">
                        {idea.content}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {idea.tags && idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {idea.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F2ECE1] text-[#7A6E60]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Relationships to resulting content / project / task */}
                  {(connectedProj || connectedTask || relatedContentCount > 0 || idea.sparringNotes) && (
                    <div className="pt-2 border-t border-[#ECE3D4] space-y-1 text-[11px]">
                      {connectedProj && (
                        <div className="flex items-center gap-1.5 text-[#554C42]">
                          <Briefcase className="w-3 h-3 text-[#8C7654]" />
                          <span>↳ Gekoppeld aan project: <strong>{connectedProj.title}</strong></span>
                        </div>
                      )}
                      {connectedTask && (
                        <div className="flex items-center gap-1.5 text-[#554C42]">
                          <CheckSquare className="w-3 h-3 text-[#8C7654]" />
                          <span>↳ Gekoppeld aan taak: <strong>{connectedTask.title}</strong></span>
                        </div>
                      )}
                      {relatedContentCount > 0 && (
                        <div className="flex items-center gap-1.5 text-[#554C42]">
                          <FileText className="w-3 h-3 text-[#8C7654]" />
                          <span>↳ {relatedContentCount} contentbericht(en) uit voortgekomen</span>
                        </div>
                      )}
                      {idea.sparringNotes && (
                        <div className="flex items-center gap-1.5 text-[#8C7654]">
                          <Bookmark className="w-3 h-3" />
                          <span>Sparringnotities opgeslagen</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Bar */}
                <div className="pt-3 border-t border-[#ECE3D4] space-y-2">
                  {/* Primary Action: Bespreek met Alchemy */}
                  <button
                    type="button"
                    onClick={() => onOpenSparring(idea)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-2xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{isNl ? '✨ Bespreek met Alchemy' : '✨ Spar with Alchemy'}</span>
                    <ArrowRight className="w-3 h-3 text-[#C5A880]" />
                  </button>

                  {/* Secondary Conversions: Maak Content | Maak Project | Maak Taak */}
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => onConvertToContent(idea, idea.title, idea.content)}
                      className="px-2 py-1 rounded-lg text-[#554C42] hover:bg-[#EAE4D7] transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <FileText className="w-3 h-3 text-[#8C7654]" />
                      <span>Maak content</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onConvertToProject(idea, idea.title, idea.content)}
                      className="px-2 py-1 rounded-lg text-[#554C42] hover:bg-[#EAE4D7] transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Briefcase className="w-3 h-3 text-[#8C7654]" />
                      <span>Maak project</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onConvertToTask(idea, `Werk idee uit: ${idea.title}`)}
                      className="px-2 py-1 rounded-lg text-[#554C42] hover:bg-[#EAE4D7] transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <CheckSquare className="w-3 h-3 text-[#8C7654]" />
                      <span>Maak taak</span>
                    </button>

                    {onArchiveIdea && idea.status !== 'archived' && (
                      <button
                        type="button"
                        onClick={() => onArchiveIdea(idea.id)}
                        className="p-1 text-[#9A9084] hover:text-[#2C2825] transition cursor-pointer"
                        title="Archiveer idee"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
