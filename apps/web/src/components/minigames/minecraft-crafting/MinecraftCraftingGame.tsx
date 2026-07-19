'use client';

import React, { useState, useEffect } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { ItemId, InventoryItem, ObstacleType, CraftingLevel } from './types';
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
  diamond: TrashItem, // fallback
  dirt: TrashItem, // fallback
  stone: TrashItem, // fallback
};

const ObstacleIcons: Record<string, React.FC<SpriteProps>> = {
  wood_block: WoodBlock,
  dirt_block: DirtBlock,
  diamond_ore: DiamondOre,
};

// Hardcoded Level 1 for now
const LEVEL_1: CraftingLevel = {
  id: 1,
  title: 'Уровень 1: Алмазная лихорадка',
  taskText: 'Чтобы добыть алмаз, тебе нужна железная кирка. Напиши функцию крафта, соединив Палку и Железо!',
  initialInventory: [
    { id: 'wood', label: 'Дерево', count: 2 },
    { id: 'stick', label: 'Палка', count: 1 },
    { id: 'iron', label: 'Железо', count: 3 },
  ],
  obstacle: 'diamond_ore',
  requiredTool: 'iron_pickaxe',
};

export default function MinecraftCraftingGame() {
  const [level, setLevel] = useState<CraftingLevel>(LEVEL_1);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [slot1, setSlot1] = useState<ItemId | null>(null);
  const [slot2, setSlot2] = useState<ItemId | null>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'animating' | 'won' | 'error'>('playing');
  const [message, setMessage] = useState<string>('');
  const [craftedItem, setCraftedItem] = useState<ItemId | null>(null);

  useEffect(() => {
    resetLevel();
  }, []);

  const resetLevel = () => {
    setInventory([...LEVEL_1.initialInventory]);
    setSlot1(null);
    setSlot2(null);
    setGameState('playing');
    setMessage('');
    setCraftedItem(null);
  };

  // Click-to-select logic
  const handleInventoryClick = (item: InventoryItem) => {
    if (gameState !== 'playing') return;
    if (item.count <= 0) return;

    if (!slot1) {
      setSlot1(item.id);
      decrementInventory(item.id);
    } else if (!slot2) {
      setSlot2(item.id);
      decrementInventory(item.id);
    }
  };

  const handleSlotClick = (slotIndex: 1 | 2) => {
    if (gameState !== 'playing') return;
    
    if (slotIndex === 1 && slot1) {
      incrementInventory(slot1);
      setSlot1(null);
    } else if (slotIndex === 2 && slot2) {
      incrementInventory(slot2);
      setSlot2(null);
    }
  };

  const decrementInventory = (id: ItemId) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, count: item.count - 1 } : item));
  };

  const incrementInventory = (id: ItemId) => {
    setInventory(prev => prev.map(item => item.id === id ? { ...item, count: item.count + 1 } : item));
  };

  const handleCraft = () => {
    if (!slot1 || !slot2) {
      setMessage('Ошибка: Заполни оба аргумента функции craft(arg1, arg2)!');
      setGameState('error');
      setTimeout(() => { setGameState('playing'); setMessage(''); }, 2000);
      return;
    }

    const { success, result, error } = executeCrafting(slot1, slot2);

    if (success && result) {
      setCraftedItem(result);
      if (result === level.requiredTool) {
        setGameState('animating');
        setMessage('Успех! Ты скрафтил нужный инструмент!');
        
        // Simulate animation delay then win
        setTimeout(() => {
          setGameState('won');
          setMessage('Уровень пройден! Препятствие разрушено.');
        }, 2000);
      } else {
        setGameState('error');
        setMessage(`Скрафчено: ${result}, но это не то, что нужно для препятствия!`);
        // Refund? or let them keep the new item? Let's refund for simplicity of level 1
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
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-900 font-mono">
      
      {/* ─── ZONE 3: Task Bar ─── */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        <h2 className="text-xl font-bold text-amber-400 mb-2">{level.title}</h2>
        <p className="text-slate-300">{level.taskText}</p>
      </div>

      {/* ─── ZONE 2: Game View (Scene) ─── */}
      <div className="relative h-64 bg-sky-300 border-b-4 border-emerald-600 overflow-hidden">
        {/* Sun/Clouds simple CSS */}
        <div className="absolute top-4 left-10 w-12 h-12 bg-yellow-300 rounded-full opacity-80" />
        
        {/* Ground */}
        <div className="absolute bottom-0 w-full h-8 bg-emerald-500" />
        <div className="absolute bottom-0 w-full h-4 bg-amber-700 opacity-50" />

        {/* Scene Container */}
        <div className="absolute inset-0 flex items-end justify-between px-16 pb-8">
          {/* Steve (Player) */}
          <div className={`transition-transform duration-1000 ${gameState === 'animating' ? 'translate-x-32' : ''}`}>
            <Steve size={96} />
            {/* If crafting successful, show the tool in Steve's hand conceptually, or above him */}
            {gameState === 'animating' && CraftedItemComp && (
              <div className="absolute -top-10 -right-8 animate-bounce">
                <CraftedItemComp size={48} />
              </div>
            )}
          </div>

          {/* Obstacle */}
          <div className={`transition-opacity duration-500 ${gameState === 'won' ? 'opacity-0 scale-50' : 'opacity-100'}`}>
            <ObstacleComp size={96} />
          </div>
        </div>

        {/* Overlay Messages */}
        {(gameState === 'error' || gameState === 'won' || message) && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-black/70 border border-white/20 backdrop-blur-sm z-10 text-center">
            <span className={`font-bold ${gameState === 'won' ? 'text-emerald-400' : gameState === 'error' ? 'text-rose-400' : 'text-white'}`}>
              {message}
            </span>
          </div>
        )}
      </div>

      {/* ─── ZONE 1: Logic Workspace ─── */}
      <div className="bg-[#4a3b32] p-6 text-orange-50 flex flex-col md:flex-row gap-6">
        
        {/* Left: Inventory */}
        <div className="flex-1 bg-[#3a2d24] rounded-xl p-4 border-2 border-[#2a1f18]">
          <h3 className="text-amber-500/80 uppercase tracking-widest text-xs mb-4 font-bold">Инвентарь (Переменные)</h3>
          <div className="grid grid-cols-2 gap-3">
            {inventory.map(item => {
              const Icon = ItemIcons[item.id] || TrashItem;
              return (
                <button 
                  key={item.id}
                  onClick={() => handleInventoryClick(item)}
                  disabled={item.count <= 0 || gameState !== 'playing'}
                  className={`flex items-center gap-3 p-2 rounded-lg border-2 text-left transition-all
                    ${item.count > 0 && gameState === 'playing' ? 'border-[#5a483a] bg-[#4a3b32] hover:bg-[#5a483a] hover:border-amber-700 cursor-pointer' : 'border-[#2a1f18] bg-[#2a1f18] opacity-50 cursor-not-allowed'}`}
                >
                  <div className="bg-[#2a1f18] p-1 rounded">
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-amber-200/50">var {item.id}</div>
                    <div className="text-sm font-bold">{item.count} шт</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Workbench (Function logic) */}
        <div className="flex-1 bg-[#3a2d24] rounded-xl p-4 border-2 border-[#2a1f18] flex flex-col">
          <h3 className="text-amber-500/80 uppercase tracking-widest text-xs mb-4 font-bold">Верстак (Вызов функции)</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-xl text-amber-100 font-bold">craft(</div>
            
            <div className="flex items-center gap-4">
              {/* Slot 1 */}
              <button 
                onClick={() => handleSlotClick(1)}
                className={`w-20 h-20 rounded-xl border-4 flex items-center justify-center transition-colors
                  ${slot1 ? 'border-amber-600 bg-[#4a3b32] hover:border-rose-500' : 'border-dashed border-[#5a483a] bg-[#2a1f18]'}`}
              >
                {slot1 && ItemIcons[slot1] && React.createElement(ItemIcons[slot1], { size: 48 })}
              </button>

              <span className="text-2xl text-amber-600 font-black">,</span>

              {/* Slot 2 */}
              <button 
                onClick={() => handleSlotClick(2)}
                className={`w-20 h-20 rounded-xl border-4 flex items-center justify-center transition-colors
                  ${slot2 ? 'border-amber-600 bg-[#4a3b32] hover:border-rose-500' : 'border-dashed border-[#5a483a] bg-[#2a1f18]'}`}
              >
                {slot2 && ItemIcons[slot2] && React.createElement(ItemIcons[slot2], { size: 48 })}
              </button>
            </div>

            <div className="text-xl text-amber-100 font-bold">)</div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={handleCraft}
              disabled={gameState !== 'playing'}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={18} />
              Выполнить
            </button>
            <button
              onClick={resetLevel}
              className="py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-colors"
              title="Сбросить"
            >
              <RotateCcw size={18} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
