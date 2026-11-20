import type { Project, ProjectStatus } from '../types';
import { isValidCalendarDate } from './calendarDate';

export interface ProjectListFilters {
  query?: string;
  status: 'all' | ProjectStatus;
}

export function filterProjectList(projects: Project[], filters: ProjectListFilters): Project[] {
  const query = (filters.query || '').trim().toLocaleLowerCase('nl-BE');
  return projects.filter((project) => {
    if (filters.status === 'all' && project.status === 'archived') return false;
    if (filters.status !== 'all' && project.status !== filters.status) return false;
    if (!query) return true;
    return [
      project.title,
      project.description || '',
      project.notes || '',
    ].join(' ').toLocaleLowerCase('nl-BE').includes(query);
  });
}

export type ProjectInputError =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'notes_too_long'
  | 'invalid_start_date'
  | 'invalid_deadline'
  | 'deadline_before_start';

export function validateProjectInput(input: {
  title: string;
  description: string;
  notes: string;
  startDate?: string;
  deadline?: string;
}): ProjectInputError | null {
  const title = input.title.trim();
  if (!title) return 'title_required';
  if (title.length > 160) return 'title_too_long';
  if (input.description.length > 5000) return 'description_too_long';
  if (input.notes.length > 5000) return 'notes_too_long';
  if (input.startDate && !isValidCalendarDate(input.startDate)) return 'invalid_start_date';
  if (input.deadline && !isValidCalendarDate(input.deadline)) return 'invalid_deadline';
  if (input.startDate && input.deadline && input.deadline < input.startDate) return 'deadline_before_start';
  return null;
}
