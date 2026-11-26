export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const DEFAULT_OPENAI_TIMEOUT_MS = 15_000;

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
  responseFormat?: 'text' | 'json';
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface OpenAIProviderResult {
  available: boolean;
  text: string | null;
  reason?: 'missing_configuration' | 'provider_error' | 'invalid_response' | 'timeout';
}

function resolveTimeoutMs(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
    return DEFAULT_OPENAI_TIMEOUT_MS;
  }
  return Math.max(1, Math.min(60_000, Math.floor(timeoutMs)));
}

/**
 * Optional server-side OpenAI Responses API adapter.
 * No request is sent unless both a key and explicit model are configured.
 * API keys are read only from server environment and never returned to clients.
 */
export async function requestOpenAIResponse(
  messages: OpenAIChatMessage[],
  config: OpenAIProviderConfig = {},
): Promise<OpenAIProviderResult> {
  const apiKey = config.apiKey?.trim();
  const model = config.model?.trim();
  if (!apiKey || !model) {
    return { available: false, text: null, reason: 'missing_configuration' };
  }
  if (apiKey.length > 4096 || /\s/.test(apiKey) || model.length > 128) {
    return { available: false, text: null, reason: 'missing_configuration' };
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30 ||
      messages.some((item) => !item || !['system', 'user', 'assistant'].includes(item.role) ||
        typeof item.content !== 'string' || item.content.length > 20000)) {
    return { available: false, text: null, reason: 'invalid_response' };
  }

  const fetcher = config.fetcher || fetch;
  const timeoutMs = resolveTimeoutMs(config.timeoutMs);
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        timedOut = true;
        const err = new Error('OpenAI request timed out');
        err.name = 'AbortError';
        controller.abort(err);
        reject(err);
      }, timeoutMs);
    });

    const fetchPromise = fetcher('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        ...(config.responseFormat === 'json' ? { text: { format: { type: 'json_object' } } } : {}),
      }),
    });
    fetchPromise.catch(() => {});

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    if (!response.ok) {
      // Never return provider response bodies: they may contain operational details.
      return { available: false, text: null, reason: 'provider_error' };
    }
    const payload = await Promise.race([
      response.json() as Promise<{
        output_text?: unknown;
        output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
      }>,
      timeoutPromise,
    ]);
    let text = typeof payload.output_text === 'string' ? payload.output_text.trim() : '';
    if (!text && Array.isArray(payload.output)) {
      text = payload.output.flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .filter((part) => part.type === 'output_text' && typeof part.text === 'string')
        .map((part) => String(part.text)).join('').trim();
    }
    if (!text || text.length > 50000) {
      return { available: false, text: null, reason: 'invalid_response' };
    }
    return { available: true, text };
  } catch (err: any) {
    if (timedOut || err?.name === 'AbortError') {
      return { available: false, text: null, reason: 'timeout' };
    }
    return { available: false, text: null, reason: 'provider_error' };
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}
