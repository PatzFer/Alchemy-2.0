import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Calendar as CalendarIcon,
  Filter,
  Search,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  Settings,
  X,
  Sparkles,
  Archive,
  ExternalLink,
  ChevronRight,
  Grid,
  List,
} from 'lucide-react';
import {
  ContentPlan,
  ContentPost,
  ContentPillar,
  ContentStatus,
  Project,
  Idea,
} from '../../types';
import {
  normalizePillars,
  getPillarName,
  normalizePlatforms,
  DEFAULT_FORMATS,
  CONTENT_STATUSES,
  getStatusLabel,
} from './pillarUtils';

interface MarilunaContentSectionProps {
  contentPlan: ContentPlan;
  onUpdateContentPlan: (plan: ContentPlan) => void;
  onAddContentPost: (post: Partial<ContentPost>) => void;
  projects: Project[];
  ideas: Idea[];
  onOpenSparring?: (idea: Idea) => void;
  isNl?: boolean;
}

type ViewMode = 'list' | 'pipeline' | 'calendar';

export const MarilunaContentSection: React.FC<MarilunaContentSectionProps> = ({
  contentPlan,
  onUpdateContentPlan,
  onAddContentPost,
  projects,
  ideas,
  onOpenSparring,
  isNl = true,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  // Post Modal (Create / Edit)
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);

  // Post Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPillar, setFormPillar] = useState('');
  const [formFormat, setFormFormat] = useState('Carousel');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formScheduledDate, setFormScheduledDate] = useState('');
  const [formStatus, setFormStatus] = useState<ContentStatus>('draft');
  const [formCampaign, setFormCampaign] = useState('');
  const [formPriority, setFormPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [formProjectId, setFormProjectId] = useState('');
  const [formIdeaId, setFormIdeaId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Pillar Management Modal
  const [isPillarsModalOpen, setIsPillarsModalOpen] = useState(false);
  const [newPillarName, setNewPillarName] = useState('');
  const [newPillarDesc, setNewPillarDesc] = useState('');
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);
  const [editingPillarName, setEditingPillarName] = useState('');
  const [editingPillarDesc, setEditingPillarDesc] = useState('');

  // Platform Management Modal
  const [isPlatformsModalOpen, setIsPlatformsModalOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState('');

  // Normalized Pillars & Platforms
  const activePillars = useMemo(
    () => normalizePillars(contentPlan.pillars),
    [contentPlan.pillars]
  );

  const activePlatforms = useMemo(
    () => normalizePlatforms(contentPlan.platforms),
    [contentPlan.platforms]
  );

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    return (contentPlan.posts || []).filter((post) => {
      // Exclude archived by default unless specifically selected
      if (statusFilter !== 'archived' && post.status === 'archived') return false;

      // Status filter
      if (statusFilter !== 'all' && post.status !== statusFilter) return false;

      // Pillar filter
      if (pillarFilter !== 'all' && post.pillar !== pillarFilter) return false;

      // Platform filter
      if (platformFilter !== 'all' && post.platform !== platformFilter) return false;

      // Project filter
      if (projectFilter !== 'all' && post.relatedProjectId !== projectFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = post.title.toLowerCase().includes(q);
        const matchesDesc = post.description ? post.description.toLowerCase().includes(q) : false;
        const matchesNotes = post.notes ? post.notes.toLowerCase().includes(q) : false;
        const matchesCampaign = post.campaign ? post.campaign.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesDesc && !matchesNotes && !matchesCampaign) return false;
      }

      return true;
    });
  }, [contentPlan.posts, statusFilter, pillarFilter, platformFilter, projectFilter, searchQuery]);

  // Sort chronological
  const sortedChronologicalPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return 0;
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return a.scheduledDate.localeCompare(b.scheduledDate);
    });
  }, [filteredPosts]);

  // CONTENT BALANCE COMPUTATION (Real metrics, no fabrication)
  const balanceAnalytics = useMemo(() => {
    const posts = contentPlan.posts || [];
    const plannedOrReady = posts.filter(
      (p) => p.status === 'planned' || p.status === 'ready' || p.status === 'draft' || p.status === 'drafted'
    );
    const todayStr = new Date().toISOString().split('T')[0];

    // Upcoming posts
    const upcomingPosts = posts
      .filter((p) => p.scheduledDate && p.scheduledDate >= todayStr && p.status !== 'archived')
      .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));

    const nextPost = upcomingPosts[0];

    // Pillar distribution
    const pillarCounts: Record<string, number> = {};
    activePillars.forEach((p) => {
      pillarCounts[p.name] = 0;
    });
    posts.forEach((p) => {
      if (p.pillar) {
        pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1;
      }
    });

    // Active platforms
    const platformCounts: Record<string, number> = {};
    posts.forEach((p) => {
      if (p.platform) {
        platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
      }
    });

    return {
      totalPosts: posts.length,
      plannedCount: plannedOrReady.length,
      publishedCount: posts.filter((p) => p.status === 'published').length,
      nextPostDate: nextPost ? nextPost.scheduledDate : null,
      nextPostTitle: nextPost ? nextPost.title : null,
      pillarCounts,
      platformCounts,
    };
  }, [contentPlan.posts, activePillars]);

  // Handle Post Modal Open (New or Edit)
  const handleOpenNewPost = () => {
    setEditingPost(null);
    setFormTitle('');
    setFormDescription('');
    setFormPillar(activePillars[0]?.name || '');
    setFormFormat('Carousel');
    setFormPlatform(activePlatforms[0] || 'Instagram');
    setFormScheduledDate('');
    setFormStatus('draft');
    setFormCampaign('');
    setFormPriority('normal');
    setFormProjectId('');
    setFormIdeaId('');
    setFormNotes('');
    setIsPostModalOpen(true);
  };

  const handleEditPost = (post: ContentPost) => {
    setEditingPost(post);
    setFormTitle(post.title);
    setFormDescription(post.description || '');
    setFormPillar(post.pillar || activePillars[0]?.name || '');
    setFormFormat(post.format || 'Carousel');
    setFormPlatform(post.platform || 'Instagram');
    setFormScheduledDate(post.scheduledDate || '');
    setFormStatus(post.status);
    setFormCampaign(post.campaign || '');
    setFormPriority(post.priority || 'normal');
    setFormProjectId(post.relatedProjectId || '');
    setFormIdeaId(post.relatedIdeaId || '');
    setFormNotes(post.notes || '');
    setIsPostModalOpen(true);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const postPayload: ContentPost = {
      id: editingPost ? editingPost.id : 'cp-' + Date.now(),
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      pillar: formPillar || (activePillars[0]?.name || 'Algemeen'),
      format: formFormat,
      platform: formPlatform,
      scheduledDate: formScheduledDate || undefined,
      status: formStatus,
      campaign: formCampaign.trim() || undefined,
      priority: formPriority,
      relatedProjectId: formProjectId || undefined,
      relatedIdeaId: formIdeaId || undefined,
      notes: formNotes.trim() || undefined,
      createdAt: editingPost?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (editingPost) {
      // Update existing post
      const updatedPosts = contentPlan.posts.map((p) =>
        p.id === editingPost.id ? postPayload : p
      );
      onUpdateContentPlan({
        ...contentPlan,
        posts: updatedPosts,
      });
    } else {
      // Add new post
      onAddContentPost(postPayload);
    }

    setIsPostModalOpen(false);
  };

  const handleDeletePost = (postId: string) => {
    const updated = contentPlan.posts.filter((p) => p.id !== postId);
    onUpdateContentPlan({
      ...contentPlan,
      posts: updated,
    });
  };

  // Pillar management actions
  const handleAddPillar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPillarName.trim()) return;

    const newPillarObj: ContentPillar = {
      id: 'pillar-' + Date.now(),
      name: newPillarName.trim(),
      description: newPillarDesc.trim() || undefined,
      archived: false,
    };

    const updatedPillars = [...activePillars, newPillarObj];
    onUpdateContentPlan({
      ...contentPlan,
      pillars: updatedPillars,
    });

    setNewPillarName('');
    setNewPillarDesc('');
  };

  const handleUpdatePillar = (pillarId: string) => {
    if (!editingPillarName.trim()) return;
    const updatedPillars = activePillars.map((p) => {
      if (p.id === pillarId) {
        return {
          ...p,
          name: editingPillarName.trim(),
          description: editingPillarDesc.trim() || undefined,
        };
      }
      return p;
    });

    onUpdateContentPlan({
      ...contentPlan,
      pillars: updatedPillars,
    });
    setEditingPillarId(null);
  };

  const handleArchivePillar = (pillarId: string) => {
    const updatedPillars = activePillars.map((p) => {
      if (p.id === pillarId) {
        return { ...p, archived: !p.archived };
      }
      return p;
    });
    onUpdateContentPlan({
      ...contentPlan,
      pillars: updatedPillars,
    });
  };

  const handleDeletePillar = (pillarId: string) => {
    const updatedPillars = activePillars.filter((p) => p.id !== pillarId);
    onUpdateContentPlan({
      ...contentPlan,
      pillars: updatedPillars,
    });
  };

  // Platform management actions
  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatformName.trim()) return;
    const clean = newPlatformName.trim();
    if (!activePlatforms.includes(clean)) {
      const updated = [...activePlatforms, clean];
      onUpdateContentPlan({
        ...contentPlan,
        platforms: updated,
      });
    }
    setNewPlatformName('');
  };

  const handleDeletePlatform = (platformToDelete: string) => {
    const updated = activePlatforms.filter((p) => p !== platformToDelete);
    onUpdateContentPlan({
      ...contentPlan,
      platforms: updated,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Mariluna Contentplanner' : 'Mariluna Content Planner'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5">
            {contentPlan.monthlyTheme
              ? `${isNl ? 'Maandthema' : 'Monthly Focus'}: "${contentPlan.monthlyTheme}"`
              : isNl
              ? 'Redactionele regie, kanaalbalans en publicatieplanning.'
              : 'Editorial stewardship and channel balance.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPillarsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#554C42] hover:bg-[#F2ECE1] transition shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? 'Pijlers beheren' : 'Manage Pillars'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPlatformsModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#554C42] hover:bg-[#F2ECE1] transition shadow-2xs cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? 'Kanalen beheren' : 'Platforms'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNewPost}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? '+ Nieuwe Content' : '+ New Content'}</span>
          </button>
        </div>
      </div>

      {/* CONTENT BALANCE SUMMARY CARD */}
      <div className="rounded-3xl border border-[#D5C6AF] bg-[#FAF8F3] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-[#8C7654]" />
            <span>{isNl ? 'Contentbalans & Publicatieritme' : 'Content Balance & Cadence'}</span>
          </div>
          <span className="text-[11px] text-[#7A7167]">
            {balanceAnalytics.plannedCount} {isNl ? 'gepland / in draft' : 'planned / drafted'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D3] space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
              {isNl ? 'Totaal Berichten' : 'Total Pieces'}
            </span>
            <div className="font-serif text-2xl text-[#2C2825]">
              {balanceAnalytics.totalPosts}
            </div>
            <span className="text-[10px] text-[#7A7167] block">
              {balanceAnalytics.publishedCount} {isNl ? 'gepubliceerd' : 'published'}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D3] space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block">
              {isNl ? 'Eerstvolgende Publicatie' : 'Next Scheduled'}
            </span>
            <div className="font-serif text-lg text-[#2C2825] truncate">
              {balanceAnalytics.nextPostDate ? balanceAnalytics.nextPostDate : '—'}
            </div>
            <span className="text-[10px] text-[#7A7167] block truncate">
              {balanceAnalytics.nextPostTitle || (isNl ? 'Geen data gepland' : 'No upcoming dates')}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E1D3] space-y-1 shadow-2xs col-span-2 sm:col-span-2">
            <span className="text-[10px] uppercase font-semibold text-[#8C7654] tracking-wider block mb-1">
              {isNl ? 'Pijlerverdeling' : 'Pillar Distribution'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activePillars.map((p) => {
                const count = balanceAnalytics.pillarCounts[p.name] || 0;
                return (
                  <span
                    key={p.id}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#DDD4C5] text-[#554C42] flex items-center gap-1"
                  >
                    <span>{p.name}:</span>
                    <strong className="text-[#2C2825]">{count}</strong>
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* VIEW TOGGLES & SEARCH + FILTER BAR */}
      <div className="bg-[#FAF8F3] p-3 rounded-2xl border border-[#E5DFD3] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Mode Toggle: List (Mobile Priority) vs Pipeline vs Calendar */}
          <div className="flex rounded-xl bg-[#EFE9DD] p-1 text-xs self-start">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                viewMode === 'list'
                  ? 'bg-[#FFFFFF] text-[#2C2825] font-medium shadow-2xs'
                  : 'text-[#7A7167]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{isNl ? 'Lijstweergave' : 'List View'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                viewMode === 'pipeline'
                  ? 'bg-[#FFFFFF] text-[#2C2825] font-medium shadow-2xs'
                  : 'text-[#7A7167]'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{isNl ? 'Pijplijn' : 'Pipeline'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                viewMode === 'calendar'
                  ? 'bg-[#FFFFFF] text-[#2C2825] font-medium shadow-2xs'
                  : 'text-[#7A7167]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{isNl ? 'Kalender' : 'Calendar'}</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#8C8377]" />
            <input
              type="text"
              placeholder={isNl ? 'Zoek in content...' : 'Search content...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#EAE3D5]">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
          >
            <option value="all">{isNl ? 'Alle statussen' : 'All statuses'}</option>
            {CONTENT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Pillar filter */}
          {activePillars.length > 0 && (
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            >
              <option value="all">{isNl ? 'Alle pijlers' : 'All pillars'}</option>
              {activePillars.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Platform filter */}
          {activePlatforms.length > 0 && (
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
            >
              <option value="all">{isNl ? 'Alle kanalen' : 'All platforms'}</option>
              {activePlatforms.map((plat) => (
                <option key={plat} value={plat}>
                  {plat}
                </option>
              ))}
            </select>
          )}

          {/* Project filter */}
          {projects.filter((p) => p.realm === 'mariluna').length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
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
            {filteredPosts.length} {isNl ? 'berichten' : 'pieces'}
          </span>
        </div>
      </div>

      {/* VIEW: 1. LIST VIEW (MOBILE FIRST) */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedChronologicalPosts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DCD3C4] p-12 text-center space-y-3 bg-[#FAF8F3]/50">
              <FileText className="w-8 h-8 text-[#8C7654] mx-auto opacity-50" />
              <h3 className="font-serif text-base font-medium text-[#2C2825]">
                {isNl ? 'Nog geen content gepland.' : 'No content planned yet.'}
              </h3>
              <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
                {isNl
                  ? 'Plan je eerste contentbericht of zet een idee uit de Idea Sanctuary om.'
                  : 'Schedule your first piece or convert a spark from the sanctuary.'}
              </p>
              <button
                type="button"
                onClick={handleOpenNewPost}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>+ Nieuw Contentbericht</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedChronologicalPosts.map((post) => {
                const connectedIdea = ideas.find((i) => i.id === post.relatedIdeaId);
                const connectedProject = projects.find((p) => p.id === post.relatedProjectId);

                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E3DBD0] shadow-2xs hover:border-[#D5C6AF] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4EFE6] text-[#6B5E4E]">
                          {getStatusLabel(post.status)}
                        </span>
                        <span className="text-[10px] font-medium text-[#8C7654] bg-[#FAF8F3] border border-[#E8E1D3] px-2 py-0.5 rounded-md">
                          {post.platform}
                        </span>
                        {post.format && (
                          <span className="text-[10px] text-[#7A7167]">
                            • {post.format}
                          </span>
                        )}
                        {post.pillar && (
                          <span className="text-[10px] text-[#7A7167] bg-[#F7F4EE] px-1.5 py-0.5 rounded">
                            {post.pillar}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-sm sm:text-base font-semibold text-[#2C2825]">
                        {post.title}
                      </h3>

                      {post.description && (
                        <p className="text-xs text-[#7A7167] line-clamp-2">
                          {post.description}
                        </p>
                      )}

                      {/* Relationships & Meta */}
                      <div className="flex items-center gap-3 text-[11px] text-[#8C8377] flex-wrap pt-0.5">
                        {post.scheduledDate && (
                          <span className="flex items-center gap-1 font-mono text-[#554C42]">
                            <CalendarIcon className="w-3 h-3 text-[#8C7654]" />
                            {post.scheduledDate}
                          </span>
                        )}
                        {post.campaign && (
                          <span>Campagne: <strong>{post.campaign}</strong></span>
                        )}
                        {connectedIdea && (
                          <span className="text-[#8C7654]">
                            ↳ Idee: <em>{connectedIdea.title}</em>
                          </span>
                        )}
                        {connectedProject && (
                          <span>
                            ↳ Project: <em>{connectedProject.title}</em>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditPost(post)}
                        className="p-1.5 rounded-xl border border-[#DDD4C5] text-[#554C42] hover:bg-[#F2ECE1] transition cursor-pointer"
                        title="Bewerken"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-xl border border-[#DDD4C5] text-[#8C8377] hover:text-[#9A3412] hover:bg-[#FBEAE5] transition cursor-pointer"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW: 2. PIPELINE BOARD (Editorial Stages) */}
      {viewMode === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-4">
          {(['idea', 'draft', 'planned', 'ready', 'published'] as const).map((stage) => {
            const postsInStage = filteredPosts.filter((p) => {
              if (stage === 'draft') return p.status === 'draft' || p.status === 'drafted';
              return p.status === stage;
            });

            return (
              <div
                key={stage}
                className="rounded-2xl border border-[#E8E1D4] bg-[#FAF8F4] p-3 flex flex-col space-y-2.5 min-w-[220px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#EDE7DC]">
                  <span className="text-xs font-semibold text-[#2C2825] uppercase tracking-wider">
                    {getStatusLabel(stage)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAE4D7] text-[#554C42] font-semibold">
                    {postsInStage.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {postsInStage.length === 0 ? (
                    <p className="text-[11px] text-[#9A9084] italic py-6 text-center">
                      {isNl ? 'Geen berichten' : 'No posts'}
                    </p>
                  ) : (
                    postsInStage.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleEditPost(p)}
                        className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3DBD0] shadow-2xs space-y-1.5 cursor-pointer hover:border-[#8C7654] transition"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#8C7654] font-medium">
                          <span>{p.platform}</span>
                          {p.scheduledDate && <span>{p.scheduledDate}</span>}
                        </div>
                        <h4 className="font-serif text-xs font-medium text-[#2C2825] leading-snug">
                          {p.title}
                        </h4>
                        {p.pillar && (
                          <span className="inline-block text-[9px] text-[#7A7167] bg-[#F4EFE6] px-1.5 py-0.5 rounded">
                            {p.pillar}
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: 3. CALENDAR OVERVIEW */}
      {viewMode === 'calendar' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F3] border border-[#E5DFD3] space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[#2C2825]">
              {isNl ? 'Chronologisch Publicatierooster' : 'Publication Schedule'}
            </h3>
            {sortedChronologicalPosts.filter((p) => p.scheduledDate).length === 0 ? (
              <p className="text-xs text-[#7A7167] italic py-6 text-center">
                {isNl
                  ? 'Er zijn nog geen publicatiedatums ingevuld bij de berichten.'
                  : 'No scheduled publication dates set yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedChronologicalPosts
                  .filter((p) => p.scheduledDate)
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleEditPost(p)}
                      className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E3DBD0] flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-[#8C7654] transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-semibold text-[#8C7654] bg-[#FAF8F3] border border-[#DDD4C5] px-2.5 py-1 rounded-lg shrink-0">
                          {p.scheduledDate}
                        </span>
                        <div>
                          <div className="font-serif font-medium text-[#2C2825]">{p.title}</div>
                          <div className="text-[10px] text-[#7A7167]">
                            {p.platform} • {p.pillar}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#EFE8DC] text-[#554C42] shrink-0">
                        {getStatusLabel(p.status)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POST MODAL (CREATE & EDIT)                                   */}
      {/* ============================================================ */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D5]">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {editingPost
                  ? isNl
                    ? 'Contentbericht Bewerken'
                    : 'Edit Content Piece'
                  : isNl
                  ? 'Nieuw Contentbericht Plannen'
                  : 'Draft New Content'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPostModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                  {isNl ? 'Titel / Werktitel *' : 'Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isNl ? 'bijv. Waarom soevereiniteit begint bij rust' : 'Title...'}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                  {isNl ? 'Korte Omschrijving / Hook' : 'Description / Hook'}
                </label>
                <textarea
                  rows={2}
                  placeholder={isNl ? 'Inhoudelijke kern, insteek of hook...' : 'Core message or hook...'}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                    {isNl ? 'Platform / Kanaal' : 'Platform'}
                  </label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value)}
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
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value)}
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
                    {isNl ? 'Content Pijler' : 'Pillar'}
                  </label>
                  <select
                    value={formPillar}
                    onChange={(e) => setFormPillar(e.target.value)}
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
                    {isNl ? 'Status' : 'Status'}
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as ContentStatus)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="idea">IDEA (Idee)</option>
                    <option value="draft">DRAFT (In Uitwerking)</option>
                    <option value="planned">PLANNED (Gepland)</option>
                    <option value="ready">READY (Klaar voor publicatie)</option>
                    <option value="published">PUBLISHED (Gepubliceerd)</option>
                    <option value="archived">ARCHIVED (Gearchiveerd)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                    {isNl ? 'Publicatiedatum' : 'Publish Date'}
                  </label>
                  <input
                    type="date"
                    value={formScheduledDate}
                    onChange={(e) => setFormScheduledDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                    {isNl ? 'Campagne (optioneel)' : 'Campaign'}
                  </label>
                  <input
                    type="text"
                    placeholder="bijv. Q4 Lancering"
                    value={formCampaign}
                    onChange={(e) => setFormCampaign(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              {/* Related Project & Idea */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                    {isNl ? 'Gekoppeld Project' : 'Related Project'}
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="">{isNl ? 'Geen project' : 'None'}</option>
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
                  <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                    {isNl ? 'Voortgekomen uit Idee' : 'Originated from Idea'}
                  </label>
                  <select
                    value={formIdeaId}
                    onChange={(e) => setFormIdeaId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="">{isNl ? 'Geen idee' : 'None'}</option>
                    {ideas
                      .filter((i) => i.realm === 'mariluna')
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block mb-1">
                  {isNl ? 'Notities & Uitwerking' : 'Notes & Draft Text'}
                </label>
                <textarea
                  rows={3}
                  placeholder={isNl ? 'Notities, copy, hashtags, visuele instructies...' : 'Draft text, visual notes...'}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#EAE3D5]">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EAE4D7] transition cursor-pointer"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
                >
                  {isNl ? 'Opslaan' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PILLARS MODAL (ADD / RENAME / ARCHIVE)                        */}
      {/* ============================================================ */}
      {isPillarsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D5]">
              <div>
                <h3 className="font-serif text-lg text-[#2C2825]">
                  {isNl ? 'Content Pijlers Beheren' : 'Manage Content Pillars'}
                </h3>
                <p className="text-xs text-[#7A7167]">
                  {isNl
                    ? 'Bepaal zelf de thematische fundamenten van je studio.'
                    : 'Configure your own thematic editorial pillars.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPillarsModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Pillars List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activePillars.map((pillar) => (
                <div
                  key={pillar.id}
                  className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] flex items-center justify-between gap-2 text-xs shadow-2xs"
                >
                  {editingPillarId === pillar.id ? (
                    <div className="space-y-2 flex-1">
                      <input
                        type="text"
                        value={editingPillarName}
                        onChange={(e) => setEditingPillarName(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#8C7654] text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Omschrijving (optioneel)"
                        value={editingPillarDesc}
                        onChange={(e) => setEditingPillarDesc(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-[#DDD4C5] text-xs"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingPillarId(null)}
                          className="text-[11px] text-[#7A7167]"
                        >
                          Annuleren
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdatePillar(pillar.id)}
                          className="text-[11px] bg-[#2C2825] text-[#FAF8F3] px-2.5 py-0.5 rounded"
                        >
                          Opslaan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="font-medium text-[#2C2825] flex items-center gap-1.5">
                          <span>{pillar.name}</span>
                          {pillar.archived && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EAE5DF] text-[#7A7167]">
                              Gearchiveerd
                            </span>
                          )}
                        </div>
                        {pillar.description && (
                          <div className="text-[11px] text-[#7A7167] mt-0.5">
                            {pillar.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPillarId(pillar.id);
                            setEditingPillarName(pillar.name);
                            setEditingPillarDesc(pillar.description || '');
                          }}
                          className="p-1 text-[#554C42] hover:text-[#2C2825]"
                          title="Hernoemen"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchivePillar(pillar.id)}
                          className="p-1 text-[#7A7167] hover:text-[#2C2825]"
                          title={pillar.archived ? 'Dearchiveer' : 'Archiveer'}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePillar(pillar.id)}
                          className="p-1 text-[#8C8377] hover:text-[#9A3412]"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Pillar Form */}
            <form onSubmit={handleAddPillar} className="pt-3 border-t border-[#EAE3D5] space-y-2">
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block">
                + Nieuwe pijler toevoegen
              </label>
              <input
                type="text"
                required
                placeholder="Pijlernaam (bijv. Atelier & Creatie)..."
                value={newPillarName}
                onChange={(e) => setNewPillarName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
              <input
                type="text"
                placeholder="Optionele omschrijving of leidraad..."
                value={newPillarDesc}
                onChange={(e) => setNewPillarDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
              />
              <button
                type="submit"
                disabled={!newPillarName.trim()}
                className="w-full py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition disabled:opacity-40"
              >
                Pijler toevoegen
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PLATFORMS MODAL (CONFIGURABLE PLATFORMS)                      */}
      {/* ============================================================ */}
      {isPlatformsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D5]">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {isNl ? 'Kanalen & Platforms' : 'Manage Platforms'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPlatformsModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {activePlatforms.map((plat) => (
                <div
                  key={plat}
                  className="px-2.5 py-1 rounded-full bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{plat}</span>
                  <button
                    type="button"
                    onClick={() => handleDeletePlatform(plat)}
                    className="text-[#9A9084] hover:text-[#9A3412] cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddPlatform} className="pt-2 border-t border-[#EAE3D5] space-y-2">
              <label className="text-[10px] uppercase font-semibold text-[#7A6E60] block">
                + Kanaal toevoegen
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="bijv. Substack, TikTok..."
                  value={newPlatformName}
                  onChange={(e) => setNewPlatformName(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                />
                <button
                  type="submit"
                  disabled={!newPlatformName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition disabled:opacity-40"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
