import type { ActiveWorldFilter, Goal } from '../types';

export interface GoalListFilters {
  activeWorld: ActiveWorldFilter;
  horizon?: string;
  query?: string;
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
    ].join(' ').toLocaleLowerCase('nl-BE');
    return searchable.includes(query);
  });
}
