'use client';
// ═══════════════════════════════════════════════════════════
// СПИСОК АЛГОРИТМА v2.0 — DnD, вложенные циклы, цвета
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { Command, DragInfo, DropTarget } from './types';
import { COMMAND_META } from './CommandPanel';
import { X, GripVertical, RefreshCw, Minus, Plus } from 'lucide-react';

interface CommandListProps {
  commands: Command[];
  activeCommandId?: string | null;
  onRemove: (id: string) => void;
  onMove: (dragInfo: DragInfo, target: DropTarget) => void;
  onUpdateLoop: (id: string, repeat: number) => void;
  onDragStart: (info: DragInfo) => void;
  isDragging: boolean;
  disabled?: boolean;
  /** Если передан — рендерим дочерние команды цикла (рекурсия) */
  parentId?: string;
  depth?: number;
}

/** Зона для сброса (drop zone) — тонкая полоска между командами */
function DropZone({
  targetId,
  position,
  onDrop,
  isDragging,
}: {
  targetId: string;
  position: 'before' | 'after';
  onDrop: (target: DropTarget) => void;
  isDragging: boolean;
}) {
  const [over, setOver] = useState(false);

  if (!isDragging) return <div className="h-1" />;

  return (
    <div
      className={`h-1.5 rounded-full mx-1 transition-all duration-150 ${
        over ? 'bg-violet-400 h-3 scale-x-105' : 'bg-transparent hover:bg-violet-500/30'
      }`}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop({ id: targetId, position });
      }}
    />
  );
}

/** Одна команда в алгоритме (рекурсивный компонент) */
function CommandItem({
  cmd,
  index,
  activeCommandId,
  onRemove,
  onMove,
  onUpdateLoop,
  onDragStart,
  isDragging,
  disabled,
  parentId,
  depth = 0,
}: {
  cmd: Command;
  index: number;
  activeCommandId?: string | null;
  onRemove: (id: string) => void;
  onMove: (dragInfo: DragInfo, target: DropTarget) => void;
  onUpdateLoop: (id: string, repeat: number) => void;
  onDragStart: (info: DragInfo) => void;
  isDragging: boolean;
  disabled?: boolean;
  parentId?: string;
  depth?: number;
}) {
  const meta = COMMAND_META[cmd.type];
  const isActive = activeCommandId === cmd.id;
  const [loopOver, setLoopOver] = useState(false);

  return (
    <div>
      {/* Drop zone — перед этим элементом */}
      <DropZone
        targetId={cmd.id}
        position="before"
        onDrop={target => onMove({ source: 'list', commandId: cmd.id }, target)}
        isDragging={isDragging}
      />

      {cmd.type === 'loop' ? (
        // ─── Loop блок-контейнер ────────────────────────────
        <div
          className={`
            rounded-xl border-2 transition-all duration-200
            ${isActive
              ? 'border-amber-400/80 bg-amber-900/30 shadow-lg shadow-amber-900/20'
              : 'border-amber-500/30 bg-amber-950/20'
            }
          `}
        >
          {/* Заголовок цикла */}
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing
              ${meta.bg} ${meta.color}
            `}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'list', commandId: cmd.id, parentId }));
              e.dataTransfer.effectAllowed = 'move';
              onDragStart({ source: 'list', commandId: cmd.id });
            }}
          >
            <GripVertical size={12} className="text-amber-600 shrink-0" />
            <span className="text-[10px] font-mono text-amber-600 shrink-0">{depth > 0 ? `${parentId ? '↳' : ''} ` : ''}{index + 1}</span>
            <RefreshCw size={14} strokeWidth={2.5} className="shrink-0" />
            <span className="flex-1 text-xs font-bold">Цикл</span>

            {/* Счётчик повторений */}
            {!disabled && (
              <div className="flex items-center gap-1 mr-1">
                <button
                  onClick={() => onUpdateLoop(cmd.id, Math.max(1, (cmd.repeat ?? 3) - 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-amber-800/50 hover:bg-amber-700/70 text-amber-300 text-xs"
                >
                  <Minus size={10} />
                </button>
                <span className="text-amber-300 font-black text-sm w-4 text-center">
                  {cmd.repeat ?? 3}
                </span>
                <button
                  onClick={() => onUpdateLoop(cmd.id, Math.min(10, (cmd.repeat ?? 3) + 1))}
                  className="w-5 h-5 rounded flex items-center justify-center bg-amber-800/50 hover:bg-amber-700/70 text-amber-300 text-xs"
                >
                  <Plus size={10} />
                </button>
              </div>
            )}
            {!disabled && (
              <button onClick={() => onRemove(cmd.id)} className="p-0.5 rounded text-amber-700 hover:text-rose-400">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Тело цикла — дочерние команды + drop zone */}
          <div
            className={`p-2 min-h-[40px] rounded-b-xl transition-all ${
              loopOver && isDragging ? 'bg-amber-500/10' : ''
            }`}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setLoopOver(true); }}
            onDragLeave={() => setLoopOver(false)}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              setLoopOver(false);
              const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
              onMove(data, { id: cmd.id, position: 'inside' });
            }}
          >
            {(cmd.children?.length ?? 0) === 0 ? (
              <div className={`flex items-center justify-center h-8 rounded-lg border border-dashed transition-colors text-[10px] font-medium ${
                loopOver && isDragging
                  ? 'border-amber-400 text-amber-400'
                  : 'border-amber-700/40 text-amber-700'
              }`}>
                {isDragging ? '+ Перетащи команду сюда' : 'Пустой цикл — добавь команды'}
              </div>
            ) : (
              <div className="space-y-0">
                {cmd.children!.map((child, i) => (
                  <CommandItem
                    key={child.id}
                    cmd={child}
                    index={i}
                    activeCommandId={activeCommandId}
                    onRemove={onRemove}
                    onMove={onMove}
                    onUpdateLoop={onUpdateLoop}
                    onDragStart={onDragStart}
                    isDragging={isDragging}
                    disabled={disabled}
                    parentId={cmd.id}
                    depth={depth + 1}
                  />
                ))}
                {/* Drop zone в конце дочернего списка */}
                {isDragging && (
                  <div
                    className={`h-2 rounded-full mx-1 mt-1 transition-all ${loopOver ? 'bg-amber-400/50' : 'bg-transparent'}`}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
                      onMove(data, { id: cmd.id, position: 'inside' });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ─── Обычная команда ─────────────────────────────────
        <div
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: 'list', commandId: cmd.id, parentId }));
            e.dataTransfer.effectAllowed = 'move';
            onDragStart({ source: 'list', commandId: cmd.id });
          }}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing select-none
            ${isActive
              ? `${meta.bgActive} ${meta.border} shadow-md scale-[1.01]`
              : `${meta.bg} ${meta.border} hover:brightness-110`
            }
          `}
        >
          {/* Номер */}
          <span className={`text-[10px] font-mono w-5 text-center shrink-0 opacity-50 ${meta.color}`}>
            {index + 1}
          </span>
          {/* Ручка DnD */}
          <GripVertical size={12} className="opacity-30 shrink-0" />
          {/* Иконка */}
          <span className={`shrink-0 font-bold ${meta.color}`}>{meta.icon}</span>
          {/* Название */}
          <span className={`flex-1 text-xs font-semibold ${meta.color}`}>{meta.label}</span>
          {/* Активный индикатор */}
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />}
          {/* Удаление */}
          {!disabled && (
            <button
              onClick={() => onRemove(cmd.id)}
              className="p-0.5 rounded opacity-30 hover:opacity-100 hover:text-rose-400 transition-all shrink-0"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* Drop zone — после этого элемента */}
      <DropZone
        targetId={cmd.id}
        position="after"
        onDrop={target => onMove({ source: 'list', commandId: cmd.id }, target)}
        isDragging={isDragging}
      />
    </div>
  );
}

// ─── Главный компонент списка ───────────────────────────────
export function CommandList({
  commands,
  activeCommandId,
  onRemove,
  onMove,
  onUpdateLoop,
  onDragStart,
  isDragging,
  disabled,
}: CommandListProps) {
  const [endOver, setEndOver] = useState(false);

  if (commands.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all min-h-[100px] ${
          isDragging
            ? 'border-violet-500/60 bg-violet-500/5 text-violet-400'
            : 'border-slate-700 text-slate-500'
        }`}
        onDragOver={e => { e.preventDefault(); setEndOver(true); }}
        onDragLeave={() => setEndOver(false)}
        onDrop={e => {
          e.preventDefault();
          setEndOver(false);
          const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
          onMove(data, { id: 'root-end', position: 'after' });
        }}
      >
        <div className="text-2xl mb-1">📋</div>
        <p className="text-xs text-center">{isDragging ? 'Брось сюда!' : 'Добавь команды из панели'}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[420px] pr-0.5 space-y-0">
      {commands.map((cmd, idx) => (
        <CommandItem
          key={cmd.id}
          cmd={cmd}
          index={idx}
          activeCommandId={activeCommandId}
          onRemove={onRemove}
          onMove={onMove}
          onUpdateLoop={onUpdateLoop}
          onDragStart={onDragStart}
          isDragging={isDragging}
          disabled={disabled}
          depth={0}
        />
      ))}

      {/* Drop zone в конце всего списка */}
      {isDragging && (
        <div
          className={`h-8 rounded-xl border-2 border-dashed transition-all mt-1 flex items-center justify-center text-[10px] ${
            endOver ? 'border-violet-400 bg-violet-500/10 text-violet-400' : 'border-slate-700 text-slate-600'
          }`}
          onDragOver={e => { e.preventDefault(); setEndOver(true); }}
          onDragLeave={() => setEndOver(false)}
          onDrop={e => {
            e.preventDefault();
            setEndOver(false);
            const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
            onMove(data, { id: 'root-end', position: 'after' });
          }}
        >
          {endOver ? '+ Добавить в конец' : ''}
        </div>
      )}
    </div>
  );
}
