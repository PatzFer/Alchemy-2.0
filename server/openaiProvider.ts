export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export interface OpenAIProviderResult {
  available: boolean;
  text: string | null;
  reason?: 'missing_configuration' | 'provider_error' | 'invalid_response' | 'provider_timeout' | 'rate_limited' | 'provider_unavailable' | 'provider_auth';
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
  const controller = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(config.timeoutMs ?? 11500, 14000));
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher('https://api.openai.com/v1/responses', {
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
      }),
    });
    if (!response.ok) {
      // Never return provider response bodies: they may contain operational details.
      const reason = response.status === 429 ? 'rate_limited'
        : response.status === 401 || response.status === 403 ? 'provider_auth'
        : response.status === 502 || response.status === 503 || response.status === 504 ? 'provider_unavailable'
        : 'provider_error';
      return { available: false, text: null, reason };
    }
    const payload = await response.json() as {
      output_text?: unknown;
      output?: Array<{ content?: Array<{ type?: string; text?: unknown }> }>;
    };
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
  } catch {
    return { available: false, text: null, reason: controller.signal.aborted ? 'provider_timeout' : 'provider_error' };
  } finally {
    clearTimeout(timeout);
  }
}
