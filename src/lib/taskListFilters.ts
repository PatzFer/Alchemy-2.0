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
  });
}
