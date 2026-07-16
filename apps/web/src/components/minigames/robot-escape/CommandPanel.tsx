'use client';
// ═══════════════════════════════════════════════════════════
// ПАНЕЛЬ КОМАНД — кнопки для добавления в алгоритм
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { CommandType } from './types';
import { ArrowUp, RotateCcw, RotateCw, RefreshCw } from 'lucide-react';

interface CommandButtonProps {
  type: CommandType;
  onClick: () => void;
  disabled?: boolean;
}

/** Метаданные для отрисовки кнопки каждой команды */
const COMMAND_META: Record<CommandType, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  description: string;
}> = {
  forward: {
    label: 'Шаг вперёд',
    shortLabel: 'Вперёд',
    icon: <ArrowUp size={20} strokeWidth={2.5} />,
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/30 hover:border-emerald-400/60',
    description: 'Двигает робота на 1 клетку вперёд',
  },
  turn_left: {
    label: 'Повернуть влево',
    shortLabel: 'Влево',
    icon: <RotateCcw size={20} strokeWidth={2.5} />,
    color: 'text-blue-300',
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    border: 'border-blue-500/30 hover:border-blue-400/60',
    description: 'Поворачивает робота на 90° влево',
  },
  turn_right: {
    label: 'Повернуть вправо',
    shortLabel: 'Вправо',
    icon: <RotateCw size={20} strokeWidth={2.5} />,
    color: 'text-purple-300',
    bg: 'bg-purple-500/10 hover:bg-purple-500/20',
    border: 'border-purple-500/30 hover:border-purple-400/60',
    description: 'Поворачивает робота на 90° вправо',
  },
  loop: {
    label: 'Цикл ×3',
    shortLabel: 'Цикл',
    icon: <RefreshCw size={20} strokeWidth={2.5} />,
    color: 'text-amber-300',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/30 hover:border-amber-400/60',
    description: 'Повторяет блок команд 3 раза',
  },
};

export function CommandButton({ type, onClick, disabled }: CommandButtonProps) {
  const meta = COMMAND_META[type];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={meta.description}
      className={`
        group flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 select-none
        ${meta.bg} ${meta.border} ${meta.color}
        disabled:opacity-40 disabled:cursor-not-allowed
        active:scale-95 cursor-pointer
      `}
    >
      <div className="transition-transform duration-200 group-hover:scale-110">
        {meta.icon}
      </div>
      <span className="text-[10px] font-bold tracking-wide uppercase">{meta.shortLabel}</span>
    </button>
  );
}

// ─── Панель с набором доступных команд ─────────────────────
interface CommandPanelProps {
  allowedCommands: CommandType[];
  onAdd: (type: CommandType) => void;
  disabled?: boolean;
}

export function CommandPanel({ allowedCommands, onAdd, disabled }: CommandPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Команды</p>
      <div className="grid grid-cols-2 gap-2">
        {allowedCommands.map(type => (
          <CommandButton
            key={type}
            type={type}
            onClick={() => onAdd(type)}
            disabled={disabled}
          />
        ))}
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">
        Нажимай на команды, чтобы добавить их в алгоритм
      </p>
    </div>
  );
}

export { COMMAND_META };
