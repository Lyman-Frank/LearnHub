'use client';
// ═══════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ v2.0
// DnD, вложенные циклы, абсолютное движение
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback } from 'react';
import {
  LevelConfig, Command, RobotState, RunStatus, DragInfo, DropTarget, CommandType,
} from './types';
import {
  executeCommands, removeCommand, insertNear, insertInLoop, moveCommand, findCommand,
} from './engine';
import { GameGrid } from './GameGrid';
import { CommandPanel } from './CommandPanel';
import { CommandList } from './CommandList';
import { SuccessModal } from './SuccessModal';
import { Play, RotateCcw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_LEVELS } from './levels';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function createCommand(type: CommandType): Command {
  return {
    id: uid(),
    type,
    ...(type === 'loop' ? { repeat: 3, children: [] } : {}),
  };
}

interface RobotEscapeGameProps {
  customLevel?: LevelConfig;
}

export function RobotEscapeGame({ customLevel }: RobotEscapeGameProps) {
  const levels = customLevel ? [customLevel] : DEFAULT_LEVELS;
  const [levelIdx, setLevelIdx] = useState(0);
  const level = levels[levelIdx];

  const initRobot = (): RobotState => ({
    x: level.start_position.x,
    y: level.start_position.y,
  });

  const [robotState, setRobotState] = useState<RobotState>(initRobot);
  const [commands, setCommands] = useState<Command[]>([]);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCell, setErrorCell] = useState<{ x: number; y: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const cancelRef = useRef(false);

  // ─── Сброс ─────────────────────────────────────────────
  const handleReset = useCallback(() => {
    cancelRef.current = true;
    const l = levels[levelIdx];
    setRobotState({ x: l.start_position.x, y: l.start_position.y });
    setCommands([]);
    setRunStatus('idle');
    setCollectedCoins([]);
    setActiveCommandId(null);
    setErrorMsg(null);
    setErrorCell(null);
    setShowSuccess(false);
  }, [levelIdx, levels]);

  // ─── Переключение уровня ────────────────────────────────
  const switchLevel = (idx: number) => {
    cancelRef.current = true;
    setLevelIdx(idx);
    const l = levels[idx];
    setRobotState({ x: l.start_position.x, y: l.start_position.y });
    setCommands([]);
    setRunStatus('idle');
    setCollectedCoins([]);
    setActiveCommandId(null);
    setErrorMsg(null);
    setErrorCell(null);
    setShowSuccess(false);
  };

  // ─── Добавить команду (клик по кнопке) ─────────────────
  const handleAddCommand = (type: CommandType) => {
    setCommands(prev => [...prev, createCommand(type)]);
  };

  // ─── Удалить команду ────────────────────────────────────
  const handleRemove = (id: string) => {
    setCommands(prev => removeCommand(prev, id));
  };

  // ─── Обновить repeat цикла ──────────────────────────────
  const handleUpdateLoop = (id: string, repeat: number) => {
    const update = (cmds: Command[]): Command[] =>
      cmds.map(c =>
        c.id === id ? { ...c, repeat } : c.type === 'loop' && c.children
          ? { ...c, children: update(c.children) }
          : c
      );
    setCommands(prev => update(prev));
  };

  // ─── DnD: сброс (drop) ──────────────────────────────────
  const handleMove = useCallback((dragInfo: DragInfo, target: DropTarget) => {
    setIsDragging(false);

    if (dragInfo.source === 'panel' && dragInfo.commandType) {
      // Создаём новую команду
      const newCmd = createCommand(dragInfo.commandType);

      if (target.id === 'root-end') {
        setCommands(prev => [...prev, newCmd]);
        return;
      }
      if (target.position === 'inside') {
        setCommands(prev => insertInLoop(prev, target.id, newCmd));
      } else {
        setCommands(prev => insertNear(prev, target.id, target.position as 'before' | 'after', newCmd));
      }
    } else if (dragInfo.source === 'list' && dragInfo.commandId) {
      // Перемещаем существующую команду
      if (target.id === 'root-end') {
        const found = findCommand(commands, dragInfo.commandId);
        if (!found) return;
        const withoutDragged = removeCommand(commands, dragInfo.commandId);
        setCommands([...withoutDragged, found]);
        return;
      }
      setCommands(prev => moveCommand(prev, dragInfo.commandId!, target));
    }
  }, [commands]);

  // ─── Запуск алгоритма ───────────────────────────────────
  const handleRun = async () => {
    if (commands.length === 0) return;
    cancelRef.current = false;

    const startState = initRobot();
    setRobotState(startState);
    setCollectedCoins([]);
    setActiveCommandId(null);
    setErrorMsg(null);
    setErrorCell(null);
    setRunStatus('running');

    const gen = executeCommands(commands, startState, level, 480);

    for await (const result of gen) {
      if (cancelRef.current) break;

      setRobotState(result.state);
      setCollectedCoins(result.collectedCoins);

      if (result.error) {
        setErrorMsg(result.error);
        setErrorCell({ x: result.state.x, y: result.state.y });
        setRunStatus('error');
        setTimeout(() => setErrorCell(null), 2500);
        setActiveCommandId(null);
        return;
      }

      if (result.finished) {
        setRunStatus('success');
        setShowSuccess(true);
        setActiveCommandId(null);
        return;
      }
    }

    if (!cancelRef.current) {
      setRunStatus('idle');
      setActiveCommandId(null);
    }
  };

  const isRunning = runStatus === 'running';
  const totalCoins = level.coins?.length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Заголовок уровня */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-black text-white">
            Уровень {level.level_id}: {level.title}
          </h2>
          <p className="text-sm text-slate-400">{level.description}</p>
        </div>
        {levels.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={levelIdx === 0 || isRunning}
              onClick={() => switchLevel(levelIdx - 1)}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-slate-500 font-mono">{levelIdx + 1}/{levels.length}</span>
            <button
              disabled={levelIdx === levels.length - 1 || isRunning}
              onClick={() => switchLevel(levelIdx + 1)}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Основная игровая зона — горизонтальный split */}
      <div className="flex gap-5 items-start">

        {/* ЗОНА А: Поле */}
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
          <div className="overflow-auto w-full flex justify-center">
            <GameGrid
              level={level}
              robotState={robotState}
              collectedCoins={collectedCoins}
              errorCell={errorCell}
            />
          </div>

          {/* Сообщение об ошибке */}
          {errorMsg && (
            <div className="w-full max-w-lg px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Монеты */}
          {totalCoins > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Монеты:</span>
              {Array.from({ length: totalCoins }, (_, i) => (
                <span key={i} className={`text-base transition-all ${i < collectedCoins.length ? 'opacity-100' : 'opacity-20'}`}>⭐</span>
              ))}
              <span className="text-amber-400 font-bold ml-1">{collectedCoins.length}/{totalCoins}</span>
            </div>
          )}
        </div>

        {/* ЗОНА Б: Панель управления — фиксированная ширина */}
        <div className="w-72 shrink-0 flex flex-col gap-3">

          {/* Команды */}
          <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm">
            <CommandPanel
              allowedCommands={level.allowed_commands}
              onAdd={handleAddCommand}
              onDragStart={info => { setIsDragging(true); }}
              disabled={isRunning}
            />
          </div>

          {/* Алгоритм */}
          <div
            className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm flex flex-col gap-3"
            onDragEnd={() => setIsDragging(false)}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Алгоритм</p>
              {commands.length > 0 && !isRunning && (
                <button onClick={() => setCommands([])} className="text-slate-600 hover:text-rose-400 transition-colors" title="Очистить">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <CommandList
              commands={commands}
              activeCommandId={activeCommandId}
              onRemove={handleRemove}
              onMove={handleMove}
              onUpdateLoop={handleUpdateLoop}
              onDragStart={info => setIsDragging(true)}
              isDragging={isDragging}
              disabled={isRunning}
            />
          </div>

          {/* Кнопки */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 text-sm font-semibold"
            >
              <RotateCcw size={14} />
              Сброс
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || commands.length === 0}
              className="flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
            >
              {isRunning ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Выполняю...</>
              ) : (
                <><Play size={14} fill="white" />Запустить</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Модалка успеха */}
      {showSuccess && (
        <SuccessModal
          levelId={level.level_id}
          coinsCollected={collectedCoins.length}
          totalCoins={totalCoins}
          commandCount={commands.length}
          onRestart={handleReset}
          onNextLevel={
            levelIdx < levels.length - 1
              ? () => { setShowSuccess(false); switchLevel(levelIdx + 1); }
              : undefined
          }
        />
      )}
    </div>
  );
}
