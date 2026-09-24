import React, { useState } from 'react';
import {
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  Lightbulb,
  Target,
  Package,
  Users,
  LayoutDashboard,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  Tag,
  Building,
  AlertCircle,
  Edit2,
  Trash2,
  Search,
  X,
  Layers,
  ChevronRight,
  Mail,
  Instagram,
} from 'lucide-react';
import {
  ContentPlan,
  ContentPost,
  Project,
  Task,
  Idea,
  Goal,
  MarilunaAdminState,
  MarilunaMetricsState,
  MarilunaOffering,
  MarilunaClient,
  Language,
  MarilunaMetric,
  IntegrationsState,
} from '../../types';
import { MarilunaContentSection } from '../mariluna/MarilunaContentSection';
import { MarilunaIdeaSanctuary } from '../mariluna/MarilunaIdeaSanctuary';
import { MarilunaIdeaSparringModal } from '../mariluna/MarilunaIdeaSparringModal';
import { MarilunaProjectsSection } from '../mariluna/MarilunaProjectsSection';
import { MarilunaStrategySection } from '../mariluna/MarilunaStrategySection';
import { MarilunaMetricsSection } from '../mariluna/MarilunaMetricsSection';
import {
  ConvertToContentModal,
  ConvertToProjectModal,
  ConvertToTaskModal,
} from '../mariluna/IdeaConversionModals';
import { MarilunaClientsManager } from '../mariluna/MarilunaClientsManager';

export type MarilunaSubTab =
  | 'overview'
  | 'content'
  | 'projects'
  | 'metrics'
  | 'brainstorm'
  | 'strategy'
  | 'offerings'
  | 'clients';

interface MarilunaHubViewProps {
  contentPlan: ContentPlan;
  onAddContentPost: (post: Partial<ContentPost>) => void;
  onUpdateContentPlan?: (plan: ContentPlan) => void;
  projects: Project[];
  onSaveProject?: (project: Partial<Project>) => void;
  onDeleteProject?: (projectId: string) => void;
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
  onSaveTask?: (task: Partial<Task>) => void;
  ideas?: Idea[];
  onSaveIdea?: (idea: Partial<Idea>) => void;
  onArchiveIdea?: (ideaId: string) => void;
  onConvertToProject?: (ideaId: string) => void;
  goals?: Goal[];
  onSaveGoal?: (goal: Partial<Goal>) => void;
  onDeleteGoal?: (goalId: string) => void;
  onToggleMilestone?: (goalId: string, milestoneId: string) => void;
  adminState?: MarilunaAdminState;
  onUpdateAdminState?: (admin: MarilunaAdminState) => void;
  metricsState?: MarilunaMetricsState;
  onUpdateMetricsState?: (metrics: MarilunaMetricsState) => void;
  offerings?: MarilunaOffering[];
  onUpdateOfferings?: (offerings: MarilunaOffering[]) => void;
  clients?: MarilunaClient[];
  onUpdateClients?: (clients: MarilunaClient[]) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  lang?: Language;
  integrations?: IntegrationsState;
}

export const MarilunaHubView: React.FC<MarilunaHubViewProps> = ({
  contentPlan,
  onAddContentPost,
  onUpdateContentPlan,
  projects,
  onSaveProject,
  onDeleteProject,
  tasks,
  onToggleTask,
  onSaveTask,
  ideas = [],
  onSaveIdea,
  onArchiveIdea,
  onConvertToProject,
  goals = [],
  onSaveGoal,
  onDeleteGoal,
  onToggleMilestone,
  metricsState = { metrics: [], records: [] } as MarilunaMetricsState,
  onUpdateMetricsState,
  offerings = [],
  onUpdateOfferings,
  clients = [],
  onUpdateClients,
  onOpenAssistantWithPrompt,
  lang = 'nl',
  integrations,
}) => {
  const isNl = lang === 'nl';
  const [activeSubTab, setActiveSubTab] = useState<MarilunaSubTab>('overview');

  const todayStr = new Date().toISOString().split('T')[0];

  // Domain filtered data
  const marilunaTasks = tasks.filter((t) => t.realm === 'mariluna');
  const todayMarilunaTasks = marilunaTasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate <= todayStr));
  const marilunaProjects = projects.filter((p) => p.realm === 'mariluna');
  const marilunaIdeas = ideas.filter((i) => i.realm === 'mariluna' && i.status !== 'archived');
  const marilunaGoals = goals.filter((g) => g.realm === 'mariluna');

  const recentMetric =
    metricsState.records && metricsState.records.length > 0
      ? metricsState.records[0]
      : metricsState.metrics && metricsState.metrics.length > 0
      ? metricsState.metrics[metricsState.metrics.length - 1]
      : null;

  const activeProject = marilunaProjects.find((p) => p.status === 'active') || null;
  const currentStrategicGoal =
    marilunaGoals.find((g) => g.status === 'active') || marilunaGoals[0] || null;
  const attentionContent =
    contentPlan.posts.find(
      (p) => p.status === 'draft' || p.status === 'idea' || p.status === 'in_progress'
    ) || null;

  const hasAnyStrategicAttention =
    !!recentMetric ||
    !!activeProject ||
    !!currentStrategicGoal ||
    !!attentionContent;

  // Subsections definition
  const subTabs: { id: MarilunaSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: isNl ? 'Overzicht' : 'Overview', icon: LayoutDashboard },
    { id: 'content', label: isNl ? 'Content' : 'Content', icon: FileText },
    { id: 'projects', label: isNl ? 'Projecten' : 'Projects', icon: Briefcase },
    { id: 'metrics', label: isNl ? 'Cijfers' : 'Metrics', icon: TrendingUp },
    { id: 'brainstorm', label: isNl ? 'Brainstorm & Sparring' : 'Brainstorm & Sparring', icon: Lightbulb },
    { id: 'strategy', label: isNl ? 'Doelen & Strategie' : 'Goals & Strategy', icon: Target },
    { id: 'offerings', label: isNl ? 'Producten & Diensten' : 'Products & Services', icon: Package },
    { id: 'clients', label: isNl ? 'Klanten' : 'Clients', icon: Users },
  ];

  // Content post modal state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postPlatform, setPostPlatform] = useState<ContentPost['platform']>('Instagram');
  const [postPillar, setPostPillar] = useState(contentPlan.pillars[0] || 'Atelier & Craft');
  const [postFormat, setPostFormat] = useState<ContentPost['format']>('Carousel');
  const [postScheduledDate, setPostScheduledDate] = useState('');
  const [postNotes, setPostNotes] = useState('');

  // Brainstorm quick idea state
  const [brainstormTitle, setBrainstormTitle] = useState('');
  const [brainstormContent, setBrainstormContent] = useState('');
  const [brainstormCategory, setBrainstormCategory] = useState('strategy');
  const [brainstormPillar, setBrainstormPillar] = useState('');

  // Project modal state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectDeadline, setNewProjectDeadline] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState<'high' | 'normal' | 'low'>('normal');

  // Metrics Modal state
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('€');
  const [metricPeriod, setMetricPeriod] = useState(new Date().getFullYear().toString());

  // Offering Modal & Search state
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [editingOfferingId, setEditingOfferingId] = useState<string | null>(null);
  const [offeringSearchQuery, setOfferingSearchQuery] = useState('');
  const [offeringTypeFilter, setOfferingTypeFilter] = useState<string>('all');
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringType, setOfferingType] = useState<MarilunaOffering['type']>('service');
  const [offeringPrice, setOfferingPrice] = useState<number | ''>('');
  const [offeringDesc, setOfferingDesc] = useState('');

  const handleOpenNewOffering = () => {
    setEditingOfferingId(null);
    setOfferingTitle('');
    setOfferingType('service');
    setOfferingPrice('');
    setOfferingDesc('');
    setIsOfferingModalOpen(true);
  };

  const handleOpenEditOffering = (off: MarilunaOffering) => {
    setEditingOfferingId(off.id);
    setOfferingTitle(off.title);
    setOfferingType(off.type);
    setOfferingPrice(off.price !== undefined && off.price !== null ? off.price : '');
    setOfferingDesc(off.description || '');
    setIsOfferingModalOpen(true);
  };

  // Sparring & Idea Conversion state
  const [sparringIdea, setSparringIdea] = useState<Idea | null>(null);
  const [isSparringOpen, setIsSparringOpen] = useState(false);
  const [convertingContentIdea, setConvertingContentIdea] = useState<Idea | null>(null);
  const [convertingProjectIdea, setConvertingProjectIdea] = useState<Idea | null>(null);
  const [convertingTaskIdea, setConvertingTaskIdea] = useState<Idea | null>(null);

  const handleSparringOpen = (idea: Idea) => {
    setSparringIdea(idea);
    setIsSparringOpen(true);
  };

  const handleSaveIdeaNotes = (ideaId: string, sparringNotes: string) => {
    if (!onSaveIdea) return;
    const target = ideas.find((i) => i.id === ideaId);
    if (target) {
      onSaveIdea({
        ...target,
        sparringNotes,
        lastRevisitedAt: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleParkIdea = (ideaId: string) => {
    if (!onSaveIdea) return;
    const target = ideas.find((i) => i.id === ideaId);
    if (target) {
      onSaveIdea({
        ...target,
        status: 'parked',
        lastRevisitedAt: new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleStartConvertToContent = (idea: Idea) => {
    setConvertingContentIdea(idea);
  };

  const handleConfirmConvertToContent = (post: ContentPost, ideaId: string) => {
    onAddContentPost(post);
    if (onSaveIdea) {
      const target = ideas.find((i) => i.id === ideaId);
      if (target) {
        const prevRelated = target.relatedContentIds || [];
        onSaveIdea({
          ...target,
          status: 'converted',
          convertedToType: 'content',
          relatedContentIds: [...prevRelated, post.id],
          lastRevisitedAt: new Date().toISOString().split('T')[0],
        });
      }
    }
    setConvertingContentIdea(null);
    setIsSparringOpen(false);
  };

  const handleStartConvertToProject = (idea: Idea) => {
    setConvertingProjectIdea(idea);
  };

  const handleConfirmConvertToProject = (proj: Partial<Project>, ideaId: string) => {
    if (onSaveProject) {
      onSaveProject(proj);
    }
    if (onSaveIdea) {
      const target = ideas.find((i) => i.id === ideaId);
      if (target) {
        onSaveIdea({
          ...target,
          status: 'converted',
          convertedToType: 'project',
          connectedProjectId: proj.id,
          lastRevisitedAt: new Date().toISOString().split('T')[0],
        });
      }
    }
    setConvertingProjectIdea(null);
    setIsSparringOpen(false);
  };

  const handleStartConvertToTask = (idea: Idea) => {
    setConvertingTaskIdea(idea);
  };

  const handleConfirmConvertToTask = (task: Partial<Task>, ideaId: string) => {
    if (onSaveTask) {
      onSaveTask(task);
    }
    if (onSaveIdea) {
      const target = ideas.find((i) => i.id === ideaId);
      if (target) {
        onSaveIdea({
          ...target,
          status: 'converted',
          convertedToType: 'task',
          assignedTaskId: task.id,
          lastRevisitedAt: new Date().toISOString().split('T')[0],
        });
      }
    }
    setConvertingTaskIdea(null);
    setIsSparringOpen(false);
  };

  // Handlers
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim()) return;
    onAddContentPost({
      id: 'cp-' + Date.now(),
      title: postTitle.trim(),
      platform: postPlatform,
      pillar: postPillar,
      format: postFormat,
      scheduledDate: postScheduledDate || undefined,
      notes: postNotes || undefined,
      status: 'idea',
    });
    setPostTitle('');
    setPostNotes('');
    setPostScheduledDate('');
    setIsPostModalOpen(false);
  };

  const handleCreateBrainstormIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brainstormTitle.trim() || !onSaveIdea) return;
    onSaveIdea({
      id: 'i-' + Date.now(),
      title: brainstormTitle.trim(),
      content: brainstormContent.trim() || brainstormTitle.trim(),
      realm: 'mariluna',
      category: brainstormCategory,
      contentPillar: brainstormPillar || undefined,
      status: 'raw',
      createdAt: todayStr,
      lastRevisitedAt: todayStr,
    });
    setBrainstormTitle('');
    setBrainstormContent('');
    setBrainstormPillar('');
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !onSaveProject) return;
    onSaveProject({
      id: 'p-' + Date.now(),
      title: newProjectTitle.trim(),
      description: newProjectDesc.trim(),
      realm: 'mariluna',
      deadline: newProjectDeadline || undefined,
      priority: newProjectPriority,
      status: 'active',
      progress: 0,
      taskIds: [],
      ideaIds: [],
    });
    setNewProjectTitle('');
    setNewProjectDesc('');
    setNewProjectDeadline('');
    setIsProjectModalOpen(false);
  };

  const handleSaveMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim() || metricValue === '' || !onUpdateMetricsState) return;
    const newM: MarilunaMetric = {
      id: 'm-' + Date.now(),
      name: metricName.trim(),
      value: metricValue.trim(),
      unit: metricUnit.trim(),
      period: metricPeriod.trim(),
    };
    onUpdateMetricsState({
      ...metricsState,
      metrics: [...metricsState.metrics, newM],
    });
    setMetricName('');
    setMetricValue('');
    setIsMetricModalOpen(false);
  };

  const handleSaveOffering = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringTitle.trim() || !onUpdateOfferings) return;

    const parsedPrice =
      offeringPrice === '' || offeringPrice === undefined || offeringPrice === null
        ? undefined
        : Number(offeringPrice);

    if (editingOfferingId) {
      const updated = offerings.map((o) =>
        o.id === editingOfferingId
          ? {
              ...o,
              title: offeringTitle.trim(),
              type: offeringType,
              price: parsedPrice,
              description: offeringDesc.trim(),
            }
          : o
      );
      onUpdateOfferings(updated);
    } else {
      const newOff: MarilunaOffering = {
        id: 'off-' + Date.now(),
        title: offeringTitle.trim(),
        type: offeringType,
        price: parsedPrice,
        description: offeringDesc.trim(),
        status: 'active',
      };
      onUpdateOfferings([...offerings, newOff]);
    }

    setEditingOfferingId(null);
    setOfferingTitle('');
    setOfferingPrice('');
    setOfferingDesc('');
    setIsOfferingModalOpen(false);
  };

  const handleDeleteOffering = (offeringId: string) => {
    if (!onUpdateOfferings) return;
    if (
      window.confirm(
        isNl
          ? 'Weet je zeker dat je dit product of deze dienst wilt verwijderen?'
          : 'Are you sure you want to delete this offering?'
      )
    ) {
      onUpdateOfferings(offerings.filter((o) => o.id !== offeringId));
    }
  };

  return (
    <div className="space-y-7 pb-24 text-[#2C2825]">
      {/* Editorial Luxury Header for Mariluna */}
      <header className="rounded-3xl border border-[#D5C6AF] bg-[#23201D] text-[#FAF8F5] p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#C5A880]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#C5A880] font-semibold">
              <span>Studio & Enterprise</span>
              <span>•</span>
              <span>{isNl ? 'Zakelijk Domein' : 'Business Domain'}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight mt-1">
              Mariluna Atelier
            </h1>
            <p className="text-xs sm:text-sm text-[#D8D0C5] mt-2 max-w-xl font-light leading-relaxed">
              {isNl
                ? 'Strategisch overzicht, contentplanning, projecten en administratie voor Mariluna. Volledig gescheiden van je persoonlijke levenssfeer.'
                : 'Strategic command center, editorial pipelines, client projects, and bookkeeping for Mariluna.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                onOpenAssistantWithPrompt(
                  isNl
                    ? 'Treed op als mijn strategische Mariluna sparringpartner. Bekijk mijn projecten, contentpijplijn en prioriteiten met rustig zakelijk inzicht.'
                    : 'Act as my strategic Mariluna business partner. Review my projects, editorial pipeline, and focus with calm clarity.'
                )
              }
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#C5A880] bg-[#C5A880]/15 text-[#FAF8F5] text-xs font-medium hover:bg-[#C5A880]/25 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{isNl ? 'Strategische Sparring' : 'Strategic Sparring'}</span>
            </button>
          </div>
        </div>

        {/* Clean Scrollable Secondary Sub-Navigation */}
        <nav
          className="relative z-10 mt-6 pt-5 border-t border-[#3E3832] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs"
          aria-label="Mariluna Subsections"
        >
          {subTabs.map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition cursor-pointer shrink-0 font-medium ${
                  isActive
                    ? 'bg-[#FAF8F5] text-[#23201D] shadow-xs'
                    : 'text-[#B8AEA2] hover:text-[#FAF8F5] hover:bg-[#342F2A]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#8C7654]' : 'text-[#AFA496]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* ============================================================ */}
      {/* 1. OVERZICHT (Business Command Center)                        */}
      {/* ============================================================ */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Business Pulse Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setActiveSubTab('projects')}
              className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Projecten' : 'Projects'}</span>
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {marilunaProjects.filter((p) => p.status === 'active').length} {isNl ? 'actief' : 'active'}
              </div>
              <p className="text-[10px] text-[#7A7167]">
                {marilunaProjects.length === 0
                  ? isNl ? 'Nog geen projecten' : 'No projects'
                  : `${marilunaProjects.length} ${isNl ? 'in totaal' : 'total'}`}
              </p>
            </div>

            <div
              onClick={() => setActiveSubTab('content')}
              className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Content' : 'Content'}</span>
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {contentPlan.posts.length} {isNl ? 'posts' : 'posts'}
              </div>
              <p className="text-[10px] text-[#7A7167]">
                {contentPlan.posts.filter((p) => p.status === 'ready').length} {isNl ? 'klaar voor publicatie' : 'ready to publish'}
              </p>
            </div>

            <div
              onClick={() => setActiveSubTab('metrics')}
              className="p-3.5 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[10px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Cijfers & KPI’s' : 'Metrics'}</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {recentMetric
                  ? recentMetric.unit === '€'
                    ? `€${Number(recentMetric.value).toLocaleString('nl-NL')}`
                    : `${recentMetric.value} ${recentMetric.unit || ''}`
                  : '—'}
              </div>
              <p className="text-[10px] text-[#7A7167] truncate">
                {recentMetric
                  ? `${recentMetric.name}`
                  : isNl ? 'Nog geen cijfers' : 'No metrics yet'}
              </p>
            </div>
          </div>

          {/* Business Attention Horizon (Only showing items that actually exist) */}
          {hasAnyStrategicAttention && (
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base text-[#2C2825] font-medium">
                    {isNl ? 'Belangrijke Zakelijke Aandachtspunten' : 'Key Business Focus Items'}
                  </h3>
                </div>
                <span className="text-[10px] text-[#8C7654] uppercase tracking-wider font-semibold">
                  {isNl ? 'Horizon' : 'Horizon'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Recent Business Figure */}
                {recentMetric && (
                  <div
                    onClick={() => setActiveSubTab('metrics')}
                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] hover:border-[#8C7654] transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#8C7654]">
                        {isNl ? 'Recent Cijfer' : 'Recent Metric'}
                      </span>
                      <span className="text-[10px] text-[#7A7167]">{recentMetric.period}</span>
                    </div>
                    <div className="text-xs font-medium text-[#2C2825] truncate">
                      {recentMetric.name}:{' '}
                      {recentMetric.unit === '€'
                        ? `€${Number(recentMetric.value).toLocaleString('nl-NL')}`
                        : `${recentMetric.value} ${recentMetric.unit || ''}`}
                    </div>
                  </div>
                )}

                {/* 2. Active Project */}
                {activeProject && (
                  <div
                    onClick={() => setActiveSubTab('projects')}
                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] hover:border-[#8C7654] transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#8C7654]">
                        {isNl ? 'Lopend Project' : 'Active Project'}
                      </span>
                      {activeProject.deadline && (
                        <span className="text-[10px] font-mono text-[#7A7167]">{activeProject.deadline}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#2C2825] truncate">
                      {activeProject.title}
                    </div>
                  </div>
                )}

                {/* 3. Current Strategic Goal */}
                {currentStrategicGoal && (
                  <div
                    onClick={() => setActiveSubTab('strategy')}
                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] hover:border-[#8C7654] transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#8C7654]">
                        {isNl ? 'Strategisch Doel' : 'Strategic Goal'}
                      </span>
                      <span className="text-[10px] capitalize text-[#7A7167]">{currentStrategicGoal.timeHorizon}</span>
                    </div>
                    <div className="text-xs font-medium text-[#2C2825] truncate">
                      {currentStrategicGoal.title}
                    </div>
                  </div>
                )}

                {/* 4. Content Needing Attention */}
                {attentionContent && (
                  <div
                    onClick={() => setActiveSubTab('content')}
                    className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] hover:border-[#8C7654] transition cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-semibold tracking-wider text-[#8C7654]">
                        {isNl ? 'Content Aandacht' : 'Content Focus'}
                      </span>
                      <span className="text-[10px] text-[#7A7167] capitalize">{attentionContent.status}</span>
                    </div>
                    <div className="text-xs font-medium text-[#2C2825] truncate">
                      {attentionContent.title}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Two Columns: Today's Mariluna Tasks & Upcoming Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Today's Relevant Mariluna Tasks */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base text-[#2C2825] font-medium">
                    {isNl ? 'Mariluna Taken voor Vandaag' : "Today's Mariluna Tasks"}
                  </h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#5A5145] font-medium">
                  {todayMarilunaTasks.length}
                </span>
              </div>

              {todayMarilunaTasks.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8377] italic">
                  {isNl ? 'Nog geen Mariluna taken gepland voor vandaag.' : 'No business tasks for today.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {todayMarilunaTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask && onToggleTask(task.id)}
                          className="text-[#B2A796] hover:text-[#2C2825] shrink-0"
                        >
                          <Circle className="w-4 h-4" />
                        </button>
                        <span className="truncate text-[#2C2825] font-medium">{task.title}</span>
                      </div>
                      {task.priority === 'high' && (
                        <span className="text-[10px] text-[#A64A38] bg-[#F9ECE9] px-2 py-0.5 rounded-md shrink-0">
                          {isNl ? 'Hoog' : 'High'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Deadlines & Commitments */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#8C7654]" />
                  <h3 className="font-serif text-base text-[#2C2825] font-medium">
                    {isNl ? 'Aankomende Projectdeadlines' : 'Upcoming Project Deadlines'}
                  </h3>
                </div>
              </div>

              {marilunaProjects.filter((p) => p.deadline).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8377] italic">
                  {isNl ? 'Geen aankomende zakelijke projectdeadlines.' : 'No upcoming project deadlines.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {marilunaProjects
                    .filter((p) => p.deadline)
                    .map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-[#2C2825]">{p.title}</span>
                        <span className="text-[10px] font-mono text-[#8C7654] bg-[#F4EFE6] px-2 py-0.5 rounded-md">
                          {p.deadline}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Ideas Waiting for Attention */}
          <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-[#8C7654]" />
                <h3 className="font-serif text-base text-[#2C2825] font-medium">
                  {isNl ? 'Ideeën Wachtend op Aandacht' : 'Ideas Awaiting Sparring'}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#5A5145] font-medium">
                  {marilunaIdeas.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('brainstorm')}
                  className="text-xs text-[#8C7654] hover:text-[#2C2825] font-medium flex items-center gap-0.5 ml-1 transition"
                >
                  <span>{isNl ? 'Open Sanctuary' : 'Open Sanctuary'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {marilunaIdeas.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#8C8377] italic">
                {isNl ? 'Geen openstaande zakelijke ideeën.' : 'No raw business ideas pending.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {marilunaIdeas.slice(0, 4).map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] space-y-2 text-xs shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-[#2C2825] truncate">{idea.title}</div>
                      {idea.contentPillar && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#FAF4EA] text-[#8C7654] font-medium shrink-0">
                          {idea.contentPillar}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7A7167] line-clamp-2">{idea.content}</p>
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleSparringOpen(idea)}
                        className="text-[11px] text-[#8C7654] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer transition"
                      >
                        <Sparkles className="w-3 h-3 text-[#8C7654]" />
                        <span>{isNl ? 'Bespreek met Alchemy' : 'Spar with Alchemy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('brainstorm')}
                        className="text-[10px] text-[#A69B8D] hover:text-[#2C2825] transition"
                      >
                        {isNl ? 'Details →' : 'Details →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. CONTENT (Editorial Planner & Strategy)                     */}
      {/* ============================================================ */}
      {activeSubTab === 'content' && (
        <MarilunaContentSection
          contentPlan={contentPlan}
          onUpdateContentPlan={onUpdateContentPlan || (() => {})}
          onAddContentPost={onAddContentPost}
          projects={projects}
          ideas={ideas}
          offerings={offerings}
          onOpenSparring={handleSparringOpen}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 3. PROJECTEN                                                 */}
      {/* ============================================================ */}
      {activeSubTab === 'projects' && (
        <MarilunaProjectsSection
          projects={projects}
          tasks={tasks}
          goals={goals}
          ideas={ideas}
          contentPosts={contentPlan.posts}
          onSaveProject={onSaveProject || (() => {})}
          onDeleteProject={onDeleteProject}
          onSaveTask={onSaveTask || (() => {})}
          onToggleTask={onToggleTask || (() => {})}
          onAddContentPost={onAddContentPost}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 5. CIJFERS (Business Figures, Metrics & Trends)              */}
      {/* ============================================================ */}
      {activeSubTab === 'metrics' && (
        <MarilunaMetricsSection
          metricsState={metricsState}
          onUpdateMetricsState={onUpdateMetricsState}
          projects={marilunaProjects}
          goals={marilunaGoals}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 6. BRAINSTORM & SPARRING (Idea Sanctuary)                    */}
      {/* ============================================================ */}
      {activeSubTab === 'brainstorm' && (
        <MarilunaIdeaSanctuary
          ideas={ideas}
          contentPlan={contentPlan}
          projects={projects}
          tasks={tasks}
          onSaveIdea={onSaveIdea || (() => {})}
          onArchiveIdea={onArchiveIdea}
          onOpenSparring={handleSparringOpen}
          onConvertToContent={handleStartConvertToContent}
          onConvertToProject={handleStartConvertToProject}
          onConvertToTask={handleStartConvertToTask}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 7. DOELEN & STRATEGIE                                        */}
      {/* ============================================================ */}
      {activeSubTab === 'strategy' && (
        <MarilunaStrategySection
          goals={goals}
          projects={projects}
          tasks={tasks}
          contentPosts={contentPlan.posts}
          ideas={ideas}
          contentPlan={contentPlan}
          onSaveGoal={onSaveGoal || (() => {})}
          onDeleteGoal={onDeleteGoal}
          onSaveProject={onSaveProject || (() => {})}
          onToggleTask={onToggleTask || (() => {})}
          onUpdateContentPlan={onUpdateContentPlan}
          onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
          onSelectProject={(projId) => setActiveSubTab('projects')}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 8. PRODUCTEN & DIENSTEN                                      */}
      {/* ============================================================ */}
      {activeSubTab === 'offerings' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Producten & Diensten' : 'Offerings & Atelier Services'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl ? 'Je aanbodcatalogus, pakketten en maatwerkdiensten.' : 'Services, packages, and bespoke offerings.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewOffering}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Aanbod Toevoegen' : 'Add Offering'}</span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          {offerings.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-[#FAF8F3] p-2.5 rounded-2xl border border-[#E3D9C9]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#9E9589]" />
                <input
                  type="text"
                  placeholder={isNl ? 'Zoek op titel of beschrijving...' : 'Search by title or description...'}
                  value={offeringSearchQuery}
                  onChange={(e) => setOfferingSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#C5A880]"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'service', 'package', 'bespoke', 'product', 'workshop'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOfferingTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer capitalize whitespace-nowrap ${
                      offeringTypeFilter === t
                        ? 'bg-[#2C2825] text-[#FAF8F3]'
                        : 'bg-[#EAE2D3]/60 text-[#554C42] hover:bg-[#EAE2D3]'
                    }`}
                  >
                    {t === 'all'
                      ? isNl ? 'Alles' : 'All'
                      : t === 'service'
                      ? isNl ? 'Dienst' : 'Service'
                      : t === 'package'
                      ? isNl ? 'Pakket' : 'Package'
                      : t === 'bespoke'
                      ? isNl ? 'Maatwerk' : 'Bespoke'
                      : t === 'product'
                      ? isNl ? 'Product' : 'Product'
                      : isNl ? 'Workshop' : 'Workshop'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {offerings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen producten of diensten toegevoegd.' : 'No offerings added yet.'}
              </p>
              <button
                type="button"
                onClick={handleOpenNewOffering}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voeg je eerste dienst of product toe' : '+ Add your first service or product'}
              </button>
            </div>
          ) : (
            (() => {
              const filteredOfferings = offerings.filter((off) => {
                const matchesSearch =
                  !offeringSearchQuery.trim() ||
                  off.title.toLowerCase().includes(offeringSearchQuery.toLowerCase()) ||
                  (off.description && off.description.toLowerCase().includes(offeringSearchQuery.toLowerCase()));
                const matchesType = offeringTypeFilter === 'all' || off.type === offeringTypeFilter;
                return matchesSearch && matchesType;
              });

              if (filteredOfferings.length === 0) {
                return (
                  <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-8 text-center text-xs text-[#7A7167]">
                    {isNl ? 'Geen producten of diensten gevonden voor deze filter.' : 'No offerings found for this filter.'}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredOfferings.map((off) => (
                    <div
                      key={off.id}
                      className="group relative rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-2 shadow-xs flex flex-col justify-between hover:border-[#C5A880] transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-serif text-base font-medium text-[#2C2825] line-clamp-1">{off.title}</h4>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#554C42] shrink-0">
                            {off.type}
                          </span>
                        </div>
                        {off.description && (
                          <p className="text-xs text-[#7A7167] leading-relaxed line-clamp-3">{off.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[#EAE2D3]/60 flex items-center justify-between">
                        <div className="font-mono text-sm font-semibold text-[#2C2825]">
                          {off.price !== undefined && off.price !== null && !isNaN(off.price) ? (
                            `€${off.price}`
                          ) : (
                            <span className="text-xs font-sans font-normal text-[#9E9589] italic">
                              {isNl ? 'Geen prijs' : 'No price'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => handleOpenEditOffering(off)}
                            className="p-1.5 rounded-lg text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EAE2D3] transition cursor-pointer"
                            title={isNl ? 'Bewerken' : 'Edit'}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteOffering(off.id)}
                            className="p-1.5 rounded-lg text-[#A05252] hover:bg-[#FBE8E8] transition cursor-pointer"
                            title={isNl ? 'Verwijderen' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}

          {/* Offering Modal */}
          {isOfferingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-[#2C2825]">
                    {editingOfferingId
                      ? isNl ? 'Dienst of Product Bewerken' : 'Edit Offering'
                      : isNl ? 'Dienst of Product Toevoegen' : 'Add Offering'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsOfferingModalOpen(false)}
                    className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveOffering} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#7A7167] mb-1">
                      {isNl ? 'Naam product / dienst *' : 'Name of offering *'}
                    </label>
                    <input
                      type="text"
                      placeholder={isNl ? 'bijv. Lenormand Reading' : 'e.g. Lenormand Reading'}
                      value={offeringTitle}
                      onChange={(e) => setOfferingTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#C5A880]"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-[#7A7167] mb-1">
                        {isNl ? 'Type' : 'Type'}
                      </label>
                      <select
                        value={offeringType}
                        onChange={(e) => setOfferingType(e.target.value as any)}
                        className="w-full px-2 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#C5A880]"
                      >
                        <option value="service">{isNl ? 'Dienst' : 'Service'}</option>
                        <option value="package">{isNl ? 'Pakket' : 'Package'}</option>
                        <option value="bespoke">{isNl ? 'Maatwerk' : 'Bespoke'}</option>
                        <option value="product">{isNl ? 'Product' : 'Product'}</option>
                        <option value="workshop">{isNl ? 'Workshop' : 'Workshop'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#7A7167] mb-1">
                        {isNl ? 'Prijs in € (optioneel)' : 'Price in € (optional)'}
                      </label>
                      <input
                        type="number"
                        placeholder={isNl ? 'bijv. 50' : 'e.g. 50'}
                        value={offeringPrice}
                        onChange={(e) => setOfferingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#7A7167] mb-1">
                      {isNl ? 'Beschrijving' : 'Description'}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={isNl ? 'Beschrijving of deliverables...' : 'Description...'}
                      value={offeringDesc}
                      onChange={(e) => setOfferingDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOfferingModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EAE2D3]/60 cursor-pointer"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!offeringTitle.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40 cursor-pointer"
                    >
                      {editingOfferingId
                        ? isNl ? 'Wijzigingen opslaan' : 'Save changes'
                        : isNl ? 'Opslaan' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. KLANTEN                                                   */}
      {/* ============================================================ */}
      {activeSubTab === 'clients' && (
        <MarilunaClientsManager
          clients={clients}
          onUpdateClients={onUpdateClients || (() => {})}
          offerings={offerings}
          integrations={integrations}
          isNl={isNl}
        />
      )}

      {/* Sparring Modal */}
      <MarilunaIdeaSparringModal
        isOpen={isSparringOpen}
        onClose={() => setIsSparringOpen(false)}
        idea={sparringIdea}
        contentPlan={contentPlan}
        projects={projects}
        onSaveNotes={handleSaveIdeaNotes}
        onParkIdea={handleParkIdea}
        onConvertToContent={handleStartConvertToContent}
        onConvertToProject={handleStartConvertToProject}
        onConvertToTask={handleStartConvertToTask}
        isNl={isNl}
      />

      {/* Convert to Content Modal */}
      <ConvertToContentModal
        isOpen={!!convertingContentIdea}
        onClose={() => setConvertingContentIdea(null)}
        idea={convertingContentIdea}
        contentPlan={contentPlan}
        projects={projects}
        onConfirm={handleConfirmConvertToContent}
        isNl={isNl}
      />

      {/* Convert to Project Modal */}
      <ConvertToProjectModal
        isOpen={!!convertingProjectIdea}
        onClose={() => setConvertingProjectIdea(null)}
        idea={convertingProjectIdea}
        onConfirm={handleConfirmConvertToProject}
        isNl={isNl}
      />

      {/* Convert to Task Modal */}
      <ConvertToTaskModal
        isOpen={!!convertingTaskIdea}
        onClose={() => setConvertingTaskIdea(null)}
        idea={convertingTaskIdea}
        projects={projects}
        onConfirm={handleConfirmConvertToTask}
        isNl={isNl}
      />
    </div>
  );
};
