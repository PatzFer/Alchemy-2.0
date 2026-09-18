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
  Receipt,
  Building,
  AlertCircle,
  Edit2,
  Trash2,
  Layers,
  ChevronRight,
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
  MarilunaExpense,
  MarilunaInvoice,
  MarilunaTaxDeadline,
  MarilunaMetric,
} from '../../types';
import { MarilunaContentSection } from '../mariluna/MarilunaContentSection';
import { MarilunaIdeaSanctuary } from '../mariluna/MarilunaIdeaSanctuary';
import { MarilunaIdeaSparringModal } from '../mariluna/MarilunaIdeaSparringModal';
import {
  ConvertToContentModal,
  ConvertToProjectModal,
  ConvertToTaskModal,
} from '../mariluna/IdeaConversionModals';

export type MarilunaSubTab =
  | 'overview'
  | 'content'
  | 'projects'
  | 'admin'
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
  tasks: Task[];
  onToggleTask?: (taskId: string) => void;
  onSaveTask?: (task: Partial<Task>) => void;
  ideas?: Idea[];
  onSaveIdea?: (idea: Partial<Idea>) => void;
  onArchiveIdea?: (ideaId: string) => void;
  onConvertToProject?: (ideaId: string) => void;
  goals?: Goal[];
  onSaveGoal?: (goal: Partial<Goal>) => void;
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
}

export const MarilunaHubView: React.FC<MarilunaHubViewProps> = ({
  contentPlan,
  onAddContentPost,
  onUpdateContentPlan,
  projects,
  onSaveProject,
  tasks,
  onToggleTask,
  onSaveTask,
  ideas = [],
  onSaveIdea,
  onArchiveIdea,
  onConvertToProject,
  goals = [],
  onSaveGoal,
  onToggleMilestone,
  adminState = { expenses: [], invoices: [], deadlines: [] },
  onUpdateAdminState,
  metricsState = { metrics: [] },
  onUpdateMetricsState,
  offerings = [],
  onUpdateOfferings,
  clients = [],
  onUpdateClients,
  onOpenAssistantWithPrompt,
  lang = 'nl',
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

  // Subsections definition
  const subTabs: { id: MarilunaSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: isNl ? 'Overzicht' : 'Overview', icon: LayoutDashboard },
    { id: 'content', label: isNl ? 'Content' : 'Content', icon: FileText },
    { id: 'projects', label: isNl ? 'Projecten' : 'Projects', icon: Briefcase },
    { id: 'admin', label: isNl ? 'Admin & Boekhouding' : 'Admin & Bookkeeping', icon: Receipt },
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

  // Admin Modals state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminType, setAdminType] = useState<'expense' | 'invoice' | 'deadline'>('invoice');
  const [invoiceClient, setInvoiceClient] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState<number | ''>('');
  const [expenseCategory, setExpenseCategory] = useState<MarilunaExpense['category']>('software');
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');

  // Metrics Modal state
  const [isMetricModalOpen, setIsMetricModalOpen] = useState(false);
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('€');
  const [metricPeriod, setMetricPeriod] = useState(new Date().getFullYear().toString());

  // Offering Modal state
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [offeringTitle, setOfferingTitle] = useState('');
  const [offeringType, setOfferingType] = useState<MarilunaOffering['type']>('service');
  const [offeringPrice, setOfferingPrice] = useState<number | ''>('');
  const [offeringDesc, setOfferingDesc] = useState('');

  // Client Modal state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientStatus, setClientStatus] = useState<MarilunaClient['status']>('active');

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

  const handleSaveAdminEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateAdminState) return;

    if (adminType === 'invoice' && invoiceClient.trim() && invoiceAmount !== '') {
      const newInv: MarilunaInvoice = {
        id: 'inv-' + Date.now(),
        invoiceNumber: invoiceNumber.trim() || `ML-${Date.now().toString().slice(-4)}`,
        clientName: invoiceClient.trim(),
        amount: Number(invoiceAmount),
        date: todayStr,
        dueDate: invoiceDueDate || todayStr,
        status: 'sent',
      };
      onUpdateAdminState({
        ...adminState,
        invoices: [...adminState.invoices, newInv],
      });
    } else if (adminType === 'expense' && expenseDesc.trim() && expenseAmount !== '') {
      const newExp: MarilunaExpense = {
        id: 'exp-' + Date.now(),
        description: expenseDesc.trim(),
        amount: Number(expenseAmount),
        date: todayStr,
        category: expenseCategory,
        paid: true,
      };
      onUpdateAdminState({
        ...adminState,
        expenses: [...adminState.expenses, newExp],
      });
    } else if (adminType === 'deadline' && deadlineTitle.trim() && deadlineDate) {
      const newDead: MarilunaTaxDeadline = {
        id: 'dead-' + Date.now(),
        title: deadlineTitle.trim(),
        dueDate: deadlineDate,
        type: 'vat_btw',
        completed: false,
      };
      onUpdateAdminState({
        ...adminState,
        deadlines: [...adminState.deadlines, newDead],
      });
    }

    // Reset
    setInvoiceClient('');
    setInvoiceAmount('');
    setInvoiceNumber('');
    setExpenseDesc('');
    setExpenseAmount('');
    setDeadlineTitle('');
    setDeadlineDate('');
    setIsAdminModalOpen(false);
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
    if (!offeringTitle.trim() || offeringPrice === '' || !onUpdateOfferings) return;
    const newOff: MarilunaOffering = {
      id: 'off-' + Date.now(),
      title: offeringTitle.trim(),
      type: offeringType,
      price: Number(offeringPrice),
      description: offeringDesc.trim(),
      status: 'active',
    };
    onUpdateOfferings([...offerings, newOff]);
    setOfferingTitle('');
    setOfferingPrice('');
    setOfferingDesc('');
    setIsOfferingModalOpen(false);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !onUpdateClients) return;
    const newCli: MarilunaClient = {
      id: 'cli-' + Date.now(),
      name: clientName.trim(),
      company: clientCompany.trim() || undefined,
      email: clientEmail.trim() || undefined,
      status: clientStatus,
      createdAt: todayStr,
    };
    onUpdateClients([...clients, newCli]);
    setClientName('');
    setClientCompany('');
    setClientEmail('');
    setIsClientModalOpen(false);
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
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Actieve Projecten' : 'Active Projects'}</span>
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {marilunaProjects.filter((p) => p.status === 'active').length} {isNl ? 'lopend' : 'active'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {marilunaProjects.length === 0
                  ? isNl ? 'Nog geen projecten' : 'No projects yet'
                  : `${marilunaProjects.length} ${isNl ? 'projecten in totaal' : 'total projects'}`}
              </p>
            </div>

            <div
              onClick={() => setActiveSubTab('content')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Content Pijplijn' : 'Content Pipeline'}</span>
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {contentPlan.posts.length} {isNl ? 'stukken vastgelegd' : 'pieces captured'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {contentPlan.posts.filter((p) => p.status === 'ready').length} {isNl ? 'klaar voor publicatie' : 'ready to publish'}
              </p>
            </div>

            <div
              onClick={() => setActiveSubTab('admin')}
              className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] hover:border-[#8C7654] transition cursor-pointer space-y-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#8C7654] font-medium uppercase tracking-wider">
                <span>{isNl ? 'Boekhouding & Deadlines' : 'Admin Deadlines'}</span>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <div className="font-serif text-lg text-[#2C2825]">
                {adminState.deadlines.filter((d) => !d.completed).length} {isNl ? 'deadlines komend' : 'deadlines upcoming'}
              </div>
              <p className="text-[11px] text-[#7A7167]">
                {adminState.invoices.filter((i) => i.status === 'sent').length} {isNl ? 'openstaande facturen' : 'open invoices'}
              </p>
            </div>
          </div>

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
                    {isNl ? 'Aankomende Deadlines' : 'Upcoming Deadlines'}
                  </h3>
                </div>
              </div>

              {adminState.deadlines.length === 0 && marilunaProjects.filter((p) => p.deadline).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8377] italic">
                  {isNl ? 'Geen aankomende zakelijke deadlines.' : 'No upcoming deadlines.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {adminState.deadlines.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-[#2C2825]">{d.title}</span>
                      <span className="text-[10px] font-mono text-[#7A7167] bg-[#F4EFE6] px-2 py-0.5 rounded-md">
                        {d.dueDate}
                      </span>
                    </div>
                  ))}
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
          onOpenSparring={handleSparringOpen}
          isNl={isNl}
        />
      )}

      {/* ============================================================ */}
      {/* 3. PROJECTEN                                                 */}
      {/* ============================================================ */}
      {activeSubTab === 'projects' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Zakelijke Projecten' : 'Studio Projects'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl ? 'Strategische lanceringen en klantopdrachten.' : 'Active ventures and client engagements.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Nieuw Project' : 'New Project'}</span>
            </button>
          </div>

          {marilunaProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen projecten.' : 'No projects recorded yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsProjectModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Start je eerste project' : '+ Start your first project'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marilunaProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-serif text-base font-medium text-[#2C2825]">{proj.title}</h4>
                      {proj.description && (
                        <p className="text-xs text-[#7A7167] mt-0.5 leading-relaxed">
                          {proj.description}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#554C42] shrink-0">
                      {proj.status}
                    </span>
                  </div>

                  {proj.deadline && (
                    <div className="flex items-center gap-1.5 text-xs text-[#8C7654]">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isNl ? 'Deadline' : 'Deadline'}: {proj.deadline}</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-[#7A7167]">
                      <span>{isNl ? 'Voortgang' : 'Progress'}</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#E5DFD3] overflow-hidden">
                      <div
                        className="h-full bg-[#7E694E] rounded-full transition-all"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Project Modal */}
          {isProjectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Nieuw Mariluna Project' : 'New Project'}
                </h3>
                <form onSubmit={handleCreateProject} className="space-y-3">
                  <input
                    type="text"
                    placeholder={isNl ? 'Projectnaam' : 'Project title'}
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    autoFocus
                  />
                  <textarea
                    rows={2}
                    placeholder={isNl ? 'Korte beschrijving van doel en scope...' : 'Short description...'}
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <input
                    type="date"
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsProjectModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!newProjectTitle.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
                    >
                      {isNl ? 'Aanmaken' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. ADMIN & BOEKHOUDING                                       */}
      {/* ============================================================ */}
      {activeSubTab === 'admin' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Admin & Boekhouding' : 'Bookkeeping & Administrative Horizon'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl
                  ? 'Handmatig vastgelegde facturen, uitgaven en fiscale deadlines zonder fictieve schattingen.'
                  : 'Manually tracked invoices, expenses, and tax deadlines.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer w-fit"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Boeking of Deadline Toevoegen' : 'Add Entry'}</span>
            </button>
          </div>

          {/* Three Cards: Invoices, Expenses, Deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoices */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                  {isNl ? 'Facturen' : 'Invoices'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#554C42]">
                  {adminState.invoices.length}
                </span>
              </div>
              {adminState.invoices.length === 0 ? (
                <p className="text-xs text-[#8C8377] italic py-6 text-center">
                  {isNl ? 'Nog geen facturen geregistreerd.' : 'No invoices recorded.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {adminState.invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-[#2C2825]">{inv.clientName}</div>
                        <div className="text-[10px] text-[#7A7167]">{inv.invoiceNumber}</div>
                      </div>
                      <span className="font-mono font-medium text-[#2C2825]">€{inv.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                  {isNl ? 'Uitgaven' : 'Expenses'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#554C42]">
                  {adminState.expenses.length}
                </span>
              </div>
              {adminState.expenses.length === 0 ? (
                <p className="text-xs text-[#8C8377] italic py-6 text-center">
                  {isNl ? 'Nog geen uitgaven geregistreerd.' : 'No expenses recorded.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {adminState.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-medium text-[#2C2825]">{exp.description}</div>
                        <div className="text-[10px] text-[#7A7167] capitalize">{exp.category}</div>
                      </div>
                      <span className="font-mono text-[#A64A38]">-€{exp.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tax & Legal Deadlines */}
            <div className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE3D4]">
                <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                  {isNl ? 'Fiscale Deadlines' : 'Tax Deadlines'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAE2D3] text-[#554C42]">
                  {adminState.deadlines.length}
                </span>
              </div>
              {adminState.deadlines.length === 0 ? (
                <p className="text-xs text-[#8C8377] italic py-6 text-center">
                  {isNl ? 'Nog geen deadlines vastgelegd.' : 'No tax deadlines recorded.'}
                </p>
              ) : (
                <div className="space-y-2">
                  {adminState.deadlines.map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E1D3] text-xs flex justify-between items-center"
                    >
                      <span className="font-medium text-[#2C2825]">{d.title}</span>
                      <span className="text-[10px] font-mono text-[#7A7167] bg-[#F5EFE5] px-2 py-0.5 rounded-md">
                        {d.dueDate}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Admin Modal */}
          {isAdminModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Nieuwe Boeking of Deadline' : 'Add Financial Entry'}
                </h3>
                <div className="flex rounded-xl bg-[#EFE9DD] p-1 text-xs">
                  {(['invoice', 'expense', 'deadline'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAdminType(type)}
                      className={`flex-1 py-1 rounded-lg transition capitalize ${
                        adminType === type
                          ? 'bg-[#FFFFFF] text-[#2C2825] font-medium shadow-xs'
                          : 'text-[#7A7167]'
                      }`}
                    >
                      {type === 'invoice' ? (isNl ? 'Factuur' : 'Invoice') : type === 'expense' ? (isNl ? 'Uitgave' : 'Expense') : 'Deadline'}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSaveAdminEntry} className="space-y-3">
                  {adminType === 'invoice' && (
                    <>
                      <input
                        type="text"
                        placeholder={isNl ? 'Klantnaam' : 'Client name'}
                        value={invoiceClient}
                        onChange={(e) => setInvoiceClient(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                        autoFocus
                      />
                      <input
                        type="number"
                        placeholder={isNl ? 'Bedrag in €' : 'Amount in €'}
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                      />
                      <input
                        type="date"
                        value={invoiceDueDate}
                        onChange={(e) => setInvoiceDueDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                      />
                    </>
                  )}

                  {adminType === 'expense' && (
                    <>
                      <input
                        type="text"
                        placeholder={isNl ? 'Omschrijving (bijv. Hosting, Software)' : 'Description'}
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                        autoFocus
                      />
                      <input
                        type="number"
                        placeholder={isNl ? 'Bedrag in €' : 'Amount in €'}
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                      />
                    </>
                  )}

                  {adminType === 'deadline' && (
                    <>
                      <input
                        type="text"
                        placeholder={isNl ? 'Titel deadline (bijv. BTW Aangifte Q3)' : 'Deadline title'}
                        value={deadlineTitle}
                        onChange={(e) => setDeadlineTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                        autoFocus
                      />
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                      />
                    </>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium"
                    >
                      {isNl ? 'Opslaan' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CIJFERS (Modular Business Metrics Area)                   */}
      {/* ============================================================ */}
      {activeSubTab === 'metrics' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Zakelijke Cijfers & KPI’s' : 'Business Metrics & Insights'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl
                  ? 'Modulair en optioneel. Voer uitsluitend getallen in die voor jou betekenisvol zijn.'
                  : 'Modular and optional business key numbers.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsMetricModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Cijfer Toevoegen' : 'Add Metric'}</span>
            </button>
          </div>

          {metricsState.metrics.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen cijfers ingevoerd.' : 'No metrics entered yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsMetricModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voer je eerste getal in (bijv. Omzetdoel, Boekingen)' : '+ Record your first metric'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {metricsState.metrics.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-1.5 shadow-xs"
                >
                  <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
                    {m.period || '2026'}
                  </span>
                  <div className="font-serif text-2xl text-[#2C2825]">
                    {m.unit === '€' ? `€${m.value}` : `${m.value} ${m.unit || ''}`}
                  </div>
                  <div className="text-xs text-[#6B6154] font-medium">{m.name}</div>
                </div>
              ))}
            </div>
          )}

          {/* Metric Modal */}
          {isMetricModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Cijfer of KPI Toevoegen' : 'Add Metric'}
                </h3>
                <form onSubmit={handleSaveMetric} className="space-y-3">
                  <input
                    type="text"
                    placeholder={isNl ? 'Metrieknaam (bijv. Kwartaalomzet, Boekingen)' : 'Metric name'}
                    value={metricName}
                    onChange={(e) => setMetricName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={isNl ? 'Waarde (bijv. 4500)' : 'Value'}
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                    <input
                      type="text"
                      placeholder="Eenheid (bijv. €, stuks)"
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsMetricModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!metricName.trim() || !metricValue.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
                    >
                      {isNl ? 'Opslaan' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
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
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Strategische Doelen & Focus' : 'Strategic Horizon & Goals'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl ? 'Jaardoelen, kwartaaldoelen en zakelijke focus.' : 'Yearly objectives and strategic quarters.'}
              </p>
            </div>
          </div>

          {marilunaGoals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen zakelijke doelen gedefinieerd.' : 'No business goals recorded yet.'}
              </p>
              <p className="text-xs text-[#8C8377]">
                {isNl ? 'Voeg zakelijke doelen toe via de Doelen-tab of bespreek ze met Alchemy.' : 'Add goals via Goals tab or discuss with Alchemy.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {marilunaGoals.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-2.5 shadow-xs"
                >
                  <h4 className="font-serif text-base text-[#2C2825] font-medium">{g.title}</h4>
                  {g.description && <p className="text-xs text-[#7A7167]">{g.description}</p>}
                  {g.targetDate && (
                    <div className="text-[10px] font-mono text-[#8C7654]">
                      {isNl ? 'Doeldatum' : 'Target'}: {g.targetDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. PRODUCTEN & DIENSTEN                                      */}
      {/* ============================================================ */}
      {activeSubTab === 'offerings' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
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
              onClick={() => setIsOfferingModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Aanbod Toevoegen' : 'Add Offering'}</span>
            </button>
          </div>

          {offerings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen producten of diensten toegevoegd.' : 'No offerings added yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsOfferingModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voeg je eerste dienst of product toe' : '+ Add your first service or product'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {offerings.map((off) => (
                <div
                  key={off.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-base font-medium text-[#2C2825]">{off.title}</h4>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#554C42]">
                      {off.type}
                    </span>
                  </div>
                  {off.description && (
                    <p className="text-xs text-[#7A7167] leading-relaxed">{off.description}</p>
                  )}
                  <div className="font-mono text-sm font-semibold text-[#2C2825] pt-1">
                    €{off.price}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Offering Modal */}
          {isOfferingModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Dienst of Product Toevoegen' : 'Add Offering'}
                </h3>
                <form onSubmit={handleSaveOffering} className="space-y-3">
                  <input
                    type="text"
                    placeholder={isNl ? 'Titel dienst / product' : 'Offering title'}
                    value={offeringTitle}
                    onChange={(e) => setOfferingTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={offeringType}
                      onChange={(e) => setOfferingType(e.target.value as any)}
                      className="w-full px-2 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    >
                      <option value="service">{isNl ? 'Dienst' : 'Service'}</option>
                      <option value="package">{isNl ? 'Pakket' : 'Package'}</option>
                      <option value="bespoke">{isNl ? 'Maatwerk' : 'Bespoke'}</option>
                      <option value="product">{isNl ? 'Product' : 'Product'}</option>
                    </select>
                    <input
                      type="number"
                      placeholder={isNl ? 'Prijs in €' : 'Price in €'}
                      value={offeringPrice}
                      onChange={(e) => setOfferingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder={isNl ? 'Beschrijving of deliverables...' : 'Description...'}
                    value={offeringDesc}
                    onChange={(e) => setOfferingDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOfferingModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!offeringTitle.trim() || offeringPrice === ''}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
                    >
                      {isNl ? 'Opslaan' : 'Save'}
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
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-normal text-[#2C2825]">
                {isNl ? 'Klanten & Relaties' : 'Clients & Relationships'}
              </h2>
              <p className="text-xs text-[#7A7167] mt-0.5">
                {isNl ? 'Cliëntenoverzicht en contactgegevens.' : 'Client contacts and active accounts.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsClientModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Klant Toevoegen' : 'Add Client'}</span>
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DCD3C4] p-10 text-center space-y-2">
              <p className="text-xs text-[#7A7167] italic">
                {isNl ? 'Nog geen klanten toegevoegd.' : 'No clients recorded yet.'}
              </p>
              <button
                type="button"
                onClick={() => setIsClientModalOpen(true)}
                className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer"
              >
                {isNl ? '+ Voeg je eerste klant toe' : '+ Add your first client'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {clients.map((cli) => (
                <div
                  key={cli.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-4 space-y-2 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-base font-medium text-[#2C2825]">{cli.name}</h4>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#554C42]">
                      {cli.status}
                    </span>
                  </div>
                  {cli.company && (
                    <div className="text-xs text-[#7A7167] flex items-center gap-1">
                      <Building className="w-3 h-3 text-[#8C7654]" />
                      <span>{cli.company}</span>
                    </div>
                  )}
                  {cli.email && <div className="text-xs text-[#8C7654]">{cli.email}</div>}
                </div>
              ))}
            </div>
          )}

          {/* Client Modal */}
          {isClientModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Klant Toevoegen' : 'Add Client'}
                </h3>
                <form onSubmit={handleSaveClient} className="space-y-3">
                  <input
                    type="text"
                    placeholder={isNl ? 'Naam klant / contactpersoon' : 'Client name'}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder={isNl ? 'Bedrijfsnaam (optioneel)' : 'Company (optional)'}
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <input
                    type="email"
                    placeholder="Email (optioneel)"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsClientModalOpen(false)}
                      className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167]"
                    >
                      {isNl ? 'Annuleren' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!clientName.trim()}
                      className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium disabled:opacity-40"
                    >
                      {isNl ? 'Opslaan' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
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
