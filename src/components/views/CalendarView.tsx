import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  ShieldCheck,
  Globe,
  Info,
} from 'lucide-react';
import { CalendarEvent, ActiveWorldFilter, Realm, LifeProfile, IntegrationsState } from '../../types';
import { findDuplicateCalendarEvent, validateCalendarTimeRange } from '../../lib/calendarValidation';

interface CalendarViewProps {
  events: CalendarEvent[];
  lifeProfile: LifeProfile;
  activeWorld: ActiveWorldFilter;
  onAddEvent: (event: Partial<CalendarEvent>) => void;
  integrations?: IntegrationsState;
}

// Local date helpers to eliminate UTC timezone drift
const parseLocalDate = (dateStr: string): Date => {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0], 10) || 2026;
  const m = (parseInt(parts[1], 10) || 1) - 1;
  const d = parseInt(parts[2], 10) || 1;
  return new Date(y, m, d);
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  lifeProfile,
  activeWorld,
  onAddEvent,
  integrations,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentDateStr, setCurrentDateStr] = useState<string>(
    formatLocalDate(new Date())
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(currentDateStr);
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newRealm, setNewRealm] = useState<Realm>('personal');
  const [newType, setNewType] = useState<CalendarEvent['type']>('appointment');
  const [newLocation, setNewLocation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const todayStr = formatLocalDate(new Date());
  const dateObj = parseLocalDate(currentDateStr);

  // Open Modal prefilled with selected date
  const handleOpenAddModal = (overrideDate?: string) => {
    setNewDate(overrideDate || currentDateStr);
    setNewRealm(activeWorld === 'mariluna' ? 'mariluna' : 'personal');
    setNewTitle('');
    setNewLocation('');
    setFormError(null);
    setNewStartTime('10:00');
    setNewEndTime('11:00');
    setIsModalOpen(true);
  };

  // Create Event Handler
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormError('Geef je afspraak een titel.');
      return;
    }
    const timeError = validateCalendarTimeRange(newStartTime, newEndTime);
    if (timeError) {
      setFormError(timeError);
      return;
    }
    if (findDuplicateCalendarEvent(events, { title: newTitle, date: newDate, startTime: newStartTime, endTime: newEndTime, realm: newRealm })) {
      setFormError('Deze afspraak staat al op dit tijdstip in dezelfde agenda.');
      return;
    }
    setFormError(null);

    onAddEvent({
      id: 'e-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      title: newTitle.trim(),
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      realm: newRealm,
      type: newType,
      location: newLocation.trim() || undefined,
      isExternalSync: false,
      source: 'alchemy',
    });

    setNewTitle('');
    setNewLocation('');
    setFormError(null);
    setIsModalOpen(false);
  };

  // Date shifting according to active view mode
  const shiftDate = (delta: number) => {
    const d = parseLocalDate(currentDateStr);
    if (viewMode === 'day') {
      d.setDate(d.getDate() + delta);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + delta * 7);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + delta);
    }
    setCurrentDateStr(formatLocalDate(d));
  };

  // Filter events by realm if applicable
  const filterByRealm = (evtList: CalendarEvent[]) => {
    if (activeWorld === 'all') return evtList;
    return evtList.filter((e) => e.realm === activeWorld);
  };

  // Day View events
  const dayEvents = filterByRealm(events.filter((e) => e.date === currentDateStr));

  // Calculate total committed hours for day
  const totalEventMinutes = dayEvents.reduce((acc, evt) => {
    if (!evt.startTime || !evt.endTime) return acc;
    const [sH, sM] = evt.startTime.split(':').map(Number);
    const [eH, eM] = evt.endTime.split(':').map(Number);
    return acc + Math.max(0, (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0)));
  }, 0);

  // Format Header Label depending on view mode
  const getHeaderLabel = () => {
    if (viewMode === 'day') {
      return dateObj.toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else if (viewMode === 'week') {
      const dayOfWeek = dateObj.getDay();
      const distToMon = (dayOfWeek + 6) % 7;
      const monday = new Date(dateObj);
      monday.setDate(dateObj.getDate() - distToMon);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const startFmt = monday.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
      const endFmt = sunday.toLocaleDateString('nl-NL', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Week: ${startFmt} — ${endFmt}`;
    } else {
      return dateObj.toLocaleDateString('nl-NL', {
        month: 'long',
        year: 'numeric',
      });
    }
  };

  // Build 7 days for Week View
  const getWeekDays = () => {
    const dayOfWeek = dateObj.getDay();
    const distToMon = (dayOfWeek + 6) % 7;
    const monday = new Date(dateObj);
    monday.setDate(dateObj.getDate() - distToMon);

    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const ds = formatLocalDate(d);
      result.push({
        dateStr: ds,
        dateObj: d,
        dayName: d.toLocaleDateString('nl-NL', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: ds === todayStr,
        isSelected: ds === currentDateStr,
        dayEvents: filterByRealm(events.filter((e) => e.date === ds)),
      });
    }
    return result;
  };

  // Build Month Grid for Month View
  const getMonthGrid = () => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const totalDays = lastDay.getDate();

    const cells: Array<{
      dateStr?: string;
      dayNum?: number;
      isToday?: boolean;
      isSelected?: boolean;
      dayEvents?: CalendarEvent[];
    }> = [];

    // Blank cells before first day
    for (let i = 0; i < startOffset; i++) {
      cells.push({});
    }

    // Days of month
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const ds = formatLocalDate(d);
      cells.push({
        dateStr: ds,
        dayNum: day,
        isToday: ds === todayStr,
        isSelected: ds === currentDateStr,
        dayEvents: filterByRealm(events.filter((e) => e.date === ds)),
      });
    }

    return cells;
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[var(--text-primary)]">
            Agenda & Ritme
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-light">
            Je agenda binnen je ingestelde werkuren ({lifeProfile.workingHoursStart} –{' '}
            {lifeProfile.workingHoursEnd}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status badge */}
          {integrations?.calendar?.status === 'connected' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D0E2D4] bg-[#E8EFE9] text-[11px] text-[#2D5A3C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <span>Google Agenda gekoppeld • {integrations?.calendar?.readOnly ? 'Alleen-lezen' : 'Lezen & Schrijven'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DCD3C4] bg-[var(--surface-2)] text-[11px] text-[#695B49]">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
              <span>Lokale Agenda • Directe opslag</span>
            </div>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            id="add-calendar-event-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--surface-raised)] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Afspraak toevoegen</span>
          </button>
        </div>
      </div>

      {/* Navigation Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
              title="Vorige"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
              title="Volgende"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-serif text-lg font-medium text-[var(--text-primary)] capitalize">
            {getHeaderLabel()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Dag
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Maand
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentDateStr(todayStr)}
            className="text-xs text-[var(--text-primary)] font-medium underline hover:text-[var(--accent-secondary)] transition cursor-pointer"
          >
            Vandaag
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DAY VIEW                                                     */}
      {/* ============================================================ */}
      {viewMode === 'day' && (
        <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
            <span>Ingeplande tijd: {(totalEventMinutes / 60).toFixed(1)} uur</span>
            <span>{dayEvents.length} {dayEvents.length === 1 ? 'afspraak' : 'afspraken'}</span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarIcon className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Geen afspraken gepland voor {getHeaderLabel()}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Een rustige, open horizon voor diep werk of hersteltijd.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`p-4 rounded-xl border transition-all ${
                    evt.realm === 'mariluna'
                      ? 'bg-[var(--surface-1)] border-[var(--border-subtle)]'
                      : 'bg-[var(--surface-1)] border-[var(--border-subtle)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-[var(--accent-secondary)]" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--text-primary)]">
                            {evt.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                              evt.realm === 'mariluna'
                                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)]'
                                : 'bg-[var(--border-subtle)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {evt.realm}
                          </span>
                          {evt.isExternalSync || evt.source === 'google' ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#2D5A3C] font-medium border border-[#D0E2D4]">
                              Google Agenda
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-secondary)] font-medium border border-[var(--border-subtle)]">
                              Lokaal in Alchemy
                            </span>
                          )}
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
                            <MapPin className="w-3 h-3 text-[var(--text-muted)]" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--surface-1)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] w-fit">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent-secondary)]" />
                      <span>
                        {evt.startTime} — {evt.endTime}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* WEEK VIEW                                                    */}
      {/* ============================================================ */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {getWeekDays().map((day) => (
            <div
              key={day.dateStr}
              onClick={() => setCurrentDateStr(day.dateStr)}
              className={`rounded-2xl border p-3 flex flex-col justify-between transition-all cursor-pointer ${
                day.isSelected
                  ? 'bg-[var(--surface-1)] border-[var(--text-primary)] shadow-md ring-1 ring-[var(--text-primary)]/20'
                  : day.isToday
                  ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)]'
                  : 'bg-[var(--surface-1)] border-[var(--border-subtle)] hover:border-[var(--accent-secondary)]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] capitalize">
                    {day.dayName}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      day.isToday
                        ? 'bg-[var(--surface-raised)] text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </div>

                <div className="mt-2 space-y-1.5">
                  {day.dayEvents.length === 0 ? (
                    <p className="text-[11px] text-[var(--text-muted)] italic pt-2">
                      Geen afspraken
                    </p>
                  ) : (
                    day.dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border-subtle)] text-xs space-y-0.5"
                      >
                        <div className="font-medium text-[var(--text-primary)] truncate">
                          {evt.title}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[var(--accent-secondary)]" />
                          <span>{evt.startTime}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAddModal(day.dateStr);
                }}
                className="mt-3 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Toevoegen</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================ */}
      {/* MONTH VIEW                                                   */}
      {/* ============================================================ */}
      {viewMode === 'month' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-4 shadow-xs">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-[var(--text-secondary)] pb-3 border-b border-[var(--border-subtle)]">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {getMonthGrid().map((cell, idx) => {
                if (!cell.dayNum) {
                  return <div key={`blank-${idx}`} className="h-16 p-1 bg-transparent" />;
                }
                const hasEvents = (cell.dayEvents?.length || 0) > 0;
                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setCurrentDateStr(cell.dateStr!)}
                    className={`h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      cell.isSelected
                        ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] border-[var(--text-primary)] shadow-xs'
                        : cell.isToday
                        ? 'bg-[var(--surface-2)] border-[var(--accent-secondary)] text-[var(--text-primary)]'
                        : 'bg-[var(--surface-1)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{cell.dayNum}</span>
                    {hasEvents && (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cell.isSelected ? 'bg-[var(--accent-secondary)]' : 'bg-[var(--accent-secondary)]'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium truncate ${
                            cell.isSelected ? 'text-[var(--text-secondary)]' : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {cell.dayEvents?.length} {cell.dayEvents?.length === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details for Selected Date in Month View */}
          <div className="rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <h3 className="font-serif text-sm font-medium text-[var(--text-primary)]">
                Afspraken voor {getHeaderLabel()}
              </h3>
              <button
                type="button"
                onClick={() => handleOpenAddModal(currentDateStr)}
                className="text-xs text-[var(--accent-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toevoegen</span>
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-2">
                Geen afspraken gepland op deze datum.
              </p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--accent-secondary)]" />
                      <span className="font-medium text-[var(--text-primary)]">{evt.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)] capitalize">
                        {evt.realm}
                      </span>
                    </div>
                    <div className="text-[var(--text-secondary)] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--accent-secondary)]" />
                      <span>{evt.startTime} — {evt.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ADD EVENT MODAL WITH DATE SELECTOR                           */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--app-bg)]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--surface-1)] border border-[var(--border-subtle)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h2 className="font-serif text-xl font-medium text-[var(--text-primary)]">
                Afspraak Inplannen
              </h2>
              <span className="text-xs text-[var(--accent-secondary)] font-mono">
                Alchemy OS
              </span>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4" noValidate>
              {formError && <div role="alert" className="rounded-xl border border-[#E4B7AE] bg-[#FDF2F0] px-3 py-2 text-xs text-[#9B382B]">{formError}</div>}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="bijv. Client Alignment, Masterclass, Wandeling"
                  className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
                  autoFocus
                />
              </div>

              {/* DATE FIELD (Required by Bug 4) */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--accent-secondary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Starttijd
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => { setNewStartTime(e.target.value); setFormError(null); }}
                    className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Eindtijd
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => { setNewEndTime(e.target.value); setFormError(null); }}
                    className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Domein / Wereld
                  </label>
                  <select
                    value={newRealm}
                    onChange={(e) => setNewRealm(e.target.value as Realm)}
                    className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="personal">Personal (Privé)</option>
                    <option value="mariluna">Mariluna Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
                  >
                    <option value="appointment">Afspraak</option>
                    <option value="work">Focus / Deep Work</option>
                    <option value="me_time">Me Time</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Locatie (optioneel)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="bijv. Atelier, Online, Studio"
                  className="w-full bg-[var(--surface-1)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-primary)]"
                />
              </div>

              {/* Read-Only Google Connection Notice */}
              <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-start gap-2">
                <Info className="w-4 h-4 text-[var(--accent-secondary)] shrink-0 mt-0.5" />
                <span>
                  Opmerking: De actieve Google Agenda koppeling is momenteel ingesteld op <strong>Alleen-lezen</strong>.
                  Deze afspraak wordt veilig opgeslagen in je lokale Alchemy OS.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--surface-raised)] text-[var(--text-primary)] text-xs font-medium hover:bg-[var(--surface-raised)] transition cursor-pointer shadow-xs"
                >
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
