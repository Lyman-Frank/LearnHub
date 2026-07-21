'use client';
// ═══════════════════════════════════════════════════════════
// ГЛАВНЫЙ КОМПОНЕНТ ИГРЫ v3.0 — С Условиями и Функциями
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  LevelConfig, Command, RobotState, RunStatus, DragInfo, DropTarget, CommandType, ColorType,
} from './types';
import {
  executeCommands, removeCommand, insertNear, insertInContainer, moveCommand, findCommand,
} from './engine';
import { GameGrid } from './GameGrid';
import { CommandPanel } from './CommandPanel';
import { CommandList } from './CommandList';
import { SuccessModal } from './SuccessModal';
import { Play, RotateCcw, Trash2, ChevronLeft, ChevronRight, Edit2, Check, BookOpen, AlertCircle } from 'lucide-react';
import { DEFAULT_LEVELS } from './levels';
import { api } from '@/lib/api';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function createCommand(type: CommandType): Command {
  return {
    id: uid(),
    type,
    ...(type === 'loop' ? { repeat: 3, children: [] } : {}),
    ...(type === 'if_color' ? { conditionColor: 'red', children: [] } : {}),
    ...(type === 'while' ? { whileCondition: { type: 'free_ahead' }, children: [] } : {}),
    ...(type === 'if_advanced' ? { advancedCondition: { operator: 'AND', clauses: [{ type: 'resource_gte', value: 1 }] }, children: [] } : {}),
  };
}

interface RobotEscapeGameProps {
  customLevel?: LevelConfig;
}

export function RobotEscapeGame({ customLevel }: RobotEscapeGameProps) {
  const [levelsState, setLevelsState] = useState<LevelConfig[]>(customLevel ? [customLevel] : DEFAULT_LEVELS);
  const [levelIdx, setLevelIdx] = useState(0);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);
  const level = levelsState[levelIdx] || levelsState[0];

  useEffect(() => {
    if (!customLevel && typeof window !== 'undefined') {
      const saved = localStorage.getItem('robot_escape_levels');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const published = parsed.filter((l: any) => l.status === 'published');
          if (published.length > 0) {
            setLevelsState(published);
          }
        } catch (e) {}
      }
      // Загрузка прогресса с бэкенда
      api.getMinigameProgress('ROBOT_ESCAPE')
        .then(progress => {
          if (progress) {
            setCompletedLevels(progress.map((p: any) => p.levelId));
            // Ищем первый непройденный уровень, если сейчас на нулевом
            const uncompletedIdx = DEFAULT_LEVELS.findIndex(l => !progress.find((p: any) => p.levelId === l.level_id.toString()));
            if (uncompletedIdx > 0 && levelIdx === 0) {
              setLevelIdx(uncompletedIdx);
            }
          }
        })
        .catch(() => {});
    }
  }, [customLevel]);

  const initRobot = (): RobotState => ({
    x: level.start_position.x,
    y: level.start_position.y,
  });

  const [robotState, setRobotState] = useState<RobotState>(initRobot);
  
  // Команды основного алгоритма и функций F1, F2
  const [commands, setCommands] = useState<Command[]>([]);
  const [f1Commands, setF1Commands] = useState<Command[]>([]);
  const [f2Commands, setF2Commands] = useState<Command[]>([]);

  // Пользовательские имена функций
  const [f1Name, setF1Name] = useState('Функция F1');
  const [f2Name, setF2Name] = useState('Функция F2');
  const [isEditingF1, setIsEditingF1] = useState(false);
  const [isEditingF2, setIsEditingF2] = useState(false);

  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [collectedCoins, setCollectedCoins] = useState<string[]>([]);
  const [collectedResources, setCollectedResources] = useState<string[]>([]);
  const [activeCommandId, setActiveCommandId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCell, setErrorCell] = useState<{ x: number; y: number } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Обучающий оверлей
  const [showTutorial, setShowTutorial] = useState(false);

  const cancelRef = useRef(false);

  // Показываем обучение при старте уровня, если оно есть и уровень еще не пройден
  useEffect(() => {
    if (level.tutorial && !completedLevels.includes(level.level_id.toString())) {
      setShowTutorial(true);
    } else {
      setShowTutorial(false);
    }
    handleReset();
  }, [levelIdx, level.tutorial, completedLevels, level.level_id]);

  // ─── Сброс ─────────────────────────────────────────────
  const handleReset = useCallback(() => {
    cancelRef.current = true;
    const l = levelsState[levelIdx] || levelsState[0];
    setRobotState({ x: l.start_position.x, y: l.start_position.y });
    setCommands([]);
    setF1Commands([]);
    setF2Commands([]);
    setRunStatus('idle');
    setCollectedCoins([]);
    setCollectedResources([]);
    setActiveCommandId(null);
    setErrorMsg(null);
    setErrorCell(null);
    setShowSuccess(false);
  }, [levelIdx, levelsState]);

  // ─── Смена уровня ───────────────────────────────────────
  const switchLevel = (idx: number) => {
    cancelRef.current = true;
    setLevelIdx(idx);
  };

  // ─── Добавление (клик) ──────────────────────────────────
  const handleAddCommand = (type: CommandType) => {
    setCommands(prev => [...prev, createCommand(type)]);
  };

  // ─── Удаление ──────────────────────────────────────────
  const handleRemove = (id: string, functionId?: 'f1' | 'f2') => {
    if (functionId === 'f1') {
      setF1Commands(prev => removeCommand(prev, id));
    } else if (functionId === 'f2') {
      setF2Commands(prev => removeCommand(prev, id));
    } else {
      setCommands(prev => removeCommand(prev, id));
    }
  };

  // ─── Обновление параметров циклов и условий ──────────────
  const handleUpdateLoop = (id: string, repeat: number, functionId?: 'f1' | 'f2') => {
    const update = (cmds: Command[]): Command[] =>
      cmds.map(c =>
        c.id === id ? { ...c, repeat } : (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
          ? { ...c, children: update(c.children) }
          : c
      );

    if (functionId === 'f1') setF1Commands(prev => update(prev));
    else if (functionId === 'f2') setF2Commands(prev => update(prev));
    else setCommands(prev => update(prev));
  };

  const handleUpdateIfColor = (id: string, color: ColorType, functionId?: 'f1' | 'f2') => {
    const update = (cmds: Command[]): Command[] =>
      cmds.map(c =>
        c.id === id ? { ...c, conditionColor: color } : (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
          ? { ...c, children: update(c.children) }
          : c
      );

    if (functionId === 'f1') setF1Commands(prev => update(prev));
    else if (functionId === 'f2') setF2Commands(prev => update(prev));
    else setCommands(prev => update(prev));
  };

  const handleUpdateWhile = (id: string, condition: any, functionId?: 'f1' | 'f2') => {
    const update = (cmds: Command[]): Command[] =>
      cmds.map(c =>
        c.id === id ? { ...c, whileCondition: condition } : (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
          ? { ...c, children: update(c.children) }
          : c
      );

    if (functionId === 'f1') setF1Commands(prev => update(prev));
    else if (functionId === 'f2') setF2Commands(prev => update(prev));
    else setCommands(prev => update(prev));
  };

  const handleUpdateIfAdvanced = (id: string, condition: any, functionId?: 'f1' | 'f2') => {
    const update = (cmds: Command[]): Command[] =>
      cmds.map(c =>
        c.id === id ? { ...c, advancedCondition: condition } : (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
          ? { ...c, children: update(c.children) }
          : c
      );

    if (functionId === 'f1') setF1Commands(prev => update(prev));
    else if (functionId === 'f2') setF2Commands(prev => update(prev));
    else setCommands(prev => update(prev));
  };

  // ─── Drag & Drop перемещение ────────────────────────────
  const handleMove = useCallback((dragInfo: DragInfo, target: DropTarget) => {
    setIsDragging(false);
    let draggedCmd: Command;

    // 1. Получаем перетаскиваемый блок
    if (dragInfo.source === 'panel' && dragInfo.commandType) {
      draggedCmd = createCommand(dragInfo.commandType);
    } else {
      const sourceId = dragInfo.commandId!;
      let found: Command | null = null;
      
      if (dragInfo.source === 'list') {
        found = findCommand(commands, sourceId);
        if (found) setCommands(prev => removeCommand(prev, sourceId));
      } else if (dragInfo.source === 'f1') {
        found = findCommand(f1Commands, sourceId);
        if (found) setF1Commands(prev => removeCommand(prev, sourceId));
      } else if (dragInfo.source === 'f2') {
        found = findCommand(f2Commands, sourceId);
        if (found) setF2Commands(prev => removeCommand(prev, sourceId));
      }
      
      if (!found) return;
      draggedCmd = found;
    }

    // 2. Вставляем в целевую позицию
    const targetFunc = target.functionId;
    if (targetFunc === 'f1') {
      if (target.id === 'f1-end') {
        setF1Commands(prev => [...prev, draggedCmd]);
      } else if (target.position === 'inside') {
        setF1Commands(prev => insertInContainer(prev, target.id, draggedCmd));
      } else {
        setF1Commands(prev => insertNear(prev, target.id, target.position as 'before' | 'after', draggedCmd));
      }
    } else if (targetFunc === 'f2') {
      if (target.id === 'f2-end') {
        setF2Commands(prev => [...prev, draggedCmd]);
      } else if (target.position === 'inside') {
        setF2Commands(prev => insertInContainer(prev, target.id, draggedCmd));
      } else {
        setF2Commands(prev => insertNear(prev, target.id, target.position as 'before' | 'after', draggedCmd));
      }
    } else {
      if (target.id === 'root-end') {
        setCommands(prev => [...prev, draggedCmd]);
      } else if (target.position === 'inside') {
        setCommands(prev => insertInContainer(prev, target.id, draggedCmd));
      } else {
        setCommands(prev => insertNear(prev, target.id, target.position as 'before' | 'after', draggedCmd));
      }
    }
  }, [commands, f1Commands, f2Commands]);

  // ─── Запуск движка ──────────────────────────────────────
  const handleRun = async () => {
    if (commands.length === 0) return;
    cancelRef.current = false;

    const startState = initRobot();
    setRobotState(startState);
    setCollectedCoins([]);
    setCollectedResources([]);
    setActiveCommandId(null);
    setErrorMsg(null);
    setErrorCell(null);
    setRunStatus('running');

    // Передаем основной алгоритм и тела F1/F2
    const gen = executeCommands(commands, f1Commands, f2Commands, startState, level, 450);

    for await (const result of gen) {
      if (cancelRef.current) break;

      setRobotState(result.state);
      setCollectedCoins(result.collectedCoins);
      setCollectedResources(result.collectedResources);

      if (result.error) {
        setErrorMsg(result.error);
        setErrorCell({ x: result.state.x, y: result.state.y });
        setRunStatus('error');
        setTimeout(() => setErrorCell(null), 2500);
        return;
      }

      if (result.finished) {
        setRunStatus('success');
        setShowSuccess(true);
        if (!completedLevels.includes(level.level_id.toString())) {
          setCompletedLevels(prev => [...prev, level.level_id.toString()]);
          // Calculate stars based on coins collected (just an example, default to 3 if all coins, 1 otherwise)
          const allCoinsCollected = level.coins ? result.collectedCoins.length === level.coins.length : true;
          const stars = allCoinsCollected ? 3 : 1;
          api.completeMinigameLevel('ROBOT_ESCAPE', level.level_id.toString(), stars).catch(() => {});
        }
        return;
      }
    }

    if (!cancelRef.current) {
      setRunStatus('idle');
    }
  };

  const isRunning = runStatus === 'running';
  const totalCoins = level.coins?.length ?? 0;

  // Флаги показа функциональных ячеек (если функция разрешена в наборе или уже вызвана)
  const hasF1 = level.allowed_commands.includes('call_f1');
  const hasF2 = level.allowed_commands.includes('call_f2');

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-2">
      {/* ── Заголовок и выбор уровня ── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            Уровень {level.level_id}: {level.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{level.description}</p>
        </div>
        <div className="flex items-center gap-3">
          {level.tutorial && (
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-semibold hover:bg-violet-600/30 transition-all"
            >
              <BookOpen size={14} />
              Обучение
            </button>
          )}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              disabled={levelIdx === 0 || isRunning}
              onClick={() => switchLevel(levelIdx - 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-300 font-mono font-bold px-2">
              {levelIdx + 1} / {levelsState.length}
            </span>
            <button
              disabled={levelIdx === levelsState.length - 1 || isRunning}
              onClick={() => switchLevel(levelIdx + 1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Основной двухколоночный макет (Grid & Editor) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ЛЕВАЯ КОЛОНКА (Зона А: Поле) — занимает 7/12 пространства */}
        <div className="lg:col-span-7 flex flex-col items-center gap-5 w-full">
          <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800 shadow-xl backdrop-blur-sm w-full flex justify-center overflow-x-auto">
            <GameGrid
              level={level}
              robotState={robotState}
              collectedCoins={collectedCoins}
              collectedResources={collectedResources}
              errorCell={errorCell}
            />
          </div>

          {/* Панель статуса и ошибок */}
          {errorMsg && (
            <div className="w-full px-5 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold flex items-center gap-3 animate-shake">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Монеты */}
          {totalCoins > 0 && (
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 w-full justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Сбор бонусов:</span>
                <span className="text-amber-400 font-black text-sm">{collectedCoins.length} / {totalCoins}</span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: totalCoins }, (_, i) => (
                  <span key={i} className={`text-xl transition-all duration-300 ${i < collectedCoins.length ? 'scale-110 opacity-100' : 'opacity-20 grayscale'}`}>⭐</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА (Зона Б: Управление и Алгоритм) — занимает 5/12 */}
        <div className="lg:col-span-5 flex flex-col gap-5 w-full">
          {/* Инструменты */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-850 shadow-md">
            <CommandPanel
              allowedCommands={level.allowed_commands}
              onAdd={handleAddCommand}
              onDragStart={() => setIsDragging(true)}
              f1Name={f1Name}
              f2Name={f2Name}
              disabled={isRunning}
            />
          </div>

          {/* Окна алгоритмов */}
          <div className="space-y-4" onDragEnd={() => setIsDragging(false)}>
            {/* ГЛАВНЫЙ АЛГОРИТМ */}
            <div className="p-5 rounded-3xl bg-slate-900/50 border border-slate-850 flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Основной алгоритм</span>
                {commands.length > 0 && !isRunning && (
                  <button onClick={() => setCommands([])} className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" title="Очистить всё">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <CommandList
                commands={commands}
                activeCommandId={activeCommandId}
                onRemove={handleRemove}
                onMove={handleMove}
                onUpdateLoop={handleUpdateLoop}
                onUpdateIfColor={handleUpdateIfColor}
                onUpdateWhile={handleUpdateWhile}
                onUpdateIfAdvanced={handleUpdateIfAdvanced}
                onDragStart={() => setIsDragging(true)}
                isDragging={isDragging}
                f1Name={f1Name}
                f2Name={f2Name}
                disabled={isRunning}
              />
            </div>

            {/* ДИНАМИЧЕСКИЙ КОНТЕЙНЕР ФУНКЦИИ F1 */}
            {hasF1 && (
              <div className="p-5 rounded-3xl bg-indigo-950/10 border border-indigo-500/20 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  {isEditingF1 ? (
                    <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                      <input
                        value={f1Name}
                        onChange={e => setF1Name(e.target.value)}
                        onBlur={() => setIsEditingF1(false)}
                        onKeyDown={e => e.key === 'Enter' && setIsEditingF1(false)}
                        className="bg-indigo-950 border border-indigo-500/50 rounded px-2 py-0.5 text-xs text-indigo-200 outline-none w-full"
                        autoFocus
                      />
                      <button onClick={() => setIsEditingF1(false)} className="p-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
                        <Check size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-[11px] text-indigo-300 uppercase tracking-widest font-black">
                        {f1Name}
                      </span>
                      <button onClick={() => setIsEditingF1(true)} className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-200 transition-all p-0.5">
                        <Edit2 size={10} />
                      </button>
                    </div>
                  )}

                  {f1Commands.length > 0 && !isRunning && (
                    <button onClick={() => setF1Commands([])} className="text-indigo-600 hover:text-rose-400 transition-colors cursor-pointer" title="Очистить F1">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <CommandList
                  commands={f1Commands}
                  activeCommandId={activeCommandId}
                  onRemove={handleRemove}
                  onMove={handleMove}
                  onUpdateLoop={handleUpdateLoop}
                  onUpdateIfColor={handleUpdateIfColor}
                  onUpdateWhile={handleUpdateWhile}
                  onUpdateIfAdvanced={handleUpdateIfAdvanced}
                  onDragStart={() => setIsDragging(true)}
                  isDragging={isDragging}
                  f1Name={f1Name}
                  f2Name={f2Name}
                  disabled={isRunning}
                  functionId="f1"
                />
              </div>
            )}

            {/* ДИНАМИЧЕСКИЙ КОНТЕЙНЕР ФУНКЦИИ F2 */}
            {hasF2 && (
              <div className="p-5 rounded-3xl bg-teal-950/10 border border-teal-500/20 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center justify-between">
                  {isEditingF2 ? (
                    <div className="flex items-center gap-1.5 w-full max-w-[200px]">
                      <input
                        value={f2Name}
                        onChange={e => setF2Name(e.target.value)}
                        onBlur={() => setIsEditingF2(false)}
                        onKeyDown={e => e.key === 'Enter' && setIsEditingF2(false)}
                        className="bg-teal-950 border border-teal-500/50 rounded px-2 py-0.5 text-xs text-teal-200 outline-none w-full"
                        autoFocus
                      />
                      <button onClick={() => setIsEditingF2(false)} className="p-1 rounded bg-teal-500/20 text-teal-300 hover:bg-teal-500/30">
                        <Check size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-[11px] text-teal-300 uppercase tracking-widest font-black">
                        {f2Name}
                      </span>
                      <button onClick={() => setIsEditingF2(true)} className="opacity-0 group-hover:opacity-100 text-teal-400 hover:text-teal-200 transition-all p-0.5">
                        <Edit2 size={10} />
                      </button>
                    </div>
                  )}

                  {f2Commands.length > 0 && !isRunning && (
                    <button onClick={() => setF2Commands([])} className="text-teal-600 hover:text-rose-400 transition-colors cursor-pointer" title="Очистить F2">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <CommandList
                  commands={f2Commands}
                  activeCommandId={activeCommandId}
                  onRemove={handleRemove}
                  onMove={handleMove}
                  onUpdateLoop={handleUpdateLoop}
                  onUpdateIfColor={handleUpdateIfColor}
                  onUpdateWhile={handleUpdateWhile}
                  onUpdateIfAdvanced={handleUpdateIfAdvanced}
                  onDragStart={() => setIsDragging(true)}
                  isDragging={isDragging}
                  f1Name={f1Name}
                  f2Name={f2Name}
                  disabled={isRunning}
                  functionId="f2"
                />
              </div>
            )}
          </div>

          {/* Запуск и сброс */}
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-40 text-sm font-bold cursor-pointer"
            >
              <RotateCcw size={15} />
              Сбросить
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || commands.length === 0}
              className="flex-[2] flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30 cursor-pointer"
            >
              {isRunning ? (
                <><div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Выполнение...</>
              ) : (
                <><Play size={15} fill="white" />Запустить код</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Обучающий оверлей-модалка ── */}
      {showTutorial && level.tutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md animate-fade-in p-4">
          <div className="relative max-w-md w-full rounded-3xl border border-violet-500/30 bg-gradient-to-b from-[#130d2a] to-[#0a0618] p-8 flex flex-col gap-5 text-center shadow-2xl shadow-violet-900/40">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400">
              <BookOpen size={30} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">{level.tutorial.title}</h3>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed">{level.tutorial.content}</p>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xs hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-md cursor-pointer"
            >
              Понятно, давай играть!
            </button>
          </div>
        </div>
      )}

      {/* Модалка успеха */}
      {showSuccess && (
        <SuccessModal
          levelId={level.level_id}
          coinsCollected={collectedCoins.length}
          totalCoins={totalCoins}
          commandCount={commands.length}
          onRestart={handleReset}
          onNextLevel={
            levelIdx < levelsState.length - 1
              ? () => { setShowSuccess(false); switchLevel(levelIdx + 1); }
              : undefined
          }
        />
      )}
    </div>
  );
}
