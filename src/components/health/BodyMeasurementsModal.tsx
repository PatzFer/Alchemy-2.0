import React, { useState } from 'react';
import { X, Check, Calendar, Ruler, Info } from 'lucide-react';
import { BodyMeasurementEntry, ProgressLog } from '../../types';
import { BODY_MEASUREMENT_FIELDS } from '../../lib/healthUtils';

interface BodyMeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: {
    date: string;
    weightKg?: number;
    measurements: Partial<Omit<BodyMeasurementEntry, 'id' | 'date' | 'unit' | 'notes'>>;
    unit: 'cm' | 'in';
    notes?: string;
  }) => void;
  initialValues?: {
    weightKg?: number;
    measurements?: Partial<BodyMeasurementEntry>;
  };
  lang?: 'nl' | 'en';
}

export const BodyMeasurementsModal: React.FC<BodyMeasurementsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValues,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [weightKg, setWeightKg] = useState<string>(
    initialValues?.weightKg ? String(initialValues.weightKg) : ''
  );
  const [notes, setNotes] = useState<string>('');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  // Exact 11 body measurements state
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    BODY_MEASUREMENT_FIELDS.forEach((f) => {
      const existing = (initialValues?.measurements as any)?.[f.key];
      init[f.key] = existing !== undefined ? String(existing) : '';
    });
    return init;
  });

  if (!isOpen) return null;

  const handleFieldChange = (key: string, val: string) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numericMeasurements: Record<string, number> = {};
    Object.entries(values).forEach(([k, v]) => {
      const trimmed = String(v ?? '').trim();
      if (trimmed !== '') {
        const num = parseFloat(trimmed);
        if (!isNaN(num)) {
          numericMeasurements[k] = num;
        }
      }
    });

    const parsedWeight = weightKg.trim() !== '' ? parseFloat(weightKg) : undefined;

    onSave({
      date,
      weightKg: !isNaN(parsedWeight as number) ? parsedWeight : undefined,
      measurements: numericMeasurements as any,
      unit,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
              {isNl ? 'Lichaamsmetingen & Gewicht' : 'Body Measurements & Weight'}
            </span>
            <h2 className="text-xl font-serif text-[#2C2825] mt-0.5">
              {isNl ? 'Meting Invoeren' : 'Log Measurement'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#DCD3C4] bg-[#FFFFFF] flex items-center justify-center text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top metadata: Date & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#4A433A] mb-1">
                {isNl ? 'Datum van de meting' : 'Measurement date'}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCD3C4] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#4A433A] mb-1">
                {isNl ? 'Gewicht (kg)' : 'Weight (kg)'}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="bv. 61.2"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#DCD3C4] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
              />
            </div>
          </div>

          {/* Unit Note */}
          <div className="flex items-center justify-between text-xs text-[#7A7167] px-1">
            <span className="font-light">
              {isNl
                ? 'Vul de velden in die je vandaag gemeten hebt (alles is optioneel):'
                : 'Fill in whichever points you measured today (all optional):'}
            </span>
            <span className="font-mono text-[11px] font-semibold text-[#8C7654] uppercase bg-[#F2ECE1] px-2 py-0.5 rounded-md">
              Eenheid: centimeters (cm)
            </span>
          </div>

          {/* Exact 11 Body Measurements Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-serif font-medium text-[#2C2825] uppercase tracking-wider flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>{isNl ? 'De 11 Lichaamsmetingen' : 'The 11 Body Points'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {BODY_MEASUREMENT_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="p-3 rounded-2xl border border-[#ECE5D8] bg-[#FFFFFF] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[#2C2825]">
                      {isNl ? field.labelNl : field.labelEn}
                    </label>
                    <span className="text-[10px] text-[#8C8377] font-light">
                      {isNl ? field.labelEn : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="—"
                      value={values[field.key] || ''}
                      onChange={(e) => handleFieldChange(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#FAF8F3] border border-[#E0D7C7] text-xs text-[#2C2825] font-mono focus:outline-none focus:border-[#8C7654]"
                    />
                    <span className="text-xs text-[#7A7167] font-mono">cm</span>
                  </div>

                  <div className="text-[10px] text-[#8C8377] font-light truncate">
                    {field.hintNl}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-medium text-[#4A433A] mb-1">
              {isNl ? 'Optionele notitie (bv. nuchter, ochtend)' : 'Optional notes (e.g. morning fasted)'}
            </label>
            <input
              type="text"
              placeholder={isNl ? 'bv. Rustige ochtend, nuchter gemeten' : 'e.g. Calm morning'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#DCD3C4] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#E8E2D6] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs text-[#6A6054] hover:bg-[#F2ECE1] transition cursor-pointer"
            >
              {isNl ? 'Annuleren' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
            >
              {isNl ? 'Meting Opslaan' : 'Save Measurements'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
