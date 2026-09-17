import React, { useState } from 'react';
import { X, Check, Sun, Moon, Zap, Smile, Heart, Clock } from 'lucide-react';
import { DailyCheckIn, EnergyLevel, MoodState, PhysicalComfort, Language } from '../types';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  existingCheckIn?: DailyCheckIn;
  lang?: Language;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  onSaveCheckIn,
  existingCheckIn,
  lang = 'nl',
}) => {
  if (!isOpen) return null;

  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];

  const [energy, setEnergy] = useState<EnergyLevel>(existingCheckIn?.energy || 'normal');
  const [mood, setMood] = useState<MoodState | undefined>(existingCheckIn?.mood || 'calm');
  const [wakeTime, setWakeTime] = useState<string>(existingCheckIn?.wakeTime || '07:30');
  const [sleepTime, setSleepTime] = useState<string>(existingCheckIn?.sleepTime || '23:00');
  const [generalWellbeing, setGeneralWellbeing] = useState<
    'great' | 'good' | 'neutral' | 'tired' | 'strained'
  >(existingCheckIn?.generalWellbeing || 'good');
  const [physicalDiscomfort, setPhysicalDiscomfort] = useState<PhysicalComfort | undefined>(
    existingCheckIn?.physicalDiscomfort || 'comfortable'
  );
  const [notes, setNotes] = useState<string>(existingCheckIn?.notes || '');

  const handleSave = () => {
    const checkIn: DailyCheckIn = {
      id: existingCheckIn?.id || `dci-${todayStr}`,
      date: todayStr,
      energy,
      mood,
      wakeTime,
      sleepTime,
      generalWellbeing,
      physicalDiscomfort,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString(),
    };
    onSaveCheckIn(checkIn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FAF8F3] border border-[#D5CCBE] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-xl text-[#2C2825] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE2D5]">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7E694E] tracking-widest">
              {isNl ? 'DAGELIJKSE REFLECTIE' : 'DAILY REFLECTION'}
            </span>
            <h3 className="font-serif text-xl text-[#2C2825]">
              {isNl ? 'Check-in voor vandaag' : "Today's Check-in"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EDE6D8] text-[#8C8377] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#7A7167]">
          {isNl
            ? 'Breng in 30 seconden je werkelijke energie en slaap in kaart. Alchemy gebruikt dit om verwachtingen zacht aan te passen.'
            : 'Capture your real energy and rest in 30 seconds. Alchemy uses this to gently tailor suggestions.'}
        </p>

        {/* Dynamic sleep and wake times */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E5DFD3]">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#8C8377] flex items-center gap-1">
              <Moon className="w-3 h-3 text-[#7E694E]" />
              <span>{isNl ? 'Slaaptijd gisteravond' : 'Sleep time'}</span>
            </label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full mt-1 p-1.5 rounded-lg border border-[#D5CCBE] text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#8C8377] flex items-center gap-1">
              <Sun className="w-3 h-3 text-[#7E694E]" />
              <span>{isNl ? 'Waaktijd vanmorgen' : 'Wake time'}</span>
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full mt-1 p-1.5 rounded-lg border border-[#D5CCBE] text-xs font-mono"
            />
          </div>
        </div>

        {/* Energy selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#6D6357]">
            {isNl ? 'Fysieke & mentale energie' : 'Energy Level'}
          </label>
          <div className="grid grid-cols-5 gap-1.5 text-xs">
            {(
              [
                { id: 'very_low', nl: 'Zeer laag', en: 'Very Low' },
                { id: 'low', nl: 'Laag', en: 'Low' },
                { id: 'normal', nl: 'Normaal', en: 'Normal' },
                { id: 'good', nl: 'Goed', en: 'Good' },
                { id: 'high', nl: 'Hoog', en: 'High' },
              ] as const
            ).map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setEnergy(e.id)}
                className={`py-2 px-1 text-center rounded-xl border text-[11px] transition cursor-pointer ${
                  energy === e.id
                    ? 'border-[#7E694E] bg-[#F7F2E9] text-[#2C2825] font-semibold shadow-xs'
                    : 'border-[#E0D7C9] bg-white text-[#7A7167] hover:border-[#B5A897]'
                }`}
              >
                {isNl ? e.nl : e.en}
              </button>
            ))}
          </div>
        </div>

        {/* Mood selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#6D6357]">
            {isNl ? 'Gemoedstoestand' : 'Mood State'}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(
              [
                { id: 'calm', nl: 'Rustig & gegrond', en: 'Calm' },
                { id: 'focused', nl: 'Gefocust', en: 'Focused' },
                { id: 'reflective', nl: 'Reflectief', en: 'Reflective' },
                { id: 'sensitive', nl: 'Gevoelig / Zacht', en: 'Sensitive' },
                { id: 'expansive', nl: 'Expansief', en: 'Expansive' },
                { id: 'overstimulated', nl: 'Overprikkeld', en: 'Overstimulated' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id)}
                className={`py-2 px-2 text-center rounded-xl border text-[11px] transition cursor-pointer truncate ${
                  mood === m.id
                    ? 'border-[#7E694E] bg-[#F7F2E9] text-[#2C2825] font-semibold'
                    : 'border-[#E0D7C9] bg-white text-[#7A7167]'
                }`}
              >
                {isNl ? m.nl : m.en}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wider font-semibold text-[#6D6357]">
            {isNl ? 'Korte notitie (optioneel)' : 'Note (optional)'}
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              isNl
                ? 'Bijv. Goed geslapen, lichte stijfheid in onderrug'
                : 'e.g. Well rested, slight lower back tightness'
            }
            className="w-full px-3.5 py-2 rounded-xl border border-[#D5CCBE] bg-white text-xs text-[#2C2825]"
          />
        </div>

        {/* Footer actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#EAE2D5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
          >
            {isNl ? 'Annuleren' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] hover:bg-[#433D38] text-xs font-medium transition cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>{isNl ? 'Opslaan' : 'Save Check-in'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
