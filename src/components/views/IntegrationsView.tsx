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
} from '../../types';
import { IntegrationsService } from '../../lib/integrationsService';
import {
  googleSignInForService,
  fetchRealGmailMessagesFromApi,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../../lib/googleAuthService';

interface IntegrationsViewProps {
  integrations: IntegrationsState;
  onUpdateIntegrations: (updater: (prev: IntegrationsState) => IntegrationsState) => void;
  lang?: Language;
  onNavigateToNotifications?: () => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onUpdateIntegrations,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F2EFE9] text-[#7A7167] border border-[#E3DDCF]">
            <Smartphone className="w-3.5 h-3.5 text-[#8C8377]" />
            {customLabel || (isNl ? 'Niet beschikbaar op dit platform' : 'Not available on platform')}
          </span>
        );
      case 'disconnected':
      case 'not_connected':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF6F0] text-[#8C8377] border border-[#E8E2D6]">
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

      const now = new Date().toISOString();
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: 'connected',
          accountEmail: authRes.email,
          lastSync: now,
          readOnly: true,
          syncedEventsCount: prev.calendar.syncedEventsCount || 0,
          isPatriciaOnlySchedule: true,
          error: undefined,
        },
      }));

      await IntegrationsService.connectService('google_calendar', {
        accountEmail: authRes.email,
        verified: true,
      });
    } catch (err: any) {
      console.warn('Google Calendar OAuth error:', err);
      const isAuthErr = err?.code === 'auth/popup-closed-by-user';
      setAuthError(isAuthErr ? 'Inlogvenster is gesloten.' : 'Authenticatie mislukt.');
      onUpdateIntegrations((prev) => ({
        ...prev,
        calendar: {
          ...prev.calendar,
          status: isAuthErr ? 'authentication_expired' : 'not_connected',
          error: 'Authenticatie mislukt.',
        },
      }));
    } finally {
      setSyncingService(null);
      setConnectModalService(null);
    }
  };

  const handleDisconnectCalendar = async () => {
    setSyncingService('calendar');
    await IntegrationsService.disconnectService('google_calendar');
    onUpdateIntegrations((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        status: 'not_connected',
        accountEmail: undefined,
        lastSync: undefined,
        syncedEventsCount: 0,
      },
    }));
    setSyncingService(null);
  };

  const handleSyncCalendar = async () => {
    setSyncingService('calendar');
    await IntegrationsService.syncService('google_calendar');
    onUpdateIntegrations((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        lastSync: new Date().toISOString(),
      },
    }));
    setSyncingService(null);
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

      await IntegrationsService.connectService('mariluna_gmail', {
        accountEmail: accountEmail || authRes.email,
        messages: messages,
        verified: true,
      });
    } catch (err: any) {
      console.warn('Gmail OAuth error:', err);
      const isAuthClosed = err?.code === 'auth/popup-closed-by-user';
      const isAuthExpired = err?.message === 'AUTHENTICATION_EXPIRED';

      const userFacingErr = isAuthClosed
        ? 'Inlogvenster geannuleerd.'
        : isAuthExpired
        ? 'Authenticatie verlopen.'
        : err?.message || 'Inloggen bij Google mislukt.';

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
    await IntegrationsService.disconnectService('mariluna_gmail');
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

      await IntegrationsService.syncService('mariluna_gmail');
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

  const handleConnectHealthConnect = async () => {
    setSyncingService('healthConnect');
    const existingSteps = integrations.healthConnect.stepsToday ?? integrations.healthConnect.todaySteps;
    const res = await IntegrationsService.connectService('health_connect', { platform: 'android', stepsToday: existingSteps });
    const syncedSteps = res?.data?.stepsToday ?? existingSteps;
    onUpdateIntegrations((prev) => ({
      ...prev,
      healthConnect: {
        ...prev.healthConnect,
        status: 'connected',
        platform: 'android',
        lastSync: new Date().toISOString(),
        stepsToday: syncedSteps,
        todaySteps: syncedSteps,
      },
    }));
    setSyncingService(null);
  };

  const handleDisconnectHealthConnect = async () => {
    setSyncingService('healthConnect');
    await IntegrationsService.disconnectService('health_connect');
    onUpdateIntegrations((prev) => ({
      ...prev,
      healthConnect: {
        ...prev.healthConnect,
        status: 'not_connected',
        lastSync: undefined,
        stepsToday: undefined,
        todaySteps: undefined,
      },
    }));
    setSyncingService(null);
  };

  const handleSyncHealthConnect = async () => {
    setSyncingService('healthConnect');
    const res = await IntegrationsService.syncService('health_connect');
    const syncedSteps = res?.data?.stepsToday ?? integrations.healthConnect.stepsToday ?? integrations.healthConnect.todaySteps;
    onUpdateIntegrations((prev) => ({
      ...prev,
      healthConnect: {
        ...prev.healthConnect,
        lastSync: new Date().toISOString(),
        stepsToday: syncedSteps,
        todaySteps: syncedSteps,
      },
    }));
    setSyncingService(null);
  };

  const handleConnectInstagram = async () => {
    const username = usernameInput.trim() || '@mariluna.studio';
    setSyncingService('instagram');
    await IntegrationsService.connectService('mariluna_instagram', { accountUsername: username });
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        status: 'connected',
        accountUsername: username,
        lastSync: new Date().toISOString(),
      },
    }));
    setSyncingService(null);
    setConnectModalService(null);
    setUsernameInput('');
  };

  const handleDisconnectInstagram = async () => {
    setSyncingService('instagram');
    await IntegrationsService.disconnectService('mariluna_instagram');
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        status: 'not_connected',
        accountUsername: undefined,
        lastSync: undefined,
        posts: [],
      },
    }));
    setSyncingService(null);
  };

  const handleSyncInstagram = async () => {
    setSyncingService('instagram');
    await IntegrationsService.syncService('mariluna_instagram');
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        lastSync: new Date().toISOString(),
      },
    }));
    setSyncingService(null);
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
      <div className="border-b border-[#E8E2D5] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
          Integraties & Koppelingen
        </h1>
        <p className="text-xs text-[#7A7167] mt-1 font-light max-w-2xl leading-relaxed">
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
        <div className="rounded-2xl border border-[#E8E2D6] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] flex items-center justify-center shrink-0 text-[#2C2825] shadow-xs">
                <Calendar className="w-5 h-5 text-[#8C7654]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    Google Agenda
                  </h3>
                  {getStatusBadge(
                    integrations.calendar.status,
                    integrations.calendar.status === 'connected'
                      ? (isNl ? 'Verbonden (Alleen-lezen)' : 'Connected (Read-only)')
                      : undefined
                  )}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'calendar' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectCalendar}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[#F9ECE9] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectCalendar}
                  disabled={syncingService === 'calendar'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verbinden via Google OAuth' : 'Connect via Google OAuth'}</span>
                </button>
              )}
            </div>
          </div>

          {integrations.calendar.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-2 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Account:' : 'Account:'} </span>
                <span className="font-mono text-[#2C2825]">{integrations.calendar.accountEmail || 'patricia@gmail.com'}</span>
              </div>
              {integrations.calendar.lastSync && (
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Laatst gesynchroniseerd:' : 'Last sync:'} </span>
                  <span>{new Date(integrations.calendar.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 2. MARILUNA GMAIL                                            */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[#E8E2D6] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] flex items-center justify-center shrink-0 text-[#2C2825] shadow-xs">
                <Mail className="w-5 h-5 text-[#8C7654]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    Mariluna Gmail
                  </h3>
                  {getStatusBadge(
                    integrations.gmail.status,
                    integrations.gmail.status === 'connected'
                      ? (isNl ? 'Verbonden (Zakelijk alleen-lezen)' : 'Connected (Business read-only)')
                      : undefined
                  )}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'gmail' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectGmail}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[#F9ECE9] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGmail}
                  disabled={syncingService === 'gmail'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Inloggen met Mariluna Gmail' : 'Connect Mariluna Gmail'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Business Realm Boundary Note */}
          <div className="rounded-xl bg-[#FFFFFF] border border-[#EDE7DC] p-3.5 flex items-start gap-2.5 text-xs text-[#6A6155] leading-relaxed">
            <Lock className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[#2C2825]">
                {isNl ? 'Strikte Zakelijke Scheiding:' : 'Strict Business Realm Isolation:'}{' '}
              </span>
              {isNl
                ? 'Uitsluitend Patricia\'s Mariluna zakelijke e-mail. Patricia\'s persoonlijke e-mail wordt NOOIT gekoppeld. Gmail-context blijft strikt binnen het Mariluna-domein.'
                : 'Exclusively Patricia\'s Mariluna business email. Personal email is NEVER connected. Gmail context remains strictly inside Mariluna.'}
            </div>
          </div>

          {(integrations.gmail.status === 'connected' || integrations.gmail.status === 'synced') && (
            <div className="space-y-3 pt-3 border-t border-[#EAE3D5]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7A7167]">
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Zakelijk adres:' : 'Business email:'} </span>
                  <span className="font-mono text-[#2C2825] font-medium">{integrations.gmail.accountEmail}</span>
                </div>
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Gesynchroniseerde e-mails:' : 'Synced emails:'} </span>
                  <span className="font-medium text-[#2C2825]">{integrations.gmail.messages.length}</span>
                </div>
                {integrations.gmail.lastSync && (
                  <div>
                    <span className="text-[#8C8377]">{isNl ? 'Laatst bijgewerkt:' : 'Last sync:'} </span>
                    <span>{new Date(integrations.gmail.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>

              {/* Real Email Display List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-serif font-medium text-[#2C2825] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#8C7654]" />
                  <span>{isNl ? 'Gesynchroniseerde Berichten' : 'Synced Messages'}</span>
                </h4>

                {integrations.gmail.messages.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[#DDD4C5] bg-[#FFFFFF] text-xs text-[#7A7167] text-center space-y-1">
                    <p className="font-medium text-[#2C2825]">
                      {isNl ? 'Geen e-mails gevonden in Mariluna Gmail' : 'No messages found in Mariluna Gmail'}
                    </p>
                    <p className="text-[11px] text-[#8C8377]">
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
                        className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] shadow-2xs space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#2C2825] truncate">
                            {msg.sender} <span className="text-[#8C8377] font-normal">({msg.senderEmail})</span>
                          </span>
                          <span className="text-[10px] text-[#8C8377] shrink-0 font-mono">{msg.date}</span>
                        </div>
                        <div className="font-medium text-[#7E694E] text-xs truncate">
                          {msg.subject}
                        </div>
                        <p className="text-[11px] text-[#6C6358] line-clamp-2 leading-relaxed">
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
        <div className="rounded-2xl border border-[#E8E2D6] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] flex items-center justify-center shrink-0 text-[#2C2825] shadow-xs">
                <Activity className="w-5 h-5 text-[#8C7654]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    Health Connect
                  </h3>
                  {getStatusBadge(integrations.healthConnect.status)}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  {isNl
                    ? 'Neutrale dagelijkse bewegingscontext (alleen stappen & actieve minuten).'
                    : 'Neutral daily movement context (steps & active minutes only).'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.healthConnect.status === 'connected' ? (
                <>
                  <button
                    type="button"
                    onClick={handleSyncHealthConnect}
                    disabled={syncingService === 'healthConnect'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'healthConnect' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectHealthConnect}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[#F9ECE9] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : integrations.healthConnect.status === 'unavailable' ? (
                <span className="text-xs text-[#8C8377] italic">
                  {isNl ? 'Vereist Android toestel met Health Connect app' : 'Requires Android device with Health Connect'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectHealthConnect}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Health Connect Koppelen' : 'Connect Health Connect'}</span>
                </button>
              )}
            </div>
          </div>

          {integrations.healthConnect.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-2 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Stappen vandaag:' : 'Steps today:'} </span>
                <span className="font-mono text-[#2C2825] font-semibold">
                  {(integrations.healthConnect.stepsToday ?? integrations.healthConnect.todaySteps) !== undefined
                    ? (integrations.healthConnect.stepsToday ?? integrations.healthConnect.todaySteps ?? 0).toLocaleString(isNl ? 'nl-NL' : 'en-US')
                    : (isNl ? 'Geen stapgegevens beschikbaar' : 'No step data available')}
                </span>
              </div>
              {integrations.healthConnect.lastSync && (
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Laatst gesynchroniseerd:' : 'Last sync:'} </span>
                  <span>{new Date(integrations.healthConnect.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 4. MARILUNA INSTAGRAM                                        */}
        {/* ============================================================ */}
        <div className="rounded-2xl border border-[#E8E2D6] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] flex items-center justify-center shrink-0 text-[#2C2825] shadow-xs">
                <Instagram className="w-5 h-5 text-[#8C7654]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    Mariluna Instagram
                  </h3>
                  {getStatusBadge(integrations.instagram.status)}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingService === 'instagram' ? 'animate-spin' : ''}`} />
                    <span>{isNl ? 'Synchroniseren' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectInstagram}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[#F9ECE9] transition cursor-pointer"
                  >
                    {isNl ? 'Verbreken' : 'Disconnect'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConnectModalService('instagram')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
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
        <div className="rounded-2xl border border-[#E8E2D6] bg-[#FAF8F3] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8E2D6] flex items-center justify-center shrink-0 text-[#2C2825] shadow-xs">
                <Bell className="w-5 h-5 text-[#8C7654]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                    Push Notificaties
                  </h3>
                  {getStatusBadge(
                    notificationStatusDetails.badgeStatus,
                    notificationStatusDetails.label
                  )}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
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
                    ? 'bg-[#EAE4D7] text-[#554C42] hover:bg-[#DDD5C7]'
                    : 'bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D37]'
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
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
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
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {isNl ? 'Mariluna Instagram Koppelen' : 'Connect Instagram'}
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="p-1 rounded-full text-[#8C8377] hover:text-[#2C2825]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-[#5A5145]">
                {isNl ? 'Instagram Gebruikersnaam' : 'Instagram Username'}
              </label>
              <input
                type="text"
                placeholder="@mariluna.studio"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#D5CCBE] text-xs text-[#2C2825]"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="px-3 py-1.5 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DD] transition"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConnectInstagram}
                className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition"
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
