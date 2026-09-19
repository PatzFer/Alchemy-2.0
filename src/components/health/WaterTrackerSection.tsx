import React, { useState } from 'react';
import { Droplet, Plus, Minus, RotateCcw, Check, Sparkles, TrendingUp, Info } from 'lucide-react';
import { WaterTrackerState, WaterLogEntry } from '../../types';
import { BOTTLE_VOLUME_ML, calculateWaterStats, getTodayWaterLog } from '../../lib/healthUtils';

interface WaterTrackerSectionProps {
  waterTracker?: WaterTrackerState;
  onUpdateWaterTracker: (updater: (prev?: WaterTrackerState) => WaterTrackerState) => void;
  lang?: 'nl' | 'en';
}

export const WaterTrackerSection: React.FC<WaterTrackerSectionProps> = ({
  waterTracker,
  onUpdateWaterTracker,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const todayStr = new Date().toISOString().split('T')[0];
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const stats = calculateWaterStats(waterTracker);
  const targetBottles = stats.targetBottles;
  const currentBottles = stats.todayBottles;

  const handleAddBottle = () => {
    onUpdateWaterTracker((prev) => {
      const history = prev?.history ? [...prev.history] : [];
      const idx = history.findIndex((h) => h.date === todayStr);

      if (idx >= 0) {
        const updatedCount = history[idx].bottles + 1;
        history[idx] = {
          ...history[idx],
          bottles: updatedCount,
          volumeMl: updatedCount * BOTTLE_VOLUME_ML,
        };
      } else {
        history.push({
          date: todayStr,
          bottles: 1,
          volumeMl: BOTTLE_VOLUME_ML,
          targetBottles: prev?.defaultTargetBottles || 4,
        });
      }

      return {
        bottleVolumeMl: BOTTLE_VOLUME_ML,
        defaultTargetBottles: prev?.defaultTargetBottles || 4,
        history,
      };
    });
  };

  const handleRemoveBottle = () => {
    onUpdateWaterTracker((prev) => {
      const history = prev?.history ? [...prev.history] : [];
      const idx = history.findIndex((h) => h.date === todayStr);

      if (idx >= 0 && history[idx].bottles > 0) {
        const updatedCount = history[idx].bottles - 1;
        history[idx] = {
          ...history[idx],
          bottles: updatedCount,
          volumeMl: updatedCount * BOTTLE_VOLUME_ML,
        };
      }

      return {
        bottleVolumeMl: BOTTLE_VOLUME_ML,
        defaultTargetBottles: prev?.defaultTargetBottles || 4,
        history,
      };
    });
  };

  const handleSetTarget = (newTarget: number) => {
    onUpdateWaterTracker((prev) => ({
      bottleVolumeMl: BOTTLE_VOLUME_ML,
      defaultTargetBottles: newTarget,
      history: prev?.history || [],
    }));
    setIsEditingTarget(false);
  };

  // Build bottle visualization (at least max of targetBottles and currentBottles)
  const displaySlots = Math.max(targetBottles, currentBottles);
  const bottleSlots = Array.from({ length: displaySlots }, (_, i) => i < currentBottles);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E8E2D6] pb-4">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7654] font-medium font-serif">
            {isNl ? 'Hydratatie & Rust' : 'Hydration & Rhythm'}
          </span>
          <h2 className="text-xl sm:text-2xl font-serif text-[#2C2825] mt-1">
            {isNl ? 'Water Tracker (750 ml flessen)' : 'Water Tracker (750 ml bottles)'}
          </h2>
          <p className="text-xs text-[#7A7167] mt-0.5 font-light">
            {isNl
              ? 'Eén tik per 750 ml fles. Rustig, overzichtelijk en zonder schuldgevoel.'
              : 'One tap per 750 ml bottle. Calm, factual, and pressure-free.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEditingTarget(!isEditingTarget)}
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-full border border-[#DCD3C4] bg-[#FFFFFF] text-[#5C5245] hover:border-[#8C7654] transition cursor-pointer"
        >
          {isNl ? `Doel: ${targetBottles} flessen (${stats.targetVolumeL}L)` : `Goal: ${targetBottles} bottles (${stats.targetVolumeL}L)`}
        </button>
      </div>

      {/* Target selector popup/collapse */}
      {isEditingTarget && (
        <div className="p-4 rounded-2xl border border-[#DCD3C4] bg-[#FAF8F3] space-y-3 animate-fade-in">
          <div className="text-xs font-medium text-[#2C2825]">
            {isNl ? 'Kies je gewenste dagelijkse waterrichtlijn:' : 'Select preferred daily water guide:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {[2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleSetTarget(num)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  targetBottles === num
                    ? 'bg-[#2C2825] text-[#FAF8F3] border-[#2C2825]'
                    : 'bg-[#FFFFFF] text-[#6A6054] border-[#DED6C7] hover:bg-[#F2ECE1]'
                }`}
              >
                {num} {isNl ? 'flessen' : 'bottles'} ({((num * BOTTLE_VOLUME_ML) / 1000).toFixed(2)} L)
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#8C8377] italic">
            {isNl
              ? 'Je zit nergens aan vast; dit is slechts een zachte referentie voor je eigen tempo.'
              : 'This is a gentle personal benchmark, never an obligation.'}
          </p>
        </div>
      )}

      {/* Main Interactive Water Card */}
      <div className="rounded-3xl border border-[#DCD3C4] bg-[#FAF8F3] p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Visual bottles */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-[#8C7654] uppercase tracking-wider">
              {isNl ? 'Vandaag geregistreerd' : 'Recorded Today'}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {bottleSlots.map((isFilled, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    isFilled
                      ? 'bg-[#EBF5FB] border-[#A9CCE3] text-[#2980B9] shadow-xs scale-102'
                      : 'bg-[#FFFFFF] border-[#E3D9C9] text-[#BDB2A3]'
                  }`}
                  title={`${idx + 1}e fles (750 ml)`}
                >
                  <Droplet className={`w-5 h-5 ${isFilled ? 'fill-[#2980B9] text-[#2980B9]' : 'text-[#C5BBAA]'}`} />
                  <span className="text-[10px] font-mono mt-0.5 font-medium">
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-sm font-serif text-[#2C2825] pt-1">
              <span className="text-2xl font-normal text-[#1A5276] mr-1">{stats.todayVolumeL} L</span>
              <span className="text-xs text-[#7A7167]">
                ({currentBottles} {currentBottles === 1 ? (isNl ? 'fles' : 'bottle') : (isNl ? 'flessen' : 'bottles')} van 750 ml)
              </span>
            </div>
          </div>

          {/* Action Buttons (Large touch targets for mobile) */}
          <div className="flex sm:flex-col items-center gap-3">
            <button
              type="button"
              id="btn-add-water-bottle"
              onClick={handleAddBottle}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-2xl bg-[#1B4F72] text-[#FFFFFF] text-sm font-medium hover:bg-[#154360] transition shadow-xs cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{isNl ? '+ 1 Fles (750 ml)' : '+ 1 Bottle (750 ml)'}</span>
            </button>

            {currentBottles > 0 && (
              <button
                type="button"
                onClick={handleRemoveBottle}
                className="flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-2xl border border-[#DCD3C4] bg-[#FFFFFF] text-xs text-[#7A7167] hover:text-[#2C2825] hover:border-[#8C7654] transition cursor-pointer"
                title={isNl ? 'Per ongeluk geklikt? Verwijder laatste fles' : 'Accidental tap? Remove last bottle'}
              >
                <Minus className="w-3.5 h-3.5" />
                <span>{isNl ? 'Laatste fles wissen' : 'Remove last bottle'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Empty state message if 0 */}
        {currentBottles === 0 && (
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#ECE5D8] text-xs text-[#8C8377] text-center italic">
            {isNl ? 'Je hebt vandaag nog geen water geregistreerd.' : "You haven't recorded any water today yet."}
          </div>
        )}

        {/* Weekly stats summary */}
        <div className="pt-4 border-t border-[#ECE5D8] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#EFE8DC]">
            <div className="text-[11px] text-[#8C8377]">{isNl ? 'Vandaag' : 'Today'}</div>
            <div className="text-base font-serif text-[#2C2825] mt-0.5">{stats.todayVolumeL} L</div>
            <div className="text-[10px] text-[#7A7167]">{currentBottles} / {targetBottles} {isNl ? 'flessen' : 'bottles'}</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#EFE8DC]">
            <div className="text-[11px] text-[#8C8377]">{isNl ? 'Weekgemiddelde' : 'Weekly Average'}</div>
            <div className="text-base font-serif text-[#2C2825] mt-0.5">{stats.weeklyAverageL} L / {isNl ? 'dag' : 'day'}</div>
            <div className="text-[10px] text-[#7A7167]">ca. {stats.weeklyAverageBottles} {isNl ? 'flessen / dag' : 'bottles / day'}</div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-[#FFFFFF] border border-[#EFE8DC] flex flex-col justify-center">
            <div className="text-[11px] text-[#8C8377]">{isNl ? 'Flesformaat' : 'Bottle Size'}</div>
            <div className="text-base font-serif text-[#2C2825] mt-0.5">750 ml</div>
            <div className="text-[10px] text-[#7A7167]">{isNl ? 'Ideaal voor bureau & workout' : 'Desk & movement sized'}</div>
          </div>
        </div>

        {/* 7-Day History Mini Strip */}
        <div className="space-y-2">
          <div className="text-[11px] font-medium text-[#7A7167]">
            {isNl ? 'Afgelopen 7 dagen' : 'Past 7 days'}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {stats.recentDays.map((d, i) => {
              const dateObj = new Date(d.date);
              const dayName = dateObj.toLocaleDateString(isNl ? 'nl-NL' : 'en-US', { weekday: 'narrow' });
              const isToday = d.date === todayStr;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-xl text-center border transition ${
                    isToday
                      ? 'bg-[#EBF5FB] border-[#A9CCE3]'
                      : 'bg-[#FFFFFF] border-[#EAE3D5]'
                  }`}
                >
                  <div className="text-[10px] text-[#8C8377] font-medium">{dayName}</div>
                  <div className="text-xs font-semibold text-[#2C2825] mt-1">{d.bottles}</div>
                  <div className="text-[9px] text-[#7A7167]">{d.volumeL}L</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
