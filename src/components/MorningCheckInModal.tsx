import React, { useState } from 'react';
import { Sparkles, Moon, Sun, Clock, Check, X } from 'lucide-react';
import { DailyCheckIn, EnergyLevel, MoodState, Language } from '../types';
import { calculateSleepDurationMinutes, formatSleepDuration } from '../lib/healthUtils';

interface MorningCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  existingCheckIn?: DailyCheckIn;
  lang?: Language;
}

export const MorningCheckInModal: React.FC<MorningCheckInModalProps> = ({
  isOpen,
  onClose,
  onSaveCheckIn,
  existingCheckIn,
  lang = 'nl',
}) => {
  if (!isOpen) return null;

  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];

  const [sleepTime, setSleepTime] = useState<string>(existingCheckIn?.sleepTime || '23:00');
  const [wakeTime, setWakeTime] = useState<string>(existingCheckIn?.wakeTime || '07:30');
  const [energy, setEnergy] = useState<EnergyLevel>(existingCheckIn?.energy || 'good');
  const [mood, setMood] = useState<MoodState | undefined>(existingCheckIn?.mood || 'calm');
  const [notes, setNotes] = useState<string>(existingCheckIn?.notes || '');

  const durationMins = calculateSleepDurationMinutes(sleepTime, wakeTime);
  const formattedDuration = formatSleepDuration(durationMins);

  const handleSave = () => {
    const checkIn: DailyCheckIn = {
      id: existingCheckIn?.id || `dci-${todayStr}`,
      date: todayStr,
      energy,
      mood,
      wakeTime,
      sleepTime,
      generalWellbeing: energy === 'high' || energy === 'good' ? 'good' : energy === 'normal' ? 'neutral' : 'tired',
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };

    onSaveCheckIn(checkIn);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="morning-checkin-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FCFAF6] border border-[#DCD3C4] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl text-[#2C2825] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAE3D5] pb-3.5">
          <div className="space-y-1 pr-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C7654] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>Ochtend Check-In</span>
            </div>
            <h2 id="morning-checkin-title" className="font-serif text-2xl font-normal text-[#2C2825]">
              Goedemorgen Patz ✨
            </h2>
            <p className="text-xs text-[#7A7167] font-light leading-relaxed">
              Hoe is je nacht geweest? Korte check-in voor je persoonlijke ritme.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="p-1.5 rounded-full hover:bg-[#EAE3D5] text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sleep & Wake Times with Calculated Duration */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] space-y-3 shadow-2xs">
          <div className="text-xs font-serif font-medium text-[#2C2825] flex items-center justify-between">
            <span>Slaap & Nachtrust</span>
            {formattedDuration && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[#FAF6EE] text-[#8C7654] border border-[#E6DBCE] font-semibold">
                ⏱ {formattedDuration} slaap
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A7167] flex items-center gap-1 mb-1">
                <Moon className="w-3 h-3 text-[#8C7654]" />
                <span>Naar bed</span>
              </label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full p-2 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs font-mono text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold text-[#7A7167] flex items-center gap-1 mb-1">
                <Sun className="w-3 h-3 text-[#8C7654]" />
                <span>Wakker geworden</span>
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full p-2 rounded-xl border border-[#D5CCBE] bg-[#FAF8F4] text-xs font-mono text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
              />
            </div>
          </div>
        </div>

        {/* Energy Level Selector */}
        <div className="space-y-2">
          <label className="text-xs font-serif font-medium text-[#2C2825] block">
            Hoe voelt je energie vanmorgen?
          </label>
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            {[
              { id: 'very_low', label: '😴 Zeer laag' },
              { id: 'low', label: '🌿 Laag' },
              { id: 'normal', label: '🙂 Normaal' },
              { id: 'good', label: '✨ Goed' },
              { id: 'high', label: '⚡ Hoog' },
            ].map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEnergy(e.id as EnergyLevel)}
                className={`py-2 px-1 text-center rounded-xl border text-[11px] transition cursor-pointer ${
                  energy === e.id
                    ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] font-medium shadow-xs'
                    : 'bg-[#FFFFFF] text-[#63594C] border-[#E8E2D5] hover:border-[#8C7654]'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selector */}
        <div className="space-y-2">
          <label className="text-xs font-serif font-medium text-[#2C2825] block">
            Gemoedstoestand / Stemming
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {[
              { id: 'calm', label: 'Rustig' },
              { id: 'focused', label: 'Gefocust' },
              { id: 'reflective', label: 'Reflectief' },
              { id: 'sensitive', label: 'Gevoelig / Zacht' },
              { id: 'expansive', label: 'Expansief' },
              { id: 'overstimulated', label: 'Overprikkeld' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id as MoodState)}
                className={`py-2 px-2 text-center rounded-xl border text-[11px] transition cursor-pointer truncate ${
                  mood === m.id
                    ? 'bg-[#8C7654] text-[#FAF8F5] border-[#8C7654] font-medium shadow-xs'
                    : 'bg-[#FFFFFF] text-[#63594C] border-[#E8E2D5] hover:border-[#8C7654]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1">
          <label className="text-xs text-[#6D6357] font-medium block">
            Korte notitie <span className="font-light text-[#8C8275]">(optioneel)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Bijv. Uitgerust ontwaakt, dromerig gevoel..."
            className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] bg-[#FFFFFF] text-xs text-[#2C2825] focus:outline-hidden focus:border-[#8C7654]"
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#EAE3D5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
          >
            Overslaan
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F5] hover:bg-[#433D38] text-xs font-medium transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-[#E6D7BD]" />
            <span>Opslaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
