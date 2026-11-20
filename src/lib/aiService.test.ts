import test from 'node:test';
import assert from 'node:assert/strict';
import { sendChatMessage } from './aiService';

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
