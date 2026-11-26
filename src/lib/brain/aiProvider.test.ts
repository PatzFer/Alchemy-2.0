import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_STATE } from '../storage';
import { queryBrainAdvisor, splitTaskWithBrain } from './aiProvider';

const originalFetch = globalThis.fetch;

test.afterEach(() => {
  globalThis.fetch = originalFetch;
});

test('splitTaskWithBrain returns AI subtasks in ai mode when server succeeds', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        subtasks: [
          { title: 'Stap 1', durationMinutes: 15 },
          { title: 'Stap 2', durationMinutes: 20 },
          { title: 'Stap 3', durationMinutes: 15 },
        ],
        rationale: 'Rustige opbouw',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  const result = await splitTaskWithBrain('Nieuwe pagina schrijven', 50, 'mariluna');
  assert.equal(result.mode, 'ai');
  assert.equal(result.subtasks.length, 3);
  assert.equal(result.rationale, 'Rustige opbouw');
});

test('splitTaskWithBrain marks 503 disabled-AI responses as explicit local-deterministic mode', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ error: 'Live AI task splitting is disabled.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  const result = await splitTaskWithBrain('Nieuwsbrief opstellen', 60, 'mariluna');
  assert.equal(result.mode, 'local-deterministic');
  assert.ok(result.subtasks.length >= 2);
  assert.match(result.notice || '', /disabled/i);
});

test('splitTaskWithBrain throws on 502 invalid AI responses instead of fabricating output', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ error: 'Jarvis returned an invalid task breakdown.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  await assert.rejects(
    () => splitTaskWithBrain('Taak opdelen', 60, 'personal'),
    /invalid task breakdown/i,
  );
});

test('queryBrainAdvisor reports server unavailability honestly instead of fabricating advice', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ error: 'Jarvis is tijdelijk niet beschikbaar.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  const result = await queryBrainAdvisor('Wat is mijn focus?', INITIAL_STATE, 'personal');
  assert.equal(result.mode, 'local-deterministic');
  assert.match(result.answer, /niet beschikbaar/i);
  assert.equal(result.error, 'Jarvis is tijdelijk niet beschikbaar.');
});

test('queryBrainAdvisor distinguishes local provider responses from external AI responses', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ answer: 'Geen afspraken vandaag.', provider: 'local' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  const localRes = await queryBrainAdvisor('Agenda vandaag?', INITIAL_STATE, 'personal');
  assert.equal(localRes.mode, 'local-deterministic');
  assert.equal(localRes.error, undefined);

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ answer: 'Focus op je Q4 overzicht.', provider: 'gemini-server' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )) as typeof fetch;

  const aiRes = await queryBrainAdvisor('Focus vandaag?', INITIAL_STATE, 'mariluna');
  assert.equal(aiRes.mode, 'ai');
  assert.equal(aiRes.error, undefined);
});
