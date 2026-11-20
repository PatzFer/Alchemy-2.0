import React from 'react';
import { CalendarDays, CheckCircle2, Circle, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Task, CalendarEvent, ActiveWorldFilter } from '../../types';
import { groupTasksForToday } from '../../lib/todayDashboardModel';

interface TodayDashboardViewProps {
  tasks: Task[];
  events: CalendarEvent[];
  activeWorld: ActiveWorldFilter;
  onToggleTask: (id: string) => void;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenJarvis: () => void;
  lang?: 'nl' | 'en';
}

const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  tasks, events, activeWorld, onToggleTask, onOpenTasks, onOpenCalendar, onOpenJarvis, lang = 'nl'
}) => {
  const nl = lang === 'nl';
  const today = localDate();
  const visible = (realm?: string) => activeWorld === 'all' || realm === activeWorld;
  const taskGroups = groupTasksForToday(tasks, today, activeWorld);
  const todayTasks = [...taskGroups.overdue, ...taskGroups.dueToday];
  const overdueCount = taskGroups.overdue.length;
  const todayEvents = events.filter(e => e.date === today && visible(e.realm)).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const priorityLabel = (priority: Task['priority']) => nl
    ? priority === 'high' ? 'Hoog' : priority === 'medium' ? 'Gemiddeld' : 'Laag'
    : priority;
  const dateLabel = new Intl.DateTimeFormat(nl ? 'nl-BE' : 'en-GB', { weekday:'long', day:'numeric', month:'long' }).format(new Date());

  return <div className="mx-auto max-w-5xl space-y-6 pb-10">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-secondary)]">{dateLabel}</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">{nl ? 'Jouw dag, in balans.' : 'Your day, in balance.'}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{nl ? 'Een helder overzicht van wat vandaag aandacht vraagt.' : 'A clear view of what needs your attention today.'}</p>
      </div>
      <button onClick={onOpenJarvis} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] px-4 py-2 text-sm hover:bg-[var(--surface-2)]">
        <Sparkles size={16}/>{nl ? 'Sparren met Jarvis' : 'Talk with Jarvis'}
      </button>
    </header>

    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-secondary)]"><CheckCircle2 size={17}/>{nl ? 'Aandacht vandaag' : 'Today’s focus'}</div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">{todayTasks.length}</span>
        </div>
        <div className="mt-4 space-y-4">
          {overdueCount > 0 && <div>
            <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{nl ? 'Eerst aandacht' : 'Needs attention first'} · {overdueCount}</h3>
            <div className="space-y-1">
              {taskGroups.overdue.slice(0, 6).map(task => <button key={task.id} onClick={() => onToggleTask(task.id)} aria-label={nl ? `Voltooi achterstallige taak: ${task.title}` : `Complete overdue task: ${task.title}`} className="flex w-full items-start gap-3 rounded-xl border-l-2 border-amber-500/70 px-2 py-2 text-left text-sm transition hover:bg-[var(--surface-2)]">
                <Circle size={17} className="mt-0.5 shrink-0 text-[var(--text-muted)]"/>
                <span className="min-w-0 flex-1">
                  <span className="block">{task.title}</span>
                  <span className="mt-1 block text-[11px] text-[var(--text-muted)]">{nl ? 'Achterstallig' : 'Overdue'} · {priorityLabel(task.priority)}</span>
                </span>
              </button>)}
            </div>
          </div>}
          {taskGroups.dueToday.length > 0 && <div>
            <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">{nl ? 'Voor vandaag' : 'Due today'} · {taskGroups.dueToday.length}</h3>
            <div className="space-y-1">
              {taskGroups.dueToday.slice(0, Math.max(0, 6 - Math.min(overdueCount, 6))).map(task => <button key={task.id} onClick={() => onToggleTask(task.id)} aria-label={nl ? `Voltooi taak: ${task.title}` : `Complete task: ${task.title}`} className="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-left text-sm transition hover:bg-[var(--surface-2)]">
                <Circle size={17} className="mt-0.5 shrink-0 text-[var(--text-muted)]"/>
                <span className="min-w-0 flex-1">
                  <span className="block">{task.title}</span>
                  <span className="mt-1 block text-[11px] text-[var(--text-muted)]">{priorityLabel(task.priority)}</span>
                </span>
              </button>)}
            </div>
          </div>}
          {todayTasks.length === 0 && <p className="py-3 text-sm text-[var(--text-muted)]">{nl ? 'Geen dringende taken. Ademruimte.' : 'No urgent tasks. Room to breathe.'}</p>}
          {todayTasks.length > 6 && <p className="px-2 text-[11px] text-[var(--text-muted)]">{nl ? `En nog ${todayTasks.length - 6} taken in je takenlijst.` : `And ${todayTasks.length - 6} more in your task list.`}</p>}
        </div>
        <button onClick={onOpenTasks} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-secondary)]">{nl ? 'Alle taken' : 'All tasks'} <ArrowRight size={14}/></button>
      </section>

      <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-secondary)]"><CalendarDays size={17}/>{nl ? 'Agenda vandaag' : 'Today’s agenda'}</div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs">{todayEvents.length}</span>
        </div>
        <div className="mt-4 space-y-3">
          {todayEvents.length ? todayEvents.slice(0,6).map(event => <div key={event.id} className="flex items-start gap-3 text-sm">
            <span className="flex items-center gap-1 text-xs tabular-nums text-[var(--text-muted)]"><Clock size={13}/>{event.startTime}</span>
            <span>{event.title}</span>
          </div>) : <p className="py-3 text-sm text-[var(--text-muted)]">{nl ? 'Nog niets gepland voor vandaag.' : 'Nothing scheduled yet today.'}</p>}
        </div>
        <button onClick={onOpenCalendar} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-secondary)]">{nl ? 'Open agenda' : 'Open calendar'} <ArrowRight size={14}/></button>
      </section>
    </div>
  </div>;
};
