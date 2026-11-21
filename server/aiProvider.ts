import { requestOpenAIResponse } from './openaiProvider';

export type ConfiguredAiProvider = 'gemini-server' | 'openai-server';

export interface AiTextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConfiguredAiResult {
  available: boolean;
  text: string | null;
  provider: ConfiguredAiProvider;
  model?: string;
  reason?: 'missing_configuration' | 'provider_error' | 'invalid_response' | 'provider_timeout' | 'rate_limited' | 'provider_unavailable' | 'provider_auth';
}

export interface ConfiguredAiOptions {
  provider: ConfiguredAiProvider;
  geminiApiKey?: string;
  geminiModel?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

function validMessages(messages: AiTextMessage[]): boolean {
  return Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 30 &&
    messages.every((message) =>
      message &&
      ['system', 'user', 'assistant'].includes(message.role) &&
      typeof message.content === 'string' &&
      message.content.length > 0 &&
      message.content.length <= 20000
    );
}

/**
 * Single server-side provider boundary for Jarvis.
 * Provider secrets are accepted only from server environment variables.
 * No provider key, raw provider error, or prompt is returned to the browser.
 */
export async function requestConfiguredAiResponse(
  messages: AiTextMessage[],
  options: ConfiguredAiOptions,
): Promise<ConfiguredAiResult> {
  if (!validMessages(messages)) {
    return { available: false, text: null, provider: options.provider, reason: 'invalid_response' };
  }

  if (options.provider === 'openai-server') {
    const result = await requestOpenAIResponse(messages, {
      apiKey: options.openAiApiKey,
      model: options.openAiModel,
      fetcher: options.fetcher,
      timeoutMs: options.timeoutMs,
    });
    return { ...result, provider: 'openai-server', model: options.openAiModel?.trim() || undefined };
  }

  const apiKey = options.geminiApiKey?.trim();
  const model = options.geminiModel?.trim() || 'gemini-3.8-flash';
  if (!apiKey || apiKey.length > 4096 || /\s/.test(apiKey) ||
      !/^[a-zA-Z0-9.-]{1,128}$/.test(model)) {
    return { available: false, text: null, provider: 'gemini-server', reason: 'missing_configuration' };
  }

  const systemInstruction = messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const contents = messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    }));

  if (contents.length === 0) {
    return { available: false, text: null, provider: 'gemini-server', model, reason: 'invalid_response' };
  }

  const fetcher = options.fetcher || fetch;
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(options.timeoutMs ?? 11500, 14000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      },
    );

    if (!response.ok) {
      const reason = response.status === 429 ? 'rate_limited'
        : response.status === 401 || response.status === 403 ? 'provider_auth'
        : response.status === 502 || response.status === 503 || response.status === 504 ? 'provider_unavailable'
        : 'provider_error';
      return { available: false, text: null, provider: 'gemini-server', model, reason };
    }

    const payload = await response.json() as {
      promptFeedback?: { blockReason?: string };
      candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: unknown; thought?: boolean }> } }>;
    };
    const candidate = payload.candidates?.[0];
    // Gemini may include internal thought parts alongside user-facing text.
    // Never expose thought parts in the chat transcript.
    const text = (candidate?.content?.parts || [])
      .filter((part) => part.thought !== true)
      .map((part) => typeof part.text === 'string' ? part.text : '')
      .join('')
      .trim();

    if (!text || text.length > 50000) {
      return { available: false, text: null, provider: 'gemini-server', model, reason: 'invalid_response' };
    }
    return { available: true, text, provider: 'gemini-server', model };
  } catch {
    return {
      available: false,
      text: null,
      provider: 'gemini-server',
      model,
      reason: controller.signal.aborted ? 'provider_timeout' : 'provider_error',
    };
  } finally {
    clearTimeout(timeout);
  }
}
