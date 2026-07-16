'use client';
// ═══════════════════════════════════════════════════════════
// КАРТОЧКА ИГРЫ
// ═══════════════════════════════════════════════════════════
import React from 'react';
import Link from 'next/link';
import { GameMeta } from './robot-escape/types';
import { Lock, Play } from 'lucide-react';

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  hard: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
};

const DIFFICULTY_LABELS = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
};

interface GameCardProps {
  game: GameMeta;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <div
      className={`
        relative group rounded-2xl border overflow-hidden transition-all duration-300
        ${game.available
          ? 'border-slate-800 bg-slate-900/60 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-900/20 hover:-translate-y-1 cursor-pointer'
          : 'border-slate-800/50 bg-slate-900/30 cursor-not-allowed opacity-60'
        }
      `}
    >
      {/* Обложка */}
      <div className="relative h-40 bg-gradient-to-br from-violet-950/80 to-fuchsia-950/80 overflow-hidden">
        {/* Анимированный фон обложки */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${30 + i * 15}px`,
                height: `${30 + i * 15}px`,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
                background: `radial-gradient(circle, ${['#7c3aed', '#a855f7', '#6d28d9'][i % 3]}, transparent)`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Эмодзи / иконка игры по центру */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-7xl filter drop-shadow-lg transition-transform duration-300 group-hover:scale-110">
            🤖
          </div>
        </div>

        {/* Бейдж сложности */}
        <div className="absolute top-3 right-3">
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${DIFFICULTY_COLORS[game.difficulty]}`}>
            {DIFFICULTY_LABELS[game.difficulty]}
          </span>
        </div>

        {/* Замок для недоступных */}
        {!game.available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Lock size={32} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-bold text-white text-lg leading-tight">{game.title}</h3>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">{game.description}</p>
        </div>

        {/* Теги */}
        <div className="flex flex-wrap gap-1.5">
          {game.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              {tag}
            </span>
          ))}
        </div>

        {/* Кнопка */}
        {game.available ? (
          <Link
            href={game.href}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-md shadow-violet-900/30"
          >
            <Play size={14} fill="white" />
            Играть
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed">
            <Lock size={14} />
            Скоро
          </div>
        )}
      </div>
    </div>
  );
}
