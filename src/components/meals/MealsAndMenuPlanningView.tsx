import React, { useState, useMemo } from 'react';
import {
  Utensils,
  Calendar,
  BookOpen,
  Package,
  ShoppingCart,
  Sparkles,
  Plus,
  Clock,
  Flame,
  CheckCircle2,
  Circle,
  X,
  Edit2,
  Trash2,
  Check,
  RefreshCw,
  Share2,
  Shield,
  ShieldCheck,
  Info,
  ChevronRight,
  ChevronDown,
  User,
  Users,
  AlertCircle,
  Copy,
  SlidersHorizontal,
  Search,
} from 'lucide-react';
import {
  NutritionState,
  PriveWeeklyMenuPlan as WeeklyMenuPlan,
  PlannedMealDay,
  Recipe,
  KitchenInventoryItem,
  ShoppingListItem,
  MealFeedbackRating,
  CalendarEvent,
  FoundationFoodProfile,
  Language,
} from '../../types';
import {
  CURATED_RECIPES,
  DEFAULT_PANTRY_STAPLES,
  getRecipeById,
  generateWeeklyPlan,
  generateShoppingListFromPlan,
  isThursdayPlanningTime,
  getSmartReplacementRecipe,
} from '../../lib/mealPlanningData';
import { RecipeDetailModal } from './RecipeDetailModal';
import { ThursdayPlanningModal } from './ThursdayPlanningModal';

interface MealsAndMenuPlanningViewProps {
  nutrition: NutritionState;
  onUpdateNutrition: (nutrition: NutritionState) => void;
  foodProfile?: FoundationFoodProfile;
  calendarEvents?: CalendarEvent[];
  onOpenAssistantWithPrompt?: (prompt: string) => void;
  lang?: Language;
}

type MealsSubTab = 'menu' | 'recipes' | 'inventory' | 'shopping' | 'learning';

export const MealsAndMenuPlanningView: React.FC<MealsAndMenuPlanningViewProps> = ({
  nutrition,
  onUpdateNutrition,
  foodProfile,
  calendarEvents = [],
  onOpenAssistantWithPrompt,
  lang = 'nl',
}) => {
  const isNl = lang === 'nl';
  const [activeTab, setActiveTab] = useState<MealsSubTab>('menu');

  // Modal States
  const [isThursdayModalOpen, setIsThursdayModalOpen] = useState(false);
  const [selectedRecipeForModal, setSelectedRecipeForModal] = useState<Recipe | null>(null);
  const [modalPortions, setModalPortions] = useState<1 | 2>(2);

  // Meal Replacement Modal
  const [replacementDayIndex, setReplacementDayIndex] = useState<number | null>(null);

  // Recipe Book Filters
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeCuisineFilter, setRecipeCuisineFilter] = useState<string>('all');

  // Inventory Form & Filters
  const [inventoryLocationFilter, setInventoryLocationFilter] = useState<'all' | 'pantry' | 'refrigerator' | 'freezer'>('all');
  const [isAddInventoryOpen, setIsAddInventoryOpen] = useState(false);
  const [newInvName, setNewInvName] = useState('');
  const [newInvQuantity, setNewInvQuantity] = useState('');
  const [newInvLocation, setNewInvLocation] = useState<'pantry' | 'refrigerator' | 'freezer'>('pantry');
  const [newInvCategory, setNewInvCategory] = useState<KitchenInventoryItem['category']>('pantry');

  // Shopping List Custom Item
  const [isAddShoppingOpen, setIsAddShoppingOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopQuantity, setNewShopQuantity] = useState('');
  const [newShopCategory, setNewShopCategory] = useState<ShoppingListItem['category']>('pantry');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Check Thursday Status
  const isThursdayEvening = isThursdayPlanningTime();

  // Ensure an active weekly plan exists or initialize one on demand
  const activePlan = nutrition.activeWeeklyPlan;

  const handlePlanGenerated = (newPlan: WeeklyMenuPlan) => {
    const newShoppingList = generateShoppingListFromPlan(
      newPlan,
      CURATED_RECIPES,
      nutrition.inventory || []
    );

    onUpdateNutrition({
      ...nutrition,
      activeWeeklyPlan: newPlan,
      shoppingList: newShoppingList,
      pastWeeklyPlans: activePlan
        ? [...(nutrition.pastWeeklyPlans || []), activePlan]
        : (nutrition.pastWeeklyPlans || []),
    });
  };

  const handleMealStatusChange = (dayIndex: number, status: PlannedMealDay['status']) => {
    if (!activePlan) return;
    const updatedDays = [...activePlan.days];
    const targetDay = updatedDays[dayIndex];
    if (!targetDay) return;

    updatedDays[dayIndex] = {
      ...targetDay,
      status,
    };

    // If marked as cooked, record in meal history
    let updatedHistory = [...(nutrition.mealHistory || [])];
    if (status === 'cooked' && targetDay.recipeId) {
      const recipe = getRecipeById(targetDay.recipeId);
      if (recipe) {
        updatedHistory.unshift({
          id: 'hist-' + Date.now(),
          date: targetDay.date,
          recipeId: recipe.id,
          recipeName: recipe.name,
          cuisine: recipe.cuisine,
          participants: targetDay.diningChoice,
          status: 'cooked',
          cookedAt: new Date().toISOString(),
        });
      }
    }

    onUpdateNutrition({
      ...nutrition,
      activeWeeklyPlan: {
        ...activePlan,
        days: updatedDays,
      },
      mealHistory: updatedHistory,
    });
  };

  const handleReplaceMeal = (recipeId: string) => {
    if (!activePlan || replacementDayIndex === null) return;
    const updatedDays = [...activePlan.days];
    const targetDay = updatedDays[replacementDayIndex];
    if (!targetDay) return;

    updatedDays[replacementDayIndex] = {
      ...targetDay,
      recipeId,
      status: 'replaced',
      replacementMealId: recipeId,
    };

    const updatedPlan: WeeklyMenuPlan = {
      ...activePlan,
      days: updatedDays,
    };

    const updatedShopping = generateShoppingListFromPlan(
      updatedPlan,
      CURATED_RECIPES,
      nutrition.inventory || []
    );

    onUpdateNutrition({
      ...nutrition,
      activeWeeklyPlan: updatedPlan,
      shoppingList: updatedShopping,
    });

    setReplacementDayIndex(null);
  };

  const handleSaveRecipeFeedback = (recipeId: string, recipeName: string, rating: MealFeedbackRating) => {
    const newEntry = {
      recipeId,
      recipeName,
      feedback: rating,
      date: new Date().toISOString(),
    };

    const existingFeedback = nutrition.feedbackHistory || [];
    const filtered = existingFeedback.filter((f) => f.recipeId !== recipeId);

    onUpdateNutrition({
      ...nutrition,
      feedbackHistory: [newEntry, ...filtered],
    });
  };

  // Inventory Management
  const handleAddInventoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) return;

    const newItem: KitchenInventoryItem = {
      id: 'inv-' + Date.now(),
      name: newInvName.trim(),
      quantity: newInvQuantity.trim() || '1 portie',
      location: newInvLocation,
      category: newInvCategory,
      addedDate: new Date().toISOString(),
    };

    const updatedInventory = [...(nutrition.inventory || []), newItem];
    onUpdateNutrition({
      ...nutrition,
      inventory: updatedInventory,
    });

    setNewInvName('');
    setNewInvQuantity('');
    setIsAddInventoryOpen(false);
  };

  const handleRemoveInventoryItem = (id: string) => {
    onUpdateNutrition({
      ...nutrition,
      inventory: (nutrition.inventory || []).filter((i) => i.id !== id),
    });
  };

  const handleToggleInventoryUsed = (id: string) => {
    onUpdateNutrition({
      ...nutrition,
      inventory: (nutrition.inventory || []).map((i) =>
        i.id === id ? { ...i, isUsed: !i.isUsed } : i
      ),
    });
  };

  const handleLoadDefaultPantry = () => {
    const starterItems: KitchenInventoryItem[] = DEFAULT_PANTRY_STAPLES.map((item, idx) => ({
      ...item,
      id: 'inv-def-' + idx + '-' + Date.now(),
      addedDate: new Date().toISOString(),
    }));

    onUpdateNutrition({
      ...nutrition,
      inventory: [...(nutrition.inventory || []), ...starterItems],
    });
  };

  // Shopping List Management
  const handleToggleShoppingItem = (id: string) => {
    onUpdateNutrition({
      ...nutrition,
      shoppingList: (nutrition.shoppingList || []).map((s) =>
        s.id === id ? { ...s, checked: !s.checked } : s
      ),
    });
  };

  const handleAddShoppingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    const newItem: ShoppingListItem = {
      id: 'shop-man-' + Date.now(),
      name: newShopName.trim(),
      quantity: newShopQuantity.trim() || '1x',
      category: newShopCategory,
      checked: false,
      alreadyInStock: false,
    };

    onUpdateNutrition({
      ...nutrition,
      shoppingList: [...(nutrition.shoppingList || []), newItem],
    });

    setNewShopName('');
    setNewShopQuantity('');
    setIsAddShoppingOpen(false);
  };

  const handleClearCheckedShopping = () => {
    onUpdateNutrition({
      ...nutrition,
      shoppingList: (nutrition.shoppingList || []).filter((s) => !s.checked),
    });
  };

  const handleCopyShoppingList = () => {
    const listText = (nutrition.shoppingList || [])
      .map((i) => `[${i.checked ? 'x' : ' '}] ${i.name} (${i.quantity})`)
      .join('\n');

    navigator.clipboard.writeText(listText).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    });
  };

  // Filtered recipes for Recipe Book
  const filteredRecipes = useMemo(() => {
    return CURATED_RECIPES.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.shortDescription.toLowerCase().includes(recipeSearch.toLowerCase()) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(recipeSearch.toLowerCase()));

      if (!matchesSearch) return false;
      if (recipeCuisineFilter === 'all') return true;
      if (recipeCuisineFilter === 'slowcooker') return r.isSlowcooker;
      return r.cuisine === recipeCuisineFilter;
    });
  }, [recipeSearch, recipeCuisineFilter]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    const items = nutrition.inventory || [];
    if (inventoryLocationFilter === 'all') return items;
    return items.filter((i) => i.location === inventoryLocationFilter);
  }, [nutrition.inventory, inventoryLocationFilter]);

  const subNavItems: { id: MealsSubTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'menu', label: isNl ? 'Weekmenu' : 'Weekly Menu', icon: Calendar },
    { id: 'recipes', label: isNl ? 'Receptenboek' : 'Recipe Book', icon: BookOpen },
    { id: 'inventory', label: isNl ? 'Voorraad & Koelkast' : 'Inventory', icon: Package },
    { id: 'shopping', label: isNl ? 'Boodschappenlijst' : 'Shopping List', icon: ShoppingCart },
    { id: 'learning', label: isNl ? 'Culinair Leren' : 'Learned Taste', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 text-[#2C2825]">
      {/* Editorial Header with Privacy Firewall Banner */}
      <div className="rounded-3xl border border-[#DCD3C4] bg-[#FAF8F3] p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#8C7654] font-medium">
              <span>Privé Sanctuary</span>
              <span>•</span>
              <span>Maaltijden & Menuplanning</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2825] tracking-tight mt-1">
              Maaltijden & Weekplanning
            </h1>
            <p className="text-xs sm:text-sm text-[#7A7167] mt-2 max-w-2xl font-light leading-relaxed">
              Jouw persoonlijke culinaire assistent: geworteld in de Portugese eetcultuur, verrijkt met Belgische en Italiaanse klassiekers.
              Doelgericht ~80–100g eiwit per dag, ontspannen koken, géén crashdiëten en géén schuldgevoel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsThursdayModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition shadow-xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#E6D7BD]" />
              <span>Wekelijks Menu Plannen</span>
            </button>
          </div>
        </div>

        {/* Strict Exclusion & Privacy Badge */}
        <div className="mt-5 pt-4 border-t border-[#EAE2D2] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#7A6B58]">
            <ShieldCheck className="w-4 h-4 text-[#8C7654] shrink-0" />
            <span>
              <strong>Patz Regels actief:</strong> 🇵🇹 Portugees (1), 🇧🇪 Belgisch (2), 🇮🇹 Italiaans (3) •{' '}
              <span className="text-[#991B1B] font-medium">Geen couscous & geen quinoa</span> • Gegaarde groenten
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#8C8275]">
            <Shield className="w-3.5 h-3.5 text-[#8C7654]" />
            <span>Strikte scheiding: geen maaltijddata in Mariluna</span>
          </div>
        </div>
      </div>

      {/* Thursday Prompt Card (Always accessible, highlighted when Thursday) */}
      <div
        className={`p-5 sm:p-6 rounded-3xl border transition shadow-xs ${
          isThursdayEvening
            ? 'bg-gradient-to-r from-[#FBF6EE] via-[#FAF8F4] to-[#F5EFE4] border-[#D8C7AA] ring-2 ring-[#D8C7AA]/40'
            : 'bg-[#FAF8F4] border-[#E8E1D2]'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[#8C7654]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isThursdayEvening ? 'Wekelijkse Donderdag Planning' : 'Volgende Week Voorbereiden'}</span>
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-normal text-[#2C2825] leading-snug">
              “Tijd voor je menu van volgende week. Ik heb je agenda voor volgende week bekeken. Weet je voor welke avonden je voor 1 of 2 personen kookt?”
            </h2>
            <p className="text-xs text-[#7A7167] font-light">
              Jeroen is geen vaste eter: kies per avond voor wie je kookt. De selectie geldt uitsluitend voor die week.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsThursdayModalOpen(true)}
            className="px-5 py-2.5 rounded-full border border-[#8C7654] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:bg-[#8C7654] hover:text-[#FFFFFF] transition cursor-pointer shadow-2xs whitespace-nowrap"
          >
            Start Menuplanner →
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E6DEC $\rightarrow$ #E8E2D6] scrollbar-none">
        {subNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#2C2825] text-[#FAF8F5] shadow-xs'
                  : 'bg-transparent text-[#6B6154] hover:bg-[#F0EBE1] hover:text-[#2C2825]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.id === 'shopping' && (nutrition.shoppingList || []).length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? 'bg-[#433D38] text-[#FAF8F5]' : 'bg-[#EAE2D4] text-[#554C40]'
                }`}>
                  {(nutrition.shoppingList || []).filter((s) => !s.checked).length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 1. WEEKMENU TAB                                              */}
      {/* ============================================================ */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {!activePlan ? (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-[#DCD3C4] bg-[#FAF8F4] p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F0EAE0] text-[#8C7654] flex items-center justify-center mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="font-serif text-xl font-normal text-[#2C2825]">
                  Nog geen weekmenu actief
                </h3>
                <p className="text-xs text-[#7A7167] font-light leading-relaxed">
                  Geen fictieve maaltijden ingeladen. Start de weekplanning om aan te geven voor welke avonden je voor 1 of 2 personen kookt.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsThursdayModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E6D7BD]" />
                <span>Genereer Weekmenu voor Volgende Week</span>
              </button>
            </div>
          ) : (
            /* Active Plan List */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif text-xl font-normal text-[#2C2825]">
                    Weekmenu (Gestart op {new Date(activePlan.weekStartDate).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })})
                  </h3>
                  <p className="text-xs text-[#7A7167] font-light">
                    Afgestemd op jouw agenda, ~80–100g dagelijks eiwit en de gekozen 1 of 2 persoonssituatie per dag.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsThursdayModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>Nieuwe Week Plannen</span>
                  </button>
                </div>
              </div>

              {/* Day-by-Day Cards */}
              <div className="grid grid-cols-1 gap-3.5">
                {activePlan.days.map((day, idx) => {
                  const recipe = day.recipeId ? getRecipeById(day.recipeId) : undefined;
                  const dayDate = new Date(day.date);
                  const dayName = dayDate.toLocaleDateString('nl-NL', { weekday: 'long' });
                  const formattedDate = dayDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

                  return (
                    <div
                      key={day.date}
                      className={`p-4 sm:p-5 rounded-2xl border transition shadow-2xs ${
                        day.status === 'cooked'
                          ? 'bg-[#F9FAF8] border-[#DDE6DE] opacity-90'
                          : day.status === 'skipped'
                          ? 'bg-[#FAF9F7] border-[#E8E2D8] opacity-75'
                          : 'bg-[#FFFFFF] border-[#E8E2D5] hover:border-[#D5CABB]'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Day Info & Title */}
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-serif font-medium text-sm text-[#2C2825] capitalize">
                              {dayName}
                            </span>
                            <span className="text-xs text-[#8C8275]">{formattedDate}</span>
                            <span className="text-xs text-[#B5A998]">•</span>

                            {/* Participant Badge */}
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#F4F1EA] text-[#554C40] border border-[#E2DAD0]">
                              {day.diningChoice === 'solo' && '👤 1 persoon (alleen ik)'}
                              {day.diningChoice === 'couple' && '👥 2 personen (ik + Jeroen)'}
                              {day.diningChoice === 'none' && '🍴 Geen diner gepland'}
                            </span>

                            {/* Status Tag */}
                            {day.status === 'cooked' && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2C6B38] border border-[#CDE0D2]">
                                ✓ Gekookt
                              </span>
                            )}
                            {day.status === 'skipped' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FAF3F2] text-[#8C5248]">
                                Overgeslagen
                              </span>
                            )}
                            {day.status === 'replaced' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#F7F4EE] text-[#8C7654]">
                                Vervangen
                              </span>
                            )}
                          </div>

                          {/* Meal Details */}
                          {day.diningChoice === 'none' ? (
                            <p className="text-xs text-[#8A8073] italic">
                              Geen diner nodig op deze avond (buitenshuis eten of restjes).
                            </p>
                          ) : recipe ? (
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-serif text-base sm:text-lg font-medium text-[#2C2825]">
                                  {recipe.name}
                                </h4>
                                {recipe.cuisine === 'portuguese' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF6EE] text-[#8C6D37] border border-[#E8D9BF] font-medium">
                                    🇵🇹 Portugees
                                  </span>
                                )}
                                {recipe.cuisine === 'belgian' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F5F0] text-[#5A5248] border border-[#E2DDD5] font-medium">
                                    🇧🇪 Belgisch
                                  </span>
                                )}
                                {recipe.cuisine === 'italian' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F7F4] text-[#3D6649] border border-[#CDE0D2] font-medium">
                                    🇮🇹 Italiaans
                                  </span>
                                )}
                                {recipe.isSlowcooker && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0F5F8] text-[#386584] border border-[#CBE0EC] flex items-center gap-1 font-medium">
                                    <Flame className="w-2.5 h-2.5" />
                                    <span>Slowcooker</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#6E6457] font-light line-clamp-1">
                                {recipe.shortDescription}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#7A7167] pt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#8C7654]" />
                                  <span>{recipe.totalMinutes} min</span>
                                </span>
                                <span>•</span>
                                <span className="text-[#2C2825] font-medium">
                                  ~{recipe.proteinGramsPerPerson}g eiwit p.p.
                                </span>
                                {day.dayContextNote && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#8C7654] italic">{day.dayContextNote}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-[#7A7167]">Geen recept gekoppeld</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {day.diningChoice !== 'none' && recipe && (
                          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EFE9DD]">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRecipeForModal(recipe);
                                setModalPortions(day.diningChoice === 'couple' ? 2 : 1);
                              }}
                              className="px-3.5 py-1.5 rounded-full border border-[#DCD3C4] bg-[#FAF8F3] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
                            >
                              Bekijk Recept
                            </button>

                            <button
                              type="button"
                              onClick={() => setReplacementDayIndex(idx)}
                              className="px-3 py-1.5 rounded-full border border-[#E0D7C9] bg-[#FFFFFF] text-[#6B6154] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
                            >
                              Vervang
                            </button>

                            {/* Status toggles */}
                            {day.status !== 'cooked' ? (
                              <button
                                type="button"
                                onClick={() => handleMealStatusChange(idx, 'cooked')}
                                className="px-3 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition cursor-pointer shadow-2xs"
                              >
                                Gekookt ✓
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMealStatusChange(idx, 'planned')}
                                className="px-3 py-1.5 rounded-full border border-[#CDE0D2] bg-[#EBF3ED] text-[#2C6B38] text-xs font-medium hover:bg-[#E2EFE5] transition cursor-pointer"
                              >
                                Gekookt
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meal Prep Suggestions for the Week */}
              <div className="p-5 rounded-3xl bg-[#FAF7F0] border border-[#E8E1D2] space-y-3">
                <div className="flex items-center gap-2 text-[#8C7654]">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="font-serif text-sm font-medium text-[#2C2825]">
                    Slimme Meal Prep & Weekendhulp
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#5F5547]">
                  <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE3D5] space-y-1">
                    <strong className="font-medium text-[#2C2825] block">🍲 Slowcooker op Mariluna-dagen:</strong>
                    <p className="font-light">Zet ‘s ochtends voor 08:00 de pan aan zodat je om 16:30 kunt aanschuiven zonder kookstress.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE3D5] space-y-1">
                    <strong className="font-medium text-[#2C2825] block">❄️ Extra portie invriezen:</strong>
                    <p className="font-light">Kook je ragù of stoofvlees? Vries 1 portie in voor drukke avonden later deze maand.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#EAE3D5] space-y-1">
                    <strong className="font-medium text-[#2C2825] block">🥕 Groenten fijn verwerken:</strong>
                    <p className="font-light">Alle groenten worden zacht gegaard of mee gepureerd in de saus voor optimaal comfort.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. RECEPTENBOEK TAB                                          */}
      {/* ============================================================ */}
      {activeTab === 'recipes' && (
        <div className="space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#2C2825]">
                Curated Receptenboek
              </h3>
              <p className="text-xs text-[#7A7167] font-light">
                Gefilterd op Patricia’s brede Zuid-Europese & Europese profiel (Portugees, Italiaans, Spaans, Grieks, Frans, Belgisch) en gegarandeerd vrij van couscous en quinoa.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8275]" />
                <input
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Zoek gerecht of ingrediënt..."
                  className="pl-8 pr-3 py-1.5 rounded-full bg-[#FFFFFF] border border-[#DDD4C5] text-xs text-[#2C2825] focus:outline-none focus:border-[#8C7654] w-48 sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Cuisine Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {[
              { id: 'all', label: 'Alle Recepten' },
              { id: 'portuguese', label: '🇵🇹 Portugees' },
              { id: 'italian', label: '🇮🇹 Italiaans' },
              { id: 'spanish', label: '🇪🇸 Spaans' },
              { id: 'greek', label: '🇬🇷 Grieks' },
              { id: 'french', label: '🇫🇷 Frans' },
              { id: 'belgian', label: '🇧🇪 Belgisch' },
              { id: 'slowcooker', label: '🍲 Slowcooker' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRecipeCuisineFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer whitespace-nowrap border ${
                  recipeCuisineFilter === f.id
                    ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825]'
                    : 'bg-[#FFFFFF] text-[#63594C] border-[#DDD5C7] hover:border-[#8C7654]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recipe Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => {
                  setSelectedRecipeForModal(recipe);
                  setModalPortions(2);
                }}
                className="p-4.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] hover:border-[#8C7654] transition cursor-pointer space-y-3 flex flex-col justify-between shadow-2xs group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8C7654]">
                      {recipe.cuisine === 'portuguese' && '🇵🇹 Portugees'}
                      {recipe.cuisine === 'belgian' && '🇧🇪 Belgisch'}
                      {recipe.cuisine === 'italian' && '🇮🇹 Italiaans'}
                      {recipe.cuisine === 'spanish' && '🇪🇸 Spaans'}
                      {recipe.cuisine === 'greek' && '🇬🇷 Grieks'}
                      {recipe.cuisine === 'french' && '🇫🇷 Frans'}
                      {recipe.cuisine === 'european' && '🇪🇺 Europees'}
                    </span>
                    {recipe.isSlowcooker && (
                      <span className="text-[10px] text-[#386584] bg-[#F0F5F8] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Slowcooker</span>
                      </span>
                    )}
                  </div>

                  <h4 className="font-serif text-base font-medium text-[#2C2825] group-hover:text-[#8C7654] transition leading-snug">
                    {recipe.name}
                  </h4>

                  <p className="text-xs text-[#70665A] font-light line-clamp-2 leading-relaxed">
                    {recipe.shortDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#7A7167]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#8C7654]" />
                    <span>{recipe.totalMinutes} min</span>
                  </span>
                  <span className="font-medium text-[#2C2825]">
                    ~{recipe.proteinGramsPerPerson}g eiwit
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. VOORRAAD & KOELKAST TAB                                   */}
      {/* ============================================================ */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#2C2825]">
                Ingrediënten Thuis
              </h3>
              <p className="text-xs text-[#7A7167] font-light">
                Houd bij wat je in voorraad hebt. De menuplanner gebruikt deze ingrediënten bij voorkeur om onnodige boodschappen te vermijden.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(nutrition.inventory || []).length === 0 && (
                <button
                  type="button"
                  onClick={handleLoadDefaultPantry}
                  className="px-3.5 py-1.5 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
                >
                  Laad Basisvoorraad
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddInventoryOpen(true)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ingrediënt Toevoegen</span>
              </button>
            </div>
          </div>

          {/* Location Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all' as const, label: 'Alles' },
              { id: 'pantry' as const, label: '📦 Voorraadkast' },
              { id: 'refrigerator' as const, label: '❄️ Koelkast' },
              { id: 'freezer' as const, label: '🧊 Diepvries' },
            ].map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setInventoryLocationFilter(loc.id)}
                className={`px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer border ${
                  inventoryLocationFilter === loc.id
                    ? 'bg-[#2C2825] text-[#FAF8F5] border-[#2C2825]'
                    : 'bg-[#FFFFFF] text-[#63594C] border-[#DDD5C7] hover:border-[#8C7654]'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Inventory Items List */}
          {filteredInventory.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#DDD5C7] bg-[#FAF8F4] text-center space-y-3">
              <Package className="w-8 h-8 text-[#8C7654] mx-auto opacity-70" />
              <div className="text-xs text-[#7A7167]">
                Geen ingrediënten gevonden in deze opslaglocatie.
              </div>
              <button
                type="button"
                onClick={handleLoadDefaultPantry}
                className="px-4 py-2 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer shadow-2xs"
              >
                Laad Patricia’s Basisvoorraad (Olijfolie, rijst, passata...)
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition shadow-2xs flex items-center justify-between ${
                    item.isUsed
                      ? 'bg-[#F9F7F3] border-[#E8E2D5] opacity-60 line-through text-[#8C8275]'
                      : 'bg-[#FFFFFF] border-[#E8E2D5]'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-[#2C2825]">{item.name}</div>
                    <div className="text-[11px] text-[#7A7167] flex items-center gap-1.5">
                      <span>{item.quantity}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {item.location === 'pantry' && 'Voorraadkast'}
                        {item.location === 'refrigerator' && 'Koelkast'}
                        {item.location === 'freezer' && 'Diepvries'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleInventoryUsed(item.id)}
                      title={item.isUsed ? 'Heractiveer ingrediënt' : 'Markeer als gebruikt'}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        item.isUsed ? 'text-[#8C7654] hover:bg-[#EAE2D4]' : 'text-[#7A7167] hover:bg-[#F2ECE1]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveInventoryItem(item.id)}
                      title="Verwijder ingrediënt"
                      className="p-1.5 rounded-full text-[#991B1B]/70 hover:bg-[#FEE2E2] hover:text-[#991B1B] transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Item Form Modal */}
          {isAddInventoryOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E1D2] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-medium text-[#2C2825]">
                  Nieuw Ingrediënt Toevoegen
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddInventoryOpen(false)}
                  className="p-1 text-[#7A7167] hover:text-[#2C2825]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddInventoryItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  value={newInvName}
                  onChange={(e) => setNewInvName(e.target.value)}
                  placeholder="Naam ingrediënt (bijv. Kipfilet)"
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                />
                <input
                  type="text"
                  value={newInvQuantity}
                  onChange={(e) => setNewInvQuantity(e.target.value)}
                  placeholder="Hoeveelheid (bijv. 500 g)"
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825] focus:outline-none focus:border-[#8C7654]"
                />
                <select
                  value={newInvLocation}
                  onChange={(e) => setNewInvLocation(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825]"
                >
                  <option value="pantry">Voorraadkast</option>
                  <option value="refrigerator">Koelkast</option>
                  <option value="freezer">Diepvries</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F5] font-medium hover:bg-[#433D38] transition cursor-pointer"
                >
                  Opslaan
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. BOODSCHAPPENLIJST TAB                                     */}
      {/* ============================================================ */}
      {activeTab === 'shopping' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-xl font-normal text-[#2C2825]">
                Wekelijkse Boodschappenlijst
              </h3>
              <p className="text-xs text-[#7A7167] font-light">
                Automatisch gegenereerd uit je geselecteerde weekmenu. Dubbele ingrediënten zijn samengevoegd en reeds aanwezige voorraad is gemarkeerd.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyShoppingList}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#D5CCBE] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:border-[#8C7654] transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#8C7654]" />
                <span>{copiedNotification ? 'Gekopieerd!' : 'Kopieer Lijst'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddShoppingOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2C2825] text-[#FAF8F5] text-xs font-medium hover:bg-[#433D38] transition cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Item Toevoegen</span>
              </button>
            </div>
          </div>

          {/* Add Shopping Item Form */}
          {isAddShoppingOpen && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E1D2] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-medium text-[#2C2825]">
                  Extra Boodschap Toevoegen
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddShoppingOpen(false)}
                  className="p-1 text-[#7A7167] hover:text-[#2C2825]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddShoppingItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="Item naam (bijv. Olijfolie)"
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825]"
                />
                <input
                  type="text"
                  value={newShopQuantity}
                  onChange={(e) => setNewShopQuantity(e.target.value)}
                  placeholder="Hoeveelheid (bijv. 1 fles)"
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825]"
                />
                <select
                  value={newShopCategory}
                  onChange={(e) => setNewShopCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DDD4C5] text-[#2C2825]"
                >
                  <option value="meat_fish">🥩 Vlees & Vis</option>
                  <option value="dairy_chilled">🥛 Zuivel & Koeling</option>
                  <option value="vegetables">🥕 Groenten (Gegaard)</option>
                  <option value="pantry">🍝 Voorraadkast</option>
                  <option value="spices_other">🧂 Kruiden & Overig</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F5] font-medium hover:bg-[#433D38] transition cursor-pointer"
                >
                  Toevoegen
                </button>
              </form>
            </div>
          )}

          {/* Categorized Shopping List */}
          {(nutrition.shoppingList || []).length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-[#DDD5C7] bg-[#FAF8F4] text-center space-y-3">
              <ShoppingCart className="w-8 h-8 text-[#8C7654] mx-auto opacity-70" />
              <div className="text-xs text-[#7A7167]">
                Nog geen boodschappenlijst actief. Genereer een weekmenu om automatisch een lijst aan te maken.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[
                { id: 'meat_fish' as const, label: '🥩 Vlees, Vis & Gevogelte' },
                { id: 'dairy_chilled' as const, label: '🥛 Zuivel & Koeling' },
                { id: 'vegetables' as const, label: '🥕 Groenten & Kruiden (Gegaard/Stoof)' },
                { id: 'pantry' as const, label: '🍝 Voorraadkast (Rijst, Pasta, Sauzen)' },
                { id: 'spices_other' as const, label: '🧂 Specerijen & Overig' },
              ].map((category) => {
                const categoryItems = (nutrition.shoppingList || []).filter(
                  (i) => i.category === category.id
                );
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] space-y-2.5 shadow-2xs">
                    <h4 className="text-xs font-semibold text-[#2C2825] tracking-wide">
                      {category.label}
                    </h4>
                    <div className="space-y-1.5">
                      {categoryItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleShoppingItem(item.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition cursor-pointer text-xs ${
                            item.checked
                              ? 'bg-[#FAF9F6] border-[#E8E3DA] line-through text-[#8C8275] opacity-60'
                              : 'bg-[#FAF8F4] border-[#ECE5D8] hover:border-[#8C7654]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                              item.checked
                                ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F5]'
                                : 'bg-[#FFFFFF] border-[#D5CCBE]'
                            }`}>
                              {item.checked && <Check className="w-3 h-3" />}
                            </div>
                            <span className="font-medium text-[#2C2825]">{item.name}</span>
                            {item.alreadyInStock && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2C6B38] font-medium">
                                Reeds in voorraad
                              </span>
                            )}
                          </div>

                          <span className="text-[#6D6357] font-semibold">
                            {item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Clear Checked Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleClearCheckedShopping}
                  className="text-xs text-[#7A7167] hover:text-[#2C2825] underline cursor-pointer"
                >
                  Afgevinkte items wissen
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. CULINAIR LEREN & HISTORIEK TAB                            */}
      {/* ============================================================ */}
      {activeTab === 'learning' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-normal text-[#2C2825]">
              Culinair Geheugen & Historiek
            </h3>
            <p className="text-xs text-[#7A7167] font-light">
              Alchemy leert van jouw reacties (❤️ Love, 👍 Like, 😐 Neutraal, 👎 Niet voor mij) om toekomstige weekmenu’s te verfijnen.
              De vaste Foundation-voorkeuren blijven ongewijzigd.
            </p>
          </div>

          {/* Feedback Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: '❤️ Heerlijk (Love)',
                count: (nutrition.feedbackHistory || []).filter((f) => f.feedback === 'love').length,
                desc: 'Komen met prioriteit terug',
              },
              {
                label: '👍 Lekker (Like)',
                count: (nutrition.feedbackHistory || []).filter((f) => f.feedback === 'like').length,
                desc: 'Regelmatig in weekplanning',
              },
              {
                label: '😐 Neutraal',
                count: (nutrition.feedbackHistory || []).filter((f) => f.feedback === 'neutral').length,
                desc: 'Af en toe als afwisseling',
              },
              {
                label: '👎 Niet voor mij',
                count: (nutrition.feedbackHistory || []).filter((f) => f.feedback === 'dislike').length,
                desc: 'Automatisch vermeden',
              },
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] space-y-1 shadow-2xs">
                <div className="text-xs font-medium text-[#2C2825]">{stat.label}</div>
                <div className="text-2xl font-serif font-normal text-[#8C7654]">{stat.count}</div>
                <div className="text-[10px] text-[#7A7167]">{stat.desc}</div>
              </div>
            ))}
          </div>

          {/* Recent Cooked Meals History */}
          <div className="p-5 rounded-3xl bg-[#FFFFFF] border border-[#E8E2D5] space-y-3 shadow-2xs">
            <h4 className="font-serif text-sm font-medium text-[#2C2825]">
              Recent Gekookte Maaltijden
            </h4>

            {(nutrition.mealHistory || []).length === 0 ? (
              <p className="text-xs text-[#7A7167] font-light italic">
                Nog geen maaltijden als gekookt geregistreerd. Zodra je een maaltijd afvinkt in het weekmenu verschijnt hij hier.
              </p>
            ) : (
              <div className="space-y-2">
                {(nutrition.mealHistory || []).slice(0, 8).map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE3D5] text-xs"
                  >
                    <div>
                      <div className="font-medium text-[#2C2825]">{hist.recipeName}</div>
                      <div className="text-[10px] text-[#7A7167]">
                        Gekookt op {new Date(hist.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} •{' '}
                        {hist.participants === 'couple' ? '2 personen' : '1 persoon'}
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EBF3ED] text-[#2C6B38] font-medium">
                      ✓ Bereid
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS                                                       */}
      {/* ============================================================ */}

      {/* Thursday Planning Wizard Modal */}
      <ThursdayPlanningModal
        isOpen={isThursdayModalOpen}
        onClose={() => setIsThursdayModalOpen(false)}
        onPlanGenerated={handlePlanGenerated}
        calendarEvents={calendarEvents}
        inventory={nutrition.inventory || []}
        feedbackHistory={nutrition.feedbackHistory || []}
      />

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeForModal}
        onClose={() => setSelectedRecipeForModal(null)}
        initialPortions={modalPortions}
        currentFeedback={
          selectedRecipeForModal
            ? (nutrition.feedbackHistory || []).find((f) => f.recipeId === selectedRecipeForModal.id)?.feedback
            : undefined
        }
        onSaveFeedback={handleSaveRecipeFeedback}
        lang={lang}
      />

      {/* Single Meal Replacement Selector Modal */}
      {replacementDayIndex !== null && activePlan && (() => {
        const currentRecipeId = activePlan.days[replacementDayIndex]?.recipeId || '';
        const usedRecipeIdsInPlan = activePlan.days.map((d) => d.recipeId).filter(Boolean) as string[];
        const smartSuggestion = getSmartReplacementRecipe(
          currentRecipeId,
          CURATED_RECIPES,
          nutrition.feedbackHistory || [],
          usedRecipeIdsInPlan
        );

        return (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
            onClick={() => setReplacementDayIndex(null)}
          >
            <div
              className="relative w-full max-w-xl bg-[#FCFAF6] rounded-3xl border border-[#DCD3C4] shadow-2xl p-5 sm:p-6 space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-3">
                <div>
                  <h3 className="font-serif text-lg font-normal text-[#2C2825]">
                    Vervang Maaltijd voor {activePlan.days[replacementDayIndex]?.dayOfWeek}
                  </h3>
                  <p className="text-xs text-[#7A7167] font-light">
                    Kies een ander maaltijdrecept met gepaste variatie. De rest van je weekmenu blijft ongewijzigd.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplacementDayIndex(null)}
                  className="p-1 text-[#7A7167] hover:text-[#2C2825]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Auto-Suggestion Banner */}
              {smartSuggestion && (
                <div
                  onClick={() => handleReplaceMeal(smartSuggestion.id)}
                  className="p-3.5 rounded-2xl bg-[#F5F0E6] border border-[#8C7654]/40 hover:border-[#8C7654] transition cursor-pointer flex items-center justify-between shadow-2xs group"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="text-[10px] uppercase font-bold text-[#8C7654] flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#8C7654]" />
                      <span>Aanbevolen Slimme Variatie</span>
                    </div>
                    <div className="font-serif text-xs font-semibold text-[#2C2825] group-hover:text-[#8C7654] transition">
                      {smartSuggestion.name}
                    </div>
                    <div className="text-[11px] text-[#7A7167]">
                      ⏱ {smartSuggestion.totalMinutes} min • ~{smartSuggestion.proteinGramsPerPerson}g eiwit
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-full bg-[#8C7654] text-[#FAF8F5] text-xs font-medium shrink-0 group-hover:bg-[#2C2825] transition"
                  >
                    Kies Suggestie
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                {CURATED_RECIPES.filter((r) => r.id !== currentRecipeId).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => handleReplaceMeal(r.id)}
                    className="p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#E8E2D5] hover:border-[#8C7654] transition cursor-pointer flex items-center justify-between shadow-2xs group"
                  >
                    <div className="space-y-0.5 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-medium text-xs text-[#2C2825] group-hover:text-[#8C7654] transition">
                          {r.name}
                        </span>
                        <span className="text-[10px] text-[#8C7654]">
                          {r.cuisine === 'portuguese' && '🇵🇹'}
                          {r.cuisine === 'belgian' && '🇧🇪'}
                          {r.cuisine === 'italian' && '🇮🇹'}
                          {r.cuisine === 'spanish' && '🇪🇸'}
                          {r.cuisine === 'greek' && '🇬🇷'}
                          {r.cuisine === 'french' && '🇫🇷'}
                          {r.cuisine === 'european' && '🇪🇺'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A7167] flex items-center gap-2">
                        <span>⏱ {r.totalMinutes} min</span>
                        <span>•</span>
                        <span>~{r.proteinGramsPerPerson}g eiwit</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 rounded-full bg-[#2C2825] text-[#FAF8F5] text-[11px] font-medium shrink-0 group-hover:bg-[#8C7654] transition"
                    >
                      Kies Dit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
