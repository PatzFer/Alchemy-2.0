import type { ActiveWorldFilter, Goal, Project, Task } from '../types';

export interface GoalListFilters {
  activeWorld: ActiveWorldFilter;
  horizon?: string;
  query?: string;
  tasks?: Task[];
  projects?: Project[];
}

/** Search goals and their milestones while preserving source order. */
export function filterGoalList(goals: Goal[], filters: GoalListFilters): Goal[] {
  const query = (filters.query || '').trim().toLocaleLowerCase('nl-BE');
  return goals.filter((goal) => {
    if (filters.activeWorld !== 'all' && goal.realm !== filters.activeWorld) return false;
    if (filters.horizon && filters.horizon !== 'all' && goal.timeframe !== filters.horizon) return false;
    if (!query) return true;
    const searchable = [
      goal.title,
      goal.description || '',
      goal.notes || '',
      ...(goal.milestones || []).map((milestone) => milestone.title),
      ...(filters.tasks || []).filter((task) => task.realm === goal.realm && (task.goalId === goal.id || goal.connectedTaskIds?.includes(task.id))).map((task) => task.title),
      ...(filters.projects || []).filter((project) => project.realm === goal.realm && (project.goalId === goal.id || goal.connectedProjectIds?.includes(project.id))).map((project) => project.title),
    ].join(' ').toLocaleLowerCase('nl-BE');
    return searchable.includes(query);
  });
}
