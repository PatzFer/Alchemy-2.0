import test from 'node:test';
import assert from 'node:assert/strict';
import { requestConfiguredAiResponse } from './aiProvider';

test('Gemini adapter makes no network request without a server key', async () => {
  let called = false;
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    fetcher: (async () => { called = true; throw new Error('must not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.available, false);
  assert.equal(result.reason, 'missing_configuration');
});

test('Gemini adapter sends a server-only key and extracts generated text', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const result = await requestConfiguredAiResponse([
    { role: 'system', content: 'Antwoord in het Nederlands.' },
    { role: 'user', content: 'Hallo Jarvis.' },
  ], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    fetcher: (async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Hallo! Waarmee kan ik helpen?' }] } }],
      }), { status: 200 });
    }) as typeof fetch,
  });

  assert.equal(result.available, true);
  assert.equal(result.text, 'Hallo! Waarmee kan ik helpen?');
  assert.equal(requestUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
  assert.equal(new Headers(requestInit?.headers).get('x-goog-api-key'), 'server-secret');
  assert.equal(JSON.parse(String(requestInit?.body)).systemInstruction.parts[0].text, 'Antwoord in het Nederlands.');
});

test('Gemini adapter keeps provider errors and credentials out of its result', async () => {
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    fetcher: (async () => new Response('private diagnostics and secret', { status: 500 })) as typeof fetch,
  });
  assert.deepEqual(result, {
    available: false,
    text: null,
    provider: 'gemini-server',
    model: 'gemini-3.8-flash',
    reason: 'provider_error',
  });
});

test('Gemini adapter rejects invalid model names before network access', async () => {
  let called = false;
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    geminiModel: 'bad/model?query',
    fetcher: (async () => { called = true; throw new Error('must not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.reason, 'missing_configuration');
});

test('Both providers reject malformed messages before network access', async () => {
  let called = false;
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'x'.repeat(20001) }], {
    provider: 'openai-server',
    openAiApiKey: 'server-secret',
    openAiModel: 'test-model',
    fetcher: (async () => { called = true; throw new Error('must not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.reason, 'invalid_response');
});


test('Gemini adapter classifies provider rate limits without leaking response bodies', async () => {
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    fetcher: (async () => new Response('private provider details', { status: 429 })) as typeof fetch,
  });
  assert.equal(result.available, false);
  assert.equal(result.reason, 'rate_limited');
  assert.equal(JSON.stringify(result).includes('private provider details'), false);
});

test('Gemini adapter aborts a stalled request within its configured timeout', async () => {
  const started = Date.now();
  const result = await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    timeoutMs: 1000,
    fetcher: ((_input, init) => new Promise((_resolve, reject) => {
      const signal = init?.signal;
      signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
    })) as typeof fetch,
  });
  assert.equal(result.available, false);
  assert.equal(result.reason, 'provider_timeout');
  assert.ok(Date.now() - started < 3000);
});


test('Gemini adapter defaults to the currently configured Flash model', async () => {
  let requestUrl = '';
  await requestConfiguredAiResponse([{ role: 'user', content: 'Hallo' }], {
    provider: 'gemini-server',
    geminiApiKey: 'server-secret',
    fetcher: (async (input) => {
      requestUrl = String(input);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'OK' }] } }],
      }), { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(requestUrl, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent');
});
