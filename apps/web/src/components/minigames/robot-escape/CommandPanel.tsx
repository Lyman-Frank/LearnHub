'use client';
// ═══════════════════════════════════════════════════════════
// КОМАНДНАЯ ПАНЕЛЬ v2.0 — абсолютные направления + перетаскивание
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { CommandType, DragInfo } from './types';
import { RefreshCw } from 'lucide-react';

/** Метаданные каждой команды — цвет, иконка, подпись */
export const COMMAND_META: Record<CommandType, {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;        // цвет текста
  bg: string;           // фон кнопки/плитки
  bgActive: string;     // фон при активном шаге
  border: string;
  emoji: string;
}> = {
  move_up: {
    label: 'Шаг вверх',
    shortLabel: 'Вверх',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>↑</span>,
    color: 'text-emerald-300',
    bg: 'bg-emerald-900/60',
    bgActive: 'bg-emerald-700/60',
    border: 'border-emerald-500/40',
    emoji: '↑',
  },
  move_down: {
    label: 'Шаг вниз',
    shortLabel: 'Вниз',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>↓</span>,
    color: 'text-sky-300',
    bg: 'bg-sky-900/60',
    bgActive: 'bg-sky-700/60',
    border: 'border-sky-500/40',
    emoji: '↓',
  },
  move_left: {
    label: 'Шаг влево',
    shortLabel: 'Влево',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>←</span>,
    color: 'text-violet-300',
    bg: 'bg-violet-900/60',
    bgActive: 'bg-violet-700/60',
    border: 'border-violet-500/40',
    emoji: '←',
  },
  move_right: {
    label: 'Шаг вправо',
    shortLabel: 'Вправо',
    icon: <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>,
    color: 'text-fuchsia-300',
    bg: 'bg-fuchsia-900/60',
    bgActive: 'bg-fuchsia-700/60',
    border: 'border-fuchsia-500/40',
    emoji: '→',
  },
  loop: {
    label: 'Цикл',
    shortLabel: 'Цикл',
    icon: <RefreshCw size={18} strokeWidth={2.5} />,
    color: 'text-amber-300',
    bg: 'bg-amber-900/60',
    bgActive: 'bg-amber-700/60',
    border: 'border-amber-500/40',
    emoji: '🔄',
  },
};

interface CommandPanelProps {
  allowedCommands: CommandType[];
  onAdd: (type: CommandType) => void;
  onDragStart: (info: DragInfo) => void;
  disabled?: boolean;
}

export function CommandPanel({ allowedCommands, onAdd, onDragStart, disabled }: CommandPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Команды</p>
      <div className="grid grid-cols-2 gap-2">
        {allowedCommands.map(type => {
          const meta = COMMAND_META[type];
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
                select-none
              `}
            >
              <div className="transition-transform group-hover:scale-110">{meta.icon}</div>
              <span className="text-[10px] font-bold tracking-wide uppercase leading-none">
                {meta.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        Нажимай или перетаскивай команды в алгоритм
      </p>
    </div>
  );
}
