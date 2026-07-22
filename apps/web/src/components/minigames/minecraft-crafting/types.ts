export type ItemId = 'wood' | 'stick' | 'iron' | 'iron_pickaxe' | 'iron_sword' | 'iron_axe' | 'iron_shovel' | 'diamond' | 'dirt' | 'stone' | 'trash';

export interface InventoryItem {
  id: ItemId;
  label: string;
  count: number;
}

export interface CraftingRecipe {
  shape: (ItemId | null)[]; // length 9 array representing 3x3 grid
  result: ItemId;
  shapeless?: boolean; // If true, order in the 9 slots doesn't matter
}

export type ObstacleType = 'wood_block' | 'dirt_block' | 'diamond_ore' | 'zombie';

export interface CraftingLevel {
  id: number;
  title: string;
  taskText: string;
  initialInventory: InventoryItem[];
  obstacle: ObstacleType;
  requiredTool: ItemId; // The tool needed to break the obstacle and win
  tutorial?: { title: string; content: string; };
  status?: 'published' | 'draft';
  createdAt?: string;
  updatedAt?: string;
}
