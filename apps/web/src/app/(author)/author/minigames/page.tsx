'use client';
import React from 'react';
import Link from 'next/link';
import { Gamepad2, Zap } from 'lucide-react';
import { GameCard } from '@/components/minigames/GameCard';
import type { GameMeta } from '@/components/minigames/robot-escape/types';

const GAMES: GameMeta[] = [
  {
    id: 'robot-escape',
    title: 'Побег Робота',
    description: 'Напиши алгоритм, чтобы провести робота через лабиринт к финишу. Собирай монеты и избегай препятствий!',
    href: '/author/minigames/robot-escape',
    difficulty: 'easy',
    tags: ['Алгоритмы', 'Программирование', '2D'],
    available: true,
  },
  {
    id: 'code-quiz',
    title: 'Викторина Кода',
    description: 'Отвечай на вопросы по программированию быстрее других.',
    href: '/author/minigames/code-quiz',
    difficulty: 'medium',
    tags: ['Квиз', 'Знания'],
    available: false,
  },
];

export default function AuthorMinigamesPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center">
            <Gamepad2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Мини-игры</h1>
            <p className="text-sm text-slate-400">Сыграй и отдохни между уроками</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {GAMES.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
