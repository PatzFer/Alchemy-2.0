import React, { useState } from 'react';
import { Bell, Clock, CheckCircle2, ChevronRight, X, Sparkles, Settings } from 'lucide-react';
import { WeeklyBodyCheckReminder } from '../../types';
import { isSundayMeasurementReminderDue, getISOWeekString } from '../../lib/healthUtils';

interface WeeklyReminderBannerProps {
  reminder?: WeeklyBodyCheckReminder;
  onUpdateReminder: (reminder: WeeklyBodyCheckReminder) => void;
  onOpenMeasurementModal: () => void;
  lang?: 'nl' | 'en';
}

export const WeeklyReminderBanner: React.FC<WeeklyReminderBannerProps> = ({
  reminder,
  onUpdateReminder,
  onOpenMeasurementModal,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const now = new Date();
  const reminderStatus = isSundayMeasurementReminderDue(reminder, now);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [preferredTime, setPreferredTime] = useState(reminder?.preferredTime || '09:00');

  // If snoozed or skipped or completed today or not sunday, but user wants to inspect settings:
  // We only show the active banner if isDue === true, or if config is explicitly opened.
  const handleSnoozeOneHour = () => {
    const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    onUpdateReminder({
      enabled: reminder?.enabled ?? true,
      dayOfWeek: reminder?.dayOfWeek || 'sunday',
      preferredTime: reminder?.preferredTime || '09:00',
      snoozedUntil: oneHourLater,
      lastSkippedWeek: reminder?.lastSkippedWeek,
      lastCompletedDate: reminder?.lastCompletedDate,
    });
  };

  const handleSkipThisWeek = () => {
    const currentWeek = getISOWeekString(new Date());
    onUpdateReminder({
      enabled: reminder?.enabled ?? true,
      dayOfWeek: reminder?.dayOfWeek || 'sunday',
      preferredTime: reminder?.preferredTime || '09:00',
      snoozedUntil: null,
      lastSkippedWeek: currentWeek,
      lastCompletedDate: reminder?.lastCompletedDate,
    });
  };

  const handleSaveConfig = () => {
    onUpdateReminder({
      enabled: reminder?.enabled ?? true,
      dayOfWeek: 'sunday',
      preferredTime,
      snoozedUntil: null,
      lastSkippedWeek: reminder?.lastSkippedWeek,
      lastCompletedDate: reminder?.lastCompletedDate,
    });
    setIsConfigOpen(false);
  };

  const handleToggleEnable = () => {
    onUpdateReminder({
      enabled: !reminder?.enabled,
      dayOfWeek: reminder?.dayOfWeek || 'sunday',
      preferredTime: reminder?.preferredTime || '09:00',
      snoozedUntil: reminder?.snoozedUntil,
      lastSkippedWeek: reminder?.lastSkippedWeek,
      lastCompletedDate: reminder?.lastCompletedDate,
    });
  };

  if (!reminderStatus.isDue && !isConfigOpen) {
    return (
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-[#FAF8F3] border border-[#E8E2D6] text-xs text-[#7A7167]">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
          <span>
            {isNl ? 'Wekelijkse lichaamscheck: elke zondagochtend' : 'Weekly body check: every Sunday morning'}
            {reminder?.preferredTime ? ` om ${reminder.preferredTime}` : ''}
          </span>
          {reminderStatus.reason === 'snoozed' && (
            <span className="text-[10px] bg-[#F2ECE1] text-[#8C7654] px-2 py-0.5 rounded-full font-mono">
              {isNl ? `Gesnoozed (nog ${reminderStatus.snoozedRemainingMins}m)` : `Snoozed (${reminderStatus.snoozedRemainingMins}m left)`}
            </span>
          )}
          {reminderStatus.reason === 'skipped' && (
            <span className="text-[10px] bg-[#F2ECE1] text-[#7A7167] px-2 py-0.5 rounded-full">
              {isNl ? 'Deze week overgeslagen' : 'Skipped this week'}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsConfigOpen(true)}
          className="text-xs text-[#8C7654] hover:text-[#2C2825] transition cursor-pointer flex items-center gap-1 font-medium"
        >
          <Settings className="w-3 h-3" />
          <span>{isNl ? 'Aanpassen' : 'Settings'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D5CCBE] bg-[#FBF9F5] p-5 shadow-xs space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0EBE1] border border-[#DED6C7] flex items-center justify-center text-[#8C7654] shrink-0 mt-0.5">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#EDE6D8] text-[#6E6353]">
                {isNl ? 'Wekelijkse Herinnering' : 'Weekly Reminder'}
              </span>
              <span className="text-[11px] text-[#8C7654] font-medium font-serif">
                {isNl ? 'Zondagochtend' : 'Sunday morning'}
              </span>
            </div>
            <h3 className="text-base font-serif text-[#2C2825] mt-1">
              {isNl ? 'Wekelijkse lichaamscheck' : 'Weekly body check'}
            </h3>
            <p className="text-xs text-[#7A7167] mt-0.5 font-light max-w-lg">
              {isNl
                ? 'Een rustig moment voor jezelf om gewicht of metingen vast te leggen. Geen verplichting; overslaan is altijd prima.'
                : 'A calm personal moment to record weight or measurements. No pressure; skipping is always fine.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          <button
            type="button"
            id="btn-complete-weekly-check"
            onClick={onOpenMeasurementModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs min-h-[44px]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isNl ? 'Meting voltooien' : 'Complete measurement'}</span>
          </button>

          <button
            type="button"
            onClick={handleSnoozeOneHour}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs text-[#5C5245] hover:border-[#8C7654] transition cursor-pointer min-h-[44px]"
          >
            <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>{isNl ? 'Herinner me over 1 uur' : 'Snooze 1 hour'}</span>
          </button>

          <button
            type="button"
            onClick={handleSkipThisWeek}
            className="px-3.5 py-2 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs text-[#8C8377] hover:text-[#2C2825] transition cursor-pointer min-h-[44px]"
          >
            {isNl ? 'Deze week overslaan' : 'Skip this week'}
          </button>
        </div>
      </div>

      {/* Config Drawer if open */}
      {isConfigOpen && (
        <div className="pt-3 border-t border-[#E8E2D6] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-[#4A433A]">
              <input
                type="checkbox"
                checked={reminder?.enabled !== false}
                onChange={handleToggleEnable}
                className="rounded border-[#DCD3C4] text-[#8C7654] focus:ring-0 cursor-pointer"
              />
              <span>{isNl ? 'Wekelijkse zondagherinnering actief' : 'Weekly Sunday reminder enabled'}</span>
            </label>

            <div className="flex items-center gap-1.5 text-[#7A7167]">
              <span>{isNl ? 'Tijdstip:' : 'Time:'}</span>
              <input
                type="time"
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="px-2 py-1 rounded-lg border border-[#DCD3C4] bg-[#FFFFFF] text-xs font-mono text-[#2C2825]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConfigOpen(false)}
              className="text-xs text-[#7A7167] hover:text-[#2C2825]"
            >
              {isNl ? 'Sluiten' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-3 py-1 rounded-lg bg-[#8C7654] text-[#FAF8F3] text-xs font-medium"
            >
              {isNl ? 'Opslaan' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
