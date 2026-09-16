import React from 'react';
import { X, Bell, Check, Trash2, Clock, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { SmartNotification, NotificationSettings, NotificationCategory } from '../types';
import { isCurrentlyQuietHours, triggerBrowserPush, DEFAULT_NOTIFICATION_SETTINGS } from '../lib/notificationEngine';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: SmartNotification[];
  onMarkAsRead?: (id: string) => void;
  onDismissNotification?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  settings?: NotificationSettings;
  onUpdateSettings?: (settings: NotificationSettings) => void;
  onNavigateTab?: (tab: any) => void;
  onOpenAssistantWithPrompt?: (prompt: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAsRead,
  onDismissNotification,
  onMarkAllAsRead,
  onMarkAllRead,
  onClearAll,
  settings,
  onUpdateSettings,
  onNavigateTab,
  onOpenAssistantWithPrompt,
}) => {
  if (!isOpen) return null;

  const safeSettings = settings || DEFAULT_NOTIFICATION_SETTINGS;
  const isQuiet = isCurrentlyQuietHours(safeSettings);

  const handleMarkOne = (id: string) => {
    if (onMarkAsRead) onMarkAsRead(id);
    else if (onDismissNotification) onDismissNotification(id);
  };

  const handleMarkAll = () => {
    if (onMarkAllAsRead) onMarkAllAsRead();
    else if (onMarkAllRead) onMarkAllRead();
  };

  const handleClear = () => {
    if (onClearAll) onClearAll();
    else handleMarkAll();
  };

  const requestBrowserPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (onUpdateSettings) {
          onUpdateSettings({
            ...safeSettings,
            browserPermission: perm as 'default' | 'granted' | 'denied',
            browserPushEnabled: perm === 'granted',
          });
        }
        if (perm === 'granted') {
          triggerBrowserPush(
            {
              id: 'test-' + Date.now(),
              category: 'weekly_planning',
              title: 'P & M Alchemy Notifications Active',
              body: 'Sparse, respectful notifications enabled for your personal OS.',
              timestamp: new Date().toISOString(),
              read: false,
              priority: 'thoughtful',
            },
            safeSettings
          );
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
  };

  const isReadItem = (n: SmartNotification) => Boolean(n.read || n.isRead);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-3xl bg-[#FAF8F3] border border-[#DDD5C7] shadow-2xl p-6 text-[#2C2825] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE4D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EDE6D8] flex items-center justify-center text-[#8C7654]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#2C2825]">Notification Center</h3>
              <p className="text-[11px] text-[#7A7167]">Sparse, thoughtful intelligence digest</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7A7167] hover:text-[#2C2825] hover:bg-[#EBE4D8] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quiet Hours indicator */}
        <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-[#F2EDE2] border border-[#E2DDD2] text-xs">
          <div className="flex items-center gap-2 text-[#554C42]">
            <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>
              Quiet Hours: {safeSettings.quietHoursStart} – {safeSettings.quietHoursEnd}
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isQuiet ? 'bg-[#E3D9C6] text-[#4A4032]' : 'bg-[#E6EFE4] text-[#3B5B35]'
            }`}
          >
            {isQuiet ? 'Quiet Mode Active' : 'Normal Hours'}
          </span>
        </div>

        {/* Browser Permission Prompt if not granted */}
        {typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted' && (
          <div className="mt-2.5 flex items-center justify-between p-3 rounded-xl bg-[#FFFFFF] border border-[#E3DCD0] text-xs">
            <span className="text-[#554C42]">Receive system notifications on desktop & mobile</span>
            <button
              onClick={requestBrowserPermission}
              className="px-2.5 py-1 rounded-lg bg-[#2C2825] text-[#F9F7F2] text-[11px] font-medium hover:bg-[#433D37] transition cursor-pointer"
            >
              Enable Browser Push
            </button>
          </div>
        )}

        {/* Action bar for notifications */}
        <div className="flex items-center justify-between py-2 text-xs border-b border-[#EAE4D8]">
          <span className="text-[#7A7167] font-medium">{notifications.length} message{notifications.length === 1 ? '' : 's'}</span>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !isReadItem(n)) && (
              <button
                onClick={handleMarkAll}
                className="text-[11px] text-[#8C7654] hover:text-[#2C2825] transition cursor-pointer"
              >
                Mark all as read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClear}
                className="text-[11px] text-[#9E4A4A] hover:text-[#7A2A2A] transition ml-2 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Notification items list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#8C8377] space-y-1">
              <p>Your notification sanctuary is clear.</p>
              <p className="text-[11px] text-[#A69D91]">
                P & M Alchemy preserves your focus and avoids unnecessary alarms.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const read = isReadItem(notif);
              return (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-2xl border text-xs transition space-y-1.5 ${
                    read
                      ? 'bg-[#F9F7F2] border-[#E8E2D6] text-[#6C6358]'
                      : 'bg-[#FFFFFF] border-[#C5BAA8] text-[#2C2825] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {!read && <span className="w-2 h-2 rounded-full bg-[#C5A880]"></span>}
                      <span className="font-semibold text-xs text-[#2C2825]">{notif.title}</span>
                    </div>
                    <span className="text-[10px] text-[#8C8377]">
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <p className="text-xs text-[#4A433B] leading-relaxed pl-4">{notif.body}</p>

                  <div className="flex items-center justify-between pt-1 pl-4">
                    <span className="text-[10px] uppercase tracking-wider text-[#8C7654]">
                      {(notif.category || '').replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {notif.actionPrompt && onOpenAssistantWithPrompt && (
                        <button
                          onClick={() => {
                            onOpenAssistantWithPrompt(notif.actionPrompt!);
                            handleMarkOne(notif.id);
                            onClose();
                          }}
                          className="text-[11px] text-[#8C7654] font-medium hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          Consult Partner
                        </button>
                      )}
                      {notif.targetTab && onNavigateTab && (
                        <button
                          onClick={() => {
                            onNavigateTab(notif.targetTab);
                            handleMarkOne(notif.id);
                            onClose();
                          }}
                          className="text-[11px] text-[#2C2825] font-medium hover:underline cursor-pointer"
                        >
                          View in {notif.targetTab} →
                        </button>
                      )}
                      {!read && (
                        <button
                          onClick={() => handleMarkOne(notif.id)}
                          className="p-1 rounded-md text-[#7A7167] hover:text-[#2C2825] cursor-pointer"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#EAE4D8] flex items-center justify-between text-[11px] text-[#8C8377]">
          <span>Max {safeSettings.maxDailyFrequency} thoughtful digests per day</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#F9F7F2] font-medium hover:bg-[#433D37] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
