'use client';
// ═══════════════════════════════════════════════════════════
// СПИСОК АЛГОРИТМА v3.0 — Условия, Вызовы функций, Смена цвета
// ═══════════════════════════════════════════════════════════
import React, { useState } from 'react';
import { Command, DragInfo, DropTarget, ColorType } from './types';
import { COMMAND_META } from './CommandPanel';
import { X, GripVertical, RefreshCw, HelpCircle, Minus, Plus } from 'lucide-react';

interface CommandListProps {
  commands: Command[];
  activeCommandId?: string | null;
  onRemove: (id: string, functionId?: 'f1' | 'f2') => void;
  onMove: (dragInfo: DragInfo, target: DropTarget) => void;
  onUpdateLoop: (id: string, repeat: number, functionId?: 'f1' | 'f2') => void;
  onUpdateIfColor: (id: string, color: ColorType, functionId?: 'f1' | 'f2') => void;
  onUpdateWhile: (id: string, condition: any, functionId?: 'f1' | 'f2') => void;
  onUpdateIfAdvanced: (id: string, condition: any, functionId?: 'f1' | 'f2') => void;
  onDragStart: (info: DragInfo) => void;
  isDragging: boolean;
  f1Name?: string;
  f2Name?: string;
  disabled?: boolean;
  functionId?: 'f1' | 'f2'; // Указывает, редактируем ли мы команды внутри F1/F2
  parentId?: string;
  depth?: number;
}

const COLOR_HEX: Record<ColorType, string> = {
  red: '#f43f5e',
  blue: '#0ea5e9',
  green: '#10b981',
  yellow: '#f59e0b',
};

function DropZone({
  targetId,
  position,
  onDrop,
  isDragging,
  functionId,
}: {
  targetId: string;
  position: 'before' | 'after';
  onDrop: (target: DropTarget) => void;
  isDragging: boolean;
  functionId?: 'f1' | 'f2';
}) {
  const [over, setOver] = useState(false);

  if (!isDragging) return <div className="h-1" />;

  return (
    <div
      className={`h-1.5 rounded-full mx-1 transition-all duration-150 ${
        over ? 'bg-violet-400 h-3 scale-x-105' : 'bg-transparent hover:bg-violet-500/20'
      }`}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onDrop({ id: targetId, position, functionId });
      }}
    />
  );
}

function CommandItem({
  cmd,
  index,
  activeCommandId,
  onRemove,
  onMove,
  onUpdateLoop,
  onUpdateIfColor,
  onUpdateWhile,
  onUpdateIfAdvanced,
  onDragStart,
  isDragging,
  f1Name,
  f2Name,
  disabled,
  functionId,
  parentId,
  depth = 0,
}: {
  cmd: Command;
  index: number;
  activeCommandId?: string | null;
  onRemove: (id: string, functionId?: 'f1' | 'f2') => void;
  onMove: (dragInfo: DragInfo, target: DropTarget) => void;
  onUpdateLoop: (id: string, repeat: number, functionId?: 'f1' | 'f2') => void;
  onUpdateIfColor: (id: string, color: ColorType, functionId?: 'f1' | 'f2') => void;
  onUpdateWhile: (id: string, condition: any, functionId?: 'f1' | 'f2') => void;
  onUpdateIfAdvanced: (id: string, condition: any, functionId?: 'f1' | 'f2') => void;
  onDragStart: (info: DragInfo) => void;
  isDragging: boolean;
  f1Name?: string;
  f2Name?: string;
  disabled?: boolean;
  functionId?: 'f1' | 'f2';
  parentId?: string;
  depth?: number;
}) {
  const meta = COMMAND_META[cmd.type];
  const isActive = activeCommandId === cmd.id;
  const [containerOver, setContainerOver] = useState(false);

  const dragSource = functionId || 'list';

  // Определение названия функции
  let displayLabel = meta.label;
  if (cmd.type === 'call_f1' && f1Name) displayLabel = `Вызов: ${f1Name}`;
  if (cmd.type === 'call_f2' && f2Name) displayLabel = `Вызов: ${f2Name}`;

  return (
    <div>
      <DropZone
        targetId={cmd.id}
        position="before"
        onDrop={target => onMove({ source: dragSource, commandId: cmd.id, functionId }, target)}
        isDragging={isDragging}
        functionId={functionId}
      />

      {cmd.type === 'loop' || cmd.type === 'if_color' || cmd.type === 'while' || cmd.type === 'if_advanced' ? (
        // ─── БЛОК-КОНТЕЙНЕР (Цикл, Условие, While, If_Advanced) ────────────────
        <div
          className={`
            rounded-xl border-2 transition-all duration-200
            ${isActive
              ? 'border-violet-400/80 bg-violet-955/20 shadow-lg'
              : cmd.type === 'loop'
                ? 'border-amber-500/20 bg-amber-950/10'
                : cmd.type === 'while'
                  ? 'border-orange-500/20 bg-orange-950/10'
                  : cmd.type === 'if_advanced'
                    ? 'border-pink-500/20 bg-pink-950/10'
                    : 'border-rose-500/20 bg-rose-955/10'
            }
          `}
        >
          {/* Шапка контейнера */}
          <div
            className={`
              flex items-center gap-2 px-3 py-2 rounded-t-xl cursor-grab active:cursor-grabbing select-none
              ${meta.bg} ${meta.color}
            `}
            draggable
            onDragStart={e => {
              e.dataTransfer.setData('text/plain', JSON.stringify({ source: dragSource, commandId: cmd.id, functionId }));
              e.dataTransfer.effectAllowed = 'move';
              onDragStart({ source: dragSource, commandId: cmd.id, functionId });
            }}
          >
            <GripVertical size={12} className="opacity-40 shrink-0" />
            <span className="text-[10px] font-mono opacity-50 shrink-0">{depth > 0 ? '↳ ' : ''}{index + 1}</span>
            {meta.icon}
            
            {cmd.type === 'loop' ? (
              <>
                <span className="flex-1 text-xs font-bold">Цикл</span>
                {!disabled && (
                  <div className="flex items-center gap-1 mr-1">
                    <button
                      onClick={() => onUpdateLoop(cmd.id, Math.max(1, (cmd.repeat ?? 3) - 1), functionId)}
                      className="w-5 h-5 rounded flex items-center justify-center bg-amber-800/40 hover:bg-amber-700/60 text-amber-300 text-xs"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-amber-300 font-bold text-xs w-4 text-center">
                      {cmd.repeat ?? 3}
                    </span>
                    <button
                      onClick={() => onUpdateLoop(cmd.id, Math.min(10, (cmd.repeat ?? 3) + 1), functionId)}
                      className="w-5 h-5 rounded flex items-center justify-center bg-amber-800/40 hover:bg-amber-700/60 text-amber-300 text-xs"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                )}
              </>
            ) : cmd.type === 'if_color' ? (
              <>
                <span className="text-xs font-bold mr-1">Если на</span>
                {/* Селектор цвета плитки для условия */}
                {!disabled && (
                  <div className="flex gap-1 bg-black/40 p-0.5 rounded-full border border-rose-500/20">
                    {(['red', 'blue', 'green', 'yellow'] as ColorType[]).map(color => (
                      <button
                        key={color}
                        onClick={() => onUpdateIfColor(cmd.id, color, functionId)}
                        className={`w-3.5 h-3.5 rounded-full border transition-all ${
                          cmd.conditionColor === color
                            ? 'border-white scale-110 ring-2 ring-violet-500/30'
                            : 'border-transparent opacity-40 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: COLOR_HEX[color] }}
                        title={`Выбрать ${color}`}
                      />
                    ))}
                  </div>
                )}
                {disabled && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/50"
                    style={{ backgroundColor: COLOR_HEX[cmd.conditionColor ?? 'red'] }}
                  />
                )}
                <span className="flex-1" />
              </>
            ) : cmd.type === 'while' ? (
              <>
                <span className="text-xs font-bold mr-1 text-orange-200">Пока:</span>
                {!disabled && cmd.whileCondition && (
                  <select
                    className="bg-black/40 text-xs text-orange-300 outline-none border border-orange-500/30 rounded p-0.5"
                    value={cmd.whileCondition.type}
                    onChange={e => onUpdateWhile(cmd.id, { ...cmd.whileCondition, type: e.target.value as any }, functionId)}
                  >
                    <option value="free_ahead">Свободно впереди</option>
                    <option value="color">На цвете</option>
                    <option value="resource_gte">Ресурсов &gt;= 1</option>
                  </select>
                )}
                {disabled && cmd.whileCondition && <span className="text-xs text-orange-300">{cmd.whileCondition.type}</span>}
                <span className="flex-1" />
              </>
            ) : (
              <>
                <span className="text-xs font-bold mr-1 text-pink-200">Условие И:</span>
                {!disabled && cmd.advancedCondition && (
                  <div className="flex gap-1">
                    <select
                      className="bg-black/40 text-[10px] text-pink-300 outline-none border border-pink-500/30 rounded p-0.5"
                      value={cmd.advancedCondition.clauses[0]?.type || 'resource_gte'}
                      onChange={e => onUpdateIfAdvanced(cmd.id, { ...cmd.advancedCondition, clauses: [{ type: e.target.value as any, value: e.target.value === 'resource_gte' ? 1 : 'red' }] }, functionId)}
                    >
                      <option value="resource_gte">Ресурсов &gt;= 1</option>
                      <option value="free_ahead">Свободно впереди</option>
                    </select>
                  </div>
                )}
                {disabled && <span className="text-[10px] text-pink-300">Настроено</span>}
                <span className="flex-1" />
              </>
            )}

            {!disabled && (
              <button onClick={() => onRemove(cmd.id, functionId)} className="p-0.5 rounded opacity-50 hover:opacity-100 hover:text-rose-400">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Дочерние элементы контейнера */}
          <div
            className={`p-2 min-h-[40px] rounded-b-xl transition-all ${
              containerOver && isDragging ? 'bg-violet-500/10' : ''
            }`}
            onDragOver={e => { e.preventDefault(); e.stopPropagation(); setContainerOver(true); }}
            onDragLeave={() => setContainerOver(false)}
            onDrop={e => {
              e.preventDefault();
              e.stopPropagation();
              setContainerOver(false);
              const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
              onMove(data, { id: cmd.id, position: 'inside', functionId });
            }}
          >
            {(cmd.children?.length ?? 0) === 0 ? (
              <div className="flex items-center justify-center h-8 rounded-lg border border-dashed border-slate-700/50 text-[10px] text-slate-500">
                {isDragging ? '+ Перетащи блок внутрь' : 'Пусто — перетащи блоки'}
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
                    onUpdateIfColor={onUpdateIfColor}
                    onUpdateWhile={onUpdateWhile}
                    onUpdateIfAdvanced={onUpdateIfAdvanced}
                    onDragStart={onDragStart}
                    isDragging={isDragging}
                    f1Name={f1Name}
                    f2Name={f2Name}
                    disabled={disabled}
                    functionId={functionId}
                    parentId={cmd.id}
                    depth={depth + 1}
                  />
                ))}
                {/* Конечный drop zone внутри списка детей */}
                {isDragging && (
                  <div
                    className={`h-2 rounded-full mx-1 mt-1 transition-all ${containerOver ? 'bg-violet-400/40' : 'bg-transparent'}`}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
                      onMove(data, { id: cmd.id, position: 'inside', functionId });
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        // ─── ОБЫЧНЫЙ БЛОК (Движение или Вызов функции) ───────
        <div
          draggable
          onDragStart={e => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ source: dragSource, commandId: cmd.id, functionId }));
            e.dataTransfer.effectAllowed = 'move';
            onDragStart({ source: dragSource, commandId: cmd.id, functionId });
          }}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 cursor-grab active:cursor-grabbing select-none
            ${isActive
              ? `${meta.bgActive} ${meta.border} shadow-md scale-[1.01]`
              : `${meta.bg} ${meta.border} hover:brightness-110`
            }
          `}
        >
          <span className={`text-[10px] font-mono w-5 text-center shrink-0 opacity-50 ${meta.color}`}>
            {index + 1}
          </span>
          <GripVertical size={12} className="opacity-30 shrink-0" />
          <span className={`shrink-0 font-bold ${meta.color}`}>{meta.icon}</span>
          <span className={`flex-1 text-xs font-semibold ${meta.color}`}>{displayLabel}</span>
          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />}
          {!disabled && (
            <button
              onClick={() => onRemove(cmd.id, functionId)}
              className="p-0.5 rounded opacity-30 hover:opacity-100 hover:text-rose-400 transition-all shrink-0"
            >
              <X size={11} />
            </button>
          )}
        </div>
      )}

      <DropZone
        targetId={cmd.id}
        position="after"
        onDrop={target => onMove({ source: dragSource, commandId: cmd.id, functionId }, target)}
        isDragging={isDragging}
        functionId={functionId}
      />
    </div>
  );
}

export function CommandList({
  commands,
  activeCommandId,
  onRemove,
  onMove,
  onUpdateLoop,
  onUpdateIfColor,
  onUpdateWhile,
  onUpdateIfAdvanced,
  onDragStart,
  isDragging,
  f1Name,
  f2Name,
  disabled,
  functionId,
}: CommandListProps) {
  const [endOver, setEndOver] = useState(false);
  const dropTargetEndId = functionId ? `${functionId}-end` : 'root-end';

  if (commands.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed transition-all min-h-[90px] select-none ${
          isDragging
            ? 'border-violet-500/60 bg-violet-500/5 text-violet-400'
            : 'border-slate-700/60 text-slate-500'
        }`}
        onDragOver={e => { e.preventDefault(); setEndOver(true); }}
        onDragLeave={() => setEndOver(false)}
        onDrop={e => {
          e.preventDefault();
          setEndOver(false);
          const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
          onMove(data, { id: dropTargetEndId, position: 'after', functionId });
        }}
      >
        <div className="text-xl mb-1 opacity-70">📋</div>
        <p className="text-[10px] text-center opacity-85">
          {isDragging ? 'Брось сюда!' : 'Перетащи действия сюда'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto max-h-[350px] pr-0.5 space-y-0">
      {commands.map((cmd, idx) => (
        <CommandItem
          key={cmd.id}
          cmd={cmd}
          index={idx}
          activeCommandId={activeCommandId}
          onRemove={onRemove}
          onMove={onMove}
          onUpdateLoop={onUpdateLoop}
          onUpdateIfColor={onUpdateIfColor}
          onUpdateWhile={onUpdateWhile}
          onUpdateIfAdvanced={onUpdateIfAdvanced}
          onDragStart={onDragStart}
          isDragging={isDragging}
          f1Name={f1Name}
          f2Name={f2Name}
          disabled={disabled}
          functionId={functionId}
          depth={0}
        />
      ))}

      {isDragging && (
        <div
          className={`h-8 rounded-xl border-2 border-dashed transition-all mt-1 flex items-center justify-center text-[10px] select-none ${
            endOver ? 'border-violet-400 bg-violet-500/10 text-violet-400' : 'border-slate-700/50 text-slate-600'
          }`}
          onDragOver={e => { e.preventDefault(); setEndOver(true); }}
          onDragLeave={() => setEndOver(false)}
          onDrop={e => {
            e.preventDefault();
            setEndOver(false);
            const data = JSON.parse(e.dataTransfer.getData('text/plain')) as DragInfo;
            onMove(data, { id: dropTargetEndId, position: 'after', functionId });
          }}
        >
          {endOver ? '+ Добавить в конец' : ''}
        </div>
      )}
    </div>
  );
}
