'use client';
// ═══════════════════════════════════════════════════════════
// СТРАНИЦА МИНИ-ИГР — Студент
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { Gamepad2, Zap } from 'lucide-react';
import { GameCard } from '@/components/minigames/GameCard';
import type { GameMeta } from '@/components/minigames/robot-escape/types';

/** Реестр всех мини-игр — добавляй сюда новые карточки */
const GAMES: GameMeta[] = [
  {
    id: 'robot-escape',
    title: 'Побег Робота',
    description:
      'Напиши алгоритм, чтобы провести робота через лабиринт к финишу. Собирай монеты и избегай препятствий!',
    href: '/student/minigames/robot-escape',
    difficulty: 'easy',
    tags: ['Алгоритмы', 'Программирование', '2D'],
    available: true,
  },
  {
    id: 'code-quiz',
    title: 'Викторина Кода',
    description: 'Отвечай на вопросы по программированию быстрее других. Побеждает знание!',
    href: '/student/minigames/code-quiz',
    difficulty: 'medium',
    tags: ['Квиз', 'Знания'],
    available: false,
  },
  {
    id: 'binary-tower',
    title: 'Башня Двоичного Кода',
    description: 'Собери числа в двоичном формате, пока башня не рухнула. Тренируй цифровое мышление!',
    href: '/student/minigames/binary-tower',
    difficulty: 'hard',
    tags: ['Двоичный код', 'Скорость'],
    available: false,
  },
];

export default function MinigamesPage() {
  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Gamepad2 size={22} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Мини-игры</h1>
            <p className="text-sm text-slate-400">Учись играя — прокачай навыки программирования</p>
          </div>
        </div>

        {/* Баннер */}
        <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/30 border border-violet-500/20">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl" />
          </div>
          <div className="relative flex items-center gap-3">
            <Zap size={18} className="text-fuchsia-400" />
            <p className="text-sm text-slate-300">
              За каждую пройденную игру ты получаешь <span className="text-amber-400 font-bold">XP и монеты</span>!
            </p>
          </div>
        </div>
      </div>

      {/* Сетка игр */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
          Доступные игры
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {GAMES.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </div>
  );
}
