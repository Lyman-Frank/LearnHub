'use client';
import React from 'react';
import MinecraftCraftingGame from '@/components/minigames/minecraft-crafting/MinecraftCraftingGame';

export default function MinecraftCraftingStudentPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">2D Майнкрафт (Крафт и Функции)</h1>
          <p className="text-sm text-slate-400">Используй функции для создания инструментов и добычи ресурсов.</p>
        </div>
      </div>
      
      {/* Container for the game */}
      <div className="w-full">
        <MinecraftCraftingGame />
      </div>
    </div>
  );
}
