import { GoogleGenAI } from '@google/genai';
import { requestOpenAIResponse } from './openaiProvider';

export type ConfiguredAiProvider = 'gemini-server' | 'openai-server';
export type AiProviderSelection = ConfiguredAiProvider | 'local-rules';

export interface AiTextMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiClientLike {
  models: {
    generateContent: (params: {
      model: string;
      contents: unknown;
      config?: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
        responseMimeType?: string;
        abortSignal?: AbortSignal;
      };
    }) => Promise<{ text?: string }>;
  };
}

export type AiFailureReason =
  | 'local_mode'
  | 'missing_configuration'
  | 'invalid_api_key'
  | 'permission_denied'
  | 'provider_unavailable'
  | 'rate_limited'
  | 'quota_exceeded'
  | 'timeout'
  | 'provider_error'
  | 'invalid_response';

export interface ConfiguredAiResult {
  available: boolean;
  text: string | null;
  provider: AiProviderSelection;
  model?: string;
  reason?: AiFailureReason;
}

export interface ConfiguredAiOptions {
  provider: AiProviderSelection;
  geminiApiKey?: string;
  geminiModel?: string;
  openAiApiKey?: string;
  openAiModel?: string;
  responseFormat?: 'text' | 'json';
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  geminiClient?: GeminiClientLike;
  fetcher?: typeof fetch;
}

export interface GeminiVisionOptions {
  geminiApiKey?: string;
  geminiModel?: string;
  imageBase64: string;
  mimeType?: string;
  promptText: string;
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  geminiClient?: GeminiClientLike;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
export const DEFAULT_AI_TIMEOUT_MS = 20_000;
export const MAX_AI_RETRIES = 2;
// Gemini 503s indicate temporary service capacity pressure. Start with a meaningful
// pause and use bounded exponential backoff rather than immediately repeating requests.
export const DEFAULT_RETRY_BASE_DELAY_MS = 1_500;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

class AiTimeoutError extends Error {
  constructor() {
    super('AI provider request timed out');
    this.name = 'AiTimeoutError';
  }
}

function defaultSleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveTimeoutMs(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs)) {
    return DEFAULT_AI_TIMEOUT_MS;
  }
  return Math.max(1, Math.min(60_000, Math.floor(timeoutMs)));
}

function resolveMaxRetries(maxRetries: number | undefined): number {
  if (typeof maxRetries !== 'number' || !Number.isFinite(maxRetries)) {
    return MAX_AI_RETRIES;
  }
  return Math.max(0, Math.min(MAX_AI_RETRIES, Math.floor(maxRetries)));
}

function resolveRetryBaseDelayMs(baseDelayMs: number | undefined): number {
  if (typeof baseDelayMs !== 'number' || !Number.isFinite(baseDelayMs)) {
    return DEFAULT_RETRY_BASE_DELAY_MS;
  }
  return Math.max(0, Math.min(10_000, Math.floor(baseDelayMs)));
}

function isValidGeminiKey(apiKey: string | undefined): apiKey is string {
  const trimmed = apiKey?.trim();
  return Boolean(trimmed && trimmed.length <= 4096 && !/\s/.test(trimmed));
}

function resolveGeminiModel(model: string | undefined): string | null {
  const candidate = model?.trim() || DEFAULT_GEMINI_MODEL;
  if (!/^[a-zA-Z0-9._-]{1,128}$/.test(candidate)) {
    return null;
  }
  return candidate;
}

function validMessages(messages: AiTextMessage[]): boolean {
  return Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= 30 &&
    messages.every((message) =>
      message &&
      ['system', 'user', 'assistant'].includes(message.role) &&
      typeof message.content === 'string' &&
      message.content.trim().length > 0 &&
      message.content.length <= 20000
    );
}

function createGeminiClient(apiKey: string, injected?: GeminiClientLike): GeminiClientLike {
  if (injected) return injected;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ClassifiedGeminiError {
  retryable: boolean;
  reason: AiFailureReason;
  statusCode?: number;
}

function parseEmbeddedErrorPayload(message: string): { code?: number; status?: string; reason?: string; quotaReason?: string } | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed) as {
      error?: {
        code?: unknown;
        status?: unknown;
        details?: Array<{ reason?: unknown }>;
      };
      code?: unknown;
      status?: unknown;
    };
    const inner = parsed?.error && typeof parsed.error === 'object' ? parsed.error : parsed;
    const details = Array.isArray(parsed?.error?.details) ? parsed.error.details : [];
    const detailReason = details.find((item) => typeof item?.reason === 'string')?.reason;
    const quotaReason = details.find((item) =>
      typeof item?.reason === 'string' &&
      /QUOTA_EXCEEDED|QUOTA_EXHAUSTED|DAILY_LIMIT/i.test(item.reason)
    )?.reason;
    return {
      code: typeof inner?.code === 'number' ? inner.code : undefined,
      status: typeof inner?.status === 'string' ? inner.status : undefined,
      reason: typeof detailReason === 'string' ? detailReason : undefined,
      quotaReason: typeof quotaReason === 'string' ? quotaReason : undefined,
    };
  } catch {
    return null;
  }
}

function classifyGeminiError(error: unknown): ClassifiedGeminiError {
  if (error instanceof AiTimeoutError) {
    return { retryable: false, reason: 'timeout' };
  }

  const errObj = error && typeof error === 'object' ? (error as Record<string, any>) : null;
  if (errObj?.name === 'AbortError') {
    return { retryable: false, reason: 'timeout' };
  }

  const message = typeof errObj?.message === 'string'
    ? errObj.message
    : typeof error === 'string'
      ? error
      : '';
  const embedded = message ? parseEmbeddedErrorPayload(message) : null;

  const candidateCodes = [
    errObj?.status,
    errObj?.statusCode,
    errObj?.code,
    errObj?.response?.status,
    errObj?.error?.code,
    embedded?.code,
  ];
  const statusCode = candidateCodes.find(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  );

  const statusLabel = [
    typeof embedded?.quotaReason === 'string' ? embedded.quotaReason : '',
    typeof errObj?.error?.status === 'string' ? errObj.error.status : '',
    typeof embedded?.status === 'string' ? embedded.status : '',
    typeof embedded?.reason === 'string' ? embedded.reason : '',
    message,
  ].join(' ');

  // Permanent auth/key/permission errors MUST NOT be retried.
  if (
    statusCode === 401 ||
    /\b(API_KEY_INVALID|INVALID_API_KEY|UNAUTHENTICATED)\b/i.test(statusLabel) ||
    /API key not valid/i.test(statusLabel)
  ) {
    return { retryable: false, reason: 'invalid_api_key', statusCode };
  }

  if (statusCode === 403 || /\bPERMISSION_DENIED\b/i.test(statusLabel)) {
    return { retryable: false, reason: 'permission_denied', statusCode };
  }

  if (statusCode === 400 || statusCode === 404) {
    return { retryable: false, reason: 'provider_error', statusCode };
  }

  // Transient capacity/rate-limit errors (503/429) may be retried up to MAX_AI_RETRIES.
  if (statusCode === 503 || /\bUNAVAILABLE\b/i.test(statusLabel)) {
    return { retryable: true, reason: 'provider_unavailable', statusCode };
  }

  if (/\b(QUOTA_EXCEEDED|QUOTA_EXHAUSTED|DAILY_LIMIT)\b/i.test(statusLabel)) {
    return { retryable: false, reason: 'quota_exceeded', statusCode };
  }

  if (statusCode === 429 || /\b(RESOURCE_EXHAUSTED|TOO_MANY_REQUESTS)\b/i.test(statusLabel)) {
    return { retryable: true, reason: 'rate_limited', statusCode };
  }

  return { retryable: false, reason: 'provider_error', statusCode };
}

async function runWithTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const timeoutErr = new AiTimeoutError();
      controller.abort(timeoutErr);
      reject(timeoutErr);
    }, timeoutMs);
  });

  try {
    const operationPromise = Promise.resolve().then(() => operation(controller.signal));
    // Prevent unhandled rejection if timeout rejects before the underlying promise settles.
    operationPromise.catch(() => {});
    return await Promise.race([operationPromise, timeoutPromise]);
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

async function executeGeminiWithResilience(
  client: GeminiClientLike,
  model: string,
  buildRequest: (abortSignal: AbortSignal) => Parameters<GeminiClientLike['models']['generateContent']>[0],
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    retryBaseDelayMs?: number;
    sleep?: (ms: number) => Promise<void>;
  },
): Promise<ConfiguredAiResult> {
  const timeoutMs = resolveTimeoutMs(options.timeoutMs);
  const maxRetries = resolveMaxRetries(options.maxRetries);
  const baseDelayMs = resolveRetryBaseDelayMs(options.retryBaseDelayMs);
  const sleep = options.sleep || defaultSleep;

  let lastReason: AiFailureReason = 'provider_error';

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const attemptStartedAt = Date.now();
    try {
      const response = await runWithTimeout(
        (signal) => client.models.generateContent(buildRequest(signal)),
        timeoutMs,
      );

      const text = typeof response?.text === 'string' ? response.text.trim() : '';
      if (!text || text.length > 50000) {
        return {
          available: false,
          text: null,
          provider: 'gemini-server',
          model,
          reason: 'invalid_response',
        };
      }

      return {
        available: true,
        text,
        provider: 'gemini-server',
        model,
      };
    } catch (error) {
      const elapsedMs = Date.now() - attemptStartedAt;
      const classified = classifyGeminiError(error);
      lastReason = classified.reason;

      // Safe diagnostics only: never log prompts, response bodies, API keys or raw SDK errors.
      console.warn('[Alchemy AI] Gemini request failed', {
        model,
        attempt: attempt + 1,
        elapsedMs,
        reason: classified.reason,
        upstreamStatus: classified.statusCode ?? null,
        retryable: classified.retryable,
      });

      if (!classified.retryable || attempt >= maxRetries) {
        return {
          available: false,
          text: null,
          provider: 'gemini-server',
          model,
          reason: lastReason,
        };
      }

      const backoffMs = baseDelayMs * Math.pow(2, attempt);
      // Jitter prevents multiple Alchemy sessions from retrying in lockstep.
      // Keep injected test sleeps deterministic.
      const retryDelayMs = options.sleep
        ? backoffMs
        : Math.round(backoffMs * (0.8 + Math.random() * 0.4));
      console.info('[Alchemy AI] Retrying Gemini request', {
        model,
        nextAttempt: attempt + 2,
        delayMs: retryDelayMs,
        previousReason: classified.reason,
      });
      await sleep(retryDelayMs);
    }
  }

  return {
    available: false,
    text: null,
    provider: 'gemini-server',
    model,
    reason: lastReason,
  };
}

/**
 * Maps an internal AI provider failure reason into a safe, clear HTTP status and user message.
 * Never reveals API keys or raw upstream error details.
 */
export function formatAiFailureResponse(
  reason: AiFailureReason | undefined,
  options: {
    providerLabel?: string;
    language?: 'nl' | 'en';
    target?: 'chat' | 'plan' | 'goal' | 'idea' | 'split' | 'query' | 'vision';
  } = {},
): { statusCode: number; message: string } {
  const providerLabel = options.providerLabel || 'Gemini';
  const isDutch = options.language !== 'en';
  const target = options.target || 'chat';

  if (reason === 'timeout') {
    return {
      statusCode: 504,
      message: isDutch
        ? `Jarvis kreeg geen tijdige reactie van ${providerLabel} (time-out). Er is niets gewijzigd; probeer het straks opnieuw.`
        : `Jarvis did not receive a timely response from ${providerLabel} (timeout). Nothing was changed; please try again shortly.`,
    };
  }

  if (reason === 'provider_unavailable' || reason === 'rate_limited') {
    const busyDetailNl = reason === 'rate_limited' ? 'limiet bereikt (429)' : 'tijdelijke drukte (503)';
    const busyDetailEn = reason === 'rate_limited' ? 'rate limit reached (429)' : 'temporary high demand (503)';
    if (target === 'vision') {
      return {
        statusCode: 503,
        message: isDutch
          ? `${providerLabel} is tijdelijk niet beschikbaar door ${busyDetailNl}. Er is geen kledingadvies gegenereerd; probeer het straks opnieuw.`
          : `${providerLabel} is temporarily unavailable due to ${busyDetailEn}. No styling assessment was generated; please try again shortly.`,
      };
    }
    return {
      statusCode: 503,
      message: isDutch
        ? `Jarvis is momenteel niet bereikbaar: ${providerLabel} geeft ${busyDetailNl}. Er is niets gewijzigd; probeer het straks opnieuw of gebruik expliciet de lokale modus.`
        : `Jarvis is temporarily unavailable: ${providerLabel} reported ${busyDetailEn}. Nothing was changed; please try again shortly or switch explicitly to local mode.`,
    };
  }

  if (reason === 'quota_exceeded') {
    return {
      statusCode: 429,
      message: isDutch
        ? `${providerLabel} heeft de beschikbare API-quota bereikt. Opnieuw proberen helpt pas wanneer de limiet is gereset of aangepast. Controleer je gratis gebruikslimiet in Google AI Studio. Er is niets gewijzigd.`
        : `${providerLabel} has reached the available API quota. Retrying will only help after the limit resets or changes. Check your free usage limits in Google AI Studio. Nothing was changed.`,
    };
  }

  if (reason === 'invalid_api_key' || reason === 'permission_denied' || reason === 'missing_configuration') {
    return {
      statusCode: 503,
      message: isDutch
        ? `Jarvis is momenteel niet bereikbaar: de serverconfiguratie of API-toegang voor ${providerLabel} is ongeldig of ontbreekt. Er is niets gewijzigd.`
        : `Jarvis is temporarily unavailable: server configuration or API access for ${providerLabel} is missing or invalid. Nothing was changed.`,
    };
  }

  if (reason === 'invalid_response') {
    return {
      statusCode: 502,
      message: isDutch
        ? `${providerLabel} gaf geen bruikbaar antwoord terug. Er is niets gewijzigd; probeer het opnieuw.`
        : `${providerLabel} returned an unusable response. Nothing was changed; please try again.`,
    };
  }

  return {
    statusCode: 503,
    message: isDutch
      ? `Jarvis is momenteel niet bereikbaar via ${providerLabel}. Er is niets gewijzigd; probeer het straks opnieuw.`
      : `Jarvis could not reach ${providerLabel}. Nothing was changed; please try again shortly.`,
  };
}

/**
 * Safely parses JSON returned by an AI provider, stripping optional markdown code fences.
 * Returns null if the output is empty or invalid JSON.
 */
export function parseAiJsonResponse<T = unknown>(rawText: string | null | undefined): T | null {
  if (typeof rawText !== 'string') return null;
  let trimmed = rawText.trim();
  if (!trimmed) return null;

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch) {
    trimmed = fencedMatch[1].trim();
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

/**
 * Single server-side text AI provider boundary for Jarvis.
 * Gemini is the primary provider; OpenAI is optional and inactive unless explicitly selected.
 * Provider keys are accepted only on the server and never returned to clients.
 */
export async function requestConfiguredAiResponse(
  messages: AiTextMessage[],
  options: ConfiguredAiOptions,
): Promise<ConfiguredAiResult> {
  if (options.provider === 'local-rules') {
    return {
      available: false,
      text: null,
      provider: 'local-rules',
      reason: 'local_mode',
    };
  }

  if (!validMessages(messages)) {
    return {
      available: false,
      text: null,
      provider: options.provider,
      reason: 'invalid_response',
    };
  }

  if (options.provider === 'openai-server') {
    const result = await requestOpenAIResponse(messages, {
      apiKey: options.openAiApiKey,
      model: options.openAiModel,
      responseFormat: options.responseFormat,
      timeoutMs: options.timeoutMs,
      fetcher: options.fetcher,
    });
    return {
      ...result,
      provider: 'openai-server',
      model: options.openAiModel?.trim() || undefined,
    };
  }

  const apiKey = options.geminiApiKey?.trim();
  const model = resolveGeminiModel(options.geminiModel);
  if (!isValidGeminiKey(apiKey) || !model) {
    return {
      available: false,
      text: null,
      provider: 'gemini-server',
      reason: 'missing_configuration',
    };
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
    return {
      available: false,
      text: null,
      provider: 'gemini-server',
      model,
      reason: 'invalid_response',
    };
  }

  const client = createGeminiClient(apiKey, options.geminiClient);
  return executeGeminiWithResilience(
    client,
    model,
    (abortSignal) => ({
      model,
      contents,
      config: {
        ...(systemInstruction ? { systemInstruction } : {}),
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        ...(options.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
        abortSignal,
      },
    }),
    options,
  );
}

/**
 * Server-side Gemini Vision boundary (used for photo-based garment evaluation).
 */
export async function requestGeminiVisionResponse(
  options: GeminiVisionOptions,
): Promise<ConfiguredAiResult> {
  const apiKey = options.geminiApiKey?.trim();
  const model = resolveGeminiModel(options.geminiModel);
  if (!isValidGeminiKey(apiKey) || !model) {
    return {
      available: false,
      text: null,
      provider: 'gemini-server',
      reason: 'missing_configuration',
    };
  }

  const rawImage = typeof options.imageBase64 === 'string' ? options.imageBase64.trim() : '';
  const dataUriMatch = rawImage.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const resolvedMime = (dataUriMatch ? dataUriMatch[1] : options.mimeType || 'image/jpeg').toLowerCase();
  const cleanBase64 = (dataUriMatch ? dataUriMatch[2] : rawImage.replace(/^data:image\/\w+;base64,/, '')).trim();
  const promptText = typeof options.promptText === 'string' ? options.promptText.trim() : '';

  if (
    !ALLOWED_IMAGE_MIME_TYPES.has(resolvedMime) ||
    !cleanBase64 ||
    cleanBase64.length > 10_000_000 ||
    !/^[A-Za-z0-9+/=\r\n]+$/.test(cleanBase64) ||
    !promptText ||
    promptText.length > 20000
  ) {
    return {
      available: false,
      text: null,
      provider: 'gemini-server',
      model,
      reason: 'invalid_response',
    };
  }

  const client = createGeminiClient(apiKey, options.geminiClient);
  return executeGeminiWithResilience(
    client,
    model,
    (abortSignal) => ({
      model,
      contents: [
        {
          inlineData: {
            mimeType: resolvedMime,
            data: cleanBase64,
          },
        },
        {
          text: promptText,
        },
      ],
      config: {
        ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxOutputTokens ?? 4096,
        ...(options.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
        abortSignal,
      },
    }),
    options,
  );
}
