import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sendChatMessage,
  requestGoalBreakdown,
  requestIdeaAnalysis,
  requestStylingEvaluationPhoto,
} from './aiService';

const originalFetch = globalThis.fetch;

function mockFetch(handler: typeof fetch) {
  globalThis.fetch = handler;
}

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('Jarvis returns a validated assistant message and supported suggested action', async () => {
  mockFetch(async () => new Response(JSON.stringify({
    content: 'Ik stel voor om dit als taak vast te leggen.\n\n```action\n{"type":"SUGGEST_TASK","label":"Taak voorstellen","data":{"title":"Weekplanning maken"}}\n```',
  }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

  const result = await sendChatMessage([{ role: 'user', content: 'Help me plannen' }], {}, 'personal');
  assert.equal(result.role, 'assistant');
  assert.equal(result.world, 'personal');
  assert.match(result.content, /Ik stel voor/);
  assert.equal(result.suggestedAction?.type, 'SUGGEST_TASK');
  assert.deepEqual(result.suggestedAction?.payload, { title: 'Weekplanning maken' });
  assert.equal(result.content.includes('```action'), false);
});

test('Jarvis ignores unsupported action types and never displays raw action JSON', async () => {
  mockFetch(async () => new Response(JSON.stringify({
    content: 'Hier is mijn antwoord.\n```action\n{"type":"BREAKDOWN_GOAL","data":{}}\n```',
  }), { status: 200 }));

  const result = await sendChatMessage([{ role: 'user', content: 'Wat stel je voor?' }], {}, 'mariluna');
  assert.equal(result.world, 'mariluna');
  assert.equal(result.suggestedAction, undefined);
  assert.equal(result.content, 'Hier is mijn antwoord.');
  assert.equal(result.content.includes('BREAKDOWN_GOAL'), false);
});

test('Jarvis reports an unavailable endpoint without inventing a successful result', async () => {
  mockFetch(async () => new Response(JSON.stringify({ error: 'unavailable' }), { status: 503 }));
  const result = await sendChatMessage([{ role: 'user', content: 'Wat staat er vandaag in mijn agenda?' }], {}, 'personal');
  assert.equal(result.role, 'assistant');
  assert.match(result.content, /niet bereikbaar/i);
  assert.match(result.content, /niets gewijzigd/i);
  assert.equal(result.suggestedAction, undefined);
});

test('Jarvis explains expired app authentication without disguising it as a Gemini outage', async () => {
  mockFetch(async () => new Response(JSON.stringify({
    error: 'Application authentication required.',
    authenticationRequired: true,
  }), { status: 401, headers: { 'Content-Type': 'application/json' } }));

  const result = await sendChatMessage(
    [{ role: 'user', content: 'Antwoord uitsluitend met: JARVIS ONLINE' }],
    {},
    'mariluna',
  );

  assert.equal(result.world, 'mariluna');
  assert.match(result.content, /sessie is vergrendeld of verlopen/i);
  assert.match(result.content, /ontgrendel de app opnieuw/i);
  assert.match(result.content, /geen gegevens gewijzigd/i);
  assert.doesNotMatch(result.content, /Gemini/i);
});

test('Jarvis rejects empty server responses and returns a clear recovery message', async () => {
  mockFetch(async () => new Response(JSON.stringify({ content: '   ' }), { status: 200 }));
  const result = await sendChatMessage([{ role: 'user', content: 'Help me' }], {}, 'personal');
  assert.match(result.content, /niet bereikbaar/i);
});


test('Jarvis discards incomplete action fences and array payloads', async () => {
  mockFetch(async () => new Response(JSON.stringify({
    content: 'Ik heb een voorstel.\n```action\n{"type":"SUGGEST_TASK","data":[{"title":"Onjuist"}]}',
  }), { status: 200 }));
  const result = await sendChatMessage([{ role: 'user', content: 'Maak een voorstel' }], {}, 'personal');
  assert.equal(result.suggestedAction, undefined);
  assert.equal(result.content, 'Ik heb een voorstel.');
});


test('goal breakdown returns only the server-generated milestone response', async () => {
  const expected = {
    milestones: [
      { title: 'Define the outcome', durationMins: 30, suggestedDay: 'Tomorrow' },
      { title: 'Complete the first draft', durationMins: 45, suggestedDay: 'Friday' },
    ],
  };
  mockFetch(async (input, init) => {
    assert.equal(String(input), '/api/ai/breakdown-goal');
    assert.equal(init?.method, 'POST');
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body, { goalTitle: 'Launch a project', realm: 'mariluna', timeframe: 'quarterly' });
    return new Response(JSON.stringify(expected), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  assert.deepEqual(await requestGoalBreakdown('Launch a project', 'mariluna', 'quarterly'), expected);
});

test('goal breakdown reports server failures instead of returning fabricated AI milestones', async () => {
  mockFetch(async () => new Response(JSON.stringify({ error: 'AI provider unavailable' }), { status: 503 }));
  await assert.rejects(
    () => requestGoalBreakdown('Launch a project', 'mariluna', 'quarterly'),
    /AI provider unavailable/,
  );
});

test('goal breakdown propagates network failures instead of disguising them as AI output', async () => {
  mockFetch(async () => { throw new Error('Network offline'); });
  await assert.rejects(
    () => requestGoalBreakdown('Launch a project', 'mariluna', 'quarterly'),
    /Network offline/,
  );
});

test('idea analysis preserves the server error instead of inventing a generic analysis', async () => {
  mockFetch(async () => new Response(JSON.stringify({ error: 'Jarvis-ideeanalyse is niet beschikbaar.' }), { status: 503 }));
  await assert.rejects(
    () => requestIdeaAnalysis('Een nieuw Mariluna-concept', 'mariluna'),
    /Jarvis-ideeanalyse is niet beschikbaar/,
  );
});

test('idea analysis rejects malformed success payloads', async () => {
  mockFetch(async () => new Response(JSON.stringify({ summary: 'Only half an answer' }), { status: 200 }));
  await assert.rejects(
    () => requestIdeaAnalysis('Een nieuw idee', 'personal'),
    /geen geldige analyse terug/,
  );
});

test('styling photo evaluation propagates server unavailability instead of falling back to fake advice', async () => {
  mockFetch(async () => new Response(JSON.stringify({ error: 'Visuele kledinganalyse vereist Gemini.' }), { status: 503 }));
  await assert.rejects(
    () => requestStylingEvaluationPhoto('data:image/jpeg;base64,abc', { heightMeters: 1.57 }),
    /Visuele kledinganalyse vereist Gemini/,
  );
});

test('styling photo evaluation rejects invalid verdicts and accepts valid qualitative results', async () => {
  mockFetch(async () => new Response(JSON.stringify({ verdict: 'MAYBE_72%' }), { status: 200 }));
  await assert.rejects(
    () => requestStylingEvaluationPhoto('data:image/png;base64,abc', {}),
    /geen geldig resultaat terug/,
  );

  const valid = { verdict: 'JA', descriptiveTitle: 'Witte blouse', whyReasons: ['Taillefocus'], combos: ['Suède laars'] };
  mockFetch(async () => new Response(JSON.stringify(valid), { status: 200 }));
  assert.deepEqual(await requestStylingEvaluationPhoto('data:image/png;base64,abc', {}), valid);
});
