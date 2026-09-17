import React, { useState } from 'react';
import {
  ShoppingBag,
  Check,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  PackageCheck,
  Tag,
  Filter,
} from 'lucide-react';
import { WellbeingState, ShoppingItem } from '../../types';
import { generateShoppingListFromMenu } from '../../lib/wellbeingData';

interface WellbeingShoppingSectionProps {
  wellbeing: WellbeingState;
  onUpdateWellbeing: (updater: (prev: WellbeingState) => WellbeingState) => void;
  onOpenAssistantWithPrompt: (prompt: string) => void;
}

const CATEGORY_LABELS: Record<ShoppingItem['category'], string> = {
  produce: 'Fresh Produce & Greens',
  proteins: 'Proteins & Seafood',
  dairy_refrigerated: 'Refrigerated & Dairy',
  pantry: 'Pantry & Whole Grains',
  herbs_spices: 'Herbs & Seasonings',
  other: 'Specialty & Household',
};

export const WellbeingShoppingSection: React.FC<WellbeingShoppingSectionProps> = ({
  wellbeing,
  onUpdateWellbeing,
  onOpenAssistantWithPrompt,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ShoppingItem['category']>('produce');
  const [newItemQuantity, setNewItemQuantity] = useState('1 unit');

  const toggleInPantry = (id: string) => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, inPantry: !item.inPantry, checked: !item.inPantry } : item
      ),
    }));
  };

  const toggleChecked = (id: string) => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const handleDeleteItem = (id: string) => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.filter((item) => item.id !== id),
    }));
  };

  const handleUpdateQuantity = (id: string, qty: string) => {
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      ),
    }));
  };

  const handleSyncFromMenu = () => {
    const updated = generateShoppingListFromMenu(wellbeing.weeklyMenu, wellbeing.shoppingList);
    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: updated,
    }));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `sl-man-${Date.now()}`,
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity.trim() || '1 unit',
      inPantry: false,
      checked: false,
      isManual: true,
    };

    onUpdateWellbeing((prev) => ({
      ...prev,
      shoppingList: [newItem, ...prev.shoppingList],
    }));

    setNewItemName('');
    setIsAddingItem(false);
  };

  const filteredItems = wellbeing.shoppingList.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'needed') return !item.inPantry;
    if (filterCategory === 'pantry') return item.inPantry;
    return item.category === filterCategory;
  });

  const pantryCount = wellbeing.shoppingList.filter((i) => i.inPantry).length;
  const neededCount = wellbeing.shoppingList.length - pantryCount;

  // Group by category
  const categories: ShoppingItem['category'][] = [
    'produce',
    'proteins',
    'dairy_refrigerated',
    'pantry',
    'herbs_spices',
    'other',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#E8E2D6] pb-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C8377] font-serif">
            Ingredient Provisions
          </span>
          <h2 className="text-2xl font-serif text-[#2C2825] mt-1">
            Connected Shopping List
          </h2>
          <p className="text-xs text-[#7A7167] mt-1 max-w-2xl font-light leading-relaxed">
            Synchronized directly with your Weekly Menu. Mark staples already in your pantry, adjust quantities, and purchase with quiet confidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#DED6C7] bg-[#FFFFFF] text-[#2C2825] text-xs font-medium hover:bg-[#F2ECE1] transition cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#8C8377]" />
            <span>Sync from Menu</span>
          </button>

          <button
            onClick={() => setIsAddingItem(true)}
            id="add-shopping-item-btn"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] text-xs font-medium hover:bg-[#1A1816] transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Overview & Quick Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#FAF8F3] border border-[#E8E2D6] rounded-2xl p-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7E694E]" />
            <span className="text-[#2C2825] font-medium">{neededCount} Items to procure</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A880]" />
            <span className="text-[#6A6054]">{pantryCount} Already in pantry</span>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterCategory === 'all'
                ? 'bg-[#2C2825] text-[#FAF8F3] font-medium'
                : 'text-[#6A6054] hover:bg-[#EAE3D5]'
            }`}
          >
            All ({wellbeing.shoppingList.length})
          </button>
          <button
            onClick={() => setFilterCategory('needed')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterCategory === 'needed'
                ? 'bg-[#2C2825] text-[#FAF8F3] font-medium'
                : 'text-[#6A6054] hover:bg-[#EAE3D5]'
            }`}
          >
            To Buy ({neededCount})
          </button>
          <button
            onClick={() => setFilterCategory('pantry')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterCategory === 'pantry'
                ? 'bg-[#2C2825] text-[#FAF8F3] font-medium'
                : 'text-[#6A6054] hover:bg-[#EAE3D5]'
            }`}
          >
            In Pantry ({pantryCount})
          </button>
        </div>
      </div>

      {/* Categorized Shopping Items */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const itemsInCat = filteredItems.filter((i) => i.category === cat);
          if (itemsInCat.length === 0) return null;

          return (
            <div key={cat} className="bg-[#FFFFFF] border border-[#E8E2D6] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F2ECE1] pb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6A6054]">
                  {CATEGORY_LABELS[cat]}
                </h3>
                <span className="text-[11px] text-[#8C8377]">{itemsInCat.length} items</span>
              </div>

              <div className="divide-y divide-[#F4EFE6]">
                {itemsInCat.map((item) => (
                  <div
                    key={item.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Checked / Purchased Checkbox */}
                      <button
                        onClick={() => toggleChecked(item.id)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                          item.checked
                            ? 'bg-[#2C2825] border-[#2C2825] text-[#FAF8F3]'
                            : 'border-[#DED6C7] bg-[#FFFFFF] hover:border-[#7E694E]'
                        }`}
                      >
                        {item.checked && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span
                          className={`font-medium ${
                            item.checked
                              ? 'line-through text-[#9E9486]'
                              : item.inPantry
                              ? 'text-[#6A6054]'
                              : 'text-[#2C2825]'
                          }`}
                        >
                          {item.name}
                        </span>
                        {item.isManual && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-[#F0EBE1] text-[#7A7167]">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Quantity input */}
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                        className="w-24 text-right px-2 py-1 rounded-md border border-[#E8E2D6] text-[11px] text-[#4A433A] bg-[#FAF8F4]"
                      />

                      {/* In Pantry Toggle */}
                      <button
                        onClick={() => toggleInPantry(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer ${
                          item.inPantry
                            ? 'bg-[#EAE4D8] text-[#554C40] font-medium'
                            : 'border border-[#E8E2D6] text-[#7A7167] hover:bg-[#F7F4EE]'
                        }`}
                      >
                        {item.inPantry ? 'In Pantry' : 'Mark In Pantry'}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[#9E9486] hover:text-[#C53030] p-1 transition cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Item Modal */}
      {isAddingItem && (
        <div className="fixed inset-0 z-50 bg-[#1A1816]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F3] border border-[#DED6C7] rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-3">
              <h3 className="text-base font-serif text-[#2C2825]">Add Provision Item</h3>
              <button onClick={() => setIsAddingItem(false)} className="text-xs text-[#8C8377]">✕</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Maldon flaky sea salt"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Department</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                >
                  <option value="produce">Fresh Produce & Greens</option>
                  <option value="proteins">Proteins & Seafood</option>
                  <option value="dairy_refrigerated">Refrigerated & Dairy</option>
                  <option value="pantry">Pantry & Whole Grains</option>
                  <option value="herbs_spices">Herbs & Seasonings</option>
                  <option value="other">Specialty & Household</option>
                </select>
              </div>

              <div>
                <label className="block text-[#6A6054] font-medium mb-1">Quantity</label>
                <input
                  type="text"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  placeholder="e.g. 250g box"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFFFF] border border-[#DED6C7] text-[#2C2825]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingItem(false)}
                  className="px-4 py-2 rounded-xl border border-[#DED6C7] text-[#6A6054]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2C2825] text-[#FAF8F3] font-medium"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
