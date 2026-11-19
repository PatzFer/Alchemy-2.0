import test from 'node:test';
import assert from 'node:assert/strict';
import { getMissingPantryStaples, hasCookedMealForDate } from './mealPlanningSafety';
import type { KitchenInventoryItem, MealHistoryEntry } from '../types';

const item = (name: string, id = name): KitchenInventoryItem => ({
  id, name, quantity: '1', location: 'pantry', category: 'pantry', addedDate: '2026-11-19',
});

const meal = (date: string, recipeId: string, status: MealHistoryEntry['status'] = 'cooked'): MealHistoryEntry => ({
  id: `${date}-${recipeId}`, date, recipeId, recipeName: 'Test meal',
  cuisine: 'italian', participants: 'both', status, cookedAt: '2026-11-19T12:00:00.000Z',
});

test('cooked meal history lookup is idempotent for the same planned date and recipe', () => {
  const history = [meal('2026-11-19', 'pasta')];
  assert.equal(hasCookedMealForDate(history, '2026-11-19', 'pasta'), true);
  assert.equal(hasCookedMealForDate(history, '2026-11-20', 'pasta'), false);
  assert.equal(hasCookedMealForDate(history, '2026-11-19', 'risotto'), false);
});

test('pantry starter items do not duplicate existing or repeated ingredients', () => {
  const existing = [item('Olijfolie')];
  const starter = [item('olijfolie', 'a'), item('Zout', 'b'), item('Zout', 'c'), item('Peper', 'd')];
  assert.deepEqual(getMissingPantryStaples(existing, starter).map((entry) => entry.name), ['Zout', 'Peper']);
});

test('used inventory does not block adding a pantry starter again', () => {
  const used = [{ ...item('Rijst'), isUsed: true }];
  assert.deepEqual(getMissingPantryStaples(used, [item('Rijst', 'fresh')]).map((entry) => entry.id), ['fresh']);
});
