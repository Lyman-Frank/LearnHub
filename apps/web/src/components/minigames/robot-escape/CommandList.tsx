'use client';
// ═══════════════════════════════════════════════════════════
// СПИСОК АЛГОРИТМА — Собранные команды пользователя
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { Command } from './types';
import { COMMAND_META } from './CommandPanel';
import { X, GripVertical } from 'lucide-react';

interface CommandListProps {
  commands: Command[];
  currentStep?: number | null; // Индекс текущей выполняемой команды
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function CommandList({ commands, currentStep, onRemove, disabled }: CommandListProps) {
  if (commands.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-700 text-slate-500 text-center min-h-[120px]">
        <div className="text-3xl mb-2">📋</div>
        <p className="text-xs">Добавь команды из панели слева</p>
      </div>
    );
  }

  // Отображение плоского списка (loop внутри разворачивается при выполнении)
  return (
    <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[320px] pr-1">
      {commands.map((cmd, idx) => {
        const meta = COMMAND_META[cmd.type];
        const isActive = currentStep === idx;
        const isPast = currentStep !== null && currentStep !== undefined && idx < currentStep;

        return (
          <div
            key={cmd.id}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
              ${isActive
                ? `${meta.bg} ${meta.border} shadow-lg scale-[1.02]`
                : isPast
                  ? 'bg-slate-900/30 border-slate-800/50 opacity-50'
                  : `bg-slate-900 border-slate-800 hover:border-slate-700`
              }
            `}
          >
            {/* Номер шага */}
            <span className={`text-[10px] font-mono w-5 text-center shrink-0 ${isActive ? meta.color : 'text-slate-600'}`}>
              {idx + 1}
            </span>

            {/* Ручка (декоративная) */}
            <GripVertical size={12} className="text-slate-700 shrink-0" />

            {/* Иконка */}
            <span className={`shrink-0 ${isActive ? meta.color : 'text-slate-400'}`}>
              {meta.icon}
            </span>

            {/* Название */}
            <span className={`flex-1 text-xs font-medium ${isActive ? meta.color : 'text-slate-300'}`}>
              {meta.label}
              {cmd.type === 'loop' && cmd.repeat && (
                <span className="ml-1 text-amber-400 font-bold">×{cmd.repeat}</span>
              )}
            </span>

            {/* Активный индикатор */}
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            )}

            {/* Кнопка удаления */}
            {!disabled && (
              <button
                onClick={() => onRemove(cmd.id)}
                className="p-0.5 rounded text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
