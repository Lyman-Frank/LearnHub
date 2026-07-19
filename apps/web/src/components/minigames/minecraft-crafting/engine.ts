import { ItemId, CraftingRecipe } from './types';

export const RECIPES: CraftingRecipe[] = [
  { ingredient1: 'wood', ingredient2: 'wood', result: 'stick' },
  { ingredient1: 'stick', ingredient2: 'iron', result: 'iron_pickaxe' },
  { ingredient1: 'iron', ingredient2: 'stick', result: 'iron_pickaxe' }, // order insensitive
];

export function executeCrafting(slot1: ItemId | null, slot2: ItemId | null): { success: boolean; result?: ItemId; error?: string } {
  if (!slot1 || !slot2) {
    return { success: false, error: 'Заполни оба слота для крафта!' };
  }

  const recipe = RECIPES.find(
    r => (r.ingredient1 === slot1 && r.ingredient2 === slot2) || (r.ingredient1 === slot2 && r.ingredient2 === slot1)
  );

  if (recipe) {
    return { success: true, result: recipe.result };
  }

  return { success: false, result: 'trash', error: 'Ошибка: Неизвестный рецепт. Получился мусор.' };
}
