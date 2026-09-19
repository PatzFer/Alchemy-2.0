import React, { useState } from 'react';
import { Sparkles, Info, RefreshCw, CheckCircle2, Shield, Shirt } from 'lucide-react';
import { BodyMeasurementEntry, PersonalStyleState } from '../../types';
import { calculateEstimatedBodyShape } from '../../lib/healthUtils';

interface BodyShapeCardProps {
  latestMeasurement?: BodyMeasurementEntry;
  personalStyle?: PersonalStyleState;
  onUpdateStyle?: (updater: (prev: PersonalStyleState) => PersonalStyleState) => void;
  lang?: 'nl' | 'en';
}

export const BodyShapeCard: React.FC<BodyShapeCardProps> = ({
  latestMeasurement,
  personalStyle,
  onUpdateStyle,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  const shapeResult = calculateEstimatedBodyShape(latestMeasurement);
  const savedShape = personalStyle?.bodyShape;

  const hasDiff =
    shapeResult.isReliable &&
    shapeResult.shapeCode &&
    savedShape &&
    shapeResult.shapeCode !== savedShape &&
    !dismissedNotice &&
    !justApplied;

  const handleRecalculateStyleProfile = () => {
    if (!onUpdateStyle || !shapeResult.shapeCode) return;
    onUpdateStyle((prev) => ({
      ...prev,
      bodyShape: shapeResult.shapeCode as any,
      notes: `${prev.notes ? prev.notes + ' • ' : ''}Lichaamsvorm automatisch bijgewerkt op basis van actuele meting (${new Date().toLocaleDateString('nl-NL')})`,
    }));
    setJustApplied(true);
  };

  const handleKeepCurrent = () => {
    setDismissedNotice(true);
  };

  return (
    <div className="rounded-3xl border border-[#DCD3C4] bg-[#FAF8F3] p-6 sm:p-7 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#8C7654] font-medium">
              {isNl ? 'Metingen & Proporties' : 'Measurements & Proportions'}
            </span>
            <span className="w-1 h-1 rounded-full bg-[#C5A880]" />
            <span className="text-[10px] text-[#8C8377] font-light">
              {isNl ? 'Styling Inzicht' : 'Styling Insight'}
            </span>
          </div>
          <h3 className="text-lg font-serif text-[#2C2825] mt-1">
            {isNl ? 'Berekende Lichaamsvorm' : 'Calculated Body Shape'}
          </h3>
          <p className="text-xs text-[#7A7167] mt-0.5 font-light max-w-xl">
            {isNl
              ? 'Wiskundige verhouding tussen schouders, borst, taille en heupen voor kledingproporties.'
              : 'Mathematical ratio between shoulders, chest, waist, and hips for silhouette harmony.'}
          </p>
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DCD3C4] text-xs text-[#2C2825] font-serif font-medium">
            {shapeResult.estimatedShapeLabel}
          </div>
        </div>
      </div>

      {/* Ratios and description */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#ECE5D8] space-y-1">
          <div className="text-[11px] text-[#8C8377]">{isNl ? 'Taille-Heup Ratio' : 'Waist-to-Hip Ratio'}</div>
          <div className="text-base font-mono font-medium text-[#2C2825]">
            {shapeResult.ratios.waistToHip ? shapeResult.ratios.waistToHip.toFixed(2) : '—'}
          </div>
          <div className="text-[10px] text-[#7A7167]">
            {isNl ? 'Taille t.o.v. bekkenlijn' : 'Waist relative to hip line'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#ECE5D8] space-y-1">
          <div className="text-[11px] text-[#8C8377]">{isNl ? 'Schouder-Heup Ratio' : 'Shoulder-to-Hip Ratio'}</div>
          <div className="text-base font-mono font-medium text-[#2C2825]">
            {shapeResult.ratios.shoulderToHip ? shapeResult.ratios.shoulderToHip.toFixed(2) : '—'}
          </div>
          <div className="text-[10px] text-[#7A7167]">
            {isNl ? 'Bovenlichaam balans' : 'Upper torso symmetry'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#ECE5D8] space-y-1">
          <div className="text-[11px] text-[#8C8377]">{isNl ? 'Opgeslagen Styling Profiel' : 'Saved Styling Profile'}</div>
          <div className="text-base font-serif font-medium text-[#8C7654] capitalize">
            {savedShape ? savedShape.replace('_', ' ') : isNl ? 'Nog niet ingesteld' : 'Not set'}
          </div>
          <div className="text-[10px] text-[#7A7167]">
            {isNl ? 'In Privé → Styling' : 'In Private → Styling'}
          </div>
        </div>
      </div>

      <p className="text-xs text-[#5C5245] bg-[#FFFFFF] p-3 rounded-xl border border-[#ECE5D8] leading-relaxed">
        {shapeResult.description}
      </p>

      {/* Explicit Non-Medical Disclaimer */}
      <div className="flex items-start gap-2.5 text-[11px] text-[#8C8377] font-light">
        <Info className="w-3.5 h-3.5 text-[#8C7654] shrink-0 mt-0.5" />
        <span>{shapeResult.disclaimer}</span>
      </div>

      {/* Gentle notice if measurements differ from saved Personal Styling profile */}
      {hasDiff && (
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#D5CCBE] space-y-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <Shirt className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#2C2825]">
                {isNl ? 'Wijziging in verhoudingen opgemerkt' : 'Change in proportions observed'}
              </div>
              <p className="text-xs text-[#6A6054] leading-relaxed">
                {isNl
                  ? 'Ik zie dat je huidige metingen niet meer volledig overeenkomen met je opgeslagen lichaamsvormprofiel. Wil je je stylingprofiel opnieuw laten berekenen?'
                  : 'I notice your recent measurements no longer fully match your saved style body shape. Would you like to recalculate your personal styling profile?'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleKeepCurrent}
              className="px-3.5 py-1.5 rounded-xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs text-[#7A7167] hover:text-[#2C2825] transition cursor-pointer"
            >
              {isNl ? 'Behouden' : 'Keep current'}
            </button>
            <button
              type="button"
              onClick={handleRecalculateStyleProfile}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{isNl ? 'Opnieuw berekenen' : 'Recalculate profile'}</span>
            </button>
          </div>
        </div>
      )}

      {justApplied && (
        <div className="p-3 rounded-xl bg-[#F0EBE1] border border-[#DED6C7] flex items-center gap-2 text-xs text-[#4A433A]">
          <CheckCircle2 className="w-4 h-4 text-[#8C7654]" />
          <span>
            {isNl
              ? 'Je stylingprofiel is bijgewerkt met je nieuwste berekende lichaamsvorm.'
              : 'Your style profile has been updated with your latest calculated body shape.'}
          </span>
        </div>
      )}
    </div>
  );
};
