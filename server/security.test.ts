import test from 'node:test';
import assert from 'node:assert/strict';
import { securityVault, requireAppAuth } from './security';
import { buildIntentAwareResponse } from './brainEngine';

test('Mariluna AI context excludes personal events, projects, memories and private preferences', () => {
  securityVault.updatePermissions({ allowPersonalDataToAI: true, allowMarilunaDataToAI: true });
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
  securityVault.updatePermissions({ allowPersonalDataToAI: false, allowMarilunaDataToAI: false });
});

test('Personal AI context excludes Mariluna business records and offerings', () => {
  securityVault.updatePermissions({ allowPersonalDataToAI: true, allowMarilunaDataToAI: true });
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
  securityVault.updatePermissions({ allowPersonalDataToAI: false, allowMarilunaDataToAI: false });
});


test('private API middleware rejects an unauthenticated session', () => {
  const headers: Record<string, string> = {};
  const req: any = {
    cookies: {},
    headers: { 'user-agent': 'Alchemy test runner' },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this.body = body; return this; },
    cookie(name: string, value: string) { headers[name] = value; return this; },
  };
  let nextCalled = false;
  requireAppAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.authenticationRequired, true);
  assert.equal(nextCalled, false);
});



test('private API middleware rejects malformed session cookies and creates a fresh locked session', () => {
  const cookies: Record<string, string> = {};
  const req: any = {
    cookies: { pm_alchemy_session: 'not-a-64-character-session-token' },
    headers: { 'user-agent': 'Alchemy test runner' },
    ip: '127.0.0.5',
    socket: { remoteAddress: '127.0.0.5' },
  };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this.body = body; return this; },
    cookie(name: string, value: string) { cookies[name] = value; return this; },
  };
  let nextCalled = false;
  requireAppAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
  assert.match(cookies.pm_alchemy_session, /^[a-f0-9]{64}$/);
});

test('private API middleware ignores a caller-supplied session header', () => {
  const authenticatedSession = securityVault.createSession({
    ip: '127.0.0.3',
    headers: { 'user-agent': 'Alchemy test runner' },
    socket: { remoteAddress: '127.0.0.3' },
  } as any, 'totp', true);
  const headers: Record<string, string> = {};
  const req: any = {
    cookies: {},
    headers: {
      'user-agent': 'Alchemy test runner',
      'x-session-id': authenticatedSession.id,
    },
    ip: '127.0.0.4',
    socket: { remoteAddress: '127.0.0.4' },
  };
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this.body = body; return this; },
    cookie(name: string, value: string) { headers[name] = value; return this; },
  };
  let nextCalled = false;
  requireAppAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.authenticationRequired, true);
  assert.equal(nextCalled, false);
  assert.notEqual(headers.pm_alchemy_session, authenticatedSession.id);
});

test('private API middleware allows a valid authenticated session', () => {
  const session = securityVault.createSession({
    ip: '127.0.0.2',
    headers: { 'user-agent': 'Alchemy test runner' },
    socket: { remoteAddress: '127.0.0.2' },
  } as any, 'totp', true);
  const req: any = {
    cookies: { pm_alchemy_session: session.id },
    headers: { 'user-agent': 'Alchemy test runner' },
    ip: '127.0.0.2',
    socket: { remoteAddress: '127.0.0.2' },
  };
  const res: any = {
    statusCode: 200,
    status(code: number) { this.statusCode = code; return this; },
    json(body: any) { this.body = body; return this; },
    cookie() { return this; },
  };
  let nextCalled = false;
  requireAppAuth(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
});


test('AI access to personal, business, cycle and wellbeing data is disabled by default', () => {
  const permissions = securityVault.getPermissions();
  assert.equal(permissions.allowPersonalDataToAI, false);
  assert.equal(permissions.allowMarilunaDataToAI, false);
  assert.equal(permissions.allowCycleDataToAI, false);
  assert.equal(permissions.allowWellbeingDataToAI, false);
});

test('permission updates ignore unknown keys and preserve mandatory confirmations', () => {
  const updated = securityVault.updatePermissions({
    allowPersonalDataToAI: true,
    aiRequiresConfirmationForModifications: false,
    aiRequiresConfirmationForDestructive: false,
    admin: true,
  } as any);
  assert.equal(updated.allowPersonalDataToAI, true);
  assert.equal(updated.aiRequiresConfirmationForModifications, true);
  assert.equal(updated.aiRequiresConfirmationForDestructive, true);
  assert.equal('admin' in updated, false);
  securityVault.updatePermissions({ allowPersonalDataToAI: false });
});


test('default AI privacy firewall removes both private and business records', () => {
  const mixedContext = {
    tasks: [
      { id: 'private-task', realm: 'personal' },
      { id: 'business-task', realm: 'mariluna' },
    ],
    goals: [
      { id: 'private-goal', realm: 'personal' },
      { id: 'business-goal', realm: 'mariluna' },
    ],
    wellbeing: { notes: 'private wellbeing data' },
    cycleProfile: { phase: 'luteal' },
    nutrition: { notes: 'private meal data' },
    marilunaMetrics: { metrics: [{ name: 'Revenue', value: 5000 }] },
    marilunaClients: [{ name: 'Client record' }],
    marilunaOfferings: [{ title: 'Business service' }],
    offerings: [{ title: 'Business service' }],
    contentPlan: { quarterTheme: 'Business theme' },
  };

  const privateResult = securityVault.sanitizeContextForAi(mixedContext, 'personal');
  const businessResult = securityVault.sanitizeContextForAi(mixedContext, 'mariluna');

  assert.deepEqual(privateResult.tasks, []);
  assert.deepEqual(privateResult.goals, []);
  assert.equal('wellbeing' in privateResult, false);
  assert.equal('cycleProfile' in privateResult, false);
  assert.equal('nutrition' in privateResult, false);
  assert.equal('marilunaMetrics' in privateResult, false);
  assert.equal('marilunaClients' in privateResult, false);
  assert.equal('marilunaOfferings' in privateResult, false);
  assert.equal('offerings' in privateResult, false);
  assert.equal('contentPlan' in privateResult, false);

  assert.deepEqual(businessResult.tasks, []);
  assert.deepEqual(businessResult.goals, []);
  assert.equal('wellbeing' in businessResult, false);
  assert.equal('cycleProfile' in businessResult, false);
  assert.equal('nutrition' in businessResult, false);
});


test('WebAuthn challenges are one-time and cannot be replayed', () => {
  securityVault.setChallenge('test-one-time-challenge', 'nonce-value');
  assert.equal(securityVault.consumeChallenge('test-one-time-challenge'), 'nonce-value');
  assert.equal(securityVault.consumeChallenge('test-one-time-challenge'), undefined);
  assert.equal(securityVault.getChallenge('test-one-time-challenge'), undefined);
});

test('expired WebAuthn challenges are rejected', async () => {
  securityVault.setChallenge('test-expired-challenge', 'expired-nonce', 1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(securityVault.consumeChallenge('test-expired-challenge'), undefined);
});


test('device inventory exposes public identifiers, never HttpOnly session credentials', () => {
  const session = securityVault.createSession({
    ip: '127.0.0.9',
    headers: { 'user-agent': 'Alchemy device inventory test' },
    socket: { remoteAddress: '127.0.0.9' },
  } as any);
  const listed = securityVault.getActiveSessions(session.id).find((item) => item.isCurrent);
  assert.ok(listed);
  assert.equal(listed.isCurrent, true);
  assert.notEqual(listed.id, session.id);
  assert.equal('lastActivityMs' in listed, false);
  assert.equal('stepUpExpiresAt' in listed, false);
  assert.equal(securityVault.revokeSession(listed.id), true);
  assert.equal(securityVault.getSession(session.id), undefined);
});


test('balanced AI context enforces each realm consent on all mixed collections', () => {
  securityVault.updatePermissions({
    allowPersonalDataToAI: true,
    allowMarilunaDataToAI: false,
    allowWellbeingDataToAI: false,
  });
  const mixed = {
    calendarEvents: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }, { id: 'u' }],
    projects: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    ideas: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    intentions: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    tasks: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }, { id: 'u' }],
    goals: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    offerings: [{ title: 'Business offering' }],
    contentPlan: { quarterTheme: 'Business theme' },
    workingHours: 'Private working hours',
    preferences: { protectEvenings: true },
    todayIntention: { id: 'm', realm: 'mariluna' },
    activeContextItem: { id: 'm', realm: 'mariluna' },
  };
  const result = securityVault.sanitizeContextForAi(mixed, 'all');
  for (const key of ['calendarEvents', 'projects', 'ideas', 'intentions', 'tasks', 'goals']) {
    assert.deepEqual((result as any)[key].map((item: any) => item.id), ['p']);
  }
  assert.equal('offerings' in result, false);
  assert.equal('contentPlan' in result, false);
  assert.equal(result.workingHours, 'Private working hours');
  assert.deepEqual(result.preferences, { protectEvenings: true });
  assert.equal('todayIntention' in result, false);
  assert.equal('activeContextItem' in result, false);
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowMarilunaDataToAI: false,
  });
});

test('balanced AI context excludes personal records when only Mariluna consent is enabled', () => {
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowMarilunaDataToAI: true,
  });
  const result = securityVault.sanitizeContextForAi({
    calendarEvents: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    projects: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    tasks: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    goals: [{ id: 'p', realm: 'personal' }, { id: 'm', realm: 'mariluna' }],
    workingHours: 'Private working hours',
    preferences: { protectEvenings: true },
  }, 'balanced');
  assert.deepEqual(result.calendarEvents.map((item: any) => item.id), ['m']);
  assert.deepEqual(result.projects.map((item: any) => item.id), ['m']);
  assert.deepEqual(result.tasks.map((item: any) => item.id), ['m']);
  assert.deepEqual(result.goals.map((item: any) => item.id), ['m']);
  assert.equal('workingHours' in result, false);
  assert.equal('preferences' in result, false);
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowMarilunaDataToAI: false,
  });
});


test('financial records and prices remain quarantined without financial AI consent', () => {
  securityVault.updatePermissions({
    allowMarilunaDataToAI: true,
    allowFinancialDataToAI: false,
  });
  const result = securityVault.sanitizeContextForAi({
    offerings: [
      { id: 'service-1', title: 'Reading', price: 75, description: 'A service' },
    ],
    marilunaMetrics: {
      revenueTargetYear: 12000,
      metrics: [
        { id: 'revenue', name: 'Revenue', value: 5000, unit: '€' },
        { id: 'followers', name: 'Instagram followers', value: 800, unit: 'people' },
      ],
    },
    financialData: { balance: 1200, bankTransactions: [{ amount: 100 }] },
    tasks: [{ id: 'business-task', realm: 'mariluna', title: 'Publish a post' }],
  }, 'mariluna');

  assert.deepEqual(result.offerings, [
    { id: 'service-1', title: 'Reading', description: 'A service' },
  ]);
  assert.equal('financialData' in result, false);
  assert.equal('marilunaAdmin' in result, false);
  assert.equal('marilunaFinance' in result, false);
  assert.equal('revenueTargetYear' in result.marilunaMetrics, false);
  assert.deepEqual(result.marilunaMetrics.metrics, [
    { id: 'followers', name: 'Instagram followers', value: 800, unit: 'people' },
  ]);
  assert.deepEqual(result.tasks.map((item: any) => item.id), ['business-task']);
  securityVault.updatePermissions({
    allowMarilunaDataToAI: false,
    allowFinancialDataToAI: false,
  });
});


test('application sessions expire after their absolute lifetime', () => {
  const session = securityVault.createSession({
    ip: '127.0.0.10',
    headers: { 'user-agent': 'Alchemy expiry test' },
    socket: { remoteAddress: '127.0.0.10' },
  } as any);
  session.expiresAt = Date.now() - 1;
  assert.equal(securityVault.getSession(session.id), undefined);
  assert.equal(securityVault.getActiveSessions(session.id).some((item) => item.id === session.publicId), false);
});


test('authentication rate limiting locks after five failures and can be cleared', () => {
  const key = 'alchemy-rate-limit-regression-test';
  securityVault.clearFailedAttempts(key);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    securityVault.recordFailedAttempt(key);
  }
  const blocked = securityVault.checkRateLimit(key);
  assert.equal(blocked.allowed, false);
  assert.ok((blocked.remainingLockoutSeconds || 0) > 0);
  securityVault.clearFailedAttempts(key);
  assert.equal(securityVault.checkRateLimit(key).allowed, true);
});


test('Jarvis receives only active confirmed memories allowed by realm and sensitivity consent', () => {
  securityVault.updatePermissions({
    allowPersonalDataToAI: true,
    allowMarilunaDataToAI: true,
    allowWellbeingDataToAI: false,
    allowCycleDataToAI: false,
    allowFinancialDataToAI: false,
  });
  const memories = [
    { content: 'Prefers calm, realistic planning.', category: 'Planning', realm: 'personal', type: 'explicit', status: 'active' },
    { content: 'Tracks menstrual cycle phases.', category: 'Cyclus', realm: 'personal', type: 'confirmed', status: 'active' },
    { content: 'Wants to track wellbeing and weight.', category: 'Gezondheid', realm: 'personal', type: 'confirmed', status: 'active' },
    { content: 'Mariluna uses a warm editorial brand voice.', category: 'Brand strategy', realm: 'mariluna', type: 'confirmed', status: 'active' },
    { content: 'Monthly revenue and costs.', category: 'Finance', realm: 'mariluna', type: 'confirmed', status: 'active' },
    { content: 'Unconfirmed inferred preference.', category: 'Planning', realm: 'personal', type: 'learned', status: 'pending_confirmation' },
    { content: 'Archived memory.', category: 'Planning', realm: 'personal', type: 'explicit', status: 'archived' },
    { content: 'Unscoped memory.', category: 'Planning', type: 'explicit', status: 'active' },
  ];
  const result = securityVault.sanitizeContextForAi({ memoryItems: memories }, 'all');
  assert.deepEqual(result.memoryItems.map((item: any) => item.content), [
    'Prefers calm, realistic planning.',
    'Mariluna uses a warm editorial brand voice.',
  ]);

  securityVault.updatePermissions({
    allowWellbeingDataToAI: true,
    allowCycleDataToAI: true,
    allowFinancialDataToAI: true,
  });
  const fullyAuthorized = securityVault.sanitizeContextForAi({ memoryItems: memories }, 'all');
  assert.equal(fullyAuthorized.memoryItems.length, 5);

  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowMarilunaDataToAI: false,
    allowWellbeingDataToAI: false,
    allowCycleDataToAI: false,
    allowFinancialDataToAI: false,
  });
});


test('local Jarvis can retrieve only the confirmed memories supplied by the privacy filter', () => {
  const answer = buildIntentAwareResponse(
    { intent: 'ambiguous' },
    'Wat weet je nog?',
    {
      memoryItems: [
        { content: 'Prefers calm, realistic planning.', category: 'Planning', realm: 'personal', type: 'explicit' },
      ],
    },
    'personal',
  );
  assert.match(answer, /Prefers calm, realistic planning/);
  assert.match(answer, /bevestigde herinneringen/i);

  const emptyAnswer = buildIntentAwareResponse(
    { intent: 'ambiguous' },
    'Wat herinner je je?',
    { memoryItems: [] },
    'personal',
  );
  assert.match(emptyAnswer, /geen bevestigde herinneringen/i);
});


test('Jarvis AI quota limits bursts per session and resets after its sliding window', () => {
  const key = 'ai-quota-regression-test-session';
  const start = 1_800_000_000_000;

  for (let index = 0; index < 20; index += 1) {
    const result = securityVault.consumeAiRequest(key, start + index);
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 19 - index);
  }

  const blocked = securityVault.consumeAiRequest(key, start + 20);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.retryAfterSeconds, 60);

  const afterWindow = securityVault.consumeAiRequest(key, start + 60_020);
  assert.equal(afterWindow.allowed, true);
  assert.equal(afterWindow.remaining, 19);
});

test('Jarvis AI quota is isolated between sessions', () => {
  const first = securityVault.consumeAiRequest('ai-quota-session-one', 1_800_000_100_000);
  const second = securityVault.consumeAiRequest('ai-quota-session-two', 1_800_000_100_000);
  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(first.remaining, 19);
  assert.equal(second.remaining, 19);
});

test('cycle phase context stays out of Jarvis prompts without explicit cycle consent', () => {
  securityVault.updatePermissions({
    allowPersonalDataToAI: true,
    allowCycleDataToAI: false,
  });
  const result = securityVault.sanitizeContextForAi({
    cyclePhase: 'luteal',
    cycleDay: 23,
    cyclePhaseConfidence: 'Estimated Model',
  }, 'personal');
  assert.equal('cyclePhase' in result, false);
  assert.equal('cycleDay' in result, false);
  assert.equal('cyclePhaseConfidence' in result, false);
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowCycleDataToAI: false,
  });
});

test('cycle consent alone cannot bypass the personal-data AI permission', () => {
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowCycleDataToAI: true,
  });
  const result = securityVault.sanitizeContextForAi({
    cyclePhase: 'follicular',
    cycleDay: 8,
  }, 'personal');
  assert.equal('cyclePhase' in result, false);
  assert.equal('cycleDay' in result, false);
  securityVault.updatePermissions({
    allowPersonalDataToAI: false,
    allowCycleDataToAI: false,
  });
});
