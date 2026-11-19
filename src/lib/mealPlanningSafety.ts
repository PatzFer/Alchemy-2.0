import type { KitchenInventoryItem, MealHistoryEntry } from '../types';

const normalizeItemName = (name: string): string =>
  name.trim().toLocaleLowerCase('nl-BE').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function hasCookedMealForDate(
  history: MealHistoryEntry[],
  date: string,
  recipeId: string,
): boolean {
  return history.some((entry) =>
    entry.date === date && entry.recipeId === recipeId && entry.status === 'cooked'
  );
}

export function getMissingPantryStaples(
  existing: KitchenInventoryItem[],
  starterItems: KitchenInventoryItem[],
): KitchenInventoryItem[] {
  const existingNames = new Set(
    existing.filter((item) => !item.isUsed).map((item) => normalizeItemName(item.name))
  );
  const addedNames = new Set<string>();
  return starterItems.filter((item) => {
    const name = normalizeItemName(item.name);
    if (!name || existingNames.has(name) || addedNames.has(name)) return false;
    addedNames.add(name);
    return true;
  });
}
