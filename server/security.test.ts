import test from 'node:test';
import assert from 'node:assert/strict';
import { securityVault, requireAppAuth } from './security';

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
  };

  const privateResult = securityVault.sanitizeContextForAi(mixedContext, 'personal');
  const businessResult = securityVault.sanitizeContextForAi(mixedContext, 'mariluna');

  assert.deepEqual(privateResult.tasks, []);
  assert.deepEqual(privateResult.goals, []);
  assert.equal('wellbeing' in privateResult, false);
  assert.equal('cycleProfile' in privateResult, false);
  assert.equal('nutrition' in privateResult, false);

  assert.deepEqual(businessResult.tasks, []);
  assert.deepEqual(businessResult.goals, []);
  assert.equal('wellbeing' in businessResult, false);
  assert.equal('cycleProfile' in businessResult, false);
  assert.equal('nutrition' in businessResult, false);
});
