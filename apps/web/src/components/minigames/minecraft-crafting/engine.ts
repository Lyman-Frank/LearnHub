import { ItemId, CraftingRecipe } from './types';

export const RECIPES: CraftingRecipe[] = [
  { 
    // Stick: 2 Wood (shapeless for simplicity)
    shape: [
      null, null, null,
      null, null, null,
      null, null, null
    ], 
    result: 'stick',
    shapeless: true
  },
  { 
    // Iron Pickaxe: 3 Iron top, 2 Sticks middle
    shape: [
      'iron', 'iron', 'iron',
      null, 'stick', null,
      null, 'stick', null
    ], 
    result: 'iron_pickaxe' 
  },
];

export function executeCrafting(slots: (ItemId | null)[]): { success: boolean; result?: ItemId; error?: string } {
  // Check if grid is entirely empty
  if (slots.every(s => s === null)) {
    return { success: false, error: 'Верстак пуст!' };
  }

  // Helper to count items in a grid
  const countItems = (grid: (ItemId | null)[]) => {
    const counts: Record<string, number> = {};
    grid.forEach(i => {
      if (i) {
        counts[i] = (counts[i] || 0) + 1;
      }
    });
    return counts;
  };

  const inputCounts = countItems(slots);

  for (const recipe of RECIPES) {
    if (recipe.shapeless && recipe.result === 'stick') {
      // Hardcoded check for stick (2 wood anywhere)
      if (inputCounts['wood'] === 2 && Object.keys(inputCounts).length === 1) {
        return { success: true, result: 'stick' };
      }
    } else {
      // Shaped recipe - exact match
      let match = true;
      for (let i = 0; i < 9; i++) {
        if (slots[i] !== recipe.shape[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        return { success: true, result: recipe.result };
      }
    }
  }

  return { success: false, result: 'trash', error: 'Ошибка: Неизвестный рецепт. Получился мусор.' };
}
