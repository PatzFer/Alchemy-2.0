import React, { useState } from 'react';
import {
  User,
  Clock,
  Sparkles,
  Heart,
  Utensils,
  Shirt,
  Calendar,
  Shield,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { LifeProfile, RoutineItem, LifeCommitment, PersonalStyleState, NutritionState } from '../../types';

interface MyLifeViewProps {
  lifeProfile: LifeProfile;
  personalStyle: PersonalStyleState;
  nutrition: NutritionState;
  onUpdateProfile: (profile: LifeProfile) => void;
  onUpdateStyle: (style: PersonalStyleState) => void;
  onUpdateNutrition: (nutrition: NutritionState) => void;
}

export const MyLifeView: React.FC<MyLifeViewProps> = ({
  lifeProfile,
  personalStyle,
  nutrition,
  onUpdateProfile,
  onUpdateStyle,
  onUpdateNutrition,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'routines' | 'commitments' | 'style' | 'nutrition'>('profile');

  // Work Schedule edits
  const [workingStart, setWorkingStart] = useState(lifeProfile.workingHoursStart);
  const [workingEnd, setWorkingEnd] = useState(lifeProfile.workingHoursEnd);
  const [commuteMinutes, setCommuteMinutes] = useState(lifeProfile.commuteTimeMinutes);
  const [bufferTime, setBufferTime] = useState(lifeProfile.preferences.bufferTimeBetweenTasksMinutes);

  // New Routine Form
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState<RoutineItem['timeOfDay']>('morning');
  const [newRoutineDuration, setNewRoutineDuration] = useState(30);
  const [newRoutineRecurrence, setNewRoutineRecurrence] = useState<RoutineItem['recurrence']>('permanent');

  // New Commitment Form
  const [newCommitTitle, setNewCommitTitle] = useState('');
  const [newCommitDay, setNewCommitDay] = useState('Monday');
  const [newCommitStart, setNewCommitStart] = useState('10:00');
  const [newCommitEnd, setNewCommitEnd] = useState('11:00');

  const handleSaveHours = () => {
    onUpdateProfile({
      ...lifeProfile,
      workingHoursStart: workingStart,
      workingHoursEnd: workingEnd,
      commuteTimeMinutes: Number(commuteMinutes),
      preferences: {
        ...lifeProfile.preferences,
        bufferTimeBetweenTasksMinutes: Number(bufferTime),
      },
    });
  };

  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineTitle.trim()) return;

    const newItem: RoutineItem = {
      id: 'r-' + Date.now(),
      title: newRoutineTitle,
      timeOfDay: newRoutineTime,
      durationMinutes: Number(newRoutineDuration),
      recurrence: newRoutineRecurrence,
      realm: 'personal',
    };

    onUpdateProfile({
      ...lifeProfile,
      routines: [...lifeProfile.routines, newItem],
    });

    setNewRoutineTitle('');
  };

  const handleDeleteRoutine = (id: string) => {
    onUpdateProfile({
      ...lifeProfile,
      routines: lifeProfile.routines.filter((r) => r.id !== id),
    });
  };

  const handleAddCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommitTitle.trim()) return;

    const newCommit: LifeCommitment = {
      id: 'c-' + Date.now(),
      title: newCommitTitle,
      dayOfWeek: newCommitDay,
      startTime: newCommitStart,
      endTime: newCommitEnd,
      recurrence: 'recurring',
      realm: 'personal',
    };

    onUpdateProfile({
      ...lifeProfile,
      commitments: [...lifeProfile.commitments, newCommit],
    });

    setNewCommitTitle('');
  };

  const handleDeleteCommitment = (id: string) => {
    onUpdateProfile({
      ...lifeProfile,
      commitments: lifeProfile.commitments.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E8E2D5] pb-5">
        <h1 className="font-serif text-3xl font-normal text-[#2C2825]">
          My Life & Permanent Foundations
        </h1>
        <p className="text-xs text-[#7A7167] mt-1 font-light">
          Entered once, permanently respected. The intelligent planning engine consults this baseline to protect your working boundaries and rest.
        </p>

        {/* Tab switcher */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto text-xs">
          {[
            { id: 'profile', label: 'Working Baseline & Bounds', icon: Clock },
            { id: 'routines', label: 'Sacred Routines', icon: Sparkles },
            { id: 'commitments', label: 'Recurring Commitments', icon: Calendar },
            { id: 'style', label: 'Personal Style & Wardrobe', icon: Shirt },
            { id: 'nutrition', label: 'Nourishment & Dining', icon: Utensils },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition cursor-pointer shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#2C2825] text-[#F9F7F2] font-medium shadow-xs'
                    : 'bg-[#FFFFFF] border border-[#E3DCD1] text-[#695F54] hover:bg-[#F2ECE1]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Working Schedule & Bounds */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs">
            <h2 className="font-serif text-lg font-medium text-[#2C2825] mb-4">
              Protected Working Boundaries
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Daily Workday Start
                </label>
                <input
                  type="time"
                  value={workingStart}
                  onChange={(e) => setWorkingStart(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Daily Workday End (Strict Threshold)
                </label>
                <input
                  type="time"
                  value={workingEnd}
                  onChange={(e) => setWorkingEnd(e.target.value)}
                  className="w-full bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
                <span className="text-[10px] text-[#8C7654] mt-1 block">
                  Evenings automatically protected after this hour.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5A524A] mb-1">
                  Buffer Between Tasks (Minutes)
                </label>
                <input
                  type="number"
                  value={bufferTime}
                  onChange={(e) => setBufferTime(Number(e.target.value))}
                  className="w-full bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#F0EBE1] flex justify-end">
              <button
                onClick={handleSaveHours}
                className="px-5 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer"
              >
                Save Schedule Baseline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sacred Routines */}
      {activeTab === 'routines' && (
        <div className="space-y-6">
          {/* Add routine form */}
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-5 shadow-xs">
            <h3 className="font-serif text-base font-medium text-[#2C2825] mb-3">
              Add Routine
            </h3>
            <form onSubmit={handleAddRoutine} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newRoutineTitle}
                onChange={(e) => setNewRoutineTitle(e.target.value)}
                placeholder="e.g. Sensory tea ritual, morning breathwork"
                className="flex-1 bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
              />
              <select
                value={newRoutineTime}
                onChange={(e) => setNewRoutineTime(e.target.value as any)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
              <select
                value={newRoutineRecurrence}
                onChange={(e) => setNewRoutineRecurrence(e.target.value as any)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
              >
                <option value="permanent">Permanent</option>
                <option value="recurring">Recurring</option>
                <option value="temporary">Temporary</option>
              </select>
              <input
                type="number"
                value={newRoutineDuration}
                onChange={(e) => setNewRoutineDuration(Number(e.target.value))}
                className="w-20 bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
                placeholder="Mins"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer"
              >
                Add Routine
              </button>
            </form>
          </div>

          {/* List of routines */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['morning', 'afternoon', 'evening'].map((timeSlot) => {
              const list = lifeProfile.routines.filter((r) => r.timeOfDay === timeSlot);
              return (
                <div
                  key={timeSlot}
                  className="rounded-2xl border border-[#E8E1D4] bg-[#FAF8F4] p-5 shadow-xs"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDE7DC] mb-3">
                    <span className="font-serif text-base capitalize text-[#2C2825] font-medium">
                      {timeSlot} Rituals
                    </span>
                    <span className="text-xs text-[#8C7654] font-medium">
                      {list.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {list.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E2D8C7] flex items-center justify-between shadow-xs"
                      >
                        <div>
                          <div className="text-xs font-medium text-[#2C2825]">
                            {item.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-[#8C8377]">
                            <span>{item.durationMinutes} min</span>
                            <span>•</span>
                            <span className="capitalize">{item.recurrence}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteRoutine(item.id)}
                          className="text-[#9E958B] hover:text-[#733] p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Commitments */}
      {activeTab === 'commitments' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-5 shadow-xs">
            <h3 className="font-serif text-base font-medium text-[#2C2825] mb-3">
              Add Recurring Weekly Commitment
            </h3>
            <form onSubmit={handleAddCommitment} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newCommitTitle}
                onChange={(e) => setNewCommitTitle(e.target.value)}
                placeholder="e.g. Pilates reformer, Studio review"
                className="flex-1 bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3.5 py-2 text-xs text-[#2C2825]"
              />
              <select
                value={newCommitDay}
                onChange={(e) => setNewCommitDay(e.target.value)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
                  (d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  )
                )}
              </select>
              <input
                type="time"
                value={newCommitStart}
                onChange={(e) => setNewCommitStart(e.target.value)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
              />
              <input
                type="time"
                value={newCommitEnd}
                onChange={(e) => setNewCommitEnd(e.target.value)}
                className="bg-[#FAF8F4] border border-[#D5CCBE] rounded-xl px-3 py-2 text-xs text-[#2C2825]"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#F9F7F2] text-xs font-medium hover:bg-[#453E38] transition cursor-pointer"
              >
                Save
              </button>
            </form>
          </div>

          <div className="space-y-2.5">
            {lifeProfile.commitments.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E8E1D4] flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
                  <div>
                    <span className="text-xs font-semibold text-[#2C2825]">{c.title}</span>
                    <span className="text-xs text-[#8C8377] block">
                      Every {c.dayOfWeek} from {c.startTime} to {c.endTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[#F2ECE1] text-[#60564C]">
                    {c.recurrence}
                  </span>
                  <button
                    onClick={() => handleDeleteCommitment(c.id)}
                    className="text-[#9E958B] hover:text-[#733] p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Personal Style Architecture */}
      {activeTab === 'style' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                  Personal Style & Capsule Architecture
                </h3>
                <p className="text-xs text-[#7A7167]">
                  Seasonal color harmony and silhouette alignment.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#F2ECE1] text-[#60564C] font-medium">
                Module Ready
              </span>
            </div>

            {/* Color Palette */}
            <div>
              <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block mb-2">
                Seasonal Color Palette
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {personalStyle.colorPalette.map((col, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-[#E2DBD0] bg-[#FAF8F4] flex items-center gap-3"
                  >
                    <div
                      style={{ backgroundColor: col.hex }}
                      className="w-8 h-8 rounded-lg border border-[#D5CCBF] shadow-xs shrink-0"
                    />
                    <div>
                      <span className="text-xs font-semibold text-[#2C2825] block">
                        {col.name}
                      </span>
                      <span className="text-[10px] text-[#8C8377]">{col.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Silhouettes */}
            <div className="mt-6">
              <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block mb-2">
                Signature Silhouettes
              </label>
              <div className="flex flex-wrap gap-2">
                {personalStyle.preferredSilhouettes.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1.5 rounded-xl bg-[#F4EFE6] border border-[#DDD5C7] text-[#3E3832]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Wardrobe Notes */}
            <div className="mt-6">
              <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block mb-1">
                Measurements & Tailoring Notes
              </label>
              <p className="text-xs text-[#554C42] bg-[#FAF8F4] p-3 rounded-xl border border-[#E2DBD0]">
                {personalStyle.measurementsNotes}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Nutrition & Nourishment */}
      {activeTab === 'nutrition' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#E8E1D4] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#2C2825]">
                  Nourishment & Dining Philosophy
                </h3>
                <p className="text-xs text-[#7A7167]">
                  Harmonious meals honoring available preparation time.
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#F2ECE1] text-[#60564C] font-medium">
                Module Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E2DBD0]">
                <span className="text-xs font-semibold text-[#8C7654] uppercase tracking-wider block mb-1">
                  Dietary Ethos
                </span>
                <p className="text-xs text-[#3E3832] leading-relaxed">
                  {nutrition.dietaryNotes}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F4] border border-[#E2DBD0]">
                <span className="text-xs font-semibold text-[#8C7654] uppercase tracking-wider block mb-1">
                  Partner Shared Dinners
                </span>
                <p className="text-xs text-[#3E3832]">
                  Evenings: {nutrition.partnerSharedDinners.join(', ')}
                </p>
                <span className="text-[11px] text-[#8C8377] block mt-1">
                  Weekday cooking window: {nutrition.cookingTimeAvailableWeekdays} min
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
