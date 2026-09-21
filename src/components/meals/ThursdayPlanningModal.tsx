import React, { useState } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  Users,
  User,
  Utensils,
  Clock,
  Briefcase,
  Coffee,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  DiningParticipantChoice,
  PlannedMealDay,
  CalendarEvent,
  KitchenInventoryItem,
  MealFeedbackEntry,
  PriveWeeklyMenuPlan as WeeklyMenuPlan,
} from '../../types';
import { generateWeeklyPlan, generateShoppingListFromPlan } from '../../lib/mealPlanningData';

interface ThursdayPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (newPlan: WeeklyMenuPlan) => void;
  calendarEvents?: CalendarEvent[];
  inventory?: KitchenInventoryItem[];
  feedbackHistory?: MealFeedbackEntry[];
}

export const ThursdayPlanningModal: React.FC<ThursdayPlanningModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
  calendarEvents = [],
  inventory = [],
  feedbackHistory = [],
}) => {
  if (!isOpen) return null;

  // Calculate dates for next week (starting next Monday)
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 4 = Thu
  // Days until next Monday:
  const daysUntilNextMonday = ((8 - currentDayOfWeek) % 7) || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilNextMonday);

  const dayNames: { id: PlannedMealDay['dayOfWeek']; label: string; isWorkday: boolean }[] = [
    { id: 'monday', label: 'Maandag', isWorkday: false },
    { id: 'tuesday', label: 'Dinsdag', isWorkday: true },
    { id: 'wednesday', label: 'Woensdag', isWorkday: true },
    { id: 'thursday', label: 'Donderdag', isWorkday: false },
    { id: 'friday', label: 'Vrijdag', isWorkday: true },
    { id: 'saturday', label: 'Zaterdag', isWorkday: false },
    { id: 'sunday', label: 'Zondag', isWorkday: false },
  ];

  // Initialize initial state for the 7 days
  const [dayConfigs, setDayConfigs] = useState<
    {
      date: string;
      dayOfWeek: PlannedMealDay['dayOfWeek'];
      label: string;
      diningChoice: DiningParticipantChoice;
      isWorkday: boolean;
    }[]
  >(() => {
    return dayNames.map((d, index) => {
      const dayDate = new Date(nextMonday);
      dayDate.setDate(nextMonday.getDate() + index);
      const dateStr = dayDate.toISOString().split('T')[0];
      // Default: weekend with Jeroen (couple), weekdays 1 or 2
      const defaultChoice: DiningParticipantChoice = index >= 4 ? 'couple' : 'solo';
      return {
        date: dateStr,
        dayOfWeek: d.id,
        label: d.label,
        diningChoice: defaultChoice,
        isWorkday: d.isWorkday,
      };
    });
  });

  const handleChoiceChange = (index: number, choice: DiningParticipantChoice) => {
    setDayConfigs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], diningChoice: choice };
      return next;
    });
  };

  const handleGenerate = () => {
    const weekStartDate = dayConfigs[0]?.date || nextMonday.toISOString().split('T')[0];
    const newPlan = generateWeeklyPlan(
      weekStartDate,
      dayConfigs.map((c) => ({
        date: c.date,
        dayOfWeek: c.dayOfWeek,
        diningChoice: c.diningChoice,
      })),
      calendarEvents,
      inventory,
      feedbackHistory
    );

    onPlanGenerated(newPlan);
    onClose();
  };

  const weekStartStr = dayConfigs[0]?.date
    ? new Date(dayConfigs[0].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '';
  const weekEndStr = dayConfigs[6]?.date
    ? new Date(dayConfigs[6].date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : '';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="planning-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FCFAF6] rounded-3xl border border-[#DCD3C4] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with authoritative prompt */}
        <div className="p-5 sm:p-6 border-b border-[#EAE3D5] bg-[#F7F3EA] flex items-start justify-between gap-4">
          <div className="space-y-2 pr-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-[#8C7654] font-medium">
              <Calendar className="w-3.5 h-3.5 text-[#8C7654]" />
              <span>Wekelijkse Menuplanning</span>
              <span>•</span>
              <span>Week van {weekStartStr} t/m {weekEndStr}</span>
            </div>

            {/* Authoritative Prompt from user specification */}
            <h2 id="planning-modal-title" className="font-serif text-xl sm:text-2xl font-normal text-[#2C2825] leading-snug">
              “Tijd voor je menu van volgende week. Ik heb je agenda voor volgende week bekeken. Weet je voor welke avonden je voor 1 of 2 personen kookt?”
            </h2>

            <p className="text-xs text-[#7A7167] font-light leading-relaxed">
              Deze keuze geldt uitsluitend voor deze specifieke week. Jeroen eet niet standaard elke dag mee.
              Volgende donderdag vraagt Alchemy opnieuw.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="p-2 rounded-full text-[#7A7167] hover:bg-[#EAE3D5] hover:text-[#2C2825] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Day Configuration */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-[#2C2825]">
          {/* Subtle Philosophy Callout */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FAF6EE] border border-[#E9E1D2] text-xs">
            <ShieldCheck className="w-4 h-4 text-[#8C7654] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[#5F5547] font-light leading-relaxed">
              <strong className="font-medium text-[#2C2825]">Patz Culinaire Bron:</strong> Prioriteit voor 🇵🇹 Portugees, 🇧🇪 Belgisch en 🇮🇹 Italiaans met ~80-100g eiwit per dag. Couscous en quinoa zijn strikt uitgesloten.
            </div>
          </div>

          {/* 7-Day interactive selectors */}
          <div className="space-y-3">
            {dayConfigs.map((day, idx) => {
              const formattedDate = new Date(day.date).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
              });

              return (
                <div
                  key={day.date}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] space-y-2.5 shadow-2xs hover:border-[#D5CABB] transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-medium text-sm text-[#2C2825]">
                        {day.label}
                      </span>
                      <span className="text-xs text-[#8C8275]">{formattedDate}</span>
                      {day.isWorkday ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F4F1EA] text-[#6E6354] border border-[#E2DAD0]">
                          <Briefcase className="w-2.5 h-2.5" />
                          <span>Mariluna (08:00–16:30)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF7F0] text-[#7A7167]">
                          <Coffee className="w-2.5 h-2.5 text-[#8C7654]" />
                          <span>Vrij / Flexibel</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#7A7167]">
                      {day.isWorkday ? 'Snellere maaltijd of slowcooker aanbevolen' : 'Ruimte voor uitgebreidere recepten'}
                    </span>
                  </div>

                  {/* 3 Choice Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChoiceChange(idx, 'solo')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        day.diningChoice === 'solo'
                          ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] shadow-xs'
                          : 'bg-[#FAF8F4] text-[#63594C] border-[#DDD5C7] hover:border-[#8C7654]'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">👤 1 — alleen ik</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChoiceChange(idx, 'couple')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        day.diningChoice === 'couple'
                          ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] shadow-xs'
                          : 'bg-[#FAF8F4] text-[#63594C] border-[#DDD5C7] hover:border-[#8C7654]'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span className="truncate">👥 2 — ik + Jeroen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChoiceChange(idx, 'none')}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        day.diningChoice === 'none'
                          ? 'bg-[#8C7654] text-[#FAF8F5] border-[#8C7654] shadow-xs'
                          : 'bg-[#FAF8F4] text-[#63594C] border-[#DDD5C7] hover:border-[#8C7654]'
                      }`}
                    >
                      <Utensils className="w-3.5 h-3.5" />
                      <span className="truncate">🍴 Geen diner</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#EAE3D5] bg-[#F7F3EA] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#7A7167] text-center sm:text-left">
            Past automatisch ingrediënten, porties en boodschappenlijst aan.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#453F3A] transition cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E6D7BD]" />
              <span>Genereer Weekmenu op Maat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
