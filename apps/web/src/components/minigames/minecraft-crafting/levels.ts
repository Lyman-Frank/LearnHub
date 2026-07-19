import { CraftingLevel } from './types';

export const DEFAULT_MC_LEVELS: CraftingLevel[] = [
  {
    id: 1,
    title: 'Уровень 1: Алмазная лихорадка',
    taskText: 'Чтобы добыть алмаз, тебе нужна железная кирка. Собери крафт кирки 3x3 (3 железа сверху, 2 палки по центру)!',
    initialInventory: [
      { id: 'wood', label: 'Дерево', count: 2 },
      { id: 'stick', label: 'Палка', count: 2 },
      { id: 'iron', label: 'Железо', count: 3 },
    ],
    obstacle: 'diamond_ore',
    requiredTool: 'iron_pickaxe',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Уровень 2: Нападение Зомби',
    taskText: 'На тебя надвигается зомби! Скрафти железный меч (1 палка снизу, 2 железа над ней), чтобы отбиться.',
    initialInventory: [
      { id: 'wood', label: 'Дерево', count: 1 },
      { id: 'stick', label: 'Палка', count: 2 },
      { id: 'iron', label: 'Железо', count: 2 },
    ],
    obstacle: 'zombie',
    requiredTool: 'iron_sword',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];
