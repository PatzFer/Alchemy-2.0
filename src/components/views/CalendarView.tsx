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

  const todayStr = formatLocalDate(new Date());
  const dateObj = parseLocalDate(currentDateStr);

  // Open Modal prefilled with selected date
  const handleOpenAddModal = (overrideDate?: string) => {
    setNewDate(overrideDate || currentDateStr);
    setNewTitle('');
    setNewLocation('');
    setNewStartTime('10:00');
    setNewEndTime('11:00');
    setIsModalOpen(true);
  };

  // Create Event Handler
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D5] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
            Agenda & Ritme
          </h1>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Sovereinty scheduling within your bounded working hours ({lifeProfile.workingHoursStart} –{' '}
            {lifeProfile.workingHoursEnd}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status badge */}
          {integrations?.calendar?.status === 'connected' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#D0E2D4] bg-[#E8EFE9] text-[11px] text-[#2D5A3C]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A3C] animate-pulse" />
              <span>Google Agenda Gekoppeld • Alleen-lezen</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DCD3C4] bg-[#F7F3EA] text-[11px] text-[#695B49]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>Lokale Agenda • Directe opslag</span>
            </div>
          )}

          <button
            onClick={() => handleOpenAddModal()}
            id="add-calendar-event-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Afspraak toevoegen</span>
          </button>
        </div>
      </div>

      {/* Navigation Toolbar & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg border border-[#DDD5C7] text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
              title="Vorige"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg border border-[#DDD5C7] text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
              title="Volgende"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-serif text-lg font-medium text-[#2C2825] capitalize">
            {getHeaderLabel()}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#F4EFE6] p-1 rounded-xl border border-[#E3DBD0]">
            <button
              type="button"
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'day'
                  ? 'bg-[#2C2825] text-[#F9F7F2] shadow-xs'
                  : 'text-[#6C6358] hover:text-[#2C2825]'
              }`}
            >
              Dag
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#2C2825] text-[#F9F7F2] shadow-xs'
                  : 'text-[#6C6358] hover:text-[#2C2825]'
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#2C2825] text-[#F9F7F2] shadow-xs'
                  : 'text-[#6C6358] hover:text-[#2C2825]'
              }`}
            >
              Maand
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCurrentDateStr(todayStr)}
            className="text-xs text-[#2C2825] font-medium underline hover:text-[#8C7654] transition cursor-pointer"
          >
            Vandaag
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DAY VIEW                                                     */}
      {/* ============================================================ */}
      {viewMode === 'day' && (
        <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1] text-xs text-[#7A7167]">
            <span>Ingeplande tijd: {(totalEventMinutes / 60).toFixed(1)} uur</span>
            <span>{dayEvents.length} {dayEvents.length === 1 ? 'afspraak' : 'afspraken'}</span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarIcon className="w-8 h-8 text-[#C4BAAA] mx-auto mb-2" />
              <p className="text-sm font-medium text-[#2C2825]">
                Geen afspraken gepland voor {getHeaderLabel()}
              </p>
              <p className="text-xs text-[#8C8377] mt-1">
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
                      ? 'bg-[#FCFBF8] border-[#DDD5C7]'
                      : 'bg-[#FAF8F5] border-[#E8E2D8]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 bg-[#8C7654]" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-[#2C2825]">
                            {evt.title}
                          </span>
                          <span
                            className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                              evt.realm === 'mariluna'
                                ? 'bg-[#2C2825] text-[#F9F7F2]'
                                : 'bg-[#EAE4D7] text-[#554C42]'
                            }`}
                          >
                            {evt.realm}
                          </span>
                          {evt.isExternalSync || evt.source === 'google' ? (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E8EFE9] text-[#2D5A3C] font-medium border border-[#D0E2D4]">
                              Google Agenda
                            </span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#7A6D5E] font-medium border border-[#E3DBD0]">
                              Alchemy Internal
                            </span>
                          )}
                        </div>
                        {evt.location && (
                          <div className="flex items-center gap-1 text-xs text-[#8C8377] mt-1">
                            <MapPin className="w-3 h-3 text-[#A69C8E]" />
                            <span>{evt.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-[#4A433B] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border border-[#E3DBD0] w-fit">
                      <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
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
                  ? 'bg-[#FFFFFF] border-[#2C2825] shadow-md ring-1 ring-[#2C2825]/20'
                  : day.isToday
                  ? 'bg-[#FAF6EE] border-[#C5A880]'
                  : 'bg-[#FFFFFF] border-[#E8E2D6] hover:border-[#C5A880]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                  <span className="text-xs font-semibold text-[#5C5449] capitalize">
                    {day.dayName}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      day.isToday
                        ? 'bg-[#2C2825] text-[#F9F7F2]'
                        : 'text-[#2C2825]'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </div>

                <div className="mt-2 space-y-1.5">
                  {day.dayEvents.length === 0 ? (
                    <p className="text-[11px] text-[#A69C8E] italic pt-2">
                      Geen afspraken
                    </p>
                  ) : (
                    day.dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-2 rounded-lg bg-[#FAF8F4] border border-[#EAE3D5] text-xs space-y-0.5"
                      >
                        <div className="font-medium text-[#2C2825] truncate">
                          {evt.title}
                        </div>
                        <div className="text-[10px] text-[#8C8377] flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#8C7654]" />
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
                className="mt-3 pt-2 border-t border-[#F0EBE1] text-[11px] text-[#8C7654] hover:text-[#2C2825] font-medium flex items-center justify-center gap-1 cursor-pointer"
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
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] p-4 shadow-xs">
            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-[#7A7167] pb-3 border-b border-[#E8E2D6]">
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
                        ? 'bg-[#2C2825] text-[#F9F7F2] border-[#2C2825] shadow-xs'
                        : cell.isToday
                        ? 'bg-[#FAF6EE] border-[#C5A880] text-[#2C2825]'
                        : 'bg-[#FFFFFF] border-[#E8E2D6] text-[#2C2825] hover:bg-[#FAF8F4]'
                    }`}
                  >
                    <span className="text-xs font-semibold">{cell.dayNum}</span>
                    {hasEvents && (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cell.isSelected ? 'bg-[#C5A880]' : 'bg-[#8C7654]'
                          }`}
                        />
                        <span
                          className={`text-[10px] font-medium truncate ${
                            cell.isSelected ? 'text-[#D0C7B7]' : 'text-[#7A7167]'
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
          <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2">
              <h3 className="font-serif text-sm font-medium text-[#2C2825]">
                Afspraken voor {getHeaderLabel()}
              </h3>
              <button
                type="button"
                onClick={() => handleOpenAddModal(currentDateStr)}
                className="text-xs text-[#8C7654] hover:text-[#2C2825] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toevoegen</span>
              </button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-xs text-[#8C8377] py-2">
                Geen afspraken gepland op deze datum.
              </p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#8C7654]" />
                      <span className="font-medium text-[#2C2825]">{evt.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EAE4D7] text-[#554C42] capitalize">
                        {evt.realm}
                      </span>
                    </div>
                    <div className="text-[#6C6358] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8C7654]" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h2 className="font-serif text-xl font-medium text-[#2C2825]">
                Afspraak Inplannen
              </h2>
              <span className="text-xs text-[#8C7654] font-mono">
                Alchemy OS
              </span>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="bijv. Client Alignment, Masterclass, Wandeling"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                  autoFocus
                />
              </div>

              {/* DATE FIELD (Required by Bug 4) */}
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Datum
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Starttijd
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Eindtijd
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Domein / Wereld
                  </label>
                  <select
                    value={newRealm}
                    onChange={(e) => setNewRealm(e.target.value as Realm)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="personal">Personal (Privé)</option>
                    <option value="mariluna">Mariluna Business</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="appointment">Afspraak</option>
                    <option value="work">Focus / Deep Work</option>
                    <option value="me_time">Me Time</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Locatie (optioneel)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="bijv. Atelier, Online, Studio"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              {/* Read-Only Google Connection Notice */}
              <div className="p-3 rounded-xl bg-[#F7F3EA] border border-[#E3DBD0] text-[11px] text-[#7A6D5E] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
                <span>
                  Opmerking: De actieve Google Agenda koppeling is momenteel ingesteld op <strong>Alleen-lezen</strong>.
                  Deze afspraak wordt veilig opgeslagen in je lokale Alchemy OS.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DE] transition cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer shadow-xs"
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
