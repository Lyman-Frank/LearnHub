'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export default function MinecraftCraftingAdminPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Шапка */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link href="/admin/minigames" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <ArrowLeft size={20} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Конструктор: 2D Майнкрафт</h1>
          <p className="text-sm text-slate-500">Настройка рецептов и уровней</p>
        </div>
      </div>

      <div className="card text-center py-16 space-y-4">
        <div className="flex justify-center">
          <Construction size={64} className="text-emerald-500 opacity-50" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Конструктор в разработке</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
          Здесь появится визуальный редактор для добавления новых уровней игры "2D Майнкрафт", настройки инвентаря игрока и создания новых рецептов крафта.
        </p>
      </div>
    </div>
  );
}
