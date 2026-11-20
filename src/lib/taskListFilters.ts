import type { ActiveWorldFilter, Goal, Project, Task } from '../types';

export interface TaskListFilters {
  activeWorld: ActiveWorldFilter;
  status: 'active' | 'completed' | 'all';
  priority: 'all' | Task['priority'];
  query?: string;
  projects?: Project[];
  goals?: Goal[];
}

/** Search and filter tasks without mutating the source collection. */
export function filterTaskList(tasks: Task[], filters: TaskListFilters): Task[] {
  const query = (filters.query || '').trim().toLocaleLowerCase('nl-BE');
  return tasks.filter((task) => {
    if (filters.activeWorld !== 'all' && task.realm !== filters.activeWorld) return false;
    if (filters.status === 'active' && task.status === 'completed') return false;
    if (filters.status === 'completed' && task.status !== 'completed') return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (!query) return true;

    const searchable = [
      task.title,
      task.description,
      task.notes || '',
      task.category,
      task.dueDate,
      ...(task.subtasks || []).map((subtask) => subtask.title),
      filters.projects?.find((project) => project.id === task.projectId)?.title || '',
      filters.goals?.find((goal) => goal.id === task.goalId)?.title || '',
    ].join(' ').toLocaleLowerCase('nl-BE');
    return searchable.includes(query);
  }).sort((a, b) => {
    // Keep unfinished work ahead of completed work when "all" is selected.
    const completionOrder = Number(a.status === 'completed') - Number(b.status === 'completed');
    if (completionOrder !== 0) return completionOrder;
    if (a.status === 'completed' && b.status === 'completed') {
      return (b.completedAt || '').localeCompare(a.completedAt || '') ||
        a.title.localeCompare(b.title, 'nl-BE');
    }
    const dueA = /^\d{4}-\d{2}-\d{2}$/.test(a.dueDate) ? a.dueDate : '9999-12-31';
    const dueB = /^\d{4}-\d{2}-\d{2}$/.test(b.dueDate) ? b.dueDate : '9999-12-31';
    const priority = { high: 0, medium: 1, low: 2 };
    return dueA.localeCompare(dueB) ||
      priority[a.priority] - priority[b.priority] ||
      a.title.localeCompare(b.title, 'nl-BE');
  });
}
