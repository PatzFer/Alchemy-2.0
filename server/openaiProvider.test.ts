import test from 'node:test';
import assert from 'node:assert/strict';
import { requestOpenAIResponse } from './openaiProvider';

test('OpenAI adapter makes no request without explicit server configuration', async () => {
  let called = false;
  const result = await requestOpenAIResponse([{ role: 'user', content: 'Hello' }], {
    fetcher: (async () => { called = true; throw new Error('should not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.available, false);
  assert.equal(result.reason, 'missing_configuration');
});

test('OpenAI adapter rejects API keys containing whitespace before network access', async () => {
  let called = false;
  const result = await requestOpenAIResponse([{ role: 'user', content: 'Hello' }], {
    apiKey: 'sk-bad key',
    model: 'test-model',
    fetcher: (async () => { called = true; throw new Error('should not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.available, false);
  assert.equal(result.reason, 'missing_configuration');
});

test('OpenAI adapter sends server-side key and extracts Responses API output', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const result = await requestOpenAIResponse([
    { role: 'system', content: 'Be concise.' },
    { role: 'user', content: 'Hello' },
  ], {
    apiKey: 'server-secret',
    model: 'test-model',
    fetcher: (async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return new Response(JSON.stringify({ output_text: 'Hello back.' }), { status: 200 });
    }) as typeof fetch,
  });
  assert.equal(result.available, true);
  assert.equal(result.text, 'Hello back.');
  assert.equal(requestUrl, 'https://api.openai.com/v1/responses');
  assert.equal(new Headers(requestInit?.headers).get('Authorization'), 'Bearer server-secret');
  assert.equal(JSON.parse(String(requestInit?.body)).model, 'test-model');
});

test('OpenAI adapter fails closed on provider errors and does not leak response bodies', async () => {
  const result = await requestOpenAIResponse([{ role: 'user', content: 'Hello' }], {
    apiKey: 'server-secret',
    model: 'test-model',
    fetcher: (async () => new Response('private provider diagnostics', { status: 500 })) as typeof fetch,
  });
  assert.deepEqual(result, { available: false, text: null, reason: 'provider_error' });
});

test('OpenAI adapter rejects oversized or malformed input before network access', async () => {
  let called = false;
  const result = await requestOpenAIResponse([{ role: 'user', content: 'x'.repeat(20001) }], {
    apiKey: 'server-secret',
    model: 'test-model',
    fetcher: (async () => { called = true; throw new Error('should not run'); }) as typeof fetch,
  });
  assert.equal(called, false);
  assert.equal(result.reason, 'invalid_response');
});

test('OpenAI adapter aborts and returns timeout when request exceeds timeoutMs', async () => {
  let aborted = false;
  const result = await requestOpenAIResponse([{ role: 'user', content: 'Hello' }], {
    apiKey: 'server-secret',
    model: 'test-model',
    timeoutMs: 15,
    fetcher: ((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          aborted = true;
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })) as typeof fetch,
  });

  assert.equal(aborted, true);
  assert.deepEqual(result, { available: false, text: null, reason: 'timeout' });
});
