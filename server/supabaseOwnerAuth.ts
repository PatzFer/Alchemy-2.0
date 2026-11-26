import type { SupabaseServerConfig, FetchLike, VerifiedSupabaseOwner } from './supabasePersistence';

export interface SupabasePasswordAuthConfig {
  ownerEmail: string;
}

export class SupabaseOwnerAuth {
  constructor(
    private readonly server: SupabaseServerConfig,
    private readonly owner: SupabasePasswordAuthConfig,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async authenticate(password: string): Promise<VerifiedSupabaseOwner> {
    const email = this.owner.ownerEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Supabase owner email is not configured correctly.');
    }
    if (typeof password !== 'string' || password.length < 1 || password.length > 1024) {
      throw new Error('A valid owner password is required.');
    }

    const response = await this.fetcher(
      `${this.server.url}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: this.server.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10_000),
      },
    );

    const body = await response.text();
    if (!response.ok) {
      // Never expose Supabase's response body; it may contain account metadata.
      throw new Error(response.status === 400 || response.status === 401
        ? 'Supabase owner credentials were rejected.'
        : `Supabase owner authentication failed (${response.status}).`);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      throw new Error('Supabase returned an invalid owner authentication response.');
    }
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Supabase returned an invalid owner authentication response.');
    }

    const payload = parsed as Record<string, any>;
    const user = payload.user && typeof payload.user === 'object' ? payload.user : payload;
    const userId = typeof user.id === 'string' ? user.id : '';
    const returnedEmail = typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const accessToken = typeof payload.access_token === 'string' ? payload.access_token : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId) ||
        returnedEmail !== email || accessToken.length < 20 || accessToken.length > 8192) {
      throw new Error('Supabase authenticated identity did not match the configured Alchemy owner.');
    }

    return { id: userId, email: returnedEmail };
  }
}
