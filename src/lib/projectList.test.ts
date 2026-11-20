import test from 'node:test';
import assert from 'node:assert/strict';
import type { Project } from '../types';
import { filterProjectList, validateProjectInput } from './projectList';

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'p1', title: 'Mariluna website', description: 'Nieuwe website lanceren',
  realm: 'mariluna', status: 'active', progress: 0, taskIds: [], ideaIds: [],
  notes: 'Domein en webshop', ...overrides,
});
const validInput = {
  title: 'Mariluna website',
  description: 'Nieuwe website lanceren',
  notes: 'Domein en webshop',
  startDate: '2026-11-20',
  deadline: '2026-12-20',
};

test('project search covers title, description and notes and preserves order', () => {
  const projects = [project({ id: 'a' }), project({ id: 'b', title: 'Nieuwe productlijn', description: 'Andere scope', notes: 'Nieuwe verpakking' })];
  assert.deepEqual(filterProjectList(projects, { status: 'all', query: 'WEBSITE' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjectList(projects, { status: 'all', query: 'nieuwe website lanceren' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjectList(projects, { status: 'all', query: 'webshop' }).map((p) => p.id), ['a']);
  assert.deepEqual(filterProjectList(projects, { status: 'all', query: '  PRODUCTLIJN ' }).map((p) => p.id), ['b']);
});

test('project status filters hide archived by default and show selected status', () => {
  const projects = [project({ id: 'active' }), project({ id: 'archived', status: 'archived' }), project({ id: 'idea', status: 'idea' })];
  assert.deepEqual(filterProjectList(projects, { status: 'all' }).map((p) => p.id), ['active', 'idea']);
  assert.deepEqual(filterProjectList(projects, { status: 'archived' }).map((p) => p.id), ['archived']);
});

test('accepts a valid project and optional empty dates', () => {
  assert.equal(validateProjectInput(validInput), null);
  assert.equal(validateProjectInput({ ...validInput, startDate: '', deadline: '' }), null);
});

test('validates project title and bounded text fields', () => {
  assert.equal(validateProjectInput({ ...validInput, title: '  ' }), 'title_required');
  assert.equal(validateProjectInput({ ...validInput, title: 'x'.repeat(161) }), 'title_too_long');
  assert.equal(validateProjectInput({ ...validInput, description: 'x'.repeat(5001) }), 'description_too_long');
  assert.equal(validateProjectInput({ ...validInput, notes: 'x'.repeat(5001) }), 'notes_too_long');
});

test('rejects impossible dates and a deadline before the start date', () => {
  assert.equal(validateProjectInput({ ...validInput, startDate: '2026-02-31' }), 'invalid_start_date');
  assert.equal(validateProjectInput({ ...validInput, deadline: '2026-02-31' }), 'invalid_deadline');
  assert.equal(validateProjectInput({ ...validInput, startDate: '2026-12-20', deadline: '2026-11-20' }), 'deadline_before_start');
});
