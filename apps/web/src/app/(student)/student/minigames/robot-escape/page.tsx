'use client';
// ═══════════════════════════════════════════════════════════
// СТРАНИЦА ИГРЫ «ПОБЕГ РОБОТА» — Студент
// ═══════════════════════════════════════════════════════════
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RobotEscapeGame } from '@/components/minigames/robot-escape/RobotEscapeGame';

export default function RobotEscapePage() {
  return (
    <div className="space-y-6">
      {/* Навигация назад */}
      <div className="flex items-center gap-2">
        <Link
          href="/student/minigames"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          Мини-игры
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm text-white font-medium">Побег Робота</span>
      </div>

      {/* Описание */}
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h1 className="text-2xl font-black text-white mb-2">🤖 Побег Робота</h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          Собери алгоритм из команд в правой панели и нажми{' '}
          <span className="text-violet-400 font-semibold">«Запустить»</span>, чтобы привести
          робота к финишу. Используй стрелки{' '}
          <span className="text-emerald-400 font-semibold">↑↓←→</span> для перемещения.
          Собирай звёзды ⭐ и избегай стен! Перетаскивай команды между собой,
          а{' '}
          <span className="text-amber-400 font-semibold">Цикл</span> позволяет повторять блок команд много раз.
        </p>
      </div>

      {/* Игра */}
      <RobotEscapeGame />
    </div>
  );
}
