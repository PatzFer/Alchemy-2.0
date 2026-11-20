import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBrainContext } from './contextEngine';
import { INITIAL_STATE } from '../storage';
import { MemoryItem } from '../../types';

function makeMemory(overrides: Partial<MemoryItem> & Pick<MemoryItem, 'id' | 'content' | 'realm'>): MemoryItem {
  return {
    category: 'Planning',
    dateAdded: '2026-11-19',
    importance: 'medium',
    source: 'user_stated',
    type: 'explicit',
    confidence: 'high',
    status: 'active',
    ...overrides,
  };
}

test('Jarvis context excludes pending, archived, expired and malformed-expiry memories', () => {
  const state = structuredClone(INITIAL_STATE);
  state.memories = [
    makeMemory({ id: 'active', content: 'Keep plans realistic', realm: 'personal' }),
    makeMemory({ id: 'pending', content: 'Unconfirmed preference', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'legacy-learned', content: 'Legacy suggestion without status', realm: 'personal', type: 'learned', status: 'active' }),
    makeMemory({ id: 'archived', content: 'Old preference', realm: 'personal', status: 'archived' }),
    makeMemory({ id: 'expired', content: 'Expired preference', realm: 'personal', expiresAt: '2020-01-01T00:00:00.000Z' }),
    makeMemory({ id: 'malformed', content: 'Invalid expiry preference', realm: 'personal', expiresAt: 'not-a-date' }),
    makeMemory({ id: 'future', content: 'Temporary future preference', realm: 'personal', expiresAt: new Date(Date.now() + 60_000).toISOString() }),
  ];

  const result = buildBrainContext(state, 'personal');
  assert.deepEqual(result.relevantMemories.map((memory) => memory.id), ['active', 'future']);
});

test('Jarvis context never mixes personal and Mariluna memories across workspaces', () => {
  const state = structuredClone(INITIAL_STATE);
  state.memories = [
    makeMemory({ id: 'private', content: 'Private preference', realm: 'personal' }),
    makeMemory({ id: 'business', content: 'Mariluna brand voice', realm: 'mariluna' }),
    { ...makeMemory({ id: 'unscoped', content: 'Unscoped memory', realm: 'personal' }), realm: undefined as any },
  ];

  assert.deepEqual(buildBrainContext(state, 'personal').relevantMemories.map((memory) => memory.id), ['private']);
  assert.deepEqual(buildBrainContext(state, 'mariluna').relevantMemories.map((memory) => memory.id), ['business']);
  assert.deepEqual(
    buildBrainContext(state, 'balanced').relevantMemories.map((memory) => memory.id).sort(),
    ['business', 'private'],
  );
});

test('memory confirmation only promotes pending learned suggestions', async () => {
  const { confirmLearnedMemory } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'pending', content: 'Candidate', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'archived', content: 'Archived', realm: 'personal', type: 'learned', status: 'archived' }),
    makeMemory({ id: 'explicit', content: 'Explicit', realm: 'personal', type: 'explicit', status: 'active' }),
  ];
  const result = confirmLearnedMemory(memories, 'archived');
  assert.equal(result.find((memory) => memory.id === 'archived')?.status, 'archived');
  assert.equal(result.find((memory) => memory.id === 'explicit')?.type, 'explicit');
  const confirmed = confirmLearnedMemory(result, 'pending');
  assert.equal(confirmed.find((memory) => memory.id === 'pending')?.type, 'confirmed');
});

test('memory dismissal only removes pending learned suggestions', async () => {
  const { dismissLearnedMemory } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'pending', content: 'Candidate', realm: 'personal', type: 'learned', status: 'pending_confirmation' }),
    makeMemory({ id: 'explicit', content: 'Explicit', realm: 'personal', type: 'explicit', status: 'active' }),
    makeMemory({ id: 'confirmed', content: 'Confirmed', realm: 'personal', type: 'confirmed', status: 'active' }),
  ];
  assert.deepEqual(
    dismissLearnedMemory(memories, 'explicit').map((memory) => memory.id),
    ['pending', 'explicit', 'confirmed'],
  );
  assert.deepEqual(
    dismissLearnedMemory(memories, 'pending').map((memory) => memory.id),
    ['explicit', 'confirmed'],
  );
});

test('memory edits cannot blank a memory or mutate an archived record', async () => {
  const { updateMemoryContent } = await import('./memoryEngine');
  const memories = [
    makeMemory({ id: 'active', content: 'Useful preference', realm: 'personal' }),
    makeMemory({ id: 'archived', content: 'Archived preference', realm: 'personal', status: 'archived' }),
  ];
  const blankEdit = updateMemoryContent(memories, 'active', '   ');
  assert.equal(blankEdit[0].content, 'Useful preference');
  const archivedEdit = updateMemoryContent(memories, 'archived', 'Changed text');
  assert.equal(archivedEdit[1].content, 'Archived preference');
  assert.equal(archivedEdit[1].status, 'archived');
  const validEdit = updateMemoryContent(memories, 'active', ' Updated preference ');
  assert.equal(validEdit[0].content, 'Updated preference');
});


test('Jarvis Mariluna context excludes private identity, health, food, check-in and calendar details', () => {
  const state = structuredClone(INITIAL_STATE);
  state.foundation = {
    ...state.foundation,
    patzIdentity: { ...state.foundation.patzIdentity, heritage: 'PRIVATE HERITAGE MARKER' },
    foodProfile: { ...state.foundation.foodProfile, dislikes: ['PRIVATE FOOD MARKER'], allergies: ['PRIVATE ALLERGY MARKER'] },
    work: { ...state.foundation.work, workContexts: [{ name: 'PRIVATE WORK MARKER', workdays: ['Monday'], startTime: '08:00', endTime: '16:00' }] },
  } as any;
  state.dailyCheckIns = [{ date: '2026-11-20', feeling: 'sick' } as any];
  state.cycleProfile = { ...state.cycleProfile, trackingEnabled: true, history: [{ date: '2026-11-20', note: 'PRIVATE CYCLE MARKER' }] } as any;
  state.nutrition = {
    ...state.nutrition,
    mealHistory: [{ recipeName: 'PRIVATE MEAL MARKER' }] as any,
    activeWeeklyPlan: { days: [{ date: '2026-11-20', recipeId: 'private-recipe', customMealName: 'PRIVATE DINNER MARKER' }] } as any,
  };
  state.wellbeing = { ...state.wellbeing, movementHistory: [{ title: 'PRIVATE MOVEMENT MARKER', plannedDurationMins: 30 }] } as any;
  state.integrations = {
    ...state.integrations,
    healthConnect: { ...state.integrations.healthConnect, status: 'connected', todaySteps: 9876 },
    gmail: { ...state.integrations.gmail, status: 'connected', messages: [{ unread: true }] },
  } as any;
  state.calendarEvents = [
    { id: 'private-event', title: 'PRIVATE EVENT MARKER', date: '2026-11-20', startTime: '09:00', endTime: '10:00', realm: 'personal' },
    { id: 'business-event', title: 'Mariluna launch meeting', date: '2026-11-20', startTime: '11:00', endTime: '12:00', realm: 'mariluna' },
  ] as any;
  state.tasks = [
    { id: 'private-task', title: 'PRIVATE TASK MARKER', status: 'todo', priority: 'high', realm: 'personal' },
    { id: 'business-task', title: 'Prepare Mariluna launch', status: 'todo', priority: 'high', realm: 'mariluna' },
  ] as any;
  state.goals = [
    { id: 'private-goal', title: 'PRIVATE GOAL MARKER', status: 'active', realm: 'personal', progress: 10 },
    { id: 'business-goal', title: 'Mariluna growth', status: 'active', realm: 'mariluna', progress: 20 },
  ] as any;
  state.projects = [{ id: 'business-project', title: 'Mariluna project', status: 'active', realm: 'mariluna' }] as any;
  state.marilunaAdmin = { ...state.marilunaAdmin!, deadlines: [{ id: 'deadline', completed: false }] } as any;

  const context = buildBrainContext(state, 'mariluna', '2026-11-20');

  assert.equal(context.layer1Identity.roots, '');
  assert.deepEqual(context.layer2Preferences.foodDislikes, []);
  assert.deepEqual(context.layer2Preferences.foodFavorites, []);
  assert.deepEqual(context.layer2Preferences.workContexts, []);
  assert.equal(context.layer2Preferences.styleDNA, '');
  assert.equal(context.layer3CurrentState.checkInFeeling, undefined);
  assert.equal(context.layer3CurrentState.capacityLevel, 'normal');
  assert.equal(context.layer3CurrentState.dinnerPlanned, false);
  assert.deepEqual(context.layer3CurrentState.scheduledEvents.map((event) => event.title), ['Mariluna launch meeting']);
  assert.deepEqual(context.layer3CurrentState.openTasks.map((task) => task.title), ['Prepare Mariluna launch']);
  assert.deepEqual(context.layer4Goals.activeGoals.map((goal) => goal.title), ['Mariluna growth']);
  assert.deepEqual(context.layer5History.recentMealNames, []);
  assert.deepEqual(context.layer5History.recentMovementSessions, []);
  assert.equal(context.layer6External.healthConnectConnected, false);
  assert.equal(context.layer6External.todaySteps, undefined);
  assert.equal(context.layer6External.unreadBusinessInquiriesCount, 1);
  assert.deepEqual(context.relevantMemories, []);
});

test('Jarvis Private context excludes Mariluna tasks, projects, goals and business integrations', () => {
  const state = structuredClone(INITIAL_STATE);
  state.calendarEvents = [
    { id: 'private-event', title: 'Private appointment', date: '2026-11-20', startTime: '09:00', endTime: '10:00', realm: 'personal' },
    { id: 'business-event', title: 'MARILUNA EVENT MARKER', date: '2026-11-20', startTime: '11:00', endTime: '12:00', realm: 'mariluna' },
  ] as any;
  state.tasks = [
    { id: 'private-task', title: 'Private task', status: 'todo', priority: 'medium', realm: 'personal' },
    { id: 'business-task', title: 'MARILUNA TASK MARKER', status: 'todo', priority: 'high', realm: 'mariluna' },
  ] as any;
  state.goals = [
    { id: 'private-goal', title: 'Private goal', status: 'active', realm: 'personal', progress: 10 },
    { id: 'business-goal', title: 'MARILUNA GOAL MARKER', status: 'active', realm: 'mariluna', progress: 20 },
  ] as any;
  state.projects = [{ id: 'business-project', title: 'MARILUNA PROJECT MARKER', status: 'active', realm: 'mariluna' }] as any;
  state.marilunaAdmin = { ...state.marilunaAdmin!, deadlines: [{ id: 'business-deadline', completed: false }] } as any;
  state.integrations = {
    ...state.integrations,
    gmail: { ...state.integrations.gmail, status: 'connected', messages: [{ unread: true }] },
    instagram: { ...state.integrations.instagram, status: 'connected' },
  } as any;

  const context = buildBrainContext(state, 'personal', '2026-11-20');

  assert.deepEqual(context.layer3CurrentState.scheduledEvents.map((event) => event.title), ['Private appointment']);
  assert.deepEqual(context.layer3CurrentState.openTasks.map((task) => task.title), ['Private task']);
  assert.deepEqual(context.layer4Goals.activeGoals.map((goal) => goal.title), ['Private goal']);
  assert.equal(context.layer3CurrentState.activeProjectsCount, 0);
  assert.equal(context.layer3CurrentState.urgentDeadlinesCount, 0);
  assert.equal(context.layer6External.marilunaGmailConnected, false);
  assert.equal(context.layer6External.instagramConnected, false);
  assert.equal(context.layer6External.unreadBusinessInquiriesCount, 0);
});
