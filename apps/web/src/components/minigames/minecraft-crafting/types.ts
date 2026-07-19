export type ItemId = 'wood' | 'stick' | 'iron' | 'iron_pickaxe' | 'diamond' | 'dirt' | 'stone' | 'trash';

export interface InventoryItem {
  id: ItemId;
  label: string;
  count: number;
}

export interface CraftingRecipe {
  ingredient1: ItemId;
  ingredient2: ItemId;
  result: ItemId;
}

export type ObstacleType = 'wood_block' | 'dirt_block' | 'diamond_ore';

export interface CraftingLevel {
  id: number;
  title: string;
  taskText: string;
  initialInventory: InventoryItem[];
  obstacle: ObstacleType;
  requiredTool: ItemId; // The tool needed to break the obstacle and win
}
