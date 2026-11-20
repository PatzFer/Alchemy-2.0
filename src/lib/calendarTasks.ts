import type { ActiveWorldFilter, Task } from '../types';

/** Return open and completed tasks due on a calendar date, scoped to the active workspace. */
export function getCalendarTasksForDate(tasks: Task[], date: string, activeWorld: ActiveWorldFilter): Task[] {
  return tasks
    .filter((task) => task.dueDate === date && (activeWorld === 'all' || task.realm === activeWorld))
    .sort((a, b) =>
      Number(a.status === 'completed') - Number(b.status === 'completed') ||
      ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) ||
      a.title.localeCompare(b.title, 'nl')
    );
}
