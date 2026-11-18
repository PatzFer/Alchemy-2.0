import test from 'node:test';
import assert from 'node:assert/strict';
import { securityVault } from './security';

test('Mariluna AI context excludes personal events, projects, memories and private preferences', () => {
  const result = securityVault.sanitizeContextForAi({
    calendarEvents: [
      { id: 'p1', realm: 'personal', title: 'Private appointment' },
      { id: 'm1', realm: 'mariluna', title: 'Client call' },
    ],
    projects: [
      { id: 'p1', realm: 'personal', title: 'Private project' },
      { id: 'm1', realm: 'mariluna', title: 'Business launch' },
    ],
    ideas: [
      { id: 'p1', realm: 'personal', title: 'Private idea' },
      { id: 'm1', realm: 'mariluna', title: 'Campaign idea' },
    ],
    intentions: [
      { id: 'p1', realm: 'personal', title: 'Personal intention' },
      { id: 'm1', realm: 'mariluna', title: 'Business intention' },
    ],
    tasks: [
      { id: 'p1', realm: 'personal', title: 'Private task' },
      { id: 'm1', realm: 'mariluna', title: 'Business task' },
    ],
    goals: [
      { id: 'p1', realm: 'personal', title: 'Private goal' },
      { id: 'm1', realm: 'mariluna', title: 'Business goal' },
    ],
    memoriesSample: ['Unscoped personal memory'],
    workingHours: 'Private routine',
    preferences: { protectEvenings: true },
    todayIntention: { id: 'p1', realm: 'personal', title: 'Private intention' },
    activeContextItem: { id: 'p1', realm: 'personal', title: 'Private context item' },
  }, 'mariluna');

  assert.deepEqual(result.calendarEvents.map((item: any) => item.id), ['m1']);
  assert.deepEqual(result.projects.map((item: any) => item.id), ['m1']);
  assert.deepEqual(result.ideas.map((item: any) => item.id), ['m1']);
  assert.deepEqual(result.intentions.map((item: any) => item.id), ['m1']);
  assert.deepEqual(result.tasks.map((item: any) => item.id), ['m1']);
  assert.deepEqual(result.goals.map((item: any) => item.id), ['m1']);
  assert.equal('memoriesSample' in result, false);
  assert.equal('workingHours' in result, false);
  assert.equal('preferences' in result, false);
  assert.equal('todayIntention' in result, false);
  assert.equal('activeContextItem' in result, false);
});

test('Personal AI context excludes Mariluna business records and offerings', () => {
  const result = securityVault.sanitizeContextForAi({
    calendarEvents: [
      { id: 'p1', realm: 'personal' },
      { id: 'm1', realm: 'mariluna' },
    ],
    projects: [
      { id: 'p1', realm: 'personal' },
      { id: 'm1', realm: 'mariluna' },
    ],
    tasks: [
      { id: 'p1', realm: 'personal' },
      { id: 'm1', realm: 'mariluna' },
    ],
    goals: [
      { id: 'p1', realm: 'personal' },
      { id: 'm1', realm: 'mariluna' },
    ],
    offerings: [{ id: 'offering-1' }],
    contentPlan: { quarterTheme: 'Business theme' },
    memoriesSample: ['Unscoped memory'],
  }, 'personal');

  assert.deepEqual(result.calendarEvents.map((item: any) => item.id), ['p1']);
  assert.deepEqual(result.projects.map((item: any) => item.id), ['p1']);
  assert.deepEqual(result.tasks.map((item: any) => item.id), ['p1']);
  assert.deepEqual(result.goals.map((item: any) => item.id), ['p1']);
  assert.equal('offerings' in result, false);
  assert.equal('contentPlan' in result, false);
  assert.equal('memoriesSample' in result, false);
});
