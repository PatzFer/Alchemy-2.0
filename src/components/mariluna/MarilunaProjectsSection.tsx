import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  FileText,
  Lightbulb,
  Edit3,
  Trash2,
  Archive,
  Play,
  Pause,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Layers,
  Link as LinkIcon,
  CheckSquare,
  AlertCircle,
} from 'lucide-react';
import { Project, ProjectStatus, Task, Goal, Idea, ContentPost, Realm } from '../../types';

interface MarilunaProjectsSectionProps {
  projects: Project[];
  tasks: Task[];
  goals: Goal[];
  ideas: Idea[];
  contentPosts: ContentPost[];
  onSaveProject: (project: Partial<Project>) => void;
  onDeleteProject?: (projectId: string) => void;
  onSaveTask: (task: Partial<Task>) => void;
  onToggleTask: (taskId: string) => void;
  onAddContentPost?: (post: Partial<ContentPost>) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  isNl?: boolean;
}

export const MarilunaProjectsSection: React.FC<MarilunaProjectsSectionProps> = ({
  projects,
  tasks,
  goals,
  ideas,
  contentPosts,
  onSaveProject,
  onDeleteProject,
  onSaveTask,
  onToggleTask,
  onAddContentPost,
  onOpenAssistantWithPrompt,
  isNl = true,
}) => {
  // Domain isolation: only Mariluna items
  const marilunaProjects = projects.filter((p) => p.realm === 'mariluna');
  const marilunaGoals = goals.filter((g) => g.realm === 'mariluna');
  const marilunaIdeas = ideas.filter((i) => i.realm === 'mariluna' && i.status !== 'archived');
  const marilunaTasks = tasks.filter((t) => t.realm === 'mariluna');

  // Filter tab state
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  
  // Selected project for detail modal
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  // Create / Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);

  // Quick inline task creation inside project detail
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'normal' | 'low'>('normal');

  // Quick link idea or content modals
  const [isLinkIdeaOpen, setIsLinkIdeaOpen] = useState(false);
  const [isLinkContentOpen, setIsLinkContentOpen] = useState(false);
  const [isQuickContentModalOpen, setIsQuickContentModalOpen] = useState(false);
  const [newContentTitle, setNewContentTitle] = useState('');
  const [newContentPlatform, setNewContentPlatform] = useState('Instagram');
  const [newContentFormat, setNewContentFormat] = useState('Post');

  const selectedProject = marilunaProjects.find((p) => p.id === selectedProjectId);

  // Helper to calculate project task progress accurately
  const getProjectTasks = (proj: Project): Task[] => {
    return marilunaTasks.filter((t) => t.projectId === proj.id || proj.taskIds.includes(t.id));
  };

  const getProjectProgress = (proj: Project): { hasTasks: boolean; completed: number; total: number; percent: number } => {
    const pTasks = getProjectTasks(proj);
    if (pTasks.length === 0) {
      return { hasTasks: false, completed: 0, total: 0, percent: 0 };
    }
    const completed = pTasks.filter((t) => t.status === 'completed').length;
    const percent = Math.round((completed / pTasks.length) * 100);
    return { hasTasks: true, completed, total: pTasks.length, percent };
  };

  const getProjectContent = (proj: Project): ContentPost[] => {
    return contentPosts.filter(
      (cp) => cp.relatedProjectId === proj.id || proj.relatedContentIds?.includes(cp.id)
    );
  };

  const getProjectIdeas = (proj: Project): Idea[] => {
    return ideas.filter(
      (idea) => idea.connectedProjectId === proj.id || proj.ideaIds.includes(idea.id)
    );
  };

  const filteredProjects = marilunaProjects.filter((p) => {
    if (statusFilter === 'all') {
      // By default show all except archived unless explicitly filtered to archived
      return p.status !== 'archived';
    }
    return p.status === statusFilter;
  });

  // Action handlers
  const handleOpenCreateModal = () => {
    setEditingProject({
      id: 'p-' + Date.now(),
      title: '',
      description: '',
      realm: 'mariluna',
      status: 'planning',
      priority: 'normal',
      progress: 0,
      taskIds: [],
      ideaIds: [],
      relatedContentIds: [],
      notes: '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject({ ...proj });
    setIsEditModalOpen(true);
  };

  const handleSaveProjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editingProject.title?.trim()) return;

    onSaveProject(editingProject);
    setIsEditModalOpen(false);
    setEditingProject(null);
  };

  const handleQuickStatusChange = (proj: Project, newStatus: ProjectStatus) => {
    onSaveProject({
      ...proj,
      status: newStatus,
    });
  };

  const handleAddTaskToProject = (proj: Project) => {
    if (!newTaskTitle.trim()) return;

    const newTaskId = 't-' + Date.now();
    const newTask: Task = {
      id: newTaskId,
      title: newTaskTitle.trim(),
      description: '',
      realm: 'mariluna',
      category: 'project',
      projectId: proj.id,
      priority: newTaskPriority === 'normal' ? 'medium' : newTaskPriority,
      dueDate: new Date().toISOString().split('T')[0],
      estimatedDuration: 30,
      recurring: 'none',
      status: 'todo',
      subtasks: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveTask(newTask);

    // Also link task ID to project
    const updatedTaskIds = Array.from(new Set([...(proj.taskIds || []), newTaskId]));
    onSaveProject({
      ...proj,
      taskIds: updatedTaskIds,
    });

    setNewTaskTitle('');
    setNewTaskPriority('normal');
  };

  const handleLinkIdea = (proj: Project, ideaId: string) => {
    const updatedIdeaIds = Array.from(new Set([...(proj.ideaIds || []), ideaId]));
    onSaveProject({
      ...proj,
      ideaIds: updatedIdeaIds,
    });
    setIsLinkIdeaOpen(false);
  };

  const handleUnlinkIdea = (proj: Project, ideaId: string) => {
    const updatedIdeaIds = (proj.ideaIds || []).filter((id) => id !== ideaId);
    onSaveProject({
      ...proj,
      ideaIds: updatedIdeaIds,
    });
  };

  const handleLinkContent = (proj: Project, contentId: string) => {
    const updatedContentIds = Array.from(new Set([...(proj.relatedContentIds || []), contentId]));
    onSaveProject({
      ...proj,
      relatedContentIds: updatedContentIds,
    });
    setIsLinkContentOpen(false);
  };

  const handleUnlinkContent = (proj: Project, contentId: string) => {
    const updatedContentIds = (proj.relatedContentIds || []).filter((id) => id !== contentId);
    onSaveProject({
      ...proj,
      relatedContentIds: updatedContentIds,
    });
  };

  const handleCreateContentForProject = (proj: Project) => {
    if (!newContentTitle.trim() || !onAddContentPost) return;

    const newPostId = 'cp-' + Date.now();
    const newPost: ContentPost = {
      id: newPostId,
      title: newContentTitle.trim(),
      platform: newContentPlatform,
      format: newContentFormat,
      status: 'idea',
      pillar: 'Algemeen',
      relatedProjectId: proj.id,
      createdAt: new Date().toISOString(),
    };

    onAddContentPost(newPost);

    const updatedContentIds = Array.from(new Set([...(proj.relatedContentIds || []), newPostId]));
    onSaveProject({
      ...proj,
      relatedContentIds: updatedContentIds,
    });

    setNewContentTitle('');
    setIsQuickContentModalOpen(false);
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EAE2D3] text-[#554C42] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#554C42]" />
            {isNl ? 'Actief' : 'Active'}
          </span>
        );
      case 'planning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F2ECE1] text-[#7A7167] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8C7654]" />
            {isNl ? 'Planning' : 'Planning'}
          </span>
        );
      case 'idea':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECE8DF] text-[#7A7167] uppercase tracking-wider">
            <Lightbulb className="w-2.5 h-2.5 text-[#8C7654]" />
            {isNl ? 'Idee' : 'Idea'}
          </span>
        );
      case 'on_hold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EFE9DF] text-[#8C7654] uppercase tracking-wider">
            <Pause className="w-2.5 h-2.5" />
            {isNl ? 'On Hold' : 'On Hold'}
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8E1D5] text-[#2C2825] uppercase tracking-wider">
            <CheckCircle2 className="w-2.5 h-2.5 text-[#2C2825]" />
            {isNl ? 'Afgerond' : 'Completed'}
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#E5DFD3] text-[#8C8377] uppercase tracking-wider">
            <Archive className="w-2.5 h-2.5" />
            {isNl ? 'Gearchiveerd' : 'Archived'}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority?: 'high' | 'normal' | 'low') => {
    if (!priority || priority === 'normal') return null;
    if (priority === 'high') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5D7CA] text-[#4A382A] font-medium uppercase tracking-wider">
          {isNl ? 'Hoge Prioriteit' : 'High Priority'}
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFE9DF] text-[#8C8377] font-medium uppercase tracking-wider">
        {isNl ? 'Lage Prioriteit' : 'Low Priority'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Mariluna Projecten' : 'Mariluna Projects'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5">
            {isNl
              ? 'Beheer strategische trajecten, lanceringen en gerelateerde taken, content en ideeën.'
              : 'Direct strategic ventures, launches, and interconnected tasks, content, and ideas.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isNl ? 'Nieuw Project' : 'New Project'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-[#E8E0D1]">
        {[
          { id: 'all', label: isNl ? 'Alle Actieve' : 'All Active' },
          { id: 'active', label: isNl ? 'Actief' : 'Active' },
          { id: 'planning', label: isNl ? 'Planning' : 'Planning' },
          { id: 'idea', label: isNl ? 'Idee' : 'Idea' },
          { id: 'on_hold', label: isNl ? 'On Hold' : 'On Hold' },
          { id: 'completed', label: isNl ? 'Afgerond' : 'Completed' },
          { id: 'archived', label: isNl ? 'Archief' : 'Archived' },
        ].map((tab) => {
          const count =
            tab.id === 'all'
              ? marilunaProjects.filter((p) => p.status !== 'archived').length
              : marilunaProjects.filter((p) => p.status === tab.id).length;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#2C2825] text-[#FAF8F3]'
                  : 'text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EAE2D3]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-[#433D37] text-[#FAF8F3]' : 'bg-[#EAE2D3] text-[#7A7167]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DCD3C4] bg-[#FAF8F3]/50 p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#EAE2D3] flex items-center justify-center mx-auto text-[#7A7167]">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-base text-[#2C2825]">
              {statusFilter === 'all'
                ? isNl
                  ? 'Nog geen actieve projecten.'
                  : 'No active projects yet.'
                : isNl
                ? `Geen projecten met status "${statusFilter}".`
                : `No projects with status "${statusFilter}".`}
            </p>
            <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
              {isNl
                ? 'Projecten verbinden doelen met dagelijkse acties, content en creatieve vonken.'
                : 'Projects connect high-level goals with daily actions, content, and ideas.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F3] border border-[#DCD3C4] text-xs text-[#2C2825] font-medium hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isNl ? 'Start je eerste project' : 'Start your first project'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const progressInfo = getProjectProgress(proj);
            const pTasks = getProjectTasks(proj);
            const pContent = getProjectContent(proj);
            const pIdeas = getProjectIdeas(proj);
            const connectedGoal = marilunaGoals.find((g) => g.id === proj.goalId);

            return (
              <div
                key={proj.id}
                onClick={() => setSelectedProjectId(proj.id)}
                className="group rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4 shadow-xs hover:border-[#8C7654]/40 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top row: Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(proj.status)}
                      {getPriorityBadge(proj.priority)}
                    </div>
                    {connectedGoal && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#8C7654] bg-[#F2ECE1] px-2 py-0.5 rounded-md font-medium truncate max-w-[140px]">
                        <Target className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{connectedGoal.title}</span>
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#2C2825] group-hover:text-[#8C7654] transition">
                      {proj.title}
                    </h3>
                    {proj.description && (
                      <p className="text-xs text-[#7A7167] mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}
                  </div>

                  {/* Deadline or dates */}
                  {(proj.deadline || proj.startDate) && (
                    <div className="flex items-center gap-3 text-xs text-[#8C7654] pt-0.5">
                      {proj.startDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#A89F91]" />
                          <span>{isNl ? 'Start' : 'Start'}: {proj.startDate}</span>
                        </div>
                      )}
                      {proj.deadline && (
                        <div className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3" />
                          <span>{isNl ? 'Deadline' : 'Deadline'}: {proj.deadline}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress calculation & connections footer */}
                <div className="space-y-3 pt-2 border-t border-[#EFE8DC]">
                  {/* Progress section (strictly no fake numbers) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#7A7167]">
                      {progressInfo.hasTasks ? (
                        <>
                          <span>
                            {progressInfo.completed} van {progressInfo.total} {isNl ? 'taken voltooid' : 'tasks done'}
                          </span>
                          <span className="font-medium text-[#2C2825]">
                            {progressInfo.percent}%
                          </span>
                        </>
                      ) : (
                        <span className="italic text-[#A89F91]">
                          {isNl ? 'Nog geen taken' : 'No tasks yet'}
                        </span>
                      )}
                    </div>
                    {progressInfo.hasTasks && (
                      <div className="w-full h-1.5 rounded-full bg-[#E5DFD3] overflow-hidden">
                        <div
                          className="h-full bg-[#7E694E] rounded-full transition-all duration-300"
                          style={{ width: `${progressInfo.percent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Connected items pill counter */}
                  <div className="flex items-center justify-between text-[11px] text-[#8C8377] pt-1">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" title={isNl ? 'Verbonden taken' : 'Connected tasks'}>
                        <CheckSquare className="w-3 h-3 text-[#7A7167]" />
                        <span>{pTasks.length}</span>
                      </span>
                      <span className="flex items-center gap-1" title={isNl ? 'Verbonden content' : 'Connected content'}>
                        <FileText className="w-3 h-3 text-[#7A7167]" />
                        <span>{pContent.length}</span>
                      </span>
                      <span className="flex items-center gap-1" title={isNl ? 'Verbonden ideeën' : 'Connected ideas'}>
                        <Lightbulb className="w-3 h-3 text-[#7A7167]" />
                        <span>{pIdeas.length}</span>
                      </span>
                    </div>

                    <span className="text-xs text-[#8C7654] font-medium group-hover:underline flex items-center gap-0.5">
                      <span>{isNl ? 'Bekijk' : 'View'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* PROJECT DETAIL MODAL / DRAWER                                */}
      {/* ============================================================ */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-6 shadow-2xl text-[#2C2825] my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#E8E0D1]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(selectedProject.status)}
                  {getPriorityBadge(selectedProject.priority)}
                </div>
                <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
                  {selectedProject.title}
                </h2>
                {selectedProject.description && (
                  <p className="text-xs text-[#7A7167] leading-relaxed">
                    {selectedProject.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedProject)}
                  className="p-2 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
                  title={isNl ? 'Project bewerken' : 'Edit project'}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="p-2 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Bar & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#F2ECE1]/80 border border-[#E3D9C9] text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#7A7167] font-medium mr-1">
                  {isNl ? 'Status:' : 'Status:'}
                </span>
                {(['planning', 'active', 'on_hold', 'completed', 'archived'] as ProjectStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleQuickStatusChange(selectedProject, st)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition capitalize cursor-pointer ${
                      selectedProject.status === st
                        ? 'bg-[#2C2825] text-[#FAF8F3]'
                        : 'bg-[#FAF8F3] text-[#7A7167] hover:bg-[#EAE2D3]'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {onOpenAssistantWithPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProjectId(null);
                    onOpenAssistantWithPrompt(
                      `Laten we strategisch sparren over het Mariluna project "${selectedProject.title}". Wat zijn de belangrijkste prioriteiten, openstaande taken en logische vervolgstappen?`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F3] border border-[#DDD4C5] text-xs text-[#8C7654] font-medium hover:bg-[#FFFFFF] transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
                  <span>{isNl ? 'Spar met Alchemy' : 'Spar with Alchemy'}</span>
                </button>
              )}
            </div>

            {/* Progress & Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Progress */}
              <div className="p-3.5 rounded-xl border border-[#E3D9C9] bg-[#FFFFFF] space-y-2">
                <span className="text-[10px] uppercase font-semibold text-[#8C8377] tracking-wider">
                  {isNl ? 'Voortgang' : 'Progress'}
                </span>
                {(() => {
                  const prog = getProjectProgress(selectedProject);
                  if (!prog.hasTasks) {
                    return (
                      <p className="text-xs text-[#7A7167] italic">
                        {isNl ? 'Nog geen taken gekoppeld' : 'No tasks linked yet'}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-[#2C2825]">
                        <span className="font-medium">{prog.percent}% voltooid</span>
                        <span className="text-[#7A7167] text-[11px]">
                          {prog.completed} / {prog.total} {isNl ? 'taken' : 'tasks'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E5DFD3] overflow-hidden">
                        <div
                          className="h-full bg-[#7E694E] rounded-full transition-all"
                          style={{ width: `${prog.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Goal & Dates */}
              <div className="p-3.5 rounded-xl border border-[#E3D9C9] bg-[#FFFFFF] space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#8C8377] tracking-wider">
                  {isNl ? 'Strategische Context' : 'Strategic Context'}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[#7A7167]">{isNl ? 'Doel:' : 'Goal:'}</span>
                    <span className="font-medium text-[#2C2825]">
                      {marilunaGoals.find((g) => g.id === selectedProject.goalId)?.title ||
                        (isNl ? 'Geen gekoppeld doel' : 'No connected goal')}
                    </span>
                  </div>
                  {selectedProject.deadline && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A7167]">{isNl ? 'Deadline:' : 'Deadline:'}</span>
                      <span className="font-medium text-[#8C7654]">{selectedProject.deadline}</span>
                    </div>
                  )}
                  {selectedProject.startDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-[#7A7167]">{isNl ? 'Startdatum:' : 'Start date:'}</span>
                      <span className="text-[#2C2825]">{selectedProject.startDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 1. TAKEN (Central Alchemy Task System)                   */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base font-medium text-[#2C2825]">
                    {isNl ? 'Taken' : 'Tasks'}
                  </h3>
                  <span className="text-xs text-[#7A7167]">
                    ({getProjectTasks(selectedProject).length})
                  </span>
                </div>
              </div>

              {/* Quick Add Task Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={isNl ? 'Nieuwe taak voor dit project toevoegen...' : 'Add new task for this project...'}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTaskToProject(selectedProject);
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A89F91] focus:outline-none focus:border-[#8C7654]"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="px-2 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                >
                  <option value="high">{isNl ? 'Hoog' : 'High'}</option>
                  <option value="normal">{isNl ? 'Normaal' : 'Normal'}</option>
                  <option value="low">{isNl ? 'Laag' : 'Low'}</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleAddTaskToProject(selectedProject)}
                  className="px-3 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Task list */}
              {getProjectTasks(selectedProject).length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#DCD3C4] text-center text-xs text-[#7A7167] italic">
                  {isNl
                    ? 'Nog geen taken voor dit project. Voeg er hierboven direct eentje toe.'
                    : 'No tasks for this project yet. Add one directly above.'}
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {getProjectTasks(selectedProject).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] text-xs gap-3 hover:border-[#DDD4C5] transition"
                    >
                      <button
                        type="button"
                        onClick={() => onToggleTask(task.id)}
                        className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-[#8C7654] shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-[#A89F91] shrink-0" />
                        )}
                        <span
                          className={`${
                            task.status === 'completed' ? 'line-through text-[#A89F91]' : 'text-[#2C2825]'
                          }`}
                        >
                          {task.title}
                        </span>
                      </button>

                      {task.priority === 'high' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5D7CA] text-[#4A382A] font-medium shrink-0">
                          {isNl ? 'Hoog' : 'High'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 2. CONTENT (Connected Content Posts)                     */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base font-medium text-[#2C2825]">
                    {isNl ? 'Content & Publicaties' : 'Content & Publications'}
                  </h3>
                  <span className="text-xs text-[#7A7167]">
                    ({getProjectContent(selectedProject).length})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsLinkContentOpen(true)}
                    className="text-xs text-[#8C7654] hover:underline cursor-pointer font-medium"
                  >
                    {isNl ? 'Koppel bestaand' : 'Link existing'}
                  </button>
                  <span className="text-[#DDD4C5]">·</span>
                  <button
                    type="button"
                    onClick={() => setIsQuickContentModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs text-[#2C2825] bg-[#EAE2D3] px-2.5 py-1 rounded-full font-medium hover:bg-[#DDD4C5] transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isNl ? 'Nieuwe post' : 'New post'}</span>
                  </button>
                </div>
              </div>

              {getProjectContent(selectedProject).length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#DCD3C4] text-center text-xs text-[#7A7167] italic">
                  {isNl
                    ? 'Nog geen content gekoppeld aan dit project.'
                    : 'No content linked to this project yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getProjectContent(selectedProject).map((post) => (
                    <div
                      key={post.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] text-xs space-y-1.5 relative group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-medium text-[#2C2825] line-clamp-1">{post.title}</div>
                        <button
                          type="button"
                          onClick={() => handleUnlinkContent(selectedProject, post.id)}
                          className="text-[#A89F91] hover:text-[#8C4A4A] p-0.5 transition cursor-pointer"
                          title={isNl ? 'Ontkoppel content' : 'Unlink content'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7A7167]">
                        <span className="px-1.5 py-0.2 rounded-md bg-[#F2ECE1] text-[#7A7167]">
                          {post.platform} {post.format ? `· ${post.format}` : ''}
                        </span>
                        <span className="uppercase font-semibold text-[#8C7654]">
                          {post.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 3. IDEEËN (Brainstorm & Idea Sanctuary)                  */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base font-medium text-[#2C2825]">
                    {isNl ? 'Gekoppelde Ideeën' : 'Linked Ideas'}
                  </h3>
                  <span className="text-xs text-[#7A7167]">
                    ({getProjectIdeas(selectedProject).length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLinkIdeaOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-[#8C7654] hover:underline font-medium cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isNl ? 'Koppel idee' : 'Link idea'}</span>
                </button>
              </div>

              {getProjectIdeas(selectedProject).length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-[#DCD3C4] text-center text-xs text-[#7A7167] italic">
                  {isNl
                    ? 'Nog geen ideeën gekoppeld aan dit project.'
                    : 'No ideas linked to this project yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {getProjectIdeas(selectedProject).map((idea) => (
                    <div
                      key={idea.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] text-xs space-y-1 relative"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-medium text-[#2C2825] line-clamp-1">{idea.title}</div>
                        <button
                          type="button"
                          onClick={() => handleUnlinkIdea(selectedProject, idea.id)}
                          className="text-[#A89F91] hover:text-[#8C4A4A] p-0.5 transition cursor-pointer"
                          title={isNl ? 'Ontkoppel idee' : 'Unlink idea'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-[#7A7167] line-clamp-2 leading-relaxed">
                        {idea.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 4. NOTITIES                                              */}
            {/* ========================================================= */}
            <div className="space-y-2 pt-2">
              <h3 className="font-serif text-base font-medium text-[#2C2825]">
                {isNl ? 'Project Notities' : 'Project Notes'}
              </h3>
              <textarea
                value={selectedProject.notes || ''}
                onChange={(e) => {
                  onSaveProject({
                    ...selectedProject,
                    notes: e.target.value,
                  });
                }}
                placeholder={isNl ? 'Voeg strategische notities, context of reflecties toe...' : 'Add strategic notes, context or reflections...'}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] placeholder:text-[#A89F91] focus:outline-none focus:border-[#8C7654] resize-none"
              />
            </div>

            {/* Footer / Delete */}
            <div className="flex items-center justify-between pt-3 border-t border-[#E8E0D1] text-xs">
              {onDeleteProject ? (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(isNl ? `Weet je zeker dat je project "${selectedProject.title}" wilt verwijderen?` : `Delete project "${selectedProject.title}"?`)) {
                      onDeleteProject(selectedProject.id);
                      setSelectedProjectId(null);
                    }
                  }}
                  className="text-[#8C4A4A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Project Verwijderen' : 'Delete Project'}</span>
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedProjectId(null)}
                className="px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer"
              >
                {isNl ? 'Sluiten' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE / EDIT PROJECT MODAL                                  */}
      {/* ============================================================ */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#2C2825] my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {editingProject.id && marilunaProjects.some((p) => p.id === editingProject.id)
                  ? isNl
                    ? 'Project Bewerken'
                    : 'Edit Project'
                  : isNl
                  ? 'Nieuw Mariluna Project'
                  : 'New Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectForm} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Projectnaam *' : 'Project Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isNl ? 'Bijv. Lancering Herfstcollectie' : 'E.g. Autumn Collection Launch'}
                  value={editingProject.title || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Omschrijving' : 'Description'}
                </label>
                <textarea
                  placeholder={isNl ? 'Wat is het doel en de omvang van dit project?' : 'Project scope and vision?'}
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Status' : 'Status'}
                  </label>
                  <select
                    value={editingProject.status || 'planning'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="idea">{isNl ? 'Idee' : 'Idea'}</option>
                    <option value="planning">{isNl ? 'Planning' : 'Planning'}</option>
                    <option value="active">{isNl ? 'Actief' : 'Active'}</option>
                    <option value="on_hold">{isNl ? 'On Hold' : 'On Hold'}</option>
                    <option value="completed">{isNl ? 'Afgerond' : 'Completed'}</option>
                    <option value="archived">{isNl ? 'Gearchiveerd' : 'Archived'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Prioriteit' : 'Priority'}
                  </label>
                  <select
                    value={editingProject.priority || 'normal'}
                    onChange={(e) => setEditingProject({ ...editingProject, priority: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="high">{isNl ? 'Hoog' : 'High'}</option>
                    <option value="normal">{isNl ? 'Normaal' : 'Normal'}</option>
                    <option value="low">{isNl ? 'Laag' : 'Low'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Gekoppeld Doel (Optioneel)' : 'Related Goal (Optional)'}
                </label>
                <select
                  value={editingProject.goalId || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, goalId: e.target.value || undefined })}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                >
                  <option value="">{isNl ? '— Geen gekoppeld doel —' : '— No related goal —'}</option>
                  {marilunaGoals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.timeframe})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Startdatum (Optioneel)' : 'Start Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={editingProject.startDate || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, startDate: e.target.value || undefined })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Deadline (Optioneel)' : 'Deadline (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={editingProject.deadline || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value || undefined })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Notities' : 'Notes'}
                </label>
                <textarea
                  placeholder={isNl ? 'Aantekeningen of ideeën...' : 'Notes or ideas...'}
                  value={editingProject.notes || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#DDD4C5] text-xs font-medium text-[#7A7167] hover:bg-[#EAE2D3] transition"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
                >
                  {isNl ? 'Project Opslaan' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK LINK IDEA MODAL                                        */}
      {/* ============================================================ */}
      {isLinkIdeaOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-base text-[#2C2825]">
                {isNl ? 'Koppel Idee aan Project' : 'Link Idea to Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkIdeaOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {marilunaIdeas.filter((i) => !(selectedProject.ideaIds || []).includes(i.id)).length === 0 ? (
                <p className="text-xs text-[#7A7167] italic p-3 text-center">
                  {isNl ? 'Geen ongekoppelde ideeën beschikbaar.' : 'No unlinked ideas available.'}
                </p>
              ) : (
                marilunaIdeas
                  .filter((i) => !(selectedProject.ideaIds || []).includes(i.id))
                  .map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => handleLinkIdea(selectedProject, idea.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] hover:border-[#8C7654] transition text-xs space-y-0.5 cursor-pointer"
                    >
                      <div className="font-medium text-[#2C2825]">{idea.title}</div>
                      <div className="text-[11px] text-[#7A7167] line-clamp-1">{idea.content}</div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK LINK CONTENT MODAL                                     */}
      {/* ============================================================ */}
      {isLinkContentOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-base text-[#2C2825]">
                {isNl ? 'Koppel Content aan Project' : 'Link Content to Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkContentOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contentPosts.filter((cp) => !(selectedProject.relatedContentIds || []).includes(cp.id) && cp.relatedProjectId !== selectedProject.id).length === 0 ? (
                <p className="text-xs text-[#7A7167] italic p-3 text-center">
                  {isNl ? 'Geen ongekoppelde content beschikbaar.' : 'No unlinked content available.'}
                </p>
              ) : (
                contentPosts
                  .filter((cp) => !(selectedProject.relatedContentIds || []).includes(cp.id) && cp.relatedProjectId !== selectedProject.id)
                  .map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => handleLinkContent(selectedProject, post.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] hover:border-[#8C7654] transition text-xs space-y-0.5 cursor-pointer"
                    >
                      <div className="font-medium text-[#2C2825]">{post.title}</div>
                      <div className="text-[10px] text-[#7A7167]">
                        {post.platform} · {post.status}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* QUICK NEW CONTENT MODAL                                      */}
      {/* ============================================================ */}
      {isQuickContentModalOpen && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-base text-[#2C2825]">
                {isNl ? 'Nieuwe Content voor Project' : 'New Content for Project'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickContentModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateContentForProject(selectedProject);
              }}
              className="space-y-3"
            >
              <input
                type="text"
                required
                placeholder={isNl ? 'Titel van de publicatie...' : 'Content post title...'}
                value={newContentTitle}
                onChange={(e) => setNewContentTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newContentPlatform}
                  onChange={(e) => setNewContentPlatform(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                >
                  <option value="Instagram">Instagram</option>
                  <option value="Newsletter">Newsletter</option>
                  <option value="Website">Website</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Podcast">Podcast</option>
                </select>

                <select
                  value={newContentFormat}
                  onChange={(e) => setNewContentFormat(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                >
                  <option value="Post">Post</option>
                  <option value="Story">Story</option>
                  <option value="Reel">Reel / Video</option>
                  <option value="Article">Article</option>
                  <option value="Email">Email</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
                <button
                  type="button"
                  onClick={() => setIsQuickContentModalOpen(false)}
                  className="px-3 py-1.5 rounded-full border border-[#DDD4C5] text-xs text-[#7A7167]"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer"
                >
                  {isNl ? 'Toevoegen' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
