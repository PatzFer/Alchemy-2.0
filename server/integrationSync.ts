export type IntegrationSyncService =
  | 'calendar' | 'google_calendar'
  | 'gmail' | 'mariluna_gmail'
  | 'health_connect'
  | 'instagram' | 'mariluna_instagram';

export interface IntegrationSyncDecision {
  statusCode: 400 | 409 | 501;
  body: { success: false; service: string; error: string };
}

/**
 * Fail closed until a provider performs a real, verified sync.
 * A connected flag alone is not evidence that data was fetched successfully.
 */
export function resolveIntegrationSync(
  service: string,
  status: string | undefined,
): IntegrationSyncDecision {
  const supportedServices = new Set<IntegrationSyncService>([
    'calendar', 'google_calendar',
    'gmail', 'mariluna_gmail',
    'health_connect',
    'instagram', 'mariluna_instagram',
  ]);

  if (!supportedServices.has(service as IntegrationSyncService)) {
    return {
      statusCode: 400,
      body: { success: false, service, error: 'Unknown or unsupported integration service.' },
    };
  }

  if (status !== 'connected') {
    return {
      statusCode: 409,
      body: { success: false, service, error: 'Integration is not connected. No sync was performed.' },
    };
  }

  return {
    statusCode: 501,
    body: {
      success: false,
      service,
      error: 'Provider sync is not implemented. No data was fetched and no sync timestamp was recorded.',
    },
  };
}
