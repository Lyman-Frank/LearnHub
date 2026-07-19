'use client';
// ═══════════════════════════════════════════════════════════
// СТРАНИЦА МИНИ-ИГР — Админ (Хаб)
// ═══════════════════════════════════════════════════════════
import React from 'react';
import Link from 'next/link';
import { Gamepad2, Settings, PenTool } from 'lucide-react';

export default function AdminMinigamesHub() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Gamepad2 size={24} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Конструктор Мини-игр</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Управление уровнями и контентом обучающих игр</p>
          </div>
        </div>
      </div>

      {/* Сетка игр */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Карточка 1: Побег Робота */}
        <div className="card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                <Settings size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Побег Робота</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Редактор 2D лабиринтов. Добавляйте стены, монеты, угрозы, телепорты и настраивайте стартовые условия для обучения алгоритмике.
            </p>
            <div className="pt-4 flex justify-end">
              <Link
                href="/admin/minigames/robot-escape"
                className="btn-primary"
              >
                Открыть конструктор
              </Link>
            </div>
          </div>
        </div>

        {/* Карточка 2: 2D Майнкрафт */}
        <div className="card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <PenTool size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2D Майнкрафт (Крафт)</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Настройка рецептов и уровней для игры в крафт. Студенты должны собирать ресурсы в функции для прохождения испытаний.
            </p>
            <div className="pt-4 flex justify-end">
              <Link
                href="/admin/minigames/minecraft-crafting"
                className="btn-primary"
              >
                Открыть конструктор
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
