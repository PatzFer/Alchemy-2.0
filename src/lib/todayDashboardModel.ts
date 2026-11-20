import { ActiveWorldFilter, Task } from '../types';
import { isValidCalendarDate } from './calendarDate';

const priorityRank: Record<Task['priority'], number> = { high: 0, medium: 1, low: 2 };

export interface TodayTaskGroups {
  overdue: Task[];
  dueToday: Task[];
}

/** Split open tasks into genuinely overdue and due-today groups for the daily dashboard. */
export function groupTasksForToday(
  tasks: Task[],
  today: string,
  activeWorld: ActiveWorldFilter,
): TodayTaskGroups {
  if (!isValidCalendarDate(today)) return { overdue: [], dueToday: [] };

  const visibleTasks = tasks.filter((task) =>
    task.status !== 'completed' &&
    isValidCalendarDate(task.dueDate) &&
    (activeWorld === 'all' || task.realm === activeWorld)
  );

  const sortTasks = (items: Task[]) => [...items].sort((a, b) =>
    priorityRank[a.priority] - priorityRank[b.priority] ||
    a.dueDate.localeCompare(b.dueDate) ||
    a.title.localeCompare(b.title, 'nl')
  );

  return {
    overdue: sortTasks(visibleTasks.filter((task) => task.dueDate < today)),
    dueToday: sortTasks(visibleTasks.filter((task) => task.dueDate === today)),
  };
}
