import { isValidCalendarDate } from './calendarDate';

export type TaskInputError =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'invalid_due_date'
  | 'invalid_duration'
  | 'too_many_subtasks'
  | 'subtask_title_invalid';

export function validateTaskInput(input: {
  title: string;
  description: string;
  dueDate: string;
  estimatedDuration: number;
  subtasks: Array<{ title: string }>;
}): TaskInputError | null {
  const title = input.title.trim();
  if (!title) return 'title_required';
  if (title.length > 160) return 'title_too_long';
  if (input.description.length > 5000) return 'description_too_long';
  if (!isValidCalendarDate(input.dueDate)) return 'invalid_due_date';
  if (!Number.isFinite(input.estimatedDuration) || input.estimatedDuration < 5 || input.estimatedDuration > 1440) return 'invalid_duration';
  if (input.subtasks.length > 30) return 'too_many_subtasks';
  if (input.subtasks.some((item) => !item.title.trim() || item.title.trim().length > 160)) return 'subtask_title_invalid';
  return null;
}
