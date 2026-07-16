'use client';
// ═══════════════════════════════════════════════════════════
// КНОПКИ УПРАВЛЕНИЯ v3.0 — Абсолютные ходы, Условия, Вызовы функций
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { CommandType, DragInfo } from './types';
import { RefreshCw, HelpCircle, Code } from 'lucide-react';

/** Метаданные каждой команды */
export const COMMAND_META: Record<CommandType, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  bgActive: string;
  border: string;
  emoji: string;
}> = {
  move_up: {
    label: 'Шаг вверх',
    shortLabel: 'Вверх',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>↑</span>,
    color: 'text-emerald-300',
    bg: 'bg-emerald-950/60',
    bgActive: 'bg-emerald-800/80',
    border: 'border-emerald-500/40',
    emoji: '↑',
  },
  move_down: {
    label: 'Шаг вниз',
    shortLabel: 'Вниз',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>↓</span>,
    color: 'text-sky-300',
    bg: 'bg-sky-950/60',
    bgActive: 'bg-sky-800/80',
    border: 'border-sky-500/40',
    emoji: '↓',
  },
  move_left: {
    label: 'Шаг влево',
    shortLabel: 'Влево',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>←</span>,
    color: 'text-violet-300',
    bg: 'bg-violet-950/60',
    bgActive: 'bg-violet-800/80',
    border: 'border-violet-500/40',
    emoji: '←',
  },
  move_right: {
    label: 'Шаг вправо',
    shortLabel: 'Вправо',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>,
    color: 'text-fuchsia-300',
    bg: 'bg-fuchsia-950/60',
    bgActive: 'bg-fuchsia-800/80',
    border: 'border-fuchsia-500/40',
    emoji: '→',
  },
  loop: {
    label: 'Цикл',
    shortLabel: 'Цикл',
    icon: <RefreshCw size={15} strokeWidth={2.5} />,
    color: 'text-amber-300',
    bg: 'bg-amber-950/60',
    bgActive: 'bg-amber-800/80',
    border: 'border-amber-500/40',
    emoji: '🔄',
  },
  if_color: {
    label: 'Если на цвете',
    shortLabel: 'Если...',
    icon: <HelpCircle size={15} strokeWidth={2.5} />,
    color: 'text-rose-300',
    bg: 'bg-rose-950/60',
    bgActive: 'bg-rose-800/80',
    border: 'border-rose-500/40',
    emoji: '❓',
  },
  call_f1: {
    label: 'Вызов F1',
    shortLabel: 'F1',
    icon: <Code size={15} strokeWidth={2.5} />,
    color: 'text-indigo-300',
    bg: 'bg-indigo-950/60',
    bgActive: 'bg-indigo-800/80',
    border: 'border-indigo-500/40',
    emoji: 'f1',
  },
  call_f2: {
    label: 'Вызов F2',
    shortLabel: 'F2',
    icon: <Code size={15} strokeWidth={2.5} />,
    color: 'text-teal-300',
    bg: 'bg-teal-950/60',
    bgActive: 'bg-teal-800/80',
    border: 'border-teal-500/40',
    emoji: 'f2',
  },
};

interface CommandPanelProps {
  allowedCommands: CommandType[];
  onAdd: (type: CommandType) => void;
  onDragStart: (info: DragInfo) => void;
  f1Name?: string;
  f2Name?: string;
  disabled?: boolean;
}

export function CommandPanel({
  allowedCommands,
  onAdd,
  onDragStart,
  f1Name = 'Функция 1',
  f2Name = 'Функция 2',
  disabled,
}: CommandPanelProps) {
  return (
    <div className="space-y-3 select-none">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Инструменты</p>
      <div className="grid grid-cols-2 gap-2">
        {allowedCommands.map(type => {
          const meta = COMMAND_META[type];
          let label = meta.shortLabel;
          if (type === 'call_f1') label = f1Name;
          if (type === 'call_f2') label = f2Name;

          return (
            <button
              key={type}
              title={meta.label}
              disabled={disabled}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'panel', commandType: type }));
                e.dataTransfer.effectAllowed = 'copy';
                onDragStart({ source: 'panel', commandType: type });
              }}
              onClick={() => onAdd(type)}
              className={`
                group flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150
                ${meta.bg} ${meta.border} ${meta.color}
                hover:brightness-125 active:scale-95
                disabled:opacity-40 disabled:cursor-not-allowed cursor-grab active:cursor-grabbing
              `}
            >
              <div className="transition-transform group-hover:scale-110">{meta.icon}</div>
              <span className="text-[10px] font-bold tracking-wide uppercase leading-none text-center max-w-full truncate">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        Кликай или тащи блоки в окно алгоритма
      </p>
    </div>
  );
}
