import React, { useState } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Clock,
  Briefcase,
  CheckSquare,
  FileText,
  Lightbulb,
  Edit3,
  Trash2,
  CheckCircle2,
  Circle,
  Pause,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronRight,
  X,
  Layers,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  Goal,
  GoalTimeframe,
  GoalStatus,
  GoalMeasurableTarget,
  Project,
  Task,
  ContentPost,
  Idea,
  ContentPlan,
} from '../../types';

interface MarilunaStrategySectionProps {
  goals: Goal[];
  projects: Project[];
  tasks: Task[];
  contentPosts: ContentPost[];
  ideas: Idea[];
  contentPlan?: ContentPlan;
  onSaveGoal: (goal: Partial<Goal>) => void;
  onDeleteGoal?: (goalId: string) => void;
  onSaveProject: (project: Partial<Project>) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateContentPlan?: (plan: ContentPlan) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  onSelectProject?: (projectId: string) => void;
  isNl?: boolean;
}

export const MarilunaStrategySection: React.FC<MarilunaStrategySectionProps> = ({
  goals,
  projects,
  tasks,
  contentPosts,
  ideas,
  contentPlan,
  onSaveGoal,
  onDeleteGoal,
  onSaveProject,
  onToggleTask,
  onUpdateContentPlan,
  onOpenAssistantWithPrompt,
  onSelectProject,
  isNl = true,
}) => {
  // Domain isolation: only Mariluna items
  const marilunaGoals = goals.filter((g) => g.realm === 'mariluna');
  const marilunaProjects = projects.filter((p) => p.realm === 'mariluna' && p.status !== 'archived');
  const marilunaTasks = tasks.filter((t) => t.realm === 'mariluna');

  // Filters
  const [timeframeFilter, setTimeframeFilter] = useState<'all' | 'year' | 'quarter' | 'month' | 'custom'>('all');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Create / Edit Goal modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);

  // Optional strategic focus inline editor
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [strategicFocusText, setStrategicFocusText] = useState(
    contentPlan?.quarterTheme || ''
  );

  // Link project modal for a goal
  const [isLinkProjectOpen, setIsLinkProjectOpen] = useState(false);

  // Quick target fields inside editing modal
  const [hasMeasurableTarget, setHasMeasurableTarget] = useState(false);
  const [targetType, setTargetType] = useState<GoalMeasurableTarget['type']>('revenue');
  const [targetValue, setTargetValue] = useState<number>(0);
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [targetUnit, setTargetUnit] = useState<string>('€');
  const [customTargetLabel, setCustomTargetLabel] = useState<string>('');

  const selectedGoal = marilunaGoals.find((g) => g.id === selectedGoalId);

  // Helper for goal linked projects
  const getGoalProjects = (goal: Goal): Project[] => {
    return marilunaProjects.filter(
      (p) => p.goalId === goal.id || (goal.connectedProjectIds || []).includes(p.id)
    );
  };

  // Helper for goal linked tasks (directly or through linked projects)
  const getGoalTasks = (goal: Goal): Task[] => {
    const goalProjs = getGoalProjects(goal);
    const projIds = new Set(goalProjs.map((p) => p.id));
    return marilunaTasks.filter(
      (t) =>
        (goal.connectedTaskIds || []).includes(t.id) ||
        (t.projectId && projIds.has(t.projectId))
    );
  };

  // Helper for goal linked content (directly or through linked projects)
  const getGoalContent = (goal: Goal): ContentPost[] => {
    const goalProjs = getGoalProjects(goal);
    const projIds = new Set(goalProjs.map((p) => p.id));
    return contentPosts.filter(
      (cp) =>
        (goal.connectedContentIds || []).includes(cp.id) ||
        (cp.relatedProjectId && projIds.has(cp.relatedProjectId))
    );
  };

  // Upcoming deadlines (projects + content posts) sorted chronologically
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingDeadlines = [
    ...marilunaProjects
      .filter((p) => p.deadline && p.status !== 'completed')
      .map((p) => ({
        id: p.id,
        title: p.title,
        type: 'project' as const,
        date: p.deadline!,
        urgent: p.deadline <= todayStr,
      })),
    ...contentPosts
      .filter((cp) => cp.scheduledDate && cp.status !== 'published' && cp.status !== 'archived')
      .map((cp) => ({
        id: cp.id,
        title: cp.title,
        type: 'content' as const,
        platform: cp.platform,
        date: cp.scheduledDate!,
        urgent: cp.scheduledDate <= todayStr,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  // Strategic AI Observations (Alchemy intelligence based on real structure)
  const generateAlchemyObservations = () => {
    const observations: { id: string; text: string; actionPrompt: string; type: 'warning' | 'opportunity' | 'balanced' }[] = [];

    // Check: Active goal without linked projects
    const goalsWithoutProjects = marilunaGoals.filter(
      (g) => g.status === 'active' && getGoalProjects(g).length === 0
    );
    if (goalsWithoutProjects.length > 0) {
      const g = goalsWithoutProjects[0];
      observations.push({
        id: 'no-projects-' + g.id,
        text: isNl
          ? `Je hebt het actieve doel "${g.title}", maar er zijn momenteel nog geen projecten of acties aan gekoppeld. Wil je dat ik samen met je een eerste concrete stap bepaal?`
          : `You have an active goal "${g.title}", but no projects or actions are attached yet. Shall we define a solid first step together?`,
        actionPrompt: `Laten we een concreet project en eerste acties uitdenken voor mijn actieve doel "${g.title}". Wat stel je voor als logische eerste stap?`,
        type: 'warning',
      });
    }

    // Check: Active project with upcoming deadline and open tasks
    const projectsWithApproachingDeadline = marilunaProjects.filter((p) => {
      if (!p.deadline || p.status === 'completed' || p.status === 'on_hold') return false;
      const tasksForProj = marilunaTasks.filter((t) => t.projectId === p.id || p.taskIds?.includes(t.id));
      const openTasks = tasksForProj.filter((t) => t.status !== 'completed');
      return openTasks.length > 0;
    });

    if (projectsWithApproachingDeadline.length > 0) {
      const p = projectsWithApproachingDeadline[0];
      const openTasksCount = marilunaTasks.filter(
        (t) => (t.projectId === p.id || p.taskIds?.includes(t.id)) && t.status !== 'completed'
      ).length;

      observations.push({
        id: 'deadline-open-tasks-' + p.id,
        text: isNl
          ? `Project "${p.title}" heeft nog ${openTasksCount} openstaande taken met deadline ${p.deadline}. Zullen we prioriteren wat echt essentieel is?`
          : `Project "${p.title}" has ${openTasksCount} open tasks with deadline ${p.deadline}. Shall we prioritize what is truly essential?`,
        actionPrompt: `Help me prioriteren voor het project "${p.title}". De deadline is ${p.deadline} en er zijn ${openTasksCount} openstaande taken. Wat kunnen we vereenvoudigen of focussen?`,
        type: 'warning',
      });
    }

    // Check: Ideas ready to use that can support goals
    const readyIdeas = ideas.filter((i) => i.realm === 'mariluna' && (i.status === 'ready' || i.status === 'ready_to_use'));
    if (readyIdeas.length > 0 && marilunaGoals.length > 0) {
      observations.push({
        id: 'ready-ideas',
        text: isNl
          ? `Je hebt ${readyIdeas.length} uitgewerkte ideeën in je Brainstorm klaarstaan die je kunt koppelen aan je actieve doelen of lopende projecten.`
          : `You have ${readyIdeas.length} refined ideas in your sanctuary ready to be connected to goals or projects.`,
        actionPrompt: `Ik heb een aantal uitgewerkte ideeën in mijn brainstorm. Laten we kijken hoe we deze strategisch kunnen inzetten voor mijn Mariluna doelen.`,
        type: 'opportunity',
      });
    }

    return observations;
  };

  const alchemyObservations = generateAlchemyObservations();

  // Handlers for Goal modals
  const handleOpenCreateGoal = () => {
    setEditingGoal({
      id: 'g-' + Date.now(),
      title: '',
      description: '',
      realm: 'mariluna',
      timeframe: 'quarter',
      status: 'active',
      priority: 'normal',
      progress: 0,
      connectedProjectIds: [],
      connectedTaskIds: [],
      connectedContentIds: [],
      milestones: [],
      notes: '',
    });
    setHasMeasurableTarget(false);
    setTargetType('revenue');
    setTargetValue(0);
    setCurrentValue(0);
    setTargetUnit('€');
    setCustomTargetLabel('');
    setIsEditModalOpen(true);
  };

  const handleOpenEditGoal = (goal: Goal) => {
    setEditingGoal({ ...goal });
    if (goal.measurableTarget) {
      setHasMeasurableTarget(true);
      setTargetType(goal.measurableTarget.type);
      setTargetValue(goal.measurableTarget.targetValue);
      setCurrentValue(goal.measurableTarget.currentValue);
      setTargetUnit(goal.measurableTarget.unit || '€');
      setCustomTargetLabel(goal.measurableTarget.customLabel || '');
    } else {
      setHasMeasurableTarget(false);
      setTargetType('revenue');
      setTargetValue(0);
      setCurrentValue(0);
      setTargetUnit('€');
      setCustomTargetLabel('');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveGoalForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.title?.trim()) return;

    let targetData: GoalMeasurableTarget | undefined = undefined;
    if (hasMeasurableTarget && targetValue > 0) {
      targetData = {
        type: targetType,
        targetValue: Number(targetValue),
        currentValue: Number(currentValue) || 0,
        unit: targetUnit,
        customLabel: customTargetLabel,
      };
    }

    onSaveGoal({
      ...editingGoal,
      measurableTarget: targetData,
    });

    setIsEditModalOpen(false);
    setEditingGoal(null);
  };

  const handleLinkProjectToGoal = (goal: Goal, projId: string) => {
    const updatedProjectIds = Array.from(new Set([...(goal.connectedProjectIds || []), projId]));
    onSaveGoal({
      ...goal,
      connectedProjectIds: updatedProjectIds,
    });

    // Also set project's goalId
    const targetProj = marilunaProjects.find((p) => p.id === projId);
    if (targetProj) {
      onSaveProject({
        ...targetProj,
        goalId: goal.id,
      });
    }
    setIsLinkProjectOpen(false);
  };

  const handleUnlinkProjectFromGoal = (goal: Goal, projId: string) => {
    const updatedProjectIds = (goal.connectedProjectIds || []).filter((id) => id !== projId);
    onSaveGoal({
      ...goal,
      connectedProjectIds: updatedProjectIds,
    });

    const targetProj = marilunaProjects.find((p) => p.id === projId);
    if (targetProj && targetProj.goalId === goal.id) {
      onSaveProject({
        ...targetProj,
        goalId: undefined,
      });
    }
  };

  const handleSaveStrategicFocus = () => {
    if (onUpdateContentPlan && contentPlan) {
      onUpdateContentPlan({
        ...contentPlan,
        quarterTheme: strategicFocusText.trim(),
      });
    }
    setIsEditingFocus(false);
  };

  const getTimeframeBadge = (timeframe: GoalTimeframe) => {
    const normalized = timeframe.toLowerCase();
    if (normalized.includes('year')) {
      return (
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EAE2D3] text-[#554C42]">
          {isNl ? 'Jaardoel' : 'Year Goal'}
        </span>
      );
    }
    if (normalized.includes('quarter')) {
      return (
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#7A7167]">
          {isNl ? 'Kwartaaldoel' : 'Quarter Goal'}
        </span>
      );
    }
    if (normalized.includes('month')) {
      return (
        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#ECE8DF] text-[#7A7167]">
          {isNl ? 'Maanddoel' : 'Month Goal'}
        </span>
      );
    }
    return (
      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#7A7167]">
        {isNl ? 'Aangepast' : 'Custom'}
      </span>
    );
  };

  const filteredGoals = marilunaGoals.filter((g) => {
    if (timeframeFilter === 'all') return true;
    const tf = (g.timeframe || '').toLowerCase();
    if (timeframeFilter === 'year') return tf.includes('year');
    if (timeframeFilter === 'quarter') return tf.includes('quarter');
    if (timeframeFilter === 'month') return tf.includes('month');
    if (timeframeFilter === 'custom') return tf.includes('custom');
    return true;
  });

  return (
    <div className="space-y-7">
      {/* ============================================================ */}
      {/* 1. STRATEGY HEADER: WHAT AM I CURRENTLY WORKING TOWARD?      */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-normal text-[#2C2825]">
            {isNl ? 'Doelen & Strategie' : 'Goals & Strategy'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5">
            {isNl
              ? 'Waar werk ik momenteel naartoe? Rust, strategische focus en verbindingen.'
              : 'What am I working toward? Strategic clarity, alignment, and calm direction.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateGoal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isNl ? 'Nieuw Doel' : 'New Goal'}</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. STRATEGIC OVERVIEW DASH (Calm, scannable)                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Active Goals count */}
        <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7A7167]">
            <span className="font-medium">{isNl ? 'Actieve Doelen' : 'Active Goals'}</span>
            <Target className="w-4 h-4 text-[#8C7654]" />
          </div>
          <div className="font-serif text-2xl font-normal text-[#2C2825]">
            {marilunaGoals.filter((g) => g.status === 'active' || !g.status).length}
          </div>
          <p className="text-[11px] text-[#A89F91]">
            {marilunaGoals.length === 0
              ? isNl
                ? 'Nog geen doelen ingesteld'
                : 'No goals defined yet'
              : isNl
              ? `${marilunaGoals.length} doelen in totaal`
              : `${marilunaGoals.length} goals in total`}
          </p>
        </div>

        {/* Active Projects count */}
        <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#7A7167]">
            <span className="font-medium">{isNl ? 'Lopende Projecten' : 'Active Projects'}</span>
            <Briefcase className="w-4 h-4 text-[#8C7654]" />
          </div>
          <div className="font-serif text-2xl font-normal text-[#2C2825]">
            {marilunaProjects.filter((p) => p.status === 'active' || p.status === 'planning').length}
          </div>
          <p className="text-[11px] text-[#A89F91]">
            {marilunaProjects.length === 0
              ? isNl
                ? 'Nog geen actieve projecten'
                : 'No active projects'
              : isNl
              ? 'Verbonden met taken en content'
              : 'Tied to tasks & content'}
          </p>
        </div>

        {/* Strategic Focus (Quarter theme) */}
        <div className="p-4 rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] space-y-1 shadow-xs sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-[#7A7167]">
            <span className="font-medium">{isNl ? 'Strategische Focus' : 'Strategic Focus'}</span>
            <button
              type="button"
              onClick={() => setIsEditingFocus(!isEditingFocus)}
              className="text-[11px] text-[#8C7654] hover:underline cursor-pointer"
            >
              {isEditingFocus ? (isNl ? 'Annuleren' : 'Cancel') : (isNl ? 'Wijzig' : 'Edit')}
            </button>
          </div>

          {isEditingFocus ? (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={strategicFocusText}
                onChange={(e) => setStrategicFocusText(e.target.value)}
                placeholder={isNl ? 'Bijv. Zichtbaarheid & Verdieping' : 'E.g. Visibility & Depth'}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveStrategicFocus}
                className="px-3 py-1 rounded-full bg-[#2C2825] text-[#FAF8F3] text-[11px] font-medium"
              >
                {isNl ? 'Opslaan' : 'Save'}
              </button>
            </div>
          ) : (
            <>
              <p className="font-serif text-base font-normal text-[#2C2825] line-clamp-1">
                {contentPlan?.quarterTheme ||
                  (isNl ? 'Nog geen focus ingesteld' : 'No strategic focus set')}
              </p>
              <p className="text-[11px] text-[#A89F91]">
                {contentPlan?.monthlyTheme
                  ? `${isNl ? 'Maandfocus' : 'Month focus'}: ${contentPlan.monthlyTheme}`
                  : isNl
                  ? 'Klik op wijzig om een thema in te stellen'
                  : 'Click edit to define theme'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. ALCHEMY STRATEGIC INTELLIGENCE (Guidance observations)     */}
      {/* ============================================================ */}
      {alchemyObservations.length > 0 && (
        <div className="rounded-2xl border border-[#DCD3C4] bg-[#F7F3EB] p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C7654]">
            <Sparkles className="w-4 h-4 text-[#8C7654]" />
            <span>{isNl ? 'Alchemy Strategisch Inzicht' : 'Alchemy Strategic Intelligence'}</span>
          </div>

          <div className="space-y-2.5">
            {alchemyObservations.map((obs) => (
              <div
                key={obs.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#FAF8F3] border border-[#E8E0D1] text-xs"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8C7654] mt-1.5 shrink-0" />
                  <p className="text-[#3C3630] leading-relaxed">{obs.text}</p>
                </div>

                {onOpenAssistantWithPrompt && (
                  <button
                    type="button"
                    onClick={() => onOpenAssistantWithPrompt(obs.actionPrompt)}
                    className="inline-flex items-center gap-1 text-xs text-[#8C7654] font-medium hover:text-[#2C2825] hover:underline cursor-pointer shrink-0 self-end sm:self-auto"
                  >
                    <span>{isNl ? 'Bespreek met Alchemy' : 'Spar with Alchemy'}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. UPCOMING IMPORTANT DEADLINES                               */}
      {/* ============================================================ */}
      {upcomingDeadlines.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-serif text-base font-medium text-[#2C2825] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8C7654]" />
            <span>{isNl ? 'Aankomende Strategische Deadlines' : 'Upcoming Strategic Deadlines'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {upcomingDeadlines.map((dl) => (
              <div
                key={`${dl.type}-${dl.id}`}
                className="p-3 rounded-xl border border-[#E3D9C9] bg-[#FAF8F3] text-xs space-y-1 shadow-xs"
              >
                <div className="flex items-center justify-between text-[10px] text-[#7A7167]">
                  <span className="uppercase font-semibold px-1.5 py-0.2 rounded-md bg-[#EAE2D3] text-[#554C42]">
                    {dl.type === 'project' ? (isNl ? 'Project' : 'Project') : dl.platform || 'Content'}
                  </span>
                  <span className="font-mono text-[#8C7654] font-medium">{dl.date}</span>
                </div>
                <div className="font-medium text-[#2C2825] truncate">{dl.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. GOALS LIST & HIERARCHY (GOAL ↓ PROJECT ↓ TASKS / CONTENT)  */}
      {/* ============================================================ */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#2C2825]">
              {isNl ? 'Strategische Doelen' : 'Strategic Goals'}
            </h3>
            <p className="text-xs text-[#7A7167]">
              {isNl
                ? 'Doel → Projecten → Taken & Content'
                : 'Goal → Projects → Tasks & Content'}
            </p>
          </div>

          {/* Timeframe Filter pills */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
            {[
              { id: 'all', label: isNl ? 'Alle' : 'All' },
              { id: 'year', label: isNl ? 'Jaar' : 'Year' },
              { id: 'quarter', label: isNl ? 'Kwartaal' : 'Quarter' },
              { id: 'month', label: isNl ? 'Maand' : 'Month' },
            ].map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setTimeframeFilter(tf.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                  timeframeFilter === tf.id
                    ? 'bg-[#2C2825] text-[#FAF8F3]'
                    : 'text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EAE2D3]'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goals Empty State (Strictly no fake data) */}
        {filteredGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCD3C4] bg-[#FAF8F3]/50 p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#EAE2D3] flex items-center justify-center mx-auto text-[#7A7167]">
              <Target className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-base text-[#2C2825]">
                {isNl ? 'Nog geen doelen ingesteld.' : 'No goals defined yet.'}
              </p>
              <p className="text-xs text-[#7A7167] max-w-sm mx-auto">
                {isNl
                  ? 'Doelen zijn optioneel. Je kunt later een doel toevoegen wanneer je focus helder is.'
                  : 'Goals are optional. You can add a goal whenever you have strategic clarity.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateGoal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FAF8F3] border border-[#DCD3C4] text-xs text-[#2C2825] font-medium hover:bg-[#F2ECE1] transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isNl ? 'Doel Toevoegen' : 'Add Goal'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGoals.map((goal) => {
              const goalProjects = getGoalProjects(goal);
              const goalTasks = getGoalTasks(goal);
              const goalContent = getGoalContent(goal);

              return (
                <div
                  key={goal.id}
                  className="rounded-2xl border border-[#E3D9C9] bg-[#FAF8F3] p-5 space-y-4 shadow-xs"
                >
                  {/* Goal Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTimeframeBadge(goal.timeframe)}
                        {goal.status === 'achieved' || goal.status === 'completed' ? (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#E8E1D5] text-[#2C2825]">
                            {isNl ? 'Behaald' : 'Achieved'}
                          </span>
                        ) : goal.status === 'paused' ? (
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[#EFE9DF] text-[#8C7654]">
                            {isNl ? 'Gepauzeerd' : 'Paused'}
                          </span>
                        ) : null}
                      </div>

                      <h4 className="font-serif text-lg font-medium text-[#2C2825]">
                        {goal.title}
                      </h4>

                      {goal.description && (
                        <p className="text-xs text-[#7A7167] leading-relaxed max-w-2xl">
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditGoal(goal)}
                        className="p-1.5 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
                        title={isNl ? 'Doel bewerken' : 'Edit goal'}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {onDeleteGoal && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(isNl ? `Doel "${goal.title}" verwijderen?` : `Delete goal "${goal.title}"?`)) {
                              onDeleteGoal(goal.id);
                            }
                          }}
                          className="p-1.5 rounded-full hover:bg-[#EAE2D3] text-[#7A7167] hover:text-[#8C4A4A] transition cursor-pointer"
                          title={isNl ? 'Doel verwijderen' : 'Delete goal'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Measurable Target display */}
                  {goal.measurableTarget && (
                    <div className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E3D9C9] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[#7A7167]">
                        <span className="font-medium text-[#2C2825] flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[#8C7654]" />
                          <span>
                            {goal.measurableTarget.customLabel ||
                              (goal.measurableTarget.type === 'revenue'
                                ? isNl ? 'Omzetdoel' : 'Revenue Target'
                                : goal.measurableTarget.type === 'clients'
                                ? isNl ? 'Klantendoel' : 'Clients Target'
                                : goal.measurableTarget.type === 'bookings'
                                ? isNl ? 'Boekingendoel' : 'Bookings Target'
                                : goal.measurableTarget.type === 'posts'
                                ? isNl ? 'Publicatiedoel' : 'Posts Target'
                                : isNl ? 'Meetbaar Doel' : 'Measurable Target')}
                          </span>
                        </span>
                        <span className="font-mono text-[#2C2825] font-semibold">
                          {goal.measurableTarget.currentValue} / {goal.measurableTarget.targetValue} {goal.measurableTarget.unit}
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-[#E5DFD3] overflow-hidden">
                        <div
                          className="h-full bg-[#7E694E] rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (goal.measurableTarget.currentValue / goal.measurableTarget.targetValue) * 100
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* =================================================== */}
                  {/* HIERARCHY TREE: GOAL ↓ PROJECTS ↓ TASKS / CONTENT   */}
                  {/* =================================================== */}
                  <div className="space-y-3 pt-2 border-t border-[#EFE8DC]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8377] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#8C7654]" />
                        <span>{isNl ? 'Verbonden Projecten & Uitvoering' : 'Connected Projects & Execution'}</span>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGoalId(goal.id);
                          setIsLinkProjectOpen(true);
                        }}
                        className="text-xs text-[#8C7654] font-medium hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isNl ? 'Koppel Project' : 'Connect Project'}</span>
                      </button>
                    </div>

                    {goalProjects.length === 0 ? (
                      <div className="p-3.5 rounded-xl border border-dashed border-[#DCD3C4] text-xs text-[#7A7167] italic text-center">
                        {isNl
                          ? 'Nog geen projecten gekoppeld aan dit doel.'
                          : 'No projects connected to this goal yet.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {goalProjects.map((proj) => {
                          const pTasks = marilunaTasks.filter(
                            (t) => t.projectId === proj.id || proj.taskIds.includes(t.id)
                          );
                          const completedTasks = pTasks.filter((t) => t.status === 'completed').length;

                          return (
                            <div
                              key={proj.id}
                              className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] space-y-2 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="w-3.5 h-3.5 text-[#8C7654] shrink-0" />
                                  <span className="font-medium text-[#2C2825]">{proj.title}</span>
                                  <span className="text-[10px] uppercase px-1.5 py-0.2 rounded-md bg-[#F2ECE1] text-[#7A7167]">
                                    {proj.status}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {onSelectProject && (
                                    <button
                                      type="button"
                                      onClick={() => onSelectProject(proj.id)}
                                      className="text-[#8C7654] hover:underline text-[11px] font-medium cursor-pointer"
                                    >
                                      {isNl ? 'Bekijk' : 'View'}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleUnlinkProjectFromGoal(goal, proj.id)}
                                    className="text-[#A89F91] hover:text-[#8C4A4A] p-0.5 cursor-pointer"
                                    title={isNl ? 'Ontkoppel' : 'Disconnect'}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Task and content mini progress inside project */}
                              <div className="flex items-center justify-between text-[11px] text-[#7A7167] pt-1 border-t border-[#F5EFE6]">
                                <span>
                                  {pTasks.length > 0
                                    ? `${completedTasks} van ${pTasks.length} taken afgerond`
                                    : isNl
                                    ? 'Nog geen taken'
                                    : 'No tasks yet'}
                                </span>
                                {proj.deadline && (
                                  <span>{isNl ? 'Deadline' : 'Due'}: {proj.deadline}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary row for linked items */}
                    <div className="flex items-center gap-4 text-[11px] text-[#8C8377] pt-1">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3 h-3 text-[#7A7167]" />
                        <span>{goalTasks.length} {isNl ? 'taken totaal' : 'tasks total'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#7A7167]" />
                        <span>{goalContent.length} {isNl ? 'publicaties' : 'posts'}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* CREATE / EDIT GOAL MODAL                                     */}
      {/* ============================================================ */}
      {isEditModalOpen && editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#2C2825] my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {editingGoal.id && marilunaGoals.some((g) => g.id === editingGoal.id)
                  ? isNl
                    ? 'Doel Bewerken'
                    : 'Edit Goal'
                  : isNl
                  ? 'Nieuw Strategisch Doel'
                  : 'New Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoalForm} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Doelomschrijving / Naam *' : 'Goal Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isNl ? 'Bijv. Meer organische zichtbaarheid opbouwen' : 'E.g. Expand organic visibility'}
                  value={editingGoal.title || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Toelichting & Intentie' : 'Description & Vision'}
                </label>
                <textarea
                  placeholder={isNl ? 'Waarom is dit doel belangrijk en wat is het gewenste effect?' : 'Why is this strategic?'}
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Tijdshorizon' : 'Timeframe'}
                  </label>
                  <select
                    value={editingGoal.timeframe || 'quarter'}
                    onChange={(e) => setEditingGoal({ ...editingGoal, timeframe: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="quarter">{isNl ? 'Kwartaal' : 'Quarter'}</option>
                    <option value="year">{isNl ? 'Jaar' : 'Year'}</option>
                    <option value="month">{isNl ? 'Maand' : 'Month'}</option>
                    <option value="custom">{isNl ? 'Aangepast' : 'Custom'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                    {isNl ? 'Status' : 'Status'}
                  </label>
                  <select
                    value={editingGoal.status || 'active'}
                    onChange={(e) => setEditingGoal({ ...editingGoal, status: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825]"
                  >
                    <option value="active">{isNl ? 'Actief' : 'Active'}</option>
                    <option value="achieved">{isNl ? 'Behaald' : 'Achieved'}</option>
                    <option value="paused">{isNl ? 'Gepauzeerd' : 'Paused'}</option>
                    <option value="archived">{isNl ? 'Gearchiveerd' : 'Archived'}</option>
                  </select>
                </div>
              </div>

              {/* Optional Measurable Target section */}
              <div className="p-3 rounded-xl border border-[#E3D9C9] bg-[#FFFFFF] space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasMeasurableTarget}
                    onChange={(e) => setHasMeasurableTarget(e.target.checked)}
                    className="rounded text-[#8C7654] focus:ring-0"
                  />
                  <span className="text-xs font-medium text-[#2C2825]">
                    {isNl ? 'Optioneel meetbaar target toevoegen' : 'Add optional measurable target'}
                  </span>
                </label>

                {hasMeasurableTarget && (
                  <div className="space-y-2.5 pt-1 border-t border-[#F2ECE1]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#7A7167] mb-1">
                          {isNl ? 'Type Target' : 'Target Type'}
                        </label>
                        <select
                          value={targetType}
                          onChange={(e) => setTargetType(e.target.value as any)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#DDD4C5] text-xs text-[#2C2825]"
                        >
                          <option value="revenue">{isNl ? 'Omzetdoel' : 'Revenue'}</option>
                          <option value="clients">{isNl ? 'Aantal Klanten' : 'Clients'}</option>
                          <option value="bookings">{isNl ? 'Boekingen' : 'Bookings'}</option>
                          <option value="posts">{isNl ? 'Aantal Posts' : 'Posts'}</option>
                          <option value="products_sold">{isNl ? 'Producten Verkocht' : 'Products'}</option>
                          <option value="custom">{isNl ? 'Aangepast' : 'Custom'}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#7A7167] mb-1">
                          {isNl ? 'Eenheid' : 'Unit'}
                        </label>
                        <input
                          type="text"
                          placeholder="€ / klanten / posts"
                          value={targetUnit}
                          onChange={(e) => setTargetUnit(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#DDD4C5] text-xs text-[#2C2825]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#7A7167] mb-1">
                          {isNl ? 'Doelwaarde' : 'Target Value'}
                        </label>
                        <input
                          type="number"
                          value={targetValue || ''}
                          onChange={(e) => setTargetValue(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#DDD4C5] text-xs text-[#2C2825]"
                          placeholder="Bijv. 5000"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#7A7167] mb-1">
                          {isNl ? 'Huidige Waarde' : 'Current Value'}
                        </label>
                        <input
                          type="number"
                          value={currentValue || ''}
                          onChange={(e) => setCurrentValue(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg border border-[#DDD4C5] text-xs text-[#2C2825]"
                          placeholder="Bijv. 1200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#7A7167] uppercase tracking-wider mb-1">
                  {isNl ? 'Notities' : 'Notes'}
                </label>
                <textarea
                  placeholder={isNl ? 'Strategische context, reflecties...' : 'Strategic context...'}
                  value={editingGoal.notes || ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E0D1]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#DDD4C5] text-xs font-medium text-[#7A7167]"
                >
                  {isNl ? 'Annuleren' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition shadow-xs cursor-pointer"
                >
                  {isNl ? 'Doel Opslaan' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* LINK PROJECT TO GOAL MODAL                                   */}
      {/* ============================================================ */}
      {isLinkProjectOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E0D1]">
              <h3 className="font-serif text-base text-[#2C2825]">
                {isNl ? 'Koppel Project aan Doel' : 'Connect Project to Goal'}
              </h3>
              <button
                type="button"
                onClick={() => setIsLinkProjectOpen(false)}
                className="p-1 rounded-full text-[#7A7167] hover:bg-[#EAE2D3]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {marilunaProjects.filter((p) => p.goalId !== selectedGoal.id && !(selectedGoal.connectedProjectIds || []).includes(p.id)).length === 0 ? (
                <p className="text-xs text-[#7A7167] italic p-3 text-center">
                  {isNl ? 'Geen beschikbare projecten om te koppelen.' : 'No available projects to connect.'}
                </p>
              ) : (
                marilunaProjects
                  .filter((p) => p.goalId !== selectedGoal.id && !(selectedGoal.connectedProjectIds || []).includes(p.id))
                  .map((proj) => (
                    <button
                      key={proj.id}
                      type="button"
                      onClick={() => handleLinkProjectToGoal(selectedGoal, proj.id)}
                      className="w-full text-left p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E0D1] hover:border-[#8C7654] transition text-xs space-y-0.5 cursor-pointer"
                    >
                      <div className="font-medium text-[#2C2825]">{proj.title}</div>
                      <div className="text-[10px] text-[#7A7167]">
                        Status: {proj.status} {proj.deadline ? `· Due: ${proj.deadline}` : ''}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
