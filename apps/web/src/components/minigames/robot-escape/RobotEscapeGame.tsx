'use client';
// ═══════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ «ПОБЕГ РОБОТА»
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback } from 'react';
import { LevelConfig, Command, RobotState, RunStatus } from './types';
import { flattenCommands, executeCommands } from './engine';
import { GameGrid } from './GameGrid';
import { CommandPanel } from './CommandPanel';
import { CommandList } from './CommandList';
import { SuccessModal } from './SuccessModal';
import { Play, RotateCcw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_LEVELS } from './levels';

// Генерация уникального ID для команды
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface RobotEscapeGameProps {
  /** Если передан — используется этот уровень. Иначе используются дефолтные */
  customLevel?: LevelConfig;
}

export function RobotEscapeGame({ customLevel }: RobotEscapeGameProps) {
  const levels = customLevel ? [customLevel] : DEFAULT_LEVELS;

  const [levelIdx, setLevelIdx] = useState(0);
  const level = levels[levelIdx];

  // Начальное состояние робота из конфига уровня
  const initRobot = (): RobotState => ({
    x: level.start_position.x,
    y: level.start_position.y,
    direction: level.start_position.direction,
  });

  const [robotState, setRobotState] = useState<RobotState>(initRobot);
  const [commands, setCommands] = useState<Command[]>([]);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCell, setErrorCell] = useState<{ x: number; y: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Ref для отмены выполнения
  const cancelRef = useRef(false);

  /** Сброс к начальному состоянию */
  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setRobotState(initRobot());
    setCommands([]);
    setRunStatus('idle');
    setCollectedCoins([]);
    setCurrentStep(null);
    setErrorMsg(null);
    setErrorCell(null);
    setShowSuccess(false);
  }, [level]);

  /** Переключение уровня */
  const switchLevel = (idx: number) => {
    cancelRef.current = true;
    setLevelIdx(idx);
    // Сбрасываем состояние для нового уровня
    const newLevel = levels[idx];
    setRobotState({
      x: newLevel.start_position.x,
      y: newLevel.start_position.y,
      direction: newLevel.start_position.direction,
    });
    setCommands([]);
    setRunStatus('idle');
    setCollectedCoins([]);
    setCurrentStep(null);
    setErrorMsg(null);
    setErrorCell(null);
    setShowSuccess(false);
  };

  /** Добавить команду в алгоритм */
  const handleAddCommand = (type: Command['type']) => {
    setCommands(prev => [
      ...prev,
      {
        id: uid(),
        type,
        ...(type === 'loop' ? { repeat: 3, children: [] } : {}),
      },
    ]);
  };

  /** Удалить команду из алгоритма */
  const handleRemoveCommand = (id: string) => {
    setCommands(prev => prev.filter(c => c.id !== id));
  };

  /** ЗАПУСТИТЬ алгоритм */
  const handleRun = async () => {
    if (commands.length === 0) return;
    cancelRef.current = false;

    // Сбрасываем состояние перед запуском (позицию — да, команды — нет)
    const startState = initRobot();
    setRobotState(startState);
    setCollectedCoins([]);
    setCurrentStep(null);
    setErrorMsg(null);
    setErrorCell(null);
    setRunStatus('running');

    // Разворачиваем loop-команды в плоский список
    const flat = flattenCommands(commands);

    // Маппинг плоского индекса → индекс в commands (для подсветки)
    let flatIdx = 0;
    let cmdIdx = 0;
    const flatToCmd: number[] = [];
    for (const cmd of commands) {
      if (cmd.type === 'loop' && cmd.repeat) {
        for (let r = 0; r < cmd.repeat; r++) {
          for (let c = 0; c < (cmd.children?.length ?? 0); c++) {
            flatToCmd.push(cmdIdx);
          }
        }
      } else {
        flatToCmd.push(cmdIdx);
      }
      cmdIdx++;
    }

    // Запускаем движок
    const gen = executeCommands(flat, startState, level, 500);

    for await (const result of gen) {
      if (cancelRef.current) break;

      setRobotState(result.state);
      setCollectedCoins(result.collectedCoins);
      setCurrentStep(flatToCmd[flatIdx] ?? null);
      flatIdx++;

      if (result.error) {
        setErrorMsg(result.error);
        setErrorCell({ x: result.state.x, y: result.state.y });
        setRunStatus('error');
        // Убираем ошибку через 2.5 сек
        setTimeout(() => setErrorCell(null), 2500);
        return;
      }

      if (result.finished) {
        setRunStatus('success');
        setShowSuccess(true);
        setCurrentStep(null);
        return;
      }
    }

    if (!cancelRef.current) {
      setRunStatus('idle');
      setCurrentStep(null);
    }
  };

  const isRunning = runStatus === 'running';
  const totalCoins = level.coins?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Заголовок уровня ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">
            Уровень {level.level_id}: {level.title}
          </h2>
          <p className="text-sm text-slate-400">{level.description}</p>
        </div>
        {/* Переключатель уровней */}
        {levels.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={levelIdx === 0 || isRunning}
              onClick={() => switchLevel(levelIdx - 1)}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs text-slate-500 font-mono px-2">
              {levelIdx + 1}/{levels.length}
            </span>
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

      {/* ── Основная игровая зона ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ЗОНА А: Поле */}
        <div className="flex-1 flex flex-col items-center gap-4">
          <div className="overflow-x-auto max-w-full">
            <GameGrid
              level={level}
              robotState={robotState}
              collectedCoins={collectedCoins}
              errorCell={errorCell}
            />
          </div>

          {/* Сообщение об ошибке */}
          {errorMsg && (
            <div className="w-full max-w-md px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium text-center animate-bounce">
              {errorMsg}
            </div>
          )}

          {/* Монеты */}
          {totalCoins > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Монеты:</span>
              {Array.from({ length: totalCoins }, (_, i) => (
                <span
                  key={i}
                  className={`text-lg transition-all ${
                    i < collectedCoins.length ? 'opacity-100' : 'opacity-20'
                  }`}
                >
                  ⭐
                </span>
              ))}
              <span className="text-amber-400 font-bold ml-1">
                {collectedCoins.length}/{totalCoins}
              </span>
            </div>
          )}
        </div>

        {/* ЗОНА Б: Панель управления */}
        <div className="w-full lg:w-72 flex flex-col gap-4">
          {/* Доступные команды */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
            <CommandPanel
              allowedCommands={level.allowed_commands}
              onAdd={handleAddCommand}
              disabled={isRunning}
            />
          </div>

          {/* Список алгоритма */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Алгоритм
              </p>
              {commands.length > 0 && !isRunning && (
                <button
                  onClick={() => setCommands([])}
                  className="text-slate-600 hover:text-rose-400 transition-colors"
                  title="Очистить всё"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <CommandList
              commands={commands}
              currentStep={currentStep}
              onRemove={handleRemoveCommand}
              disabled={isRunning}
            />
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 text-sm font-semibold flex-1"
            >
              <RotateCcw size={15} />
              Сброс
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || commands.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-sm hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-2 shadow-lg shadow-violet-900/30"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Выполняю...
                </>
              ) : (
                <>
                  <Play size={15} fill="white" />
                  Запустить
                </>
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
              ? () => {
                  setShowSuccess(false);
                  switchLevel(levelIdx + 1);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
