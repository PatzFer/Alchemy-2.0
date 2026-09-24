import React, { useState } from 'react';
import {
  Utensils,
  Clock,
  Users,
  User,
  Sparkles,
  ShoppingBag,
  Edit2,
  CheckCircle2,
  Calendar,
  Layers,
  Leaf,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  WellbeingState,
  WeeklyMenuPlan,
  DailyMealPlan,
  MealItem,
  NutritionState,
  FoundationFoodProfile,
  CalendarEvent,
} from '../../types';
import { generateShoppingListFromMenu } from '../../lib/wellbeingData';
import { MealsAndMenuPlanningView } from '../meals/MealsAndMenuPlanningView';

interface WellbeingNutritionSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onNavigateToShopping: () => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
  nutrition?: NutritionState;
  onUpdateNutrition?: (nutrition: NutritionState) => void;
  foodProfile?: FoundationFoodProfile;
  calendarEvents?: CalendarEvent[];
}

export const WellbeingNutritionSection: React.FC<WellbeingNutritionSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onNavigateToShopping,
  onOpenAssistantWithPrompt,
  nutrition,
  onUpdateNutrition,
  foodProfile,
  calendarEvents = [],
}) => {
  // If shared nutrition state is available, render unified MealsAndMenuPlanningView
  if (nutrition && onUpdateNutrition) {
    return (
      <MealsAndMenuPlanningView
        nutrition={nutrition}
        onUpdateNutrition={onUpdateNutrition}
        foodProfile={foodProfile}
        calendarEvents={calendarEvents}
        onOpenAssistantWithPrompt={onOpenAssistantWithPrompt}
      />
    );
  }

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [editingMeal, setEditingMeal] = useState<{ dayIndex: number; category: 'breakfast' | 'lunch' | 'dinner' | 'snack'; meal: MealItem } | null>(null);

  const daysList = wellbeing?.weeklyMenu?.days || [];
  const activeDay = daysList[selectedDayIndex] || daysList[0];

  if (!activeDay) {
    return (
      <div className="rounded-3xl border border-dashed border-[#DCD3C4] bg-[#FAF8F4] p-10 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#F0EAE0] text-[#8C7654] flex items-center justify-center mx-auto">
          <Utensils className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="font-serif text-xl font-normal text-[#2C2825]">
            Nog geen voedingsplanning
          </h3>
          <p className="text-xs text-[#7A7167] font-light leading-relaxed">
            Geen fictieve maaltijden ingeladen. Start de weekplanning om jouw maaltijden in te delen.
          </p>
        </div>
      </div>
    );
  }

  const handleSyncToShopping = () => {
    const updatedList = generateShoppingListFromMenu(wellbeing.weeklyMenu, wellbeing.shoppingList);
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: updatedList,
    }));
    onNavigateToShopping();
  };

  const handleSaveEditedMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal) return;

    onUpdateWellbeing((prev) => {
      const updatedDays = [...prev.weeklyMenu.days];
      const day = { ...updatedDays[editingMeal.dayIndex] };
      const updatedMeals = { ...day.meals, [editingMeal.category]: editingMeal.meal };
      day.meals = updatedMeals;
      updatedDays[editingMeal.dayIndex] = day;

      return {
        ...prev,
        weeklyMenu: {
          ...prev.weeklyMenu,
          days: updatedDays,
        },
      };
    });

    setEditingMeal(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Nourishment & Quiet Table
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Weekly Menu & Nourishment Planner
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Thoughtful Mediterranean dining structured around work rhythm, solo versus shared dinners, and real preparation windows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncToShopping}
            id="sync-shopping-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Generate Shopping List</span>
          </button>
        </div>
      </div>

      {/* Preferences & Dietary Rules Bar */}
      <div className="bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#EFE9DD] flex items-center justify-center text-[#7E694E]">
            <Leaf className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-[#2C2825]">Dietary Archetype:</span>
            <span className="text-[#6A6054] ml-1.5">{wellbeing.preferences.foodPreferences.dietaryStyle}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[#7A7167]">
          <span>Quick Prep Limit: <strong className="text-[#2C2825]">{wellbeing.preferences.foodPreferences.quickPrepWeekdaysMaxMinutes}m</strong></span>
          <span>•</span>
          <span>Shared Dinners: <strong className="text-[#2C2825]">Fri, Sat, Sun</strong></span>
          <span>•</span>
          <button
            onClick={() => onOpenAssistantWithPrompt('Create next week’s menu based on my anti-inflammatory preferences and busy schedule.')}
            className="text-[#7E694E] hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" /> Ask Alchemy to Regenerate
          </button>
        </div>
      </div>

      {/* Days of Week Tab Switcher */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {wellbeing.weeklyMenu.days.map((day, idx) => {
          const isSelected = selectedDayIndex === idx;
          const isPartnerNight = day.diningSettingDinner === 'shared_partner';
          return (
            <button
              key={day.dayOfWeek}
              onClick={() => setSelectedDayIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#2C2825] text-[#FAF8F3] shadow-xs'
                  : 'bg-[#FFFFFF] border border-[#E8E2D6] text-[#6A6054] hover:bg-[#F7F4EE]'
              }`}
            >
              <span>{day.dayOfWeek}</span>
              {isPartnerNight && (
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#C5A880]' : 'bg-[#7E694E]'}`} title="Shared dinner with partner" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Day Overview Card */}
      <div className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F2ECE1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif text-[#2C2825]">{activeDay.dayOfWeek}'s Table</h3>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-[#F2ECE1] text-[#6E6353]">
                {activeDay.isWorkday ? 'Workday Rhythm' : 'Weekend Unhurried'}
              </span>
            </div>
            <p className="text-xs text-[#7A7167] mt-0.5 font-light">
              Dinner setting: {activeDay.diningSettingDinner === 'shared_partner' ? 'Partner Shared Table' : 'Solo Sovereign Evening'} • Cooking budget: ~{activeDay.availablePrepTimeMinutes} min
            </p>
          </div>

          <button
            onClick={() => onOpenAssistantWithPrompt(`Adjust my ${activeDay.dayOfWeek} dinner because plans changed.`)}
            className="text-xs text-[#7E694E] hover:underline flex items-center gap-1 font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" /> Adjust {activeDay.dayOfWeek} with AI
          </button>
        </div>

        {/* Meal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Breakfast */}
          {activeDay.meals.breakfast && (
            <div className="p-4 rounded-xl border border-[#E8E2D6] bg-[#FAF8F4] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8C8377]">Breakfast</span>
                  <div className="flex items-center gap-1 text-[11px] text-[#7A7167]">
                    <Clock className="w-3 h-3" />
                    <span>{activeDay.meals.breakfast.prepTimeMinutes + activeDay.meals.breakfast.cookingTimeMinutes}m</span>
                  </div>
                </div>
                <h4 className="text-xs font-serif font-semibold text-[#2C2825] mt-2">
                  {activeDay.meals.breakfast.name}
                </h4>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeDay.meals.breakfast.ingredients.slice(0, 4).map((ing, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#EAE3D5] text-[#5A5043]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between">
                <span className="text-[10px] text-[#8C8377]">Solo Nourishment</span>
                <button
                  onClick={() => setEditingMeal({ dayIndex: selectedDayIndex, category: 'breakfast', meal: activeDay.meals.breakfast })}
                  className="text-xs text-[#7E694E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Customise
                </button>
              </div>
            </div>
          )}

          {/* Lunch */}
          {activeDay.meals.lunch && (
            <div className="p-4 rounded-xl border border-[#E8E2D6] bg-[#FAF8F4] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-[#8C8377]">Lunch</span>
                  <div className="flex items-center gap-1 text-[11px] text-[#7A7167]">
                    <Clock className="w-3 h-3" />
                    <span>{activeDay.meals.lunch.prepTimeMinutes + activeDay.meals.lunch.cookingTimeMinutes}m</span>
                  </div>
                </div>
                <h4 className="text-xs font-serif font-semibold text-[#2C2825] mt-2">
                  {activeDay.meals.lunch.name}
                </h4>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeDay.meals.lunch.ingredients.slice(0, 4).map((ing, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#EAE3D5] text-[#5A5043]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between">
                <span className="text-[10px] text-[#8C8377]">Midday Reset</span>
                <button
                  onClick={() => setEditingMeal({ dayIndex: selectedDayIndex, category: 'lunch', meal: activeDay.meals.lunch })}
                  className="text-xs text-[#7E694E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Customise
                </button>
              </div>
            </div>
          )}

          {/* Dinner */}
          {activeDay.meals.dinner && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 ${
              activeDay.diningSettingDinner === 'shared_partner'
                ? 'bg-[#FAF6EE] border-[#C5A880]/60'
                : 'bg-[#FAF8F4] border-[#E8E2D6]'
            }`}>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-semibold text-[#8C8377]">Dinner</span>
                    {activeDay.diningSettingDinner === 'shared_partner' && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EFE4D2] text-[#7E694E] flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> Partner
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-[#7A7167]">
                    <Clock className="w-3 h-3" />
                    <span>{activeDay.meals.dinner.prepTimeMinutes + activeDay.meals.dinner.cookingTimeMinutes}m</span>
                  </div>
                </div>
                <h4 className="text-xs font-serif font-semibold text-[#2C2825] mt-2">
                  {activeDay.meals.dinner.name}
                </h4>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeDay.meals.dinner.ingredients.slice(0, 4).map((ing, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#FFFFFF] border border-[#EAE3D5] text-[#5A5043]">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#EFE8DC] flex items-center justify-between">
                <span className="text-[10px] text-[#8C8377]">Evening Sustenance</span>
                <button
                  onClick={() => setEditingMeal({ dayIndex: selectedDayIndex, category: 'dinner', meal: activeDay.meals.dinner })}
                  className="text-xs text-[#7E694E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Customise
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mindful Snack / Evening Ritual */}
        {activeDay.meals.snack && (
          <div className="p-3.5 rounded-xl border border-[#F2ECE1] bg-[#FAF8F3] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C8377]">Snack / Infusion</span>
              <span className="font-medium text-[#2C2825]">{activeDay.meals.snack.name}</span>
            </div>
            <span className="text-[11px] text-[#7A7167] font-light">Nourishing pause</span>
          </div>
        )}
      </div>

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Customise Meal</h3>
              <button onClick={() => setEditingMeal(null)} className="text-xs text-[#8C8377]">✕</button>
            </div>

            <form onSubmit={handleSaveEditedMeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Meal Title</label>
                <input
                  type="text"
                  value={editingMeal.meal.name}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      meal: { ...editingMeal.meal, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Ingredients (comma separated)</label>
                <input
                  type="text"
                  value={editingMeal.meal.ingredients.join(', ')}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      meal: {
                        ...editingMeal.meal,
                        ingredients: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.prepTimeMinutes}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        meal: { ...editingMeal.meal, prepTimeMinutes: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
                <div>
                  <label className="block text-[#6A6054] font-medium mb-1">Cooking Time (min)</label>
                  <input
                    type="number"
                    value={editingMeal.meal.cookingTimeMinutes}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        meal: { ...editingMeal.meal, cookingTimeMinutes: parseInt(e.target.value) || 0 },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMeal(null)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Save Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
