import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Upload,
  RefreshCcw,
  Sparkles,
  Shield,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Bell,
  Volume2,
  VolumeX,
  Clock,
  Activity,
  Lock,
  Layers,
  Link2,
} from 'lucide-react';
import {
  MemoryItem,
  Realm,
  NotificationSettings,
  CycleProfile,
  FoundationData,
  WellbeingState,
  IntegrationsState,
  CalendarEvent,
} from '../../types';
import { AppState } from '../../lib/storage';
import { requestPushPermission, sendBrowserNotification } from '../../lib/notificationEngine';
import { SecurityPrivacyCenter } from './SecurityPrivacyCenter';
import { FoundationSettingsView } from './FoundationSettingsView';
import { IntegrationsView } from './IntegrationsView';
import { MemoryManagerView } from '../brain/MemoryManagerView';
import { DEFAULT_FOUNDATION_DATA } from '../../lib/foundationDefaults';

interface SettingsViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => void;
  onUpdateMemories?: (updater: (prev: MemoryItem[]) => MemoryItem[]) => void;
  isSampleData: boolean;
  onToggleSampleData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  notificationSettings?: NotificationSettings;
  onUpdateNotificationSettings?: (settings: NotificationSettings) => void;
  cycleProfile?: CycleProfile;
  initialTab?: 'foundation' | 'memory' | 'notifications' | 'integrations' | 'security' | 'data';
  foundation?: FoundationData;
  onUpdateFoundation?: (data: FoundationData) => void;
  wellbeingState?: WellbeingState;
  integrations?: IntegrationsState;
  onUpdateIntegrations?: (updater: (prev: IntegrationsState) => IntegrationsState) => void;
  onSyncCalendarEvents?: (events: CalendarEvent[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
  onUpdateMemories,
  isSampleData,
  onToggleSampleData,
  onExportData,
  onImportData,
  onResetData,
  notificationSettings,
  onUpdateNotificationSettings,
  cycleProfile,
  initialTab = 'foundation',
  foundation = DEFAULT_FOUNDATION_DATA,
  onUpdateFoundation,
  wellbeingState,
  integrations,
  onUpdateIntegrations,
  onSyncCalendarEvents,
}) => {
  const [activeTab, setActiveTab] = useState<'foundation' | 'memory' | 'notifications' | 'integrations' | 'security' | 'data'>(initialTab);
  const [newMemoryContent, setNewMemoryContent] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState('Lifestyle & Energy');
  const [newMemoryRealm, setNewMemoryRealm] = useState<Realm>('personal');
  const [backendHealth, setBackendHealth] = useState<{ status: string; hasApiKey: boolean } | null>(null);
  const [pushStatus, setPushStatus] = useState<string>('default');

  const isNl = foundation.aboutYou.preferredLanguage !== 'en';

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setBackendHealth(data))
      .catch(() => setBackendHealth({ status: 'offline', hasApiKey: false }));

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission);
    }
  }, []);

  const handleRequestPush = async () => {
    const granted = await requestPushPermission();
    setPushStatus(granted ? 'granted' : 'denied');
    if (granted && notificationSettings && onUpdateNotificationSettings) {
      onUpdateNotificationSettings({
        ...notificationSettings,
        browserPushEnabled: true,
      });
      sendBrowserNotification(
        'P & M Alchemy',
        'Thoughtful notifications are now calibrated. We will protect your quiet hours.'
      );
    }
  };

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;

    onAddMemory({
      id: 'm-' + Date.now(),
      category: newMemoryCategory,
      content: newMemoryContent.trim(),
      realm: newMemoryRealm,
      dateAdded: new Date().toISOString().split('T')[0],
      importance: 'high',
      source: 'user_stated',
    });

    setNewMemoryContent('');
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
          P & M Alchemy Sovereignty & Settings
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
          Inspect and govern what your JARVIS knows, calibrate thoughtful quiet hours, and configure data privacy.
        </p>

        {/* Tab switch */}
        <div className="mt-5 flex items-center gap-2 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('foundation')}
            id="settings-tab-foundation"
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'foundation'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Fundament (10 gebieden)' : 'Foundation (10 areas)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {isNl ? `AI Geheugen (${memories.length})` : `Transparent AI Memory (${memories.length})`}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isNl ? 'Meldingen & Stille Uren' : 'Smart Notifications & Quiet Hours'}</span>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            id="settings-tab-integrations"
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'integrations'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>{isNl ? 'Integraties (5)' : 'Integrations (5)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {isNl ? 'Veiligheid & Intelligentie' : 'Assistant Intelligence'}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'data'
                ? 'bg-[var(--text-primary)] text-[var(--text-primary)] font-medium shadow-xs'
                : 'bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {isNl ? 'Data Soevereiniteit & Backups' : 'Data Sovereignty & Backups'}
          </button>
        </div>
      </div>

      {/* Tab 0: Foundation Settings */}
      {activeTab === 'foundation' && onUpdateFoundation && (
        <FoundationSettingsView
          foundation={foundation}
          onUpdateFoundation={onUpdateFoundation}
          wellbeingState={wellbeingState}
        />
      )}

      {/* Tab 1: Transparent Memory Engine */}
      {activeTab === 'memory' && (
        <MemoryManagerView
          memories={memories}
          onAddMemory={onAddMemory}
          onDeleteMemory={onDeleteMemory}
          onUpdateMemories={onUpdateMemories}
          isNl={isNl}
        />
      )}

      {/* Tab 2: Smart Notifications & Quiet Hours */}
      {activeTab === 'notifications' && notificationSettings && onUpdateNotificationSettings && (
        <div className="space-y-6">
          {/* Main Notification Controls */}
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--surface-2)]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                  Sparse, High-Signal Notifications
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
                  A sophisticated assistant speaks rarely, with great relevance. Never spammy or frantic.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateNotificationSettings({
                      ...notificationSettings,
                      enabled: !notificationSettings.enabled,
                    })
                  }
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    notificationSettings.enabled
                      ? 'bg-[var(--text-primary)] text-[var(--text-primary)]'
                      : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'
                  }`}
                >
                  {notificationSettings.enabled ? 'Notifications Enabled' : 'Notifications Paused'}
                </button>
              </div>
            </div>

            {/* Quiet Hours Configuration */}
            <div className="p-4 rounded-xl bg-[var(--surface-1)] border border-[var(--surface-raised)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[var(--accent-secondary)]">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Sacred Quiet Hours (Do Not Disturb)
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)]">No non-critical alerts</span>
              </div>

              <p className="text-xs text-[var(--text-secondary)] font-light">
                During these hours, your assistant holds all proactive ideas, non-urgent reminders, and digest pings silently until your morning start window.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] block mb-1">
                    Evening Wind-down (Starts)
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.quietHoursStart}
                    onChange={(e) =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        quietHoursStart: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-primary)] block mb-1">
                    Morning Emergence (Ends)
                  </label>
                  <input
                    type="time"
                    value={notificationSettings.quietHoursEnd}
                    onChange={(e) =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        quietHoursEnd: e.target.value,
                      })
                    }
                    className="w-full bg-[var(--surface-2)] border border-[var(--border-subtle)] rounded-lg p-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>

            {/* Frequency & Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[var(--surface-raised)] bg-[var(--surface-1)] space-y-3">
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Delivery Channels
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[var(--text-secondary)]">In-App Notification Center</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.inAppNotificationsEnabled}
                      onChange={(e) =>
                        onUpdateNotificationSettings({
                          ...notificationSettings,
                          inAppNotificationsEnabled: e.target.checked,
                        })
                      }
                      className="accent-[var(--accent-secondary)] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs text-[var(--text-secondary)] block">Browser Push Notifications</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        Status: {pushStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pushStatus !== 'granted' && (
                        <button
                          type="button"
                          onClick={handleRequestPush}
                          className="text-[10px] font-medium text-[var(--accent-secondary)] underline cursor-pointer"
                        >
                          Enable
                        </button>
                      )}
                      <input
                        type="checkbox"
                        checked={notificationSettings.browserPushEnabled && pushStatus === 'granted'}
                        disabled={pushStatus !== 'granted'}
                        onChange={(e) =>
                          onUpdateNotificationSettings({
                            ...notificationSettings,
                            browserPushEnabled: e.target.checked,
                          })
                        }
                        className="accent-[var(--accent-secondary)] w-4 h-4"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[var(--text-secondary)]">Subtle Audio Chime</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.soundEnabled}
                      onChange={(e) =>
                        onUpdateNotificationSettings({
                          ...notificationSettings,
                          soundEnabled: e.target.checked,
                        })
                      }
                      className="accent-[var(--accent-secondary)] w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {/* Maximum Daily Rate */}
              <div className="p-4 rounded-xl border border-[var(--surface-raised)] bg-[var(--surface-1)] space-y-3">
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Daily Attention Budget
                </span>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Maximum proactive notification digests delivered per day to preserve your focus.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-[var(--text-secondary)]">Max Daily Alerts:</span>
                    <strong className="text-[var(--text-primary)]">{notificationSettings.maxDailyFrequency} per day</strong>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={notificationSettings.maxDailyFrequency}
                    onChange={(e) =>
                      onUpdateNotificationSettings({
                        ...notificationSettings,
                        maxDailyFrequency: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-[var(--accent-secondary)]"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                    <span>1 (Strict Minimalism)</span>
                    <span>3 (Balanced)</span>
                    <span>5 (More Frequent)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Topics */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">
                  {isNl ? 'Toegestane Notificatie Categorieën' : 'Allowed Notification Categories'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sendBrowserNotification(
                      'P & M Alchemy Sovereign OS',
                      isNl
                        ? 'Testmelding: Je notificaties zijn discreet en doelgericht ingesteld.'
                        : 'Test alert: Your notifications are calibrated with discretion and purpose.'
                    );
                  }}
                  className="text-xs text-[var(--accent-secondary)] hover:underline font-medium cursor-pointer"
                >
                  {isNl ? 'Test Notificatie Verzenden' : 'Send Test Notification'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'reminderNotifications',
                    label: isNl ? 'Herinneringsnotificaties (bv. zondagse lichaamsmetingen)' : 'Reminder notifications (e.g. Sunday measurement)',
                  },
                  {
                    key: 'calendarNotifications',
                    label: isNl ? 'Agenda-afspraken & tijdslots (Patricia\'s agenda)' : 'Calendar notifications (Patricia\'s schedule)',
                  },
                  {
                    key: 'mealPlanningNotifications',
                    label: isNl ? 'Maaltijdplanning herinneringen (donderdag 18:00)' : 'Meal planning alerts (Thursday 18:00 prompt)',
                  },
                  {
                    key: 'healthMovementReminders',
                    label: isNl ? 'Gezondheid & zachte bewegingsreminders (stappen)' : 'Health & movement reminders (steps/walks)',
                  },
                  {
                    key: 'marilunaNotifications',
                    label: isNl ? 'Mariluna zakelijke alerts (cliëntberichten & follow-ups)' : 'Mariluna business alerts (client inquiries)',
                  },
                  {
                    key: 'importantAiSuggestions',
                    label: isNl ? 'Belangrijke AI-suggesties (capaciteit & herplanning)' : 'Important AI suggestions (capacity & rescheduling)',
                  },
                  {
                    key: 'cycleInsights',
                    label: isNl ? 'Cyclus-inzichten & energievensters (Strikt privé)' : 'Cycle phase insights (Strictly private)',
                  },
                  {
                    key: 'forgottenIdeas',
                    label: isNl ? 'Herontdekken vergeten ideeën' : 'Rediscovering dormant ideas',
                  },
                ].map((item) => {
                  const isChecked = Boolean(notificationSettings[item.key as keyof NotificationSettings]);
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-1)] border border-[var(--border-subtle)] cursor-pointer hover:bg-[var(--surface-2)] transition"
                    >
                      <span className="text-xs text-[#3E372E] pr-2">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onUpdateNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="accent-[var(--accent-secondary)] w-4 h-4 shrink-0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Integrations */}
      {activeTab === 'integrations' && integrations && onUpdateIntegrations && (
        <IntegrationsView
          integrations={integrations}
          onUpdateIntegrations={onUpdateIntegrations}
          onSyncCalendarEvents={onSyncCalendarEvents}
          lang={isNl ? 'nl' : 'en'}
          onNavigateToNotifications={() => setActiveTab('notifications')}
        />
      )}

      {/* Tab 3: Security & Privacy Center */}
      {activeTab === 'security' && (
        <SecurityPrivacyCenter
          memories={memories}
          onDeleteMemory={onDeleteMemory}
          onClearAllMemories={() => {
            memories.forEach((m) => onDeleteMemory(m.id));
          }}
          onExportCompleteData={onExportData}
          onResetCompleteData={onResetData}
        />
      )}

      {/* Tab 3: Data Management & Export */}
      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif text-lg font-medium text-[var(--text-primary)]">
                Data Sovereignty & Local Storage
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
                Your data is currently stored in this browser. Browser storage is not encrypted yet; export a private backup regularly and keep the file somewhere safe. Cloud storage is not connected.
              </p>
            </div>

            {/* Sample Data Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--surface-1)] border border-[#E2DBD0]">
              <div>
                <span className="text-xs font-semibold text-[var(--text-primary)] block">
                  Sample Data Mode
                </span>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {isSampleData
                    ? 'Currently showing curated sample tasks, goals, ideas, and calendar.'
                    : 'Curated sample mode disabled. Using clean custom entries.'}
                </span>
              </div>
              <button
                onClick={onToggleSampleData}
                className="px-3.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] hover:bg-[#EFE9DE] transition cursor-pointer"
              >
                {isSampleData ? 'Clear Sample Data' : 'Reload Sample Data'}
              </button>
            </div>

            {/* Export / Import */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-1)] transition text-xs font-medium text-[var(--text-primary)] cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-[#8C7654]" />
                <span>Export verified backup (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[var(--surface-1)] transition text-xs font-medium text-[var(--text-primary)] cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-[#8C7654]" />
                <span>Verify & restore backup (JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Danger Zone: Reset */}
            <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-[#733] block">
                  Reset Environment
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Clears all local storage and restores default state.
                </span>
              </div>
              <button
                onClick={onResetData}
                className="px-4 py-1.5 rounded-lg border border-[#6B3B37] bg-[#332321] text-xs font-medium text-[#842] hover:bg-[#49302E] transition cursor-pointer"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
