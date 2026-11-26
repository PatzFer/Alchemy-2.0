import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GEMINI_MODEL,
  MAX_AI_RETRIES,
  formatAiFailureResponse,
  parseAiJsonResponse,
  requestConfiguredAiResponse,
  requestGeminiVisionResponse,
  type GeminiClientLike,
} from './aiProvider';

test('local-rules mode never invokes an external AI provider', async () => {
  let called = false;
  const mockClient: GeminiClientLike = {
    models: {
      generateContent: async () => {
        called = true;
        return { text: 'unexpected' };
      },
    },
  };

  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo' }],
    {
      provider: 'local-rules',
      geminiApiKey: 'test-key',
      geminiClient: mockClient,
    },
  );

  assert.equal(called, false);
  assert.equal(result.available, false);
  assert.equal(result.provider, 'local-rules');
  assert.equal(result.reason, 'local_mode');
});

test('Gemini provider rejects missing, blank, whitespace, or oversized keys without network calls', async () => {
  let called = false;
  const mockClient: GeminiClientLike = {
    models: {
      generateContent: async () => {
        called = true;
        return { text: 'unexpected' };
      },
    },
  };

  for (const badKey of [undefined, '', '   ', 'bad key', 'k'.repeat(4097)]) {
    const result = await requestConfiguredAiResponse(
      [{ role: 'user', content: 'Hallo' }],
      {
        provider: 'gemini-server',
        geminiApiKey: badKey,
        geminiClient: mockClient,
      },
    );
    assert.equal(result.available, false);
    assert.equal(result.reason, 'missing_configuration');
  }

  assert.equal(called, false);
});

test('Gemini provider rejects invalid model identifiers before calling SDK', async () => {
  let called = false;
  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      geminiModel: 'bad model/../../x',
      geminiClient: {
        models: {
          generateContent: async () => {
            called = true;
            return { text: 'unexpected' };
          },
        },
      },
    },
  );

  assert.equal(called, false);
  assert.equal(result.available, false);
  assert.equal(result.reason, 'missing_configuration');
});

test('Gemini provider defaults to gemini-3.8-flash and formats system + chat history cleanly', async () => {
  let capturedParams: any = null;
  const result = await requestConfiguredAiResponse(
    [
      { role: 'system', content: 'Je bent Jarvis.' },
      { role: 'user', content: 'Hoi' },
      { role: 'assistant', content: 'Goedemorgen!' },
      { role: 'user', content: 'Wat is mijn focus?' },
    ],
    {
      provider: 'gemini-server',
      geminiApiKey: '  server-gemini-key  ',
      geminiClient: {
        models: {
          generateContent: async (params) => {
            capturedParams = params;
            return { text: 'Focus vandaag op je hoofddoel.' };
          },
        },
      },
    },
  );

  assert.equal(result.available, true);
  assert.equal(result.provider, 'gemini-server');
  assert.equal(result.model, DEFAULT_GEMINI_MODEL);
  assert.equal(result.text, 'Focus vandaag op je hoofddoel.');
  assert.equal(capturedParams.model, 'gemini-3.8-flash');
  assert.equal(capturedParams.config.systemInstruction, 'Je bent Jarvis.');
  assert.deepEqual(capturedParams.contents, [
    { role: 'user', parts: [{ text: 'Hoi' }] },
    { role: 'model', parts: [{ text: 'Goedemorgen!' }] },
    { role: 'user', parts: [{ text: 'Wat is mijn focus?' }] },
  ]);
});

test('Gemini provider respects explicit GEMINI_MODEL override and JSON response mode', async () => {
  let capturedParams: any = null;
  const result = await requestConfiguredAiResponse(
    [
      { role: 'system', content: 'Return JSON.' },
      { role: 'user', content: 'Plan my day.' },
    ],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      geminiModel: 'gemini-4-hydrogen',
      responseFormat: 'json',
      geminiClient: {
        models: {
          generateContent: async (params) => {
            capturedParams = params;
            return { text: '```json\n{"summary":"Rustige dag"}\n```' };
          },
        },
      },
    },
  );

  assert.equal(result.available, true);
  assert.equal(result.model, 'gemini-4-hydrogen');
  assert.equal(capturedParams.config.responseMimeType, 'application/json');
  assert.deepEqual(parseAiJsonResponse(result.text), { summary: 'Rustige dag' });
});

test('parseAiJsonResponse rejects invalid or empty JSON', () => {
  assert.equal(parseAiJsonResponse(null), null);
  assert.equal(parseAiJsonResponse(''), null);
  assert.equal(parseAiJsonResponse('not json at all'), null);
  assert.deepEqual(parseAiJsonResponse('{"ok":true}'), { ok: true });
});

test('Gemini provider fails closed on SDK errors and oversized/empty outputs', async () => {
  const errResult = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      geminiClient: {
        models: {
          generateContent: async () => {
            throw new Error('upstream secret diagnostic');
          },
        },
      },
    },
  );
  assert.deepEqual(errResult, {
    available: false,
    text: null,
    provider: 'gemini-server',
    model: 'gemini-3.8-flash',
    reason: 'provider_error',
  });

  const emptyResult = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      geminiClient: {
        models: {
          generateContent: async () => ({ text: '   ' }),
        },
      },
    },
  );
  assert.equal(emptyResult.available, false);
  assert.equal(emptyResult.reason, 'invalid_response');
});

test('requestConfiguredAiResponse rejects oversized messages or system-only prompts', async () => {
  let called = false;
  const mockClient: GeminiClientLike = {
    models: {
      generateContent: async () => {
        called = true;
        return { text: 'unexpected' };
      },
    },
  };

  const oversized = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'a'.repeat(20001) }],
    { provider: 'gemini-server', geminiApiKey: 'key', geminiClient: mockClient },
  );
  assert.equal(oversized.reason, 'invalid_response');

  const systemOnly = await requestConfiguredAiResponse(
    [{ role: 'system', content: 'Only system' }],
    { provider: 'gemini-server', geminiApiKey: 'key', geminiClient: mockClient },
  );
  assert.equal(systemOnly.reason, 'invalid_response');
  assert.equal(called, false);
});

test('OpenAI remains optional and works only when explicitly selected and configured', async () => {
  let requestUrl = '';
  const result = await requestConfiguredAiResponse(
    [
      { role: 'system', content: 'Return JSON.' },
      { role: 'user', content: 'Analyze idea' },
    ],
    {
      provider: 'openai-server',
      openAiApiKey: 'sk-test-server-only',
      openAiModel: 'gpt-4.1-mini',
      responseFormat: 'json',
      fetcher: (async (input, init) => {
        requestUrl = String(input);
        const body = JSON.parse(String(init?.body));
        assert.deepEqual(body.text, { format: { type: 'json_object' } });
        return new Response(JSON.stringify({ output_text: '{"summary":"Helder idee"}' }), { status: 200 });
      }) as typeof fetch,
    },
  );

  assert.equal(requestUrl, 'https://api.openai.com/v1/responses');
  assert.equal(result.available, true);
  assert.equal(result.provider, 'openai-server');
  assert.equal(result.model, 'gpt-4.1-mini');
});

test('Gemini vision strips data-URI prefix, validates MIME type, and returns JSON analysis', async () => {
  let capturedParams: any = null;
  const result = await requestGeminiVisionResponse({
    geminiApiKey: 'server-gemini-key',
    imageBase64: 'data:image/png;base64,iVBORw0KGgo=',
    promptText: 'Beoordeel dit kledingstuk.',
    systemInstruction: 'Styling partner',
    responseFormat: 'json',
    geminiClient: {
      models: {
        generateContent: async (params) => {
          capturedParams = params;
          return { text: '{"verdict":"JA"}' };
        },
      },
    },
  });

  assert.equal(result.available, true);
  assert.equal(result.provider, 'gemini-server');
  assert.equal(result.model, 'gemini-3.8-flash');
  assert.equal(capturedParams.config.responseMimeType, 'application/json');
  assert.deepEqual(capturedParams.contents, [
    { inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } },
    { text: 'Beoordeel dit kledingstuk.' },
  ]);
});

test('Gemini vision rejects missing images, unsupported MIME types, and missing API keys', async () => {
  let called = false;
  const mockClient: GeminiClientLike = {
    models: {
      generateContent: async () => {
        called = true;
        return { text: '{"verdict":"JA"}' };
      },
    },
  };

  const noKey = await requestGeminiVisionResponse({
    geminiApiKey: '',
    imageBase64: 'aGVsbG8=',
    promptText: 'Check',
    geminiClient: mockClient,
  });
  assert.equal(noKey.reason, 'missing_configuration');

  const badMime = await requestGeminiVisionResponse({
    geminiApiKey: 'server-key',
    imageBase64: 'data:image/svg+xml;base64,PHN2Zz4=',
    promptText: 'Check',
    geminiClient: mockClient,
  });
  assert.equal(badMime.reason, 'invalid_response');

  const emptyImg = await requestGeminiVisionResponse({
    geminiApiKey: 'server-key',
    imageBase64: '',
    promptText: 'Check',
    geminiClient: mockClient,
  });
  assert.equal(emptyImg.reason, 'invalid_response');
  assert.equal(called, false);
});

test('Gemini retries transient HTTP 503 with exponential backoff and succeeds on third attempt', async () => {
  let attempts = 0;
  const backoffDelays: number[] = [];

  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Antwoord uitsluitend met: Jarvis online.' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      retryBaseDelayMs: 100,
      sleep: async (ms) => {
        backoffDelays.push(ms);
      },
      geminiClient: {
        models: {
          generateContent: async () => {
            attempts += 1;
            if (attempts === 1) {
              const err = new Error('{"error":{"code":503,"message":"This model is currently experiencing high demand.","status":"UNAVAILABLE"}}');
              (err as any).status = 503;
              throw err;
            }
            if (attempts === 2) {
              const err = new Error('Service Unavailable');
              (err as any).status = 503;
              throw err;
            }
            return { text: 'Jarvis online.' };
          },
        },
      },
    },
  );

  assert.equal(MAX_AI_RETRIES, 2);
  assert.equal(attempts, 3);
  assert.deepEqual(backoffDelays, [100, 200]);
  assert.equal(result.available, true);
  assert.equal(result.provider, 'gemini-server');
  assert.equal(result.text, 'Jarvis online.');
});

test('Gemini stops after max 2 retries on persistent HTTP 503 and returns clear unavailability failure', async () => {
  let attempts = 0;
  const backoffDelays: number[] = [];

  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo Jarvis' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      // Verify attempts are strictly capped at MAX_AI_RETRIES (2 retries = 3 total calls) even if higher value passed.
      maxRetries: 5,
      retryBaseDelayMs: 50,
      sleep: async (ms) => {
        backoffDelays.push(ms);
      },
      geminiClient: {
        models: {
          generateContent: async () => {
            attempts += 1;
            const err = new Error('{"error":{"code":503,"message":"High demand","status":"UNAVAILABLE"}}');
            (err as any).status = 503;
            throw err;
          },
        },
      },
    },
  );

  assert.equal(attempts, 3);
  assert.deepEqual(backoffDelays, [50, 100]);
  assert.deepEqual(result, {
    available: false,
    text: null,
    provider: 'gemini-server',
    model: 'gemini-3.8-flash',
    reason: 'provider_unavailable',
  });

  const httpFailure = formatAiFailureResponse(result.reason, { language: 'nl', target: 'chat' });
  assert.equal(httpFailure.statusCode, 503);
  assert.match(httpFailure.message, /niet bereikbaar/i);
  assert.match(httpFailure.message, /503/);
  assert.match(httpFailure.message, /niets gewijzigd/i);
});

test('Gemini retries transient HTTP 504 gateway timeouts and succeeds on the next attempt', async () => {
  let attempts = 0;
  const backoffDelays: number[] = [];

  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Antwoord uitsluitend met: Jarvis online.' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      maxRetries: 2,
      retryBaseDelayMs: 25,
      sleep: async (ms) => { backoffDelays.push(ms); },
      geminiClient: {
        models: {
          generateContent: async () => {
            attempts += 1;
            if (attempts === 1) {
              const err = new Error('Gateway Timeout');
              (err as any).status = 504;
              throw err;
            }
            return { text: 'Jarvis online.' };
          },
        },
      },
    },
  );

  assert.equal(attempts, 2);
  assert.deepEqual(backoffDelays, [25]);
  assert.equal(result.available, true);
  assert.equal(result.text, 'Jarvis online.');
});

test('Gemini retries transient HTTP 429 rate-limit errors with exponential backoff (max 2 retries)', async () => {
  let attempts = 0;
  const backoffDelays: number[] = [];

  const eventualSuccess = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Wat staat er op mijn planning?' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      retryBaseDelayMs: 25,
      sleep: async (ms) => {
        backoffDelays.push(ms);
      },
      geminiClient: {
        models: {
          generateContent: async () => {
            attempts += 1;
            if (attempts === 1) {
              const err = new Error('{"error":{"code":429,"message":"Quota exceeded","status":"RESOURCE_EXHAUSTED"}}');
              (err as any).status = 429;
              throw err;
            }
            return { text: 'Je planning voor vandaag is rustig.' };
          },
        },
      },
    },
  );

  assert.equal(attempts, 2);
  assert.deepEqual(backoffDelays, [25]);
  assert.equal(eventualSuccess.available, true);
  assert.equal(eventualSuccess.text, 'Je planning voor vandaag is rustig.');

  let exhaustedAttempts = 0;
  const exhaustedDelays: number[] = [];
  const exhausted = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Wat staat er op mijn planning?' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      retryBaseDelayMs: 40,
      sleep: async (ms) => {
        exhaustedDelays.push(ms);
      },
      geminiClient: {
        models: {
          generateContent: async () => {
            exhaustedAttempts += 1;
            const err = new Error('Too Many Requests');
            (err as any).status = 429;
            throw err;
          },
        },
      },
    },
  );

  assert.equal(exhaustedAttempts, 3);
  assert.deepEqual(exhaustedDelays, [40, 80]);
  assert.equal(exhausted.available, false);
  assert.equal(exhausted.reason, 'rate_limited');
  assert.equal(formatAiFailureResponse(exhausted.reason, { language: 'nl' }).statusCode, 503);
});

test('Gemini enforces bounded request timeout and aborts hanging SDK calls', async () => {
  let attempts = 0;
  let signalAborted = false;

  const result = await requestConfiguredAiResponse(
    [{ role: 'user', content: 'Hallo' }],
    {
      provider: 'gemini-server',
      geminiApiKey: 'server-gemini-key',
      timeoutMs: 15,
      geminiClient: {
        models: {
          generateContent: async (params) => {
            attempts += 1;
            params.config?.abortSignal?.addEventListener('abort', () => {
              signalAborted = true;
            });
            return await new Promise<{ text?: string }>(() => {
              // Deliberately never resolves to verify bounded timeout enforcement.
            });
          },
        },
      },
    },
  );

  assert.equal(attempts, 1);
  assert.equal(signalAborted, true);
  assert.deepEqual(result, {
    available: false,
    text: null,
    provider: 'gemini-server',
    model: 'gemini-3.8-flash',
    reason: 'timeout',
  });

  const httpFailure = formatAiFailureResponse(result.reason, { language: 'nl', target: 'chat' });
  assert.equal(httpFailure.statusCode, 504);
  assert.match(httpFailure.message, /time-out/i);
});

test('Gemini never retries invalid API key, permission denied, or other permanent errors', async () => {
  const permanentCases: Array<{
    label: string;
    makeError: () => Error;
    expectedReason: 'invalid_api_key' | 'permission_denied' | 'provider_error' | 'quota_exceeded';
  }> = [
    {
      label: '400 API_KEY_INVALID',
      makeError: () => {
        const err = new Error('{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT","details":[{"reason":"API_KEY_INVALID"}]}}');
        (err as any).status = 400;
        return err;
      },
      expectedReason: 'invalid_api_key',
    },
    {
      label: '401 UNAUTHENTICATED',
      makeError: () => {
        const err = new Error('Unauthenticated');
        (err as any).status = 401;
        return err;
      },
      expectedReason: 'invalid_api_key',
    },
    {
      label: '403 PERMISSION_DENIED',
      makeError: () => {
        const err = new Error('{"error":{"code":403,"message":"Permission denied","status":"PERMISSION_DENIED"}}');
        (err as any).status = 403;
        return err;
      },
      expectedReason: 'permission_denied',
    },
    {
      label: '404 NOT_FOUND',
      makeError: () => {
        const err = new Error('Model not found');
        (err as any).status = 404;
        return err;
      },
      expectedReason: 'provider_error',
    },
    {
      label: '429 exhausted daily quota',
      makeError: () => {
        const err = new Error(JSON.stringify({
          error: {
            code: 429,
            message: 'Quota exceeded',
            status: 'RESOURCE_EXHAUSTED',
            details: [{ reason: 'QUOTA_EXCEEDED' }],
          },
        }));
        (err as any).status = 429;
        return err;
      },
      expectedReason: 'quota_exceeded',
    },

  ];

  for (const testCase of permanentCases) {
    let attempts = 0;
    let slept = false;
    const result = await requestConfiguredAiResponse(
      [{ role: 'user', content: 'Test' }],
      {
        provider: 'gemini-server',
        geminiApiKey: 'server-gemini-key',
        sleep: async () => {
          slept = true;
        },
        geminiClient: {
          models: {
            generateContent: async () => {
              attempts += 1;
              throw testCase.makeError();
            },
          },
        },
      },
    );

    assert.equal(attempts, 1, `Expected 1 attempt without retries for ${testCase.label}`);
    assert.equal(slept, false, `Expected no retry sleep for ${testCase.label}`);
    assert.equal(result.available, false);
    assert.equal(result.reason, testCase.expectedReason);
  }
});

test('exhausted Gemini quota returns a clear non-retryable 429 response', async () => {
  const failure = formatAiFailureResponse('quota_exceeded', { language: 'nl' });
  assert.equal(failure.statusCode, 429);
  assert.match(failure.message, /quota/i);
  assert.match(failure.message, /Google AI Studio/i);
});

test('Gemini vision retries transient 503 errors with backoff and respects timeouts', async () => {
  let attempts = 0;
  const delays: number[] = [];

  const result = await requestGeminiVisionResponse({
    geminiApiKey: 'server-gemini-key',
    imageBase64: 'data:image/png;base64,iVBORw0KGgo=',
    promptText: 'Beoordeel dit kledingstuk.',
    retryBaseDelayMs: 30,
    sleep: async (ms) => {
      delays.push(ms);
    },
    geminiClient: {
      models: {
        generateContent: async () => {
          attempts += 1;
          if (attempts === 1) {
            const err = new Error('Service Unavailable');
            (err as any).status = 503;
            throw err;
          }
          return { text: '{"verdict":"JA"}' };
        },
      },
    },
  });

  assert.equal(attempts, 2);
  assert.deepEqual(delays, [30]);
  assert.equal(result.available, true);
});

test('Gemini provider never exposes API keys in return payloads, formatted errors, or console logs', async () => {
  const secretKey = 'AIzaSySecretKeyNeverExpose998877';
  const capturedLogs: string[] = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;
  console.log = (...args: unknown[]) => capturedLogs.push(args.map(String).join(' '));
  console.warn = (...args: unknown[]) => capturedLogs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => capturedLogs.push(args.map(String).join(' '));

  try {
    const scenarios = [
      async () => {
        const err = new Error(`Invalid key ${secretKey} rejected upstream`);
        (err as any).status = 400;
        throw err;
      },
      async () => {
        const err = new Error(`503 UNAVAILABLE for ${secretKey}`);
        (err as any).status = 503;
        throw err;
      },
    ];

    for (const fn of scenarios) {
      const result = await requestConfiguredAiResponse(
        [{ role: 'user', content: 'Hallo' }],
        {
          provider: 'gemini-server',
          geminiApiKey: secretKey,
          retryBaseDelayMs: 0,
          sleep: async () => {},
          geminiClient: { models: { generateContent: fn } },
        },
      );

      const serializedResult = JSON.stringify(result);
      const formattedError = formatAiFailureResponse(result.reason, { language: 'nl' });
      assert.equal(serializedResult.includes(secretKey), false);
      assert.equal(formattedError.message.includes(secretKey), false);
    }

    assert.equal(capturedLogs.join('\n').includes(secretKey), false);
    assert.ok(capturedLogs.length > 0, 'safe provider diagnostics should be emitted for failed requests');
    assert.ok(capturedLogs.every((entry) => !entry.includes('Hallo')), 'diagnostics must not contain user prompts');
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
  }
});
