'use client';
import React, { useState, useEffect } from 'react';
import MinecraftCraftingGame from '@/components/minigames/minecraft-crafting/MinecraftCraftingGame';
import { CraftingLevel } from '@/components/minigames/minecraft-crafting/types';
import { DEFAULT_MC_LEVELS } from '@/components/minigames/minecraft-crafting/levels';

export default function MinecraftCraftingStudentPage() {
  const [levels, setLevels] = useState<CraftingLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('minecraft_crafting_levels');
    let loadedLevels = DEFAULT_MC_LEVELS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          loadedLevels = parsed;
        }
      } catch (e) {}
    }
    // Only show published levels to students
    const published = loadedLevels.filter(l => l.status === 'published');
    if (published.length === 0) {
      published.push(DEFAULT_MC_LEVELS[0]); // fallback
    }
    setLevels(published);
    setSelectedLevelId(published[0].id);
    setIsLoaded(true);
  }, []);

  if (!isLoaded) return null;

  const currentLevel = levels.find(l => l.id === selectedLevelId) || levels[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">2D Майнкрафт (Крафт и Функции)</h1>
          <p className="text-sm text-slate-400">Используй функции для создания инструментов и добычи ресурсов.</p>
        </div>
        {levels.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider ml-2">Уровень:</span>
            <select
              value={selectedLevelId}
              onChange={(e) => setSelectedLevelId(Number(e.target.value))}
              className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-violet-500 transition-colors"
            >
              {levels.map(l => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      {/* Container for the game */}
      <div className="w-full">
        <MinecraftCraftingGame level={currentLevel} key={currentLevel.id} />
      </div>
    </div>
  );
}
