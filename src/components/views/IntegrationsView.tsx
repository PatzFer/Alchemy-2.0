import React, { useState } from 'react';
import {
  Calendar,
  Mail,
  Activity,
  Instagram,
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Lock,
  Sparkles,
  Smartphone,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';
import {
  IntegrationsState,
  Language,
  IntegrationConnectionStatus,
  CalendarEvent,
} from '../../types';
import { IntegrationsService } from '../../lib/integrationsService';
import {
  googleSignInForService,
  fetchRealGmailMessagesFromApi,
  fetchRealCalendarEventsFromApi,
  fetchRealInstagramPostsFromApi,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../../lib/googleAuthService';

interface IntegrationsViewProps {
  integrations: IntegrationsState;
  onUpdateIntegrations: (updater: (prev: IntegrationsState) => IntegrationsState) => void;
  onSyncCalendarEvents?: (events: CalendarEvent[]) => void;
  lang?: Language;
  onNavigateToNotifications?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onUpdateIntegrations,
  onSyncCalendarEvents,
  lang = 'nl',
  onNavigateToNotifications,
}) => {
  const isNl = lang === 'nl';
  const [syncingService, setSyncingService] = useState<string | null>(null);
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Connection modals / dialogs
  const [connectModalService, setConnectModalService] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [instagramTokenInput, setInstagramTokenInput] = useState('');

  const getStatusBadge = (status: IntegrationConnectionStatus, customLabel?: string) => {
    switch (status) {
      case 'connected':
      case 'synced':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8EFE9] text-[#2D5A3C] border border-[#D0E2D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C] animate-pulse" />
            {customLabel || (isNl ? 'Verbonden' : 'Connected')}
          </span>
        );
      case 'connecting':
      case 'syncing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#EBF3FA] text-[#1E5285] border border-[#D0E2F5]">
            <RefreshCw className="w-3.5 h-3.5 text-[#1E5285] animate-spin" />
            {status === 'connecting'
              ? (isNl ? 'Verbinden...' : 'Connecting...')
              : (isNl ? 'Synchroniseren...' : 'Syncing...')}
          </span>
        );
      case 'needs_attention':
      case 'authentication_expired':
      case 'sync_error':
      case 'permission_denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FBF2E6] text-[#8C5D23] border border-[#F0DFCA]">
            <AlertCircle className="w-3.5 h-3.5 text-[#8C5D23]" />
            {customLabel ||
              (status === 'authentication_expired'
                ? (isNl ? 'Authenticatie verlopen' : 'Auth expired')
                : status === 'permission_denied'
                ? (isNl ? 'Toegang geweigerd' : 'Permission denied')
                : status === 'sync_error'
                ? (isNl ? 'Fout bij synchroniseren' : 'Sync error')
                : (isNl ? 'Aandacht vereist' : 'Needs attention'))}
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[#E3DDCF]">
            <Smartphone className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            {customLabel || (isNl ? 'Niet beschikbaar op dit platform' : 'Not available on platform')}
          </span>
        );
      case 'disconnected':
      case 'not_connected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--surface-1)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B5ACA0]" />
            {customLabel || (isNl ? 'Niet verbonden' : 'Not connected')}
          </span>
        );
    }
  };

  const handleConnectCalendar = async () => {
    setAuthError(null);
    setSyncingService('calendar');
    try {
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: { ...prev.calendar, status: 'connecting' },
      }));

      const authRes = await googleSignInForService([
        'https://www.googleapis.com/auth/calendar.readonly',
      ]);

      if (!authRes || !authRes.accessToken) {
        throw new Error('OAuth authenticatie is niet voltooid.');
      }

      const { accountEmail, totalEventsCount, events } =
        await fetchRealCalendarEventsFromApi(authRes.accessToken);

      if (onSyncCalendarEvents && events) {
        onSyncCalendarEvents(events);
      }

      const now = new Date().toISOString();
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: 'connected',
          accountEmail: accountEmail || authRes.email,
          lastSync: now,
          readOnly: true,
          syncedEventsCount: totalEventsCount,
          isPatriciaOnlySchedule: true,
          error: undefined,
        },
      }));

    } catch (err: any) {
      console.warn('Google Calendar OAuth error:', err);
      const isAuthClosed = err?.message?.includes('geannuleerd') || err?.message?.includes('closed');
      const isAuthExpired = err?.message === 'AUTHENTICATION_EXPIRED';

      const userFacingErr = isAuthClosed
        ? 'Inlogvenster geannuleerd.'
        : isAuthExpired
        ? 'Authenticatie verlopen.'
        : err?.message || 'Authenticatie met Google Calendar mislukt.';

      setAuthError(userFacingErr);
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: isAuthExpired ? 'authentication_expired' : 'not_connected',
          error: userFacingErr,
        },
      }));
    } finally {
      setSyncingService(null);
      setConnectModalService(null);
    }
  };

  const handleDisconnectCalendar = async () => {
    setSyncingService('calendar');
    setCachedAccessToken(null);
    if (onSyncCalendarEvents) {
      onSyncCalendarEvents([]);
    }
    onUpdateIntegrations((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        status: 'not_connected',
        accountEmail: undefined,
        lastSync: undefined,
        syncedEventsCount: 0,
        error: undefined,
      },
    }));
    setSyncingService(null);
  };

  const handleSyncCalendar = async () => {
    setAuthError(null);
    setSyncingService('calendar');
    try {
      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await googleSignInForService([
          'https://www.googleapis.com/auth/calendar.readonly',
        ]);
        token = authRes.accessToken;
      }

      const { accountEmail, totalEventsCount, events } =
        await fetchRealCalendarEventsFromApi(token);

      if (onSyncCalendarEvents && events) {
        onSyncCalendarEvents(events);
      }

      const now = new Date().toISOString();
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: 'connected',
          accountEmail: accountEmail || prev.calendar.accountEmail,
          lastSync: now,
          readOnly: true,
          syncedEventsCount: totalEventsCount,
          error: undefined,
        },
      }));

    } catch (err: any) {
      console.warn('Calendar sync error:', err);
      const isAuthExpired = err?.message === 'AUTHENTICATION_EXPIRED';
      setAuthError('Synchronisatie mislukt. Log opnieuw in bij Google Calendar.');
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: isAuthExpired ? 'authentication_expired' : 'sync_error',
          error: err?.message || 'Fout bij synchroniseren.',
        },
      }));
    } finally {
      setSyncingService(null);
    }
  };

  const handleConnectGmail = async () => {
    setAuthError(null);
    setSyncingService('gmail');
    try {
      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: { ...prev.gmail, status: 'connecting' },
      }));

      const authRes = await googleSignInForService([
        'https://www.googleapis.com/auth/gmail.readonly',
      ]);

      if (!authRes || !authRes.accessToken) {
        throw new Error('Geen OAuth toegang gekregen.');
      }

      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: { ...prev.gmail, status: 'syncing' },
      }));

      const { messages, accountEmail } = await fetchRealGmailMessagesFromApi(authRes.accessToken);
      const now = new Date().toISOString();

      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          status: 'connected',
          accountEmail: accountEmail || authRes.email,
          lastSync: now,
          readOnly: true,
          businessOnly: true,
          syncedThreadsCount: messages.length,
          messages: messages,
          error: undefined,
        },
      }));

    } catch (err: any) {
      console.warn('Gmail OAuth error:', err);
      const isAuthClosed = err?.message?.includes('geannuleerd') || err?.message?.includes('closed');
      const isAuthExpired = err?.message === 'AUTHENTICATION_EXPIRED';

      const userFacingErr = isAuthClosed
        ? 'Inlogvenster geannuleerd.'
        : isAuthExpired
        ? 'Authenticatie verlopen.'
        : err?.message || 'Inloggen bij Google Gmail mislukt.';

      setAuthError(userFacingErr);

      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          status: isAuthExpired ? 'authentication_expired' : 'not_connected',
          error: userFacingErr,
        },
      }));
    } finally {
      setSyncingService(null);
      setConnectModalService(null);
    }
  };

  const handleDisconnectGmail = async () => {
    setSyncingService('gmail');
    setCachedAccessToken(null);
    onUpdateIntegrations((prev) => ({
      ...prev,
      gmail: {
        status: 'not_connected',
        accountEmail: undefined,
        lastSync: undefined,
        readOnly: true,
        businessOnly: true,
        syncedThreadsCount: 0,
        messages: [],
        error: undefined,
      },
    }));
    setSyncingService(null);
  };

  const handleSyncGmail = async () => {
    setAuthError(null);
    setSyncingService('gmail');
    try {
      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: { ...prev.gmail, status: 'syncing' },
      }));

      let token = getCachedAccessToken();
      if (!token) {
        const authRes = await googleSignInForService([
          'https://www.googleapis.com/auth/gmail.readonly',
        ]);
        token = authRes.accessToken;
      }

      const { messages, accountEmail } = await fetchRealGmailMessagesFromApi(token);
      const now = new Date().toISOString();

      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          status: 'connected',
          accountEmail: accountEmail || prev.gmail.accountEmail,
          lastSync: now,
          syncedThreadsCount: messages.length,
          messages: messages,
          error: undefined,
        },
      }));

    } catch (err: any) {
      console.warn('Gmail sync error:', err);
      const isAuthExpired = err?.message === 'AUTHENTICATION_EXPIRED';
      onUpdateIntegrations((prev) => ({
        ...prev,
        gmail: {
          ...prev.gmail,
          status: isAuthExpired ? 'authentication_expired' : 'sync_error',
          error: err?.message || 'Fout bij synchroniseren.',
        },
      }));
      setAuthError('Synchronisatie mislukt. Log opnieuw in bij Google om de verbinding te herstellen.');
    } finally {
      setSyncingService(null);
    }
  };

  const handleConnectInstagram = async () => {
    const token = instagramTokenInput.trim();
    const username = usernameInput.trim() || '@mariluna.studio';

    if (!token) {
      setAuthError('Een Meta / Instagram Graph Access Token is vereist om de Instagram API te verifiëren.');
      onUpdateIntegrations((prev) => ({
        ...prev,
        instagram: {
          ...prev.instagram,
          status: 'needs_attention',
          error: 'Meta Graph Access Token vereist.',
          posts: [],
        },
      }));
      setConnectModalService(null);
      return;
    }

    setAuthError(null);
    setSyncingService('instagram');

    try {
      const { posts, accountUsername } = await fetchRealInstagramPostsFromApi(token);
      const now = new Date().toISOString();

      onUpdateIntegrations((prev) => ({
        ...prev,
        instagram: {
          ...prev.instagram,
          status: 'connected',
          accountUsername: accountUsername || username,
          accountType: 'business',
          lastSync: now,
          posts: posts,
          error: undefined,
        },
      }));

    } catch (err: any) {
      console.warn('Instagram Graph API error:', err);
      const userFacingErr = err?.message || 'Instagram token verificatie mislukt.';
      setAuthError(userFacingErr);

      onUpdateIntegrations((prev) => ({
        ...prev,
        instagram: {
          ...prev.instagram,
          status: 'needs_attention',
          error: userFacingErr,
          posts: [],
        },
      }));
    } finally {
      setSyncingService(null);
      setConnectModalService(null);
      setInstagramTokenInput('');
    }
  };

  const handleDisconnectInstagram = async () => {
    setSyncingService('instagram');
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        status: 'not_connected',
        accountUsername: undefined,
        lastSync: undefined,
        posts: [],
        error: undefined,
      },
    }));
    setSyncingService(null);
  };

  const handleSyncInstagram = async () => {
    setAuthError(
      isNl
        ? 'Instagram-verversing via de Meta Graph API is nog niet geïmplementeerd. De bestaande gegevens blijven ongewijzigd.'
        : 'Instagram refresh through the Meta Graph API is not implemented yet. Existing data remains unchanged.'
    );
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        status: 'needs_attention',
        error: isNl
          ? 'Handmatige synchronisatie is nog niet beschikbaar.'
          : 'Manual synchronization is not available yet.',
      },
    }));
  };

  const handleToggleNotifications = async () => {
    const nextState = !integrations.pushNotifications.enabled;
    if (nextState && typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await IntegrationsService.requestNotificationPermission();
      onUpdateIntegrations((prev) => ({
        ...prev,
        pushNotifications: {
          enabled: perm === 'granted',
          permission: perm,
        },
      }));
    } else {
      onUpdateIntegrations((prev) => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          enabled: false,
        },
      }));
    }
  };

  const handleTestNotification = async () => {
    const success = await IntegrationsService.testPush();
    if (success) {
      setTestNotificationSent(true);
      setTimeout(() => setTestNotificationSent(false), 4000);
    }
  };

  const getNotificationStatusDetails = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return {
        badgeStatus: 'not_connected' as const,
        label: isNl ? 'Niet ondersteund in deze omgeving' : 'Not supported in this environment',
        subtext: isNl
          ? 'De Notification API is niet beschikbaar in deze browser of omgeving.'
          : 'Notification API is not available in this context.',
      };
    }
    const perm = Notification.permission;
    if (perm === 'denied') {
      return {
        badgeStatus: 'needs_attention' as const,
        label: isNl ? 'Toestemming geweigerd in Android/Browser' : 'Permission denied in browser',
        subtext: isNl
          ? 'Geef notificatietoestemming in de site-instellingen van Android of je browser.'
          : 'Grant notification permission in your Android site settings.',
      };
    }
    if (perm === 'default') {
      return {
        badgeStatus: 'not_connected' as const,
        label: isNl ? 'Toestemming vereist' : 'Permission required',
        subtext: isNl
          ? 'Klik op "Inschakelen" om notificatietoestemming aan te vragen.'
          : 'Click "Enable" to request notification permission.',
      };
    }
    if (!integrations.pushNotifications.enabled) {
      return {
        badgeStatus: 'not_connected' as const,
        label: isNl ? 'Gepauzeerd in Alchemy' : 'Paused in Alchemy',
        subtext: isNl
          ? 'Toestemming verleend op toestel, maar notificaties gepauzeerd in Alchemy OS.'
          : 'Permission granted, but notifications paused in Alchemy OS.',
      };
    }

    const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

    return {
      badgeStatus: 'connected' as const,
      label: isAndroid
        ? isNl ? 'Notificaties actief (Android ServiceWorker gereed)' : 'Notifications active (Android SW ready)'
        : isNl ? 'Notificaties actief' : 'Notifications active',
      subtext: isNl
        ? 'Echte lokale meldingen en geplande herinneringen actief met respect voor stille uren (21:00 – 08:30).'
        : 'Realtime local pings and scheduled reminders active respecting quiet hours.',
    };
  };

  const notificationStatusDetails = getNotificationStatusDetails();

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
          Integraties & Koppelingen
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-light max-w-2xl leading-relaxed">
          Beheer verbindingen met externe diensten. Transparante, eerlijke status met strikte scheiding tussen de Mariluna zakelijke wereld en je privéleven.
        </p>
      </div>

      {authError && (
        <div className="p-3.5 rounded-2xl bg-[#FDF2F0] border border-[#F0C9C2] text-xs text-[#A63B2B] flex items-center justify-between">
          <span>{authError}</span>
          <button
            type="button"
            onClick={() => setAuthError(null)}
            className="p-1 text-[#A63B2B] hover:opacity-80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Integration Cards List */}
      <div className="space-y-5">
        {/* ============================================================ */}
        {/* 1. GOOGLE CALENDAR                                          */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--text-primary)] shadow-xs">
                <Calendar className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Google Agenda
                  </h3>
                  {getStatusBadge(
                    integrations.calendar.status,
                    integrations.calendar.status === 'connected'
                      ? integrations.calendar.readOnly
                        ? (isNl ? 'Verbonden • Alleen-lezen' : 'Connected • Read-only')
                        : (isNl ? 'Verbonden • Lezen & schrijven' : 'Connected • Read & write')
                      : undefined
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isNl
                    ? "Inzage in Patricia's persoonlijke afspraken om overboeking te voorkomen."
                    : "Read access to Patricia's personal events to prevent schedule congestion."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.calendar.status === 'connected' ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncCalendar}
                    disabled={syncingService === 'calendar'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'calendar' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectCalendar}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  disabled={syncingService === 'calendar'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--surface-raised)] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verbinden via Google OAuth' : 'Connect via Google OAuth'}</span>
                </button>
              )}
            </div>
          </div>

          {integrations.calendar.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
              <div>
                <span className="text-[var(--text-muted)]">{isNl ? 'Account:' : 'Account:'} </span>
                <span className="font-mono text-[var(--text-primary)]">{integrations.calendar.accountEmail || (isNl ? 'Gekoppeld account' : 'Connected account')}</span>
              </div>
              {integrations.calendar.lastSync && (
                <div>
                  <span className="text-[var(--text-muted)]">{isNl ? 'Laatst gesynchroniseerd:' : 'Last sync:'} </span>
                  <span>{new Date(integrations.calendar.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 2. MARILUNA GMAIL                                            */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--text-primary)] shadow-xs">
                <Mail className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Mariluna Gmail
                  </h3>
                  {getStatusBadge(
                    integrations.gmail.status,
                    integrations.gmail.status === 'connected'
                      ? (isNl ? 'Verbonden (Zakelijk alleen-lezen)' : 'Connected (Business read-only)')
                      : undefined
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isNl
                    ? 'Zakelijke e-mail communicatie voor Mariluna cliëntcontext en studio-aanvragen.'
                    : 'Business email communication for Mariluna client context and studio requests.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.gmail.status === 'connected' || integrations.gmail.status === 'synced' ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncGmail}
                    disabled={syncingService === 'gmail'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'gmail' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGmail}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={syncingService === 'gmail'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--surface-raised)] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Inloggen met Mariluna Gmail' : 'Connect Mariluna Gmail'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Business Realm Boundary Note */}
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--surface-2)] p-3.5 flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed">
            <Lock className="w-4 h-4 text-[var(--accent-secondary)] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[var(--text-primary)]">
                {isNl ? 'Strikte Zakelijke Scheiding:' : 'Strict Business Realm Isolation:'}{' '}
              </span>
              {isNl
                ? 'Uitsluitend Patricia\'s Mariluna zakelijke e-mail. Patricia\'s persoonlijke e-mail wordt NOOIT gekoppeld. Gmail-context blijft strikt binnen het Mariluna-domein.'
                : 'Exclusively Patricia\'s Mariluna business email. Personal email is NEVER connected. Gmail context remains strictly inside Mariluna.'}
            </div>
          </div>

          {(integrations.gmail.status === 'connected' || integrations.gmail.status === 'synced') && (
            <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                <div>
                  <span className="text-[var(--text-muted)]">{isNl ? 'Zakelijk adres:' : 'Business email:'} </span>
                  <span className="font-mono text-[var(--text-primary)] font-medium">{integrations.gmail.accountEmail}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">{isNl ? 'Gesynchroniseerde e-mails:' : 'Synced emails:'} </span>
                  <span className="font-medium text-[var(--text-primary)]">{integrations.gmail.messages.length}</span>
                </div>
                {integrations.gmail.lastSync && (
                  <div>
                    <span className="text-[var(--text-muted)]">{isNl ? 'Laatst bijgewerkt:' : 'Last sync:'} </span>
                    <span>{new Date(integrations.gmail.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Real Email Display List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-serif font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                  <span>{isNl ? 'Gesynchroniseerde Berichten' : 'Synced Messages'}</span>
                </h4>

                {integrations.gmail.messages.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] text-xs text-[var(--text-secondary)] text-center space-y-1">
                    <p className="font-medium text-[var(--text-primary)]">
                      {isNl ? 'Geen e-mails gevonden in Mariluna Gmail' : 'No messages found in Mariluna Gmail'}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {isNl
                        ? 'Geen recente berichten aangetroffen. Klik op "Synchroniseren" om opnieuw te controleren.'
                        : 'No recent messages retrieved. Click "Sync" to check again.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {integrations.gmail.messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] shadow-2xs space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--text-primary)] truncate">
                            {msg.sender} <span className="text-[var(--text-muted)] font-normal">({msg.senderEmail})</span>
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] shrink-0 font-mono">{msg.date}</span>
                        </div>
                        <div className="font-medium text-[var(--accent-secondary)] text-xs truncate">
                          {msg.subject}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {msg.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 3. GOOGLE HEALTH CONNECT                                    */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--text-primary)] shadow-xs">
                <Activity className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Health Connect (Android)
                  </h3>
                  {getStatusBadge('unavailable', isNl ? 'Nog niet gekoppeld' : 'Not connected yet')}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isNl
                    ? 'De native Android Health Connect-koppeling is nog in ontwikkeling. Er worden pas gegevens getoond nadat echte Android-toestemming en synchronisatie beschikbaar zijn.'
                    : 'The native Android Health Connect connection is still in development. Data will appear only after real Android permissions and synchronization are available.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="text-xs text-[var(--text-muted)] italic">
                {isNl ? 'Binnenkort beschikbaar via de Android-app' : 'Coming soon through the Android app'}
              </span>
            </div>
          </div>


        </div>

        {/* ============================================================ */}
        {/* 4. MARILUNA INSTAGRAM                                        */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--text-primary)] shadow-xs">
                <Instagram className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Mariluna Instagram
                  </h3>
                  {getStatusBadge(integrations.instagram.status)}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {isNl
                    ? 'Inzichten in recente atelierposts en bereik voor contentplanning.'
                    : 'Insights into recent studio posts and reach for content planning.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.instagram.status === 'connected' ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncInstagram}
                    disabled={syncingService === 'instagram'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'instagram' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectInstagram}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[var(--surface-2)] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConnectModalService('instagram')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--surface-raised)] transition cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Koppelen met Instagram' : 'Connect Instagram'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 5. PUSH NOTIFICATIES                                         */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--text-primary)] shadow-xs">
                <Bell className="w-5 h-5 text-[var(--accent-secondary)]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                    Push Notificaties
                  </h3>
                  {getStatusBadge(
                    notificationStatusDetails.badgeStatus,
                    notificationStatusDetails.label
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {notificationStatusDetails.subtext}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleToggleNotifications}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  integrations.pushNotifications.enabled
                    ? 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]'
                    : 'bg-[var(--text-primary)] text-[var(--surface-1)] hover:bg-[var(--surface-raised)]'
                }`}
              >
                {integrations.pushNotifications.enabled
                  ? (isNl ? 'Uitschakelen' : 'Disable')
                  : (isNl ? 'Inschakelen' : 'Enable')}
              </button>
              {integrations.pushNotifications.enabled && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  title="Development testnotificatie"
                  className="px-3 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition cursor-pointer"
                >
                  {isNl ? '[DEV] Testmelding' : '[DEV] Test'}
                </button>
              )}
            </div>
          </div>

          {testNotificationSent && (
            <div className="p-3 rounded-xl bg-[#E8EFE9] border border-[#D0E2D4] text-xs text-[#2D5A3C] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#2D5A3C]" />
              <span>{isNl ? 'Testmelding verzonden via browser notificatie.' : 'Test notification sent.'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instagram Connect Modal */}
      {connectModalService === 'instagram' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[var(--text-primary)]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[var(--text-primary)]">
                {isNl ? 'Mariluna Instagram Koppelen' : 'Connect Instagram'}
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {isNl ? 'Instagram Gebruikersnaam' : 'Instagram Username'}
                </label>
                <input
                  type="text"
                  placeholder="@mariluna.studio"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {isNl ? 'Meta Graph API Access Token' : 'Meta Graph API Access Token'}
                </label>
                <input
                  type="password"
                  placeholder="EAAG..."
                  value={instagramTokenInput}
                  onChange={(e) => setInstagramTokenInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]"
                  autoFocus
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  {isNl
                    ? 'Vul je actieve Instagram/Meta Graph API token in om posts te synchroniseren. Geen verbinding mogelijk zonder geverifieerde token.'
                    : 'Provide your active Meta Graph API token to sync posts.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConnectInstagram}
                className="px-4 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--surface-1)] text-xs font-medium hover:bg-[var(--surface-raised)] transition"
              >
                {isNl ? 'Koppelen' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
