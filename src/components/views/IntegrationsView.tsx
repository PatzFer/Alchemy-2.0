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
} from 'lucide-react';
import {
  IntegrationsState,
  Language,
  IntegrationConnectionStatus,
} from '../../types';
import { IntegrationsService } from '../../lib/integrationsService';

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

  // Connection modals / dialogs
  const [connectModalService, setConnectModalService] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const getStatusBadge = (status: IntegrationConnectionStatus, customLabel?: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8EFE9] text-[#2D5A3C] border border-[#D0E2D4]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C] animate-pulse" />
            {customLabel || (isNl ? 'Verbonden' : 'Connected')}
          </span>
        );
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FBF2E6] text-[#8C5D23] border border-[#F0DFCA]">
            <AlertCircle className="w-3.5 h-3.5 text-[#8C5D23]" />
            {customLabel || (isNl ? 'Aandacht vereist' : 'Needs attention')}
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
    const email = emailInput.trim() || 'patricia@gmail.com';
    setSyncingService('calendar');
    await IntegrationsService.connectService('google_calendar', { accountEmail: email });
    onUpdateIntegrations((prev) => ({
      ...prev,
      calendar: {
        ...prev.calendar,
        status: 'connected',
        accountEmail: email,
        lastSync: new Date().toISOString(),
        readOnly: true,
        syncedEventsCount: 6,
        isPatriciaOnlySchedule: true,
      },
    }));
    setSyncingService(null);
    setConnectModalService(null);
    setEmailInput('');
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
    const email = emailInput.trim() || 'contact@mariluna.be';
    setSyncingService('gmail');
    await IntegrationsService.connectService('mariluna_gmail', { accountEmail: email });
    onUpdateIntegrations((prev) => ({
      ...prev,
      gmail: {
        ...prev.gmail,
        status: 'connected',
        accountEmail: email,
        lastSync: new Date().toISOString(),
        readOnly: true,
        businessOnly: true,
        syncedThreadsCount: 4,
        messages: [
          {
            id: 'msg-g1',
            threadId: 'th-1',
            sender: 'Sophie Vandamme',
            senderEmail: 'sophie.vandamme@gent.be',
            subject: 'Aanvraag traject Styling & Branding voorjaar',
            date: new Date().toISOString().split('T')[0],
            snippet: 'Beste Patricia, ik zou graag meer informatie ontvangen over je 1-op-1 traject voor mijn nieuwe studio...',
            unread: true,
            needsReview: true,
          },
          {
            id: 'msg-g2',
            threadId: 'th-2',
            sender: 'Atelier Noémie',
            senderEmail: 'noemie@ateliernoemie.com',
            subject: 'Bevestiging levering stoffen & lookbook',
            date: new Date().toISOString().split('T')[0],
            snippet: 'De stalen zijn gisteren verzonden en komen normaal vrijdag aan.',
            unread: false,
          },
        ],
      },
    }));
    setSyncingService(null);
    setConnectModalService(null);
    setEmailInput('');
  };

  const handleDisconnectGmail = async () => {
    setSyncingService('gmail');
    await IntegrationsService.disconnectService('mariluna_gmail');
    onUpdateIntegrations((prev) => ({
      ...prev,
      gmail: {
        ...prev.gmail,
        status: 'not_connected',
        accountEmail: undefined,
        lastSync: undefined,
        syncedThreadsCount: 0,
        messages: [],
      },
    }));
    setSyncingService(null);
  };

  const handleSyncGmail = async () => {
    setSyncingService('gmail');
    await IntegrationsService.syncService('mariluna_gmail');
    onUpdateIntegrations((prev) => ({
      ...prev,
      gmail: {
        ...prev.gmail,
        lastSync: new Date().toISOString(),
      },
    }));
    setSyncingService(null);
  };

  const handleConnectHealthConnect = async () => {
    setSyncingService('healthConnect');
    await IntegrationsService.connectService('health_connect', { platform: 'android', stepsToday: 6840 });
    onUpdateIntegrations((prev) => ({
      ...prev,
      healthConnect: {
        ...prev.healthConnect,
        status: 'connected',
        platform: 'android',
        lastSync: new Date().toISOString(),
        stepsToday: 6840,
        activeMinutes: 35,
        isStepsOnly: true,
        isPrivateOnly: true,
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
      },
    }));
    setSyncingService(null);
  };

  const handleConnectInstagram = async () => {
    const handle = usernameInput.trim() || '@mariluna.studio';
    setSyncingService('instagram');
    await IntegrationsService.connectService('mariluna_instagram', { accountUsername: handle });
    onUpdateIntegrations((prev) => ({
      ...prev,
      instagram: {
        ...prev.instagram,
        status: 'connected',
        accountUsername: handle,
        accountType: 'business',
        lastSync: new Date().toISOString(),
        posts: [
          {
            id: 'ig-101',
            caption: 'Het geheim van een serene esthetiek zit in de ademruimte tussen de elementen. 🌿',
            mediaType: 'IMAGE',
            timestamp: new Date().toISOString().split('T')[0],
            likeCount: 142,
            commentsCount: 18,
            reach: 890,
          },
          {
            id: 'ig-102',
            caption: 'Atelier rituelen: natuurlijk licht, natuurlijke stoffen en doordachte proporties.',
            mediaType: 'CAROUSEL_ALBUM',
            timestamp: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
            likeCount: 198,
            commentsCount: 24,
            reach: 1250,
          },
        ],
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

  const handleTogglePushNotifications = async () => {
    if (!integrations.pushNotifications.enabled) {
      const permission = await IntegrationsService.requestNotificationPermission();
      onUpdateIntegrations((prev) => ({
        ...prev,
        pushNotifications: {
          ...prev.pushNotifications,
          enabled: true,
          permission,
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

  const handleTestPush = async () => {
    setTestNotificationSent(true);
    await IntegrationsService.testPush();
    setTimeout(() => setTestNotificationSent(false), 3500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#2C2825]">
      {/* Editorial Header */}
      <div className="border-b border-[#E8E2D6] pb-6 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-[0.25em] text-[#8C8377] font-serif">
            {isNl ? 'Externe Koppelingen' : 'External Connections'}
          </span>
          <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
          <span className="text-[11px] text-[#7A7167] font-light">
            {isNl ? 'Veilig & Rustig' : 'Safe & Quiet'}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-[#2C2825] tracking-tight">
          {isNl ? 'INTEGRATIES' : 'INTEGRATIONS'}
        </h2>
        <p className="text-sm text-[#7A7167] font-light max-w-2xl leading-relaxed">
          {isNl
            ? 'Verbind Alchemy met je externe omgeving voor realistische planningscontext, beweging en atelierinzichten. Zonder dataconflicten, zonder automatische acties en met strikte scheiding tussen Privé en Mariluna.'
            : 'Connect Alchemy to your external environment for realistic planning context, movement, and studio insights. Without data conflicts, without automated actions, and with strict separation between Private and Mariluna.'}
        </p>
      </div>

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
                    Google Calendar
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
                    ? 'Leesbare agenda-afspraken voor dagelijkse capaciteit, maaltijdplanning en rustmomenten.'
                    : 'Read-only calendar schedule for daily capacity, meal planning, and rest boundaries.'}
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
                  onClick={() => {
                    setEmailInput('patricia@gmail.com');
                    setConnectModalService('calendar');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verbinden met Google Agenda' : 'Connect Google Calendar'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sovereign Boundary Note */}
          <div className="rounded-xl bg-[#FFFFFF] border border-[#EDE7DC] p-3.5 flex items-start gap-2.5 text-xs text-[#6A6155] leading-relaxed">
            <Shield className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[#2C2825]">
                {isNl ? 'Patricia\'s Soevereine Agenda:' : 'Patricia\'s Sovereign Schedule:'}{' '}
              </span>
              {isNl
                ? 'Deze integratie synchroniseert uitsluitend Patricia\'s persoonlijke agenda. Jeroen\'s agenda wordt NOOIT ingezien, opgehaald of afgeleid. Alchemy wijzigt of verwijdert nooit afspraken in Google Calendar.'
                : 'This integration exclusively syncs Patricia\'s personal calendar. Jeroen\'s schedule is NEVER inspected or inferred. Alchemy never creates, edits, or deletes events in Google Calendar.'}
            </div>
          </div>

          {integrations.calendar.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-1 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Account:' : 'Account:'} </span>
                <span className="font-mono text-[#2C2825]">{integrations.calendar.accountEmail || 'patricia@gmail.com'}</span>
              </div>
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Actieve afspraken:' : 'Active events:'} </span>
                <span className="font-medium text-[#2C2825]">{integrations.calendar.syncedEventsCount || 0}</span>
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
        {/* 2. MARILUNA GMAIL                                           */}
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
                    ? 'Zakelijke communicatie voor cliëntcontext en studio-aanvragen.'
                    : 'Business communication for client context and studio inquiries.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.gmail.status === 'connected' ? (
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
                  onClick={() => {
                    setEmailInput('contact@mariluna.be');
                    setConnectModalService('gmail');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verbinden met Mariluna Gmail' : 'Connect Mariluna Gmail'}</span>
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
                ? 'Uitsluitend Patricia\'s Mariluna zakelijke e-mail. Patricia\'s persoonlijke e-mail wordt NOOIT gekoppeld. Gmail-context blijft strikt binnen het Mariluna-domein en raakt nooit persoonlijke gezondheid, cyclus of styling.'
                : 'Exclusively Patricia\'s Mariluna business email. Personal email is NEVER connected. Gmail context remains strictly inside Mariluna and never touches personal health, cycle, or styling.'}
            </div>
          </div>

          {integrations.gmail.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-1 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Zakelijk adres:' : 'Business email:'} </span>
                <span className="font-mono text-[#2C2825]">{integrations.gmail.accountEmail || 'contact@mariluna.be'}</span>
              </div>
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Gesynchroniseerde threads:' : 'Synced threads:'} </span>
                <span className="font-medium text-[#2C2825]">{integrations.gmail.messages.length}</span>
              </div>
              {integrations.gmail.lastSync && (
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Laatst gesynchroniseerd:' : 'Last sync:'} </span>
                  <span>{new Date(integrations.gmail.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
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
                    Google Health Connect
                  </h3>
                  {getStatusBadge(integrations.healthConnect.status)}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  {isNl
                    ? 'Uitsluitend stappen en dagelijkse bewegingscontext (Android-only ondersteuning).'
                    : 'Steps and daily movement context only (Android platform support).'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              {integrations.healthConnect.status === 'connected' ? (
                <button
                  type="button"
                  onClick={handleDisconnectHealthConnect}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#A64A38] hover:bg-[#F9ECE9] transition cursor-pointer"
                >
                  {isNl ? 'Verbreken' : 'Disconnect'}
                </button>
              ) : integrations.healthConnect.status === 'unavailable' ? (
                <button
                  type="button"
                  onClick={handleConnectHealthConnect}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
                  title={isNl ? 'Simuleer Android Health Connect koppeling' : 'Simulate Android Health Connect sync'}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Koppelen (Android)' : 'Connect (Android)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectHealthConnect}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
                >
                  <span>{isNl ? 'Verbinden met Health Connect' : 'Connect Health Connect'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Health Connect Boundary Note */}
          <div className="rounded-xl bg-[#FFFFFF] border border-[#EDE7DC] p-3.5 flex items-start gap-2.5 text-xs text-[#6A6155] leading-relaxed">
            <Shield className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[#2C2825]">
                {isNl ? 'Uitsluitend Stappen & Beweging:' : 'Steps & Activity Context Only:'}{' '}
              </span>
              {isNl
                ? 'Alchemy leest uitsluitend stappen en dagelijkse beweging. Nooit hartslag, bloeddruk, glucose, slaap, menstruatie of medische dossiers. Stappen worden nooit gebruikt als moreel oordeel of schuldgevoel.'
                : 'Alchemy reads strictly steps and daily movement. Never heart rate, glucose, sleep, cycle, or medical records. Step count is never used to judge a "good" or "bad" day.'}
            </div>
          </div>

          {integrations.healthConnect.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-1 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Stappen vandaag:' : 'Steps today:'} </span>
                <span className="font-mono text-[#2C2825] font-medium">{integrations.healthConnect.stepsToday || 6840}</span>
              </div>
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Platform:' : 'Platform:'} </span>
                <span className="capitalize text-[#2C2825]">{integrations.healthConnect.platform}</span>
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
        {/* 4. MARILUNA INSTAGRAM                                       */}
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
                    ? 'Inzichten en gepubliceerde content voor de Mariluna Content Planner.'
                    : 'Insights and published content for the Mariluna Content Planner.'}
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
                  onClick={() => {
                    setUsernameInput('@mariluna.studio');
                    setConnectModalService('instagram');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] transition cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isNl ? 'Verbinden met Instagram' : 'Connect Instagram'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Instagram Boundary Note */}
          <div className="rounded-xl bg-[#FFFFFF] border border-[#EDE7DC] p-3.5 flex items-start gap-2.5 text-xs text-[#6A6155] leading-relaxed">
            <Lock className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div>
              <span className="font-medium text-[#2C2825]">
                {isNl ? 'Uitsluitend Zakelijk Content-overzicht:' : 'Strictly Business Content Overview:'}{' '}
              </span>
              {isNl
                ? 'Koppeling met het professionele Mariluna account (@mariluna.studio). Alchemy plaatst NOOIT automatisch posts, verstuurt geen DM\'s en heeft geen toegang tot privégegevens.'
                : 'Connects to the professional Mariluna account. Alchemy NEVER automatically posts, sends DMs, or accesses personal data.'}
            </div>
          </div>

          {integrations.instagram.status === 'connected' && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A7167] pt-1 border-t border-[#EAE3D5]">
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Account:' : 'Account:'} </span>
                <span className="font-mono text-[#2C2825] font-medium">{integrations.instagram.accountUsername || '@mariluna.studio'}</span>
              </div>
              <div>
                <span className="text-[#8C8377]">{isNl ? 'Gepubliceerde posts ingeladen:' : 'Loaded posts:'} </span>
                <span className="font-medium text-[#2C2825]">{integrations.instagram.posts.length}</span>
              </div>
              {integrations.instagram.lastSync && (
                <div>
                  <span className="text-[#8C8377]">{isNl ? 'Laatst gesynchroniseerd:' : 'Last sync:'} </span>
                  <span>{new Date(integrations.instagram.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* 5. PUSH NOTIFICATIONS                                       */}
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
                    Push Notifications
                  </h3>
                  {getStatusBadge(
                    integrations.pushNotifications.enabled ? 'connected' : 'not_connected',
                    integrations.pushNotifications.enabled
                      ? (isNl ? 'Ingeschakeld' : 'Enabled')
                      : (isNl ? 'Uitgeschakeld' : 'Disabled')
                  )}
                </div>
                <p className="text-xs text-[#7A7167] mt-0.5">
                  {isNl
                    ? 'Sober en doelgericht: herinnert aan belangrijke deadlines, donderdag menuplanning en wekelijkse metingen.'
                    : 'Sparse and thoughtful: alerts for important deadlines, Thursday meal planning, and weekly measurements.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={handleTestPush}
                disabled={testNotificationSent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs font-medium text-[#5A5145] hover:bg-[#F5EFE6] transition cursor-pointer"
              >
                {testNotificationSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#2D5A3C]" />
                    <span>{isNl ? 'Verzonden!' : 'Sent!'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>{isNl ? 'Test Notificatie' : 'Test Notification'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTogglePushNotifications}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shadow-xs ${
                  integrations.pushNotifications.enabled
                    ? 'bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] hover:bg-[#F5EFE6]'
                    : 'bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D37]'
                }`}
              >
                {integrations.pushNotifications.enabled
                  ? (isNl ? 'Uitschakelen' : 'Disable')
                  : (isNl ? 'Inschakelen' : 'Enable')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-[#EAE3D5] text-xs text-[#7A7167]">
            <div className="flex items-center gap-2">
              <span>{isNl ? 'Browser permissie:' : 'Browser permission:'}</span>
              <span className="font-mono text-[#2C2825] uppercase font-semibold text-[11px]">
                {typeof window !== 'undefined' && 'Notification' in window
                  ? Notification.permission
                  : 'default'}
              </span>
            </div>

            {onNavigateToNotifications && (
              <button
                type="button"
                onClick={onNavigateToNotifications}
                className="text-xs text-[#8C7654] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{isNl ? 'Verfijn categorieën in Notificaties' : 'Fine-tune in Notifications'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {connectModalService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FAF8F3] border border-[#DDD4C5] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl text-[#2C2825]">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="font-serif text-lg text-[#2C2825]">
                {connectModalService === 'calendar'
                  ? (isNl ? 'Verbinden met Google Calendar' : 'Connect Google Calendar')
                  : connectModalService === 'gmail'
                  ? (isNl ? 'Verbinden met Mariluna Gmail' : 'Connect Mariluna Gmail')
                  : (isNl ? 'Verbinden met Mariluna Instagram' : 'Connect Mariluna Instagram')}
              </h3>
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="text-[#8C8377] hover:text-[#2C2825] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#7A7167] leading-relaxed">
              {connectModalService === 'calendar'
                ? (isNl
                    ? 'Bevestig het Google-account voor Patricia\'s persoonlijke agenda. Er wordt uitsluitend een alleen-lezen permissie verleend.'
                    : 'Confirm the Google account for Patricia\'s personal calendar. Read-only permissions only.')
                : connectModalService === 'gmail'
                ? (isNl
                    ? 'Bevestig het zakelijke Mariluna e-mailadres. Privé-e-mails worden NOOIT gesynchroniseerd.'
                    : 'Confirm the Mariluna business email address. Personal emails are never synced.')
                : (isNl
                    ? 'Voer het Instagram-bedrijfsaccount in van Mariluna. Er worden nooit geautomatiseerde berichten geplaatst.'
                    : 'Enter the Mariluna Instagram business handle. No automated posts will ever be published.')}
            </p>

            {connectModalService === 'instagram' ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#5A5145] uppercase tracking-wider">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="@mariluna.studio"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] font-mono focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[#5A5145] uppercase tracking-wider">
                  {connectModalService === 'calendar' ? 'Google Account Email' : 'Mariluna Business Email'}
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={connectModalService === 'calendar' ? 'patricia@gmail.com' : 'contact@mariluna.be'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] font-mono focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D6]">
              <button
                type="button"
                onClick={() => setConnectModalService(null)}
                className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#F2EFE9] cursor-pointer"
              >
                {isNl ? 'Annuleren' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (connectModalService === 'calendar') handleConnectCalendar();
                  else if (connectModalService === 'gmail') handleConnectGmail();
                  else if (connectModalService === 'instagram') handleConnectInstagram();
                }}
                className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#433D37] cursor-pointer shadow-xs"
              >
                {isNl ? 'Koppeling Bevestigen' : 'Confirm Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
