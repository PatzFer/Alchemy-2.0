export interface WebAuthnRequestOrigin {
  host?: string | null;
  origin?: string | null;
  protocol: string;
}

export interface WebAuthnRelyingParty {
  rpID: string;
  origin: string;
}

/**
 * Resolve WebAuthn relying-party settings from explicit deployment allowlists.
 * Production must configure both WEBAUTHN_RP_ID and WEBAUTHN_ALLOWED_ORIGINS.
 * Development defaults are intentionally restricted to loopback origins only.
 */
export function resolveWebAuthnRelyingParty(
  request: WebAuthnRequestOrigin,
  env: Record<string, string | undefined> = process.env,
): WebAuthnRelyingParty {
  const isProduction = env.NODE_ENV === 'production';
  const configuredRpId = env.WEBAUTHN_RP_ID?.trim().toLowerCase();
  const configuredOrigins = (env.WEBAUTHN_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (isProduction && (!configuredRpId || configuredOrigins.length === 0)) {
    throw new Error('WebAuthn production origin configuration is required.');
  }

  const host = request.host?.trim();
  if (!host || /[\s/@\\]/.test(host)) {
    throw new Error('Invalid request host for WebAuthn.');
  }

  const protocol = request.protocol === 'https' ? 'https' : 'http';
  let requestUrl: URL;
  try {
    requestUrl = new URL(`${protocol}://${host}`);
  } catch {
    throw new Error('Invalid request host for WebAuthn.');
  }

  const suppliedOrigin = request.origin?.trim();
  let originUrl: URL;
  try {
    originUrl = new URL(suppliedOrigin || requestUrl.origin);
  } catch {
    throw new Error('Invalid WebAuthn origin.');
  }

  if (
    !['http:', 'https:'].includes(originUrl.protocol) ||
    originUrl.origin !== (suppliedOrigin || requestUrl.origin) ||
    originUrl.username ||
    originUrl.password
  ) {
    throw new Error('Invalid WebAuthn origin.');
  }

  if (originUrl.host.toLowerCase() !== requestUrl.host.toLowerCase()) {
    throw new Error('WebAuthn origin host does not match the request host.');
  }

  const origin = originUrl.origin;
  const rpID = configuredRpId || requestUrl.hostname.toLowerCase();

  if (
    !rpID ||
    rpID.includes(':') ||
    rpID.includes('/') ||
    !(originUrl.hostname.toLowerCase() === rpID ||
      originUrl.hostname.toLowerCase().endsWith(`.${rpID}`))
  ) {
    throw new Error('WebAuthn relying-party ID does not match the request origin.');
  }

  let allowedOrigins: string[];
  if (configuredOrigins.length > 0) {
    allowedOrigins = configuredOrigins.map((candidate) => {
      let parsed: URL;
      try {
        parsed = new URL(candidate);
      } catch {
        throw new Error('Invalid WebAuthn allowed-origin configuration.');
      }
      if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        parsed.origin !== candidate ||
        parsed.username ||
        parsed.password
      ) {
        throw new Error('Invalid WebAuthn allowed-origin configuration.');
      }
      return parsed.origin;
    });
  } else if (!isProduction && ['localhost', '127.0.0.1', '[::1]'].includes(requestUrl.hostname)) {
    allowedOrigins = [requestUrl.origin];
  } else {
    throw new Error('WebAuthn allowed origins are not configured.');
  }

  if (!allowedOrigins.includes(origin)) {
    throw new Error('Request origin is not allowed for WebAuthn.');
  }

  return { rpID, origin };
}
