'use client';
import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { RobotEscapeGame } from '@/components/minigames/robot-escape/RobotEscapeGame';

export default function AuthorRobotEscapePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/author/minigames" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} />
          Мини-игры
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm text-white font-medium">Побег Робота</span>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
        <h1 className="text-2xl font-black text-white mb-2">🤖 Побег Робота</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Собери алгоритм из команд и нажми «Запустить», чтобы привести робота к финишу.
        </p>
      </div>
      <RobotEscapeGame />
    </div>
  );
}
