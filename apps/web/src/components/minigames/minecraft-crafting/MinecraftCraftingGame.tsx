'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { ItemId, InventoryItem, CraftingLevel } from './types';
import { executeCrafting } from './engine';
import { 
  Steve, DiamondOre, WoodBlock, DirtBlock,
  WoodItem, StickItem, IronItem, IronPickaxeItem, TrashItem, SpriteProps
} from './Sprites';

// Mapping for item icons
const ItemIcons: Record<string, React.FC<SpriteProps>> = {
  wood: WoodItem,
  stick: StickItem,
  iron: IronItem,
  iron_pickaxe: IronPickaxeItem,
  trash: TrashItem,
  diamond: TrashItem,
  dirt: TrashItem,
  stone: TrashItem,
};

const ObstacleIcons: Record<string, React.FC<SpriteProps>> = {
  wood_block: WoodBlock,
  dirt_block: DirtBlock,
  diamond_ore: DiamondOre,
};

const LEVEL_1: CraftingLevel = {
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
};

type DragSource = 'inventory' | number;

export default function MinecraftCraftingGame() {
  const [level, setLevel] = useState<CraftingLevel>(LEVEL_1);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [grid, setGrid] = useState<(ItemId | null)[]>(Array(9).fill(null));
  
  const [gameState, setGameState] = useState<'playing' | 'animating' | 'won' | 'error'>('playing');
  const [message, setMessage] = useState<string>('');
  const [craftedItem, setCraftedItem] = useState<ItemId | null>(null);

  const [draggedItem, setDraggedItem] = useState<{ id: ItemId, source: DragSource } | null>(null);

  useEffect(() => {
    resetLevel();
  }, []);

  const resetLevel = () => {
    setInventory(LEVEL_1.initialInventory.map(item => ({...item})));
    setGrid(Array(9).fill(null));
    setGameState('playing');
    setMessage('');
    setCraftedItem(null);
  };

  const decrementInventory = (id: ItemId) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, count: item.count - 1 } : item));
  };

  const incrementInventory = (id: ItemId) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, count: item.count + 1 } : item));
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, id: ItemId, source: DragSource) => {
    if (gameState !== 'playing') {
      e.preventDefault();
      return;
    }
    setDraggedItem({ id, source });
    // Required for Firefox
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnGrid = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (gameState !== 'playing' || !draggedItem) return;
    
    const { id, source } = draggedItem;
    const newGrid = [...grid];
    const existingItem = newGrid[index];

    if (source === 'inventory') {
      // Dragged from inventory to grid
      if (existingItem) {
        incrementInventory(existingItem);
      }
      decrementInventory(id);
      newGrid[index] = id;
    } else if (typeof source === 'number') {
      // Dragged from grid to grid (Swap)
      newGrid[source] = existingItem;
      newGrid[index] = id;
    }

    setGrid(newGrid);
    setDraggedItem(null);
  };

  const handleDropOnInventory = (e: React.DragEvent) => {
    e.preventDefault();
    if (gameState !== 'playing' || !draggedItem) return;

    const { id, source } = draggedItem;

    if (typeof source === 'number') {
      // Return to inventory
      const newGrid = [...grid];
      newGrid[source] = null;
      setGrid(newGrid);
      incrementInventory(id);
    }
    setDraggedItem(null);
  };

  const handleCraft = () => {
    const { success, result, error } = executeCrafting(grid);

    if (success && result) {
      setCraftedItem(result);
      if (result === level.requiredTool) {
        setGameState('animating');
        setMessage('Успех! Ты скрафтил нужный инструмент!');
        
        setTimeout(() => {
          setGameState('won');
          setMessage('Уровень пройден! Препятствие разрушено.');
        }, 2000); // Wait for Steve to walk and hit
      } else {
        setGameState('error');
        setMessage(`Скрафчено: ${result}, но это не то, что нужно!`);
        setTimeout(() => { resetLevel(); }, 3000);
      }
    } else {
      setGameState('error');
      setCraftedItem('trash');
      setMessage(error || 'Ошибка крафта!');
      setTimeout(() => { resetLevel(); }, 3000);
    }
  };

  const ObstacleComp = ObstacleIcons[level.obstacle] || TrashItem;
  const CraftedItemComp = craftedItem ? (ItemIcons[craftedItem] || TrashItem) : null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 font-mono">
      
      {/* ─── ZONE 3: Task Bar ─── */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 shadow-md z-10">
        <h2 className="text-xl font-bold text-amber-400 mb-2">{level.title}</h2>
        <p className="text-slate-300">{level.taskText}</p>
      </div>

      {/* ─── ZONE 2: Game View (Scene) ─── */}
      <div className="relative h-64 bg-sky-300 border-b-4 border-emerald-600 overflow-hidden">
        {/* Square Sun */}
        <div className="absolute top-4 left-10 w-16 h-16 bg-yellow-300 shadow-md" />
        
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-emerald-500" />
        <div className="absolute bottom-0 w-full h-4 bg-amber-700 opacity-50" />

        {/* Scene Container */}
        <div className="absolute inset-0 flex items-end justify-between px-16 pb-8">
          {/* Steve (Player) - animate sliding right during 'animating' phase */}
          <div 
            className="transition-transform duration-[1500ms] ease-in-out relative"
            style={{ transform: gameState === 'animating' ? 'translateX(calc(100vw - 400px))' : 'translateX(0)' }}
          >
            <Steve size={112} />
            {/* Tool in hand during animation */}
            {gameState === 'animating' && CraftedItemComp && (
              <div className="absolute top-6 -right-6 animate-pulse">
                <CraftedItemComp size={48} />
              </div>
            )}
          </div>

          {/* Obstacle */}
          <div className={`transition-all duration-300 ${gameState === 'won' ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
            <ObstacleComp size={96} />
          </div>
        </div>

        {/* Overlay Messages */}
        {(gameState === 'error' || gameState === 'won' || message) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-black/80 border-2 border-white/20 backdrop-blur-md z-10 text-center shadow-xl">
            <span className={`text-lg font-bold ${gameState === 'won' ? 'text-emerald-400' : gameState === 'error' ? 'text-rose-400' : 'text-white'}`}>
              {message}
            </span>
          </div>
        )}
      </div>

      {/* ─── ZONE 1: Logic Workspace ─── */}
      <div className="bg-[#c6c6c6] p-6 text-slate-900 flex flex-col lg:flex-row gap-8 min-h-[300px]">
        
        {/* Left: Inventory */}
        <div 
          className="flex-1 bg-[#c6c6c6] rounded p-4"
          onDragOver={handleDragOver}
          onDrop={handleDropOnInventory}
        >
          <h3 className="text-[#373737] uppercase tracking-widest text-sm mb-4 font-bold border-b-2 border-[#8b8b8b] pb-2">Инвентарь</h3>
          <div className="grid grid-cols-4 gap-2">
            {inventory.map(item => {
              const Icon = ItemIcons[item.id] || TrashItem;
              const isEmpty = item.count <= 0;
              return (
                <div 
                  key={item.id}
                  draggable={!isEmpty && gameState === 'playing'}
                  onDragStart={(e) => handleDragStart(e, item.id, 'inventory')}
                  className={`relative w-16 h-16 bg-[#8b8b8b] border-t-2 border-l-2 border-t-[#373737] border-l-[#373737] border-b-2 border-r-2 border-b-white border-r-white flex items-center justify-center
                    ${isEmpty ? 'opacity-30' : 'cursor-grab hover:bg-[#a0a0a0]'}`}
                >
                  {!isEmpty && <Icon size={40} />}
                  {!isEmpty && (
                    <span className="absolute bottom-0 right-1 text-white font-bold text-sm" style={{ textShadow: '2px 2px 0 #373737' }}>
                      {item.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500 max-w-[200px]">Перетащите ресурсы в сетку крафта.</p>
        </div>

        {/* Right: Workbench (3x3 Grid) */}
        <div className="flex-[2] bg-[#c6c6c6] rounded p-4 flex flex-col md:flex-row gap-8 items-center border-l-4 border-[#8b8b8b]">
          
          <div className="flex-1 w-full">
            <h3 className="text-[#373737] uppercase tracking-widest text-sm mb-4 font-bold">Сетка Крафта</h3>
            <div className="grid grid-cols-3 gap-1 w-max mx-auto bg-[#c6c6c6]">
              {grid.map((cellId, index) => {
                const Icon = cellId ? (ItemIcons[cellId] || TrashItem) : null;
                return (
                  <div 
                    key={index}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnGrid(e, index)}
                    draggable={!!cellId && gameState === 'playing'}
                    onDragStart={(e) => cellId && handleDragStart(e, cellId, index)}
                    className={`w-16 h-16 bg-[#8b8b8b] border-t-2 border-l-2 border-t-[#373737] border-l-[#373737] border-b-2 border-r-2 border-b-white border-r-white flex items-center justify-center transition-colors
                      ${cellId ? 'cursor-grab' : ''} ${gameState === 'playing' ? 'hover:bg-[#a0a0a0]' : ''}`}
                  >
                    {Icon && <Icon size={40} />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result Area */}
          <div className="flex flex-col items-center gap-4 px-4">
            <button
              onClick={handleCraft}
              disabled={gameState !== 'playing'}
              className="py-3 px-8 bg-[#4CAF50] hover:bg-[#45a049] text-white font-bold rounded-sm border-b-4 border-[#2E7D32] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-md"
            >
              Скрафтить!
            </button>
            <button
              onClick={resetLevel}
              className="text-sm text-slate-600 hover:text-slate-900 underline mt-2"
            >
              Сбросить
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
