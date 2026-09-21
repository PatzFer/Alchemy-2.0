import React, { useState } from 'react';
import {
  X,
  Clock,
  Flame,
  Check,
  Heart,
  ThumbsUp,
  Meh,
  ThumbsDown,
  Sparkles,
  UtensilsCrossed,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { Recipe, MealFeedbackRating, Language } from '../../types';
import { scaleRecipeIngredients } from '../../lib/mealPlanningData';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  initialPortions?: 1 | 2;
  currentFeedback?: MealFeedbackRating;
  onSaveFeedback?: (recipeId: string, recipeName: string, rating: MealFeedbackRating) => void;
  lang?: Language;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  initialPortions = 2,
  currentFeedback,
  onSaveFeedback,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const [portions, setPortions] = useState<1 | 2>(initialPortions);
  const [activeFeedback, setActiveFeedback] = useState<MealFeedbackRating | undefined>(currentFeedback);

  if (!recipe) return null;

  const scaledIngredients = scaleRecipeIngredients(recipe.ingredients, portions);
  const totalProtein = Math.round(recipe.proteinGramsPerPerson * portions);

  const handleFeedback = (rating: MealFeedbackRating) => {
    setActiveFeedback(rating);
    if (onSaveFeedback) {
      onSaveFeedback(recipe.id, recipe.name, rating);
    }
  };

  const getCuisineLabel = (cuisine: Recipe['cuisine']) => {
    switch (cuisine) {
      case 'portuguese':
        return { label: '🇵🇹 Portugese Keuken (Kernidentiteit)', bg: 'bg-[#FBF6EE] text-[#8C6D37] border-[#E8D9BF]' };
      case 'belgian':
        return { label: '🇧🇪 Belgische Klassieker', bg: 'bg-[#F7F5F0] text-[#5A5248] border-[#E2DDD5]' };
      case 'italian':
        return { label: '🇮🇹 Italiaanse Keuken', bg: 'bg-[#F4F7F4] text-[#3D6649] border-[#CDE0D2]' };
      default:
        return { label: 'Culinaire Favoriet', bg: 'bg-[#FAF8F4] text-[#6E6457] border-[#E5DFD3]' };
    }
  };

  const cuisineInfo = getCuisineLabel(recipe.cuisine);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#FCFAF6] rounded-3xl border border-[#DCD3C4] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#EAE3D5] bg-[#F7F3EA] flex items-start justify-between gap-4">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${cuisineInfo.bg}`}>
                {cuisineInfo.label}
              </span>
              {recipe.isSlowcooker && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#F0F5F8] text-[#386584] border-[#CBE0EC] flex items-center gap-1">
                  <Flame className="w-3 h-3 text-[#386584]" />
                  <span>Slowcooker</span>
                </span>
              )}
              <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#FAF5EB] text-[#7A6136] border-[#E4D5B8] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#8C713F]" />
                <span>Geen couscous & geen quinoa</span>
              </span>
            </div>
            <h2 id="recipe-modal-title" className="font-serif text-2xl sm:text-3xl font-normal text-[#2C2825] leading-snug">
              {recipe.name}
            </h2>
            <p className="text-xs sm:text-sm text-[#70665A] font-light leading-relaxed">
              {recipe.shortDescription}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isNl ? 'Sluiten' : 'Close'}
            className="p-2 rounded-full text-[#7A7167] hover:bg-[#EAE3D5] hover:text-[#2C2825] transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-[#2C2825]">
          {/* Key Metrics & Portion Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E1D2]">
            {/* Times & Protein */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-[#5C5346]">
                <Clock className="w-4 h-4 text-[#8C7654]" />
                <div>
                  <div className="text-[10px] uppercase text-[#8C7654] font-medium tracking-wider">Kooktijd</div>
                  <div className="font-semibold text-[#2C2825]">{recipe.totalMinutes} min</div>
                </div>
              </div>
              <div className="h-7 w-px bg-[#E0D8CA]" />
              <div>
                <div className="text-[10px] uppercase text-[#8C7654] font-medium tracking-wider">Eiwit / Portie</div>
                <div className="font-semibold text-[#2C2825]">~{recipe.proteinGramsPerPerson}g eiwit</div>
              </div>
              <div className="h-7 w-px bg-[#E0D8CA]" />
              <div>
                <div className="text-[10px] uppercase text-[#8C7654] font-medium tracking-wider">Dagdoel</div>
                <div className="text-[11px] text-[#7A7167]">80–100g</div>
              </div>
            </div>

            {/* Interactive Portion Switcher */}
            <div className="flex items-center justify-start sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DFD3]">
              <span className="text-xs text-[#7A7167] font-medium mr-1">Porties:</span>
              <button
                type="button"
                onClick={() => setPortions(1)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  portions === 1
                    ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#6B6154] border-[#DDD5C7] hover:border-[#8C7654]'
                }`}
              >
                <span>👤 1 persoon</span>
              </button>
              <button
                type="button"
                onClick={() => setPortions(2)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer flex items-center gap-1 ${
                  portions === 2
                    ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#6B6154] border-[#DDD5C7] hover:border-[#8C7654]'
                }`}
              >
                <span>👥 2 personen (ik + Jeroen)</span>
              </button>
            </div>
          </div>

          {/* Ingredients Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-normal text-[#2C2825] flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#8C7654]" />
                <span>Ingrediënten</span>
                <span className="text-xs font-sans font-light text-[#7A7167]">
                  (berekend voor {portions} {portions === 1 ? 'persoon' : 'personen'})
                </span>
              </h3>
              <span className="text-[11px] text-[#8C7654] bg-[#F7F2E7] px-2.5 py-0.5 rounded-full font-medium">
                Totaal ~{totalProtein}g eiwit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scaledIngredients.map((ing, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E8E2D5] text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 pr-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#8C7654] shrink-0" />
                    <span className="text-[#2C2825] font-medium">{ing.name}</span>
                  </div>
                  <span className="text-[#6D6357] font-semibold bg-[#FAF8F4] px-2 py-0.5 rounded-md shrink-0">
                    {ing.amount} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Steps */}
          <div className="space-y-3">
            <h3 className="font-serif text-lg font-normal text-[#2C2825]">
              Stapsgewijze Bereiding
            </h3>
            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E9E3D6] text-xs leading-relaxed"
                >
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#EAE3D4] text-[#554C40] font-semibold text-[11px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-[#4A4237] font-light flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Substitutions & Prep Advice */}
          {(recipe.substitutions || recipe.mealPrepNotes || recipe.storageNotes) && (
            <div className="p-4 rounded-2xl bg-[#F6F2E9] border border-[#E4DCCF] space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 text-[#8C7654] font-medium">
                <Info className="w-4 h-4" />
                <span>Tips voor restjes, meal prep & substituties</span>
              </div>
              {recipe.mealPrepNotes && (
                <p className="text-[#5C5346] font-light">
                  <strong className="font-medium text-[#2C2825]">Meal prep:</strong> {recipe.mealPrepNotes}
                </p>
              )}
              {recipe.storageNotes && (
                <p className="text-[#5C5346] font-light">
                  <strong className="font-medium text-[#2C2825]">Bewaren:</strong> {recipe.storageNotes}
                </p>
              )}
              {recipe.substitutions && recipe.substitutions.length > 0 && (
                <p className="text-[#5C5346] font-light">
                  <strong className="font-medium text-[#2C2825]">Alternatieven:</strong> {recipe.substitutions.join(' ')}
                </p>
              )}
            </div>
          )}

          {/* Feedback & Culinair Leren */}
          <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E1D2] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8C7654]" />
                <span className="text-xs font-serif font-medium text-[#2C2825]">
                  Culinair Leren van Patricia
                </span>
              </div>
              <span className="text-[10px] text-[#7A7167]">Verfijnt toekomstige weeksuggesties</span>
            </div>
            <p className="text-xs text-[#6B6154] font-light">
              Wat vind je van dit gerecht? Alchemy onthoudt je reactie voor toekomstige menuvoorstellen.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'love' as const, label: '❤️ Heerlijk', desc: 'Favoriet' },
                { id: 'like' as const, label: '👍 Lekker', desc: 'Vaker op menu' },
                { id: 'neutral' as const, label: '😐 Neutraal', desc: 'Af en toe' },
                { id: 'dislike' as const, label: '👎 Niet voor mij', desc: 'Vermijden' },
              ].map((item) => {
                const isSelected = activeFeedback === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleFeedback(item.id)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825] shadow-xs'
                        : 'bg-[#FFFFFF] text-[#4A4237] border-[#DDD5C7] hover:border-[#8C7654]'
                    }`}
                  >
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-[#DCD5C8]' : 'text-[#8A7F73]'}`}>
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#EAE3D5] bg-[#F7F3EA] flex items-center justify-between">
          <div className="text-xs text-[#7A7167] font-light">
            Eiwitdoel van Patricia: <strong className="font-medium text-[#2C2825]">80–100 g/dag</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition cursor-pointer shadow-xs"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
