import type { Milestone, Task } from '../types';

/** Milestones take priority; otherwise derive progress from linked tasks, then fall back to manual progress. */
export function calculateGoalProgress(
  milestones: Milestone[],
  linkedTasks: Task[],
  manualProgress = 0,
): number {
  if (milestones.length > 0) {
    return Math.round((milestones.filter((milestone) => milestone.completed).length / milestones.length) * 100);
  }
  if (linkedTasks.length > 0) {
    return Math.round((linkedTasks.filter((task) => task.status === 'completed').length / linkedTasks.length) * 100);
  }
  return Math.max(0, Math.min(100, Number.isFinite(manualProgress) ? manualProgress : 0));
}
