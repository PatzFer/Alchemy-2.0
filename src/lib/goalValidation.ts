import { isValidCalendarDate } from './calendarDate';

export type GoalValidationError =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'invalid_target_date'
  | 'too_many_milestones'
  | 'milestone_title_invalid';

export function validateGoalInput(input: {
  title: string;
  description: string;
  targetDate: string;
  milestones: Array<{ title: string }>;
}): GoalValidationError | null {
  const title = input.title.trim();
  if (!title) return 'title_required';
  if (title.length > 160) return 'title_too_long';
  if (input.description.length > 5000) return 'description_too_long';
  if (input.targetDate && !isValidCalendarDate(input.targetDate)) return 'invalid_target_date';
  if (input.milestones.length > 50) return 'too_many_milestones';
  if (input.milestones.some((milestone) => !milestone.title.trim() || milestone.title.trim().length > 160)) return 'milestone_title_invalid';
  return null;
}
