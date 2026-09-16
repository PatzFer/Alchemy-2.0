import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { CalendarEvent, ActiveWorldFilter, Realm, LifeProfile } from '../../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  lifeProfile: LifeProfile;
  activeWorld: ActiveWorldFilter;
  onAddEvent: (event: Partial<CalendarEvent>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  lifeProfile,
  activeWorld,
  onAddEvent,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDateStr, setCurrentDateStr] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Event Form state
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newRealm, setNewRealm] = useState<Realm>('personal');
  const [newType, setNewType] = useState<CalendarEvent['type']>('appointment');
  const [newLocation, setNewLocation] = useState('');

  const dateObj = new Date(currentDateStr + 'T00:00:00');
  const formattedHeader = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const filteredEvents = events.filter((e) => {
    if (activeWorld !== 'all' && e.realm !== activeWorld) return false;
    return e.date === currentDateStr;
  });

  // Calculate day stats
  const totalEventMinutes = filteredEvents.reduce((acc, evt) => {
    const [sH, sM] = evt.startTime.split(':').map(Number);
    const [eH, eM] = evt.endTime.split(':').map(Number);
    return acc + Math.max(0, (eH * 60 + eM) - (sH * 60 + sM));
  }, 0);

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddEvent({
      id: 'e-' + Date.now(),
      title: newTitle,
      startTime: newStartTime,
      endTime: newEndTime,
      date: currentDateStr,
      realm: newRealm,
      type: newType,
      location: newLocation || undefined,
    });

    setNewTitle('');
    setNewLocation('');
    setIsModalOpen(false);
  };

  const shiftDate = (days: number) => {
    const d = new Date(currentDateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    setCurrentDateStr(d.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Google Sync banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D5] pb-5">
        <div>
          <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
            Calendar & Rhythm
          </h1>
          <p className="text-xs text-[#7A7167] mt-1 font-light">
            Intentional scheduling honoring working hours ({lifeProfile.workingHoursStart} –{' '}
            {lifeProfile.workingHoursEnd}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real Google Calendar status badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DCD3C4] bg-[#F7F3EA] text-[11px] text-[#695B49]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>Local Engine Active • Google OAuth Ready</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            id="add-calendar-event-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => shiftDate(-1)}
              className="p-1.5 rounded-lg border border-[#DDD5C7] text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="p-1.5 rounded-lg border border-[#DDD5C7] text-[#6C6358] hover:text-[#2C2825] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h2 className="font-serif text-lg font-medium text-[#2C2825]">
            {formattedHeader}
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#7A7167]">
          <span>Committed: {(totalEventMinutes / 60).toFixed(1)} hrs</span>
          <span className="hidden sm:inline">•</span>
          <button
            onClick={() => setCurrentDateStr(new Date().toISOString().split('T')[0])}
            className="text-[#2C2825] font-medium underline cursor-pointer"
          >
            Go to Today
          </button>
        </div>
      </div>

      {/* Timeline View */}
      <div className="rounded-2xl bg-[#FFFFFF] border border-[#E8E2D6] p-6 shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarIcon className="w-8 h-8 text-[#C4BAAA] mx-auto mb-2" />
            <p className="text-xs text-[#7A7167]">
              No commitments scheduled for {formattedHeader}.
            </p>
            <p className="text-[11px] text-[#A89F93] mt-1">
              An open horizon for deep creation or restful pause.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((evt) => (
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
                      <div className="flex items-center gap-2">
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
                      </div>
                      {evt.location && (
                        <div className="flex items-center gap-1 text-xs text-[#8C8377] mt-0.5">
                          <MapPin className="w-3 h-3" />
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

      {/* Add Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1816]/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FAF8F3] border border-[#E3DCD0] p-6 shadow-2xl">
            <h2 className="font-serif text-xl font-medium text-[#2C2825] mb-4">
              Schedule Commitment
            </h2>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Masterclass Q&A, Pilates, Coastal Walk"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#5A524A] mb-1">
                    World
                  </label>
                  <select
                    value={newRealm}
                    onChange={(e) => setNewRealm(e.target.value as Realm)}
                    className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                  >
                    <option value="personal">Personal</option>
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
                    <option value="appointment">Appointment</option>
                    <option value="work">Deep Work</option>
                    <option value="me_time">Me Time</option>
                    <option value="routine">Routine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Studio, Home Library, Online"
                  className="w-full bg-[#FFFFFF] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E8E2D6]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:bg-[#EFE9DE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38]"
                >
                  Save Commitment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
