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
} from 'lucide-react';
import { MemoryItem, Realm, NotificationSettings, CycleProfile, FoundationData } from '../../types';
import { AppState } from '../../lib/storage';
import { requestPushPermission, sendBrowserNotification } from '../../lib/notificationEngine';
import { SecurityPrivacyCenter } from './SecurityPrivacyCenter';
import { FoundationSettingsView } from './FoundationSettingsView';
import { DEFAULT_FOUNDATION_DATA } from '../../lib/foundationDefaults';

interface SettingsViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Partial<MemoryItem>) => void;
  onDeleteMemory: (id: string) => void;
  isSampleData: boolean;
  onToggleSampleData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  notificationSettings?: NotificationSettings;
  onUpdateNotificationSettings?: (settings: NotificationSettings) => void;
  cycleProfile?: CycleProfile;
  initialTab?: 'foundation' | 'memory' | 'notifications' | 'security' | 'data';
  foundation?: FoundationData;
  onUpdateFoundation?: (data: FoundationData) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory,
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
}) => {
  const [activeTab, setActiveTab] = useState<'foundation' | 'memory' | 'notifications' | 'security' | 'data'>(initialTab);
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
      <div className="border-b border-[#E8E2D5] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
          P & M Alchemy Sovereignty & Settings
        </h1>
        <p className="text-xs text-[#7A7167] mt-1 font-light">
          Inspect and govern what your JARVIS knows, calibrate thoughtful quiet hours, and configure data privacy.
        </p>

        {/* Tab switch */}
        <div className="mt-5 flex items-center gap-2 text-xs flex-wrap">
          <button
            onClick={() => setActiveTab('foundation')}
            id="settings-tab-foundation"
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'foundation'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{isNl ? 'Fundament (10 gebieden)' : 'Foundation (10 areas)'}</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'memory'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
            }`}
          >
            {isNl ? `AI Geheugen (${memories.length})` : `Transparent AI Memory (${memories.length})`}
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{isNl ? 'Meldingen & Stille Uren' : 'Smart Notifications & Quiet Hours'}</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
            }`}
          >
            {isNl ? 'Veiligheid & Intelligentie' : 'Assistant Intelligence'}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
              activeTab === 'data'
                ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
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
        />
      )}

      {/* Tab 1: Transparent Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          {/* Add Memory Form */}
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-5 shadow-xs">
            <h3 className="font-serif text-base font-medium text-[#2C2825] mb-2">
              Teach Assistant a Permanent Fact or Preference
            </h3>
            <p className="text-xs text-[#7A7167] mb-4">
              Add a principle, routine boundary, brand rule, or personal preference that JARVIS must always remember.
            </p>

            <form onSubmit={handleCreateMemory} className="space-y-3">
              <textarea
                rows={2}
                required
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="e.g. In Mariluna, we never discount flagship courses; in personal life, prefer walking meetings on Wednesdays..."
                className="w-full bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl p-3 text-xs text-[#2C2825] placeholder-[#9E958B] focus:outline-hidden focus:border-[#8C7654]"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <select
                    value={newMemoryRealm}
                    onChange={(e) => setNewMemoryRealm(e.target.value as Realm)}
                    className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-1.5 text-xs text-[#2C2825]"
                  >
                    <option value="personal">Personal Life</option>
                    <option value="mariluna">Mariluna Business</option>
                  </select>

                  <input
                    type="text"
                    value={newMemoryCategory}
                    onChange={(e) => setNewMemoryCategory(e.target.value)}
                    placeholder="Category"
                    className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-1.5 text-xs text-[#2C2825]"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer w-fit"
                >
                  Save Fact to Memory
                </button>
              </div>
            </form>
          </div>

          {/* Stored Memories List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8175]">
              Active Memory Registry
            </h3>

            {memories.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E1D4] flex items-start justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        m.realm === 'mariluna'
                          ? 'bg-[#2C2825] text-[#F9F7F2]'
                          : 'bg-[#EAE4D7] text-[#554C42]'
                      }`}
                    >
                      {m.realm}
                    </span>
                    <span className="text-[11px] font-semibold text-[#8C7654]">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-[#9E958B]">
                      • Added {m.dateAdded} ({m.source === 'user_stated' ? 'Explicit' : 'Learned'})
                    </span>
                  </div>
                  <p className="text-xs text-[#3E3832] font-light leading-relaxed">
                    {m.content}
                  </p>
                </div>

                <button
                  onClick={() => onDeleteMemory(m.id)}
                  title="Forget this memory"
                  className="text-[#9E958B] hover:text-[#733] p-1.5 rounded-lg hover:bg-[#F4EFE6] transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Smart Notifications & Quiet Hours */}
      {activeTab === 'notifications' && notificationSettings && onUpdateNotificationSettings && (
        <div className="space-y-6">
          {/* Main Notification Controls */}
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE0]">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                  Sparse, High-Signal Notifications
                </h3>
                <p className="text-xs text-[#7A7167] mt-1 font-light">
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
                      ? 'bg-[#2C2825] text-[#F9F7F2]'
                      : 'bg-[#EDE7DC] text-[#7A7167]'
                  }`}
                >
                  {notificationSettings.enabled ? 'Notifications Enabled' : 'Notifications Paused'}
                </button>
              </div>
            </div>

            {/* Quiet Hours Configuration */}
            <div className="p-4 rounded-xl bg-[#FAF7F0] border border-[#E5DEC7] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#7E694E]">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Sacred Quiet Hours (Do Not Disturb)
                  </span>
                </div>
                <span className="text-[11px] text-[#7A7167]">No non-critical alerts</span>
              </div>

              <p className="text-xs text-[#5C5348] font-light">
                During these hours, your assistant holds all proactive ideas, non-urgent reminders, and digest pings silently until your morning start window.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-xs font-medium text-[#3D372F] block mb-1">
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
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-lg p-2 text-xs text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#3D372F] block mb-1">
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
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-lg p-2 text-xs text-[#2C2825]"
                  />
                </div>
              </div>
            </div>

            {/* Frequency & Channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[#E5DEC7] bg-[#FAF8F4] space-y-3">
                <span className="text-xs font-semibold text-[#2C2825] block">
                  Delivery Channels
                </span>

                <div className="space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#4E463E]">In-App Notification Center</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.inAppNotificationsEnabled}
                      onChange={(e) =>
                        onUpdateNotificationSettings({
                          ...notificationSettings,
                          inAppNotificationsEnabled: e.target.checked,
                        })
                      }
                      className="accent-[#7E694E] w-4 h-4"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs text-[#4E463E] block">Browser Push Notifications</span>
                      <span className="text-[10px] text-[#8C8377]">
                        Status: {pushStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {pushStatus !== 'granted' && (
                        <button
                          type="button"
                          onClick={handleRequestPush}
                          className="text-[10px] font-medium text-[#7E694E] underline cursor-pointer"
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
                        className="accent-[#7E694E] w-4 h-4"
                      />
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#4E463E]">Subtle Audio Chime</span>
                    <input
                      type="checkbox"
                      checked={notificationSettings.soundEnabled}
                      onChange={(e) =>
                        onUpdateNotificationSettings({
                          ...notificationSettings,
                          soundEnabled: e.target.checked,
                        })
                      }
                      className="accent-[#7E694E] w-4 h-4"
                    />
                  </label>
                </div>
              </div>

              {/* Maximum Daily Rate */}
              <div className="p-4 rounded-xl border border-[#E5DEC7] bg-[#FAF8F4] space-y-3">
                <span className="text-xs font-semibold text-[#2C2825] block">
                  Daily Attention Budget
                </span>
                <p className="text-[11px] text-[#7A7167] leading-relaxed">
                  Maximum proactive notification digests delivered per day to preserve your focus.
                </p>

                <div>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="text-[#554C42]">Max Daily Alerts:</span>
                    <strong className="text-[#2C2825]">{notificationSettings.maxDailyFrequency} per day</strong>
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
                    className="w-full accent-[#7E694E]"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C8377] mt-1">
                    <span>1 (Strict Minimalism)</span>
                    <span>3 (Balanced)</span>
                    <span>5 (More Frequent)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Topics */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8A8175] block">
                Allowed Notification Categories
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'upcomingTaskReminders', label: 'Upcoming scheduled tasks' },
                  { key: 'marilunaFollowUps', label: 'Mariluna studio & business follow-ups' },
                  { key: 'forgottenIdeas', label: 'Forgotten ideas review prompts' },
                  { key: 'goalCheckIns', label: 'Strategic goal milestones' },
                  { key: 'cycleInsights', label: 'Weekly cycle planning insights (Private)' },
                  { key: 'weeklyPlanning', label: 'Sunday / Monday weekly alignment' },
                  { key: 'rescheduleSuggestions', label: 'Gentle overdue task rescheduling' },
                ].map((item) => {
                  const isChecked = Boolean(notificationSettings[item.key as keyof NotificationSettings]);
                  return (
                    <label
                      key={item.key}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#E7DEC8] cursor-pointer hover:bg-[#F5EFE3] transition"
                    >
                      <span className="text-xs text-[#3E372E]">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          onUpdateNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="accent-[#7E694E] w-4 h-4 ml-2"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
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
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                Data Sovereignty & Local Storage
              </h3>
              <p className="text-xs text-[#7A7167] mt-1 font-light">
                Your data is stored securely in your browser's persistent storage. You can export a complete JSON snapshot at any time.
              </p>
            </div>

            {/* Sample Data Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAF8F4] border border-[#E2DBD0]">
              <div>
                <span className="text-xs font-semibold text-[#2C2825] block">
                  Sample Data Mode
                </span>
                <span className="text-[11px] text-[#7A7167]">
                  {isSampleData
                    ? 'Currently showing curated sample tasks, goals, ideas, and calendar.'
                    : 'Curated sample mode disabled. Using clean custom entries.'}
                </span>
              </div>
              <button
                onClick={onToggleSampleData}
                className="px-3.5 py-1.5 rounded-lg border border-[#D5CCBE] text-xs font-medium text-[#2C2825] hover:bg-[#EFE9DE] transition cursor-pointer"
              >
                {isSampleData ? 'Clear Sample Data' : 'Reload Sample Data'}
              </button>
            </div>

            {/* Export / Import */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] hover:bg-[#FAF8F4] transition text-xs font-medium text-[#2C2825] cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-[#8C7654]" />
                <span>Export Complete Backup (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] hover:bg-[#FAF8F4] transition text-xs font-medium text-[#2C2825] cursor-pointer shadow-xs">
                <Upload className="w-4 h-4 text-[#8C7654]" />
                <span>Restore Backup (JSON)</span>
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
                <span className="text-[11px] text-[#8C8377]">
                  Clears all local storage and restores default state.
                </span>
              </div>
              <button
                onClick={onResetData}
                className="px-4 py-1.5 rounded-lg border border-[#EAC4C4] bg-[#FFF8F8] text-xs font-medium text-[#842] hover:bg-[#FFEAEA] transition cursor-pointer"
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
