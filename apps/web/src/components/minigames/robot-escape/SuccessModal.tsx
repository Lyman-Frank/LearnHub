'use client';
// ═══════════════════════════════════════════════════════════
// МОДАЛЬНОЕ ОКНО ПОБЕДЫ
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { Trophy, Star, RotateCcw, ChevronRight } from 'lucide-react';

interface SuccessModalProps {
  levelId: number;
  coinsCollected: number;
  totalCoins: number;
  commandCount: number;
  onRestart: () => void;
  onNextLevel?: () => void;
}

export function SuccessModal({
  levelId,
  coinsCollected,
  totalCoins,
  commandCount,
  onRestart,
  onNextLevel,
}: SuccessModalProps) {
  // Рейтинг звёздами в зависимости от кол-ва монет и команд
  const stars = coinsCollected === totalCoins ? 3 : coinsCollected > 0 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-sm w-full mx-4 rounded-3xl border border-violet-500/30 bg-gradient-to-b from-[#130d2a] to-[#0f0a1e] shadow-2xl shadow-violet-900/50 overflow-hidden">
        {/* Декоративный фон */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-fuchsia-600/20 blur-3xl" />
        </div>

        {/* Конфетти точки */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 50}%`,
              background: ['#a78bfa', '#f0abfc', '#fbbf24', '#34d399'][i % 4],
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.8 + Math.random() * 0.6}s`,
            }}
          />
        ))}

        <div className="relative z-10 p-8 flex flex-col items-center text-center space-y-5">
          {/* Трофей */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-xl shadow-amber-500/30">
            <Trophy size={40} className="text-amber-900" strokeWidth={2.5} />
          </div>

          {/* Заголовок */}
          <div>
            <h2 className="text-3xl font-black text-white mb-1">Уровень пройден!</h2>
            <p className="text-slate-400 text-sm">Уровень {levelId} успешно завершён 🎉</p>
          </div>

          {/* Звёзды */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <Star
                key={s}
                size={36}
                className={`transition-all duration-500 ${
                  s <= stars
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'text-slate-700 fill-slate-800'
                }`}
                style={{ animationDelay: `${s * 0.15}s` }}
              />
            ))}
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="text-2xl font-black text-amber-400">
                {coinsCollected}<span className="text-slate-500 text-lg">/{totalCoins}</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">монет собрано</div>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className="text-2xl font-black text-violet-400">{commandCount}</div>
              <div className="text-xs text-slate-400 mt-0.5">команд использовано</div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onRestart}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all text-sm font-semibold"
            >
              <RotateCcw size={15} />
              Повтор
            </button>
            {onNextLevel && (
              <button
                onClick={onNextLevel}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-900/30"
              >
                Дальше
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
