'use client';
// ═══════════════════════════════════════════════════════════
// КОНСТРУКТОР УРОВНЕЙ — Страница Admin
// ═══════════════════════════════════════════════════════════
import React, { useState, useCallback } from 'react';
import { LevelConfig, ManagedLevel, Position, LevelPublishStatus } from '@/components/minigames/robot-escape/types';
import { DEFAULT_LEVELS } from '@/components/minigames/robot-escape/levels';
import { THEME_REGISTRY } from '@/components/minigames/robot-escape/ThemeAssets';
import {
  Plus, Trash2, Globe, EyeOff, Save, Play, RotateCcw,
  ChevronRight, Layers, Settings2, LayoutGrid, Eye,
} from 'lucide-react';

// ─── Инструменты конструктора ──────────────────────────────
type Tool = 'wall' | 'start' | 'finish' | 'coin' | 'resource' | 'eraser';

const TOOLS: { id: Tool; label: string; emoji: string; color: string }[] = [
  { id: 'wall',   label: 'Стена',   emoji: '🧱', color: 'border-gray-500 text-gray-300' },
  { id: 'start',  label: 'Старт',   emoji: '🟢', color: 'border-emerald-500 text-emerald-300' },
  { id: 'finish', label: 'Финиш',   emoji: '🏁', color: 'border-yellow-500 text-yellow-300' },
  { id: 'coin',   label: 'Монета',  emoji: '⭐', color: 'border-amber-500 text-amber-300' },
  { id: 'resource', label: 'Ресурс', emoji: '⚙️', color: 'border-blue-500 text-blue-300' },
  { id: 'eraser', label: 'Ластик',  emoji: '🗑️', color: 'border-rose-500 text-rose-300' },
];

// Создать пустую конфигурацию уровня
function createEmptyLevel(id: number): ManagedLevel {
  return {
    level_id: id,
    title: `Уровень ${id}`,
    description: 'Описание уровня',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 4, y: 4 },
    obstacles: [],
    coins: [],
    resources: [],
    required_resources: 0,
    theme: 'default',
    allowed_commands: ['move_right', 'move_down', 'move_left', 'move_up', 'loop'],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const CELL_SIZE = 56; // px

// ─── Компонент ячейки конструктора ─────────────────────────
function ConstructorCell({
  col, row, level, activeTool, onCellClick,
}: {
  col: number; row: number; level: ManagedLevel;
  activeTool: Tool; onCellClick: (x: number, y: number) => void;
}) {
  const isStart = level.start_position.x === col && level.start_position.y === row;
  const isFinish = level.finish_position.x === col && level.finish_position.y === row;
  const isWall = level.obstacles.some(o => o.x === col && o.y === row);
  const isCoin = level.coins?.some(c => c.x === col && c.y === row);
  const isResource = level.resources?.some(c => c.x === col && c.y === row);

  const themeKey = level.theme || 'default';
  const theme = THEME_REGISTRY[themeKey] || THEME_REGISTRY['default'];
  const { Wall, Finish, Start, Resource, Coin } = theme;

  return (
    <div
      onClick={() => onCellClick(col, row)}
      className={`
        relative flex items-center justify-center cursor-pointer rounded transition-all duration-100
        border border-slate-800 hover:border-violet-500/40 hover:bg-violet-500/5
        ${isWall ? 'bg-slate-700/50' : 'bg-slate-900/40'}
      `}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    >
      {isWall && <Wall size={CELL_SIZE * 0.8} />}
      {isStart && !isWall && <Start size={CELL_SIZE * 0.7} />}
      {isFinish && !isWall && <Finish size={CELL_SIZE * 0.8} />}
      {isCoin && !isWall && !isFinish && (
        <Coin size={CELL_SIZE * 0.5} />
      )}
      {isResource && !isWall && !isFinish && !isCoin && (
        <Resource size={CELL_SIZE * 0.6} />
      )}

      {/* Координаты при наведении */}
      <span className="absolute bottom-0 right-0.5 text-[8px] text-slate-700 opacity-0 group-hover:opacity-100">
        {col},{row}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function AdminMinigamesPage() {
  const [levels, setLevels] = useState<ManagedLevel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem('robot_escape_levels');
    if (saved) {
      try {
        setLevels(JSON.parse(saved));
      } catch (e) {}
    } else {
      setLevels(DEFAULT_LEVELS.map(l => ({
        ...l,
        status: 'published' as LevelPublishStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })));
    }
    setIsLoaded(true);
  }, []);

  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('robot_escape_levels', JSON.stringify(levels));
    }
  }, [levels, isLoaded]);

  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [activeTool, setActiveTool] = useState<Tool>('wall');
  const [activeTab, setActiveTab] = useState<'editor' | 'moderation'>('editor');

  const selectedLevel = levels.find(l => l.level_id === selectedLevelId) || levels[0];

  // Обновить уровень в списке
  const updateLevel = useCallback((updated: ManagedLevel) => {
    setLevels(prev => prev.map(l => l.level_id === updated.level_id ? { ...updated, updatedAt: new Date().toISOString() } : l));
  }, []);

  // Клик по ячейке сетки
  const handleCellClick = useCallback((x: number, y: number) => {
    if (!selectedLevel) return;
    const level = { ...selectedLevel };

    if (activeTool === 'wall') {
      const exists = level.obstacles.some(o => o.x === x && o.y === y);
      level.obstacles = exists
        ? level.obstacles.filter(o => !(o.x === x && o.y === y))
        : [...level.obstacles, { x, y }];
    } else if (activeTool === 'start') {
      level.start_position = { ...level.start_position, x, y };
      level.obstacles = level.obstacles.filter(o => !(o.x === x && o.y === y));
      level.resources = (level.resources ?? []).filter(c => !(c.x === x && c.y === y));
    } else if (activeTool === 'finish') {
      level.finish_position = { x, y };
      level.obstacles = level.obstacles.filter(o => !(o.x === x && o.y === y));
      level.resources = (level.resources ?? []).filter(c => !(c.x === x && c.y === y));
    } else if (activeTool === 'coin') {
      const exists = level.coins?.some(c => c.x === x && c.y === y);
      level.coins = exists
        ? (level.coins ?? []).filter(c => !(c.x === x && c.y === y))
        : [...(level.coins ?? []), { x, y }];
    } else if (activeTool === 'resource') {
      if (x === level.start_position.x && y === level.start_position.y) return;
      if (x === level.finish_position.x && y === level.finish_position.y) return;
      const exists = level.resources?.some(c => c.x === x && c.y === y);
      level.resources = exists
        ? (level.resources ?? []).filter(c => !(c.x === x && c.y === y))
        : [...(level.resources ?? []), { x, y }];
    } else if (activeTool === 'eraser') {
      level.obstacles = level.obstacles.filter(o => !(o.x === x && o.y === y));
      level.coins = (level.coins ?? []).filter(c => !(c.x === x && c.y === y));
      level.resources = (level.resources ?? []).filter(c => !(c.x === x && c.y === y));
    }

    updateLevel(level);
  }, [selectedLevel, activeTool, updateLevel]);

  // Добавить новый уровень
  const addLevel = () => {
    const maxId = Math.max(...levels.map(l => l.level_id), 0);
    const newLevel = createEmptyLevel(maxId + 1);
    setLevels(prev => [...prev, newLevel]);
    setSelectedLevelId(newLevel.level_id);
  };

  // Удалить уровень
  const deleteLevel = (id: number) => {
    setLevels(prev => prev.filter(l => l.level_id !== id));
    if (selectedLevelId === id) setSelectedLevelId(levels[0]?.level_id ?? -1);
  };

  // Изменить статус публикации
  const togglePublish = (id: number) => {
    setLevels(prev => prev.map(l =>
      l.level_id === id
        ? { ...l, status: l.status === 'published' ? 'draft' : 'published', updatedAt: new Date().toISOString() }
        : l
    ));
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers size={24} className="text-violet-400" />
            Конструктор Мини-игр
          </h1>
          <p className="text-slate-400 text-sm mt-1">Создавай и публикуй уровни для игры «Побег Робота»</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'editor' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
            Редактор
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'moderation' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Globe size={15} />
            Модерация
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px]">
              {levels.filter(l => l.status === 'published').length}
            </span>
          </button>
        </div>
      </div>

      {/* ── ВКЛАДКА: Редактор ── */}
      {activeTab === 'editor' && (
        <div className="flex gap-5 items-start">
          {/* Список уровней */}
          <div className="w-56 shrink-0 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Уровни</span>
              <button
                onClick={addLevel}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                <Plus size={13} />
                Добавить
              </button>
            </div>
            {levels.map(l => (
              <div
                key={l.level_id}
                onClick={() => setSelectedLevelId(l.level_id)}
                className={`
                  flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedLevelId === l.level_id
                    ? 'border-violet-500/50 bg-violet-500/10 text-white'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white'}
                `}
              >
                <div>
                  <div className="text-xs font-bold">Уровень {l.level_id}</div>
                  <div className="text-[10px] truncate max-w-[100px] mt-0.5">{l.title}</div>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${l.status === 'published' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <button
                    onClick={e => { e.stopPropagation(); deleteLevel(l.level_id); }}
                    className="p-1 rounded text-slate-600 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Редактор уровня */}
          {selectedLevel && (
            <div className="flex-1 space-y-4">
              {/* Мета-данные уровня */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Название</label>
                  <input
                    value={selectedLevel.title}
                    onChange={e => updateLevel({ ...selectedLevel, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Описание</label>
                  <input
                    value={selectedLevel.description}
                    onChange={e => updateLevel({ ...selectedLevel, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Строк</label>
                    <input
                      type="number" min={3} max={10}
                      value={selectedLevel.grid_size.rows}
                      onChange={e => updateLevel({ ...selectedLevel, grid_size: { ...selectedLevel.grid_size, rows: +e.target.value } })}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Столбцов</label>
                    <input
                      type="number" min={3} max={10}
                      value={selectedLevel.grid_size.cols}
                      onChange={e => updateLevel({ ...selectedLevel, grid_size: { ...selectedLevel.grid_size, cols: +e.target.value } })}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Треб. Ресурсов (для финиша)</label>
                    <input
                      type="number" min={0} max={20}
                      value={selectedLevel.required_resources || 0}
                      onChange={e => updateLevel({ ...selectedLevel, required_resources: +e.target.value })}
                      className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Тема</label>
                    <select
                      value={selectedLevel.theme || 'default'}
                      onChange={e => updateLevel({ ...selectedLevel, theme: e.target.value as any })}
                      className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-violet-500 outline-none"
                    >
                      <option value="default">Default</option>
                      <option value="zombie">Zombie</option>
                      <option value="space">Space</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Доступные блоки / Команды */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <label className="text-xs text-slate-400 block mb-3 font-semibold uppercase tracking-wider">Дополнительные блоки</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'loop', label: '🔄 Циклы' },
                    { id: 'while', label: '🔁 Пока (While)' },
                    { id: 'if_color', label: '❓ Условия' },
                    { id: 'if_advanced', label: '⚙️ Сл. Условия' },
                    { id: 'call_f1', label: '📦 Функция F1' },
                    { id: 'call_f2', label: '📦 Функция F2' }
                  ].map(cmd => {
                    const isEnabled = selectedLevel.allowed_commands.includes(cmd.id as any);
                    return (
                      <label key={cmd.id} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            const current = selectedLevel.allowed_commands;
                            // Базовые команды движения оставляем всегда
                            const baseCmds = current.filter(c => ['move_up', 'move_down', 'move_left', 'move_right'].includes(c));
                            const advancedCmds = current.filter(c => !['move_up', 'move_down', 'move_left', 'move_right'].includes(c));
                            
                            let newAdvanced = [];
                            if (e.target.checked) {
                              newAdvanced = [...advancedCmds, cmd.id];
                            } else {
                              newAdvanced = advancedCmds.filter(c => c !== cmd.id);
                            }
                            
                            updateLevel({ ...selectedLevel, allowed_commands: [...baseCmds, ...newAdvanced] as any[] });
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-violet-500 focus:ring-violet-500/20 bg-slate-800"
                        />
                        <span className="text-sm text-slate-300 font-medium">{cmd.label}</span>
                      </label>
                    )
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-3">Команды движения (стрелки вверх, вниз, влево, вправо) доступны по умолчанию на всех уровнях.</p>
              </div>

              {/* Инструменты */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 mr-1">Инструмент:</span>
                {TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                      ${activeTool === tool.id ? `bg-slate-700 ${tool.color} shadow-lg` : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}
                    `}
                  >
                    <span>{tool.emoji}</span>
                    {tool.label}
                  </button>
                ))}
              </div>

              {/* Сетка конструктора */}
              <div className="overflow-x-auto">
                <div
                  className="inline-grid rounded-2xl overflow-hidden border border-slate-800 bg-slate-950"
                  style={{
                    gridTemplateColumns: `repeat(${selectedLevel.grid_size.cols}, ${CELL_SIZE}px)`,
                    gridTemplateRows: `repeat(${selectedLevel.grid_size.rows}, ${CELL_SIZE}px)`,
                  }}
                >
                  {Array.from({ length: selectedLevel.grid_size.rows }, (_, row) =>
                    Array.from({ length: selectedLevel.grid_size.cols }, (_, col) => (
                      <ConstructorCell
                        key={`${col}-${row}`}
                        col={col} row={row}
                        level={selectedLevel}
                        activeTool={activeTool}
                        onCellClick={handleCellClick}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* JSON-превью */}
              <details className="rounded-xl border border-slate-800 overflow-hidden">
                <summary className="px-4 py-3 text-xs text-slate-400 cursor-pointer hover:text-slate-300 bg-slate-900/50">
                  📄 JSON конфигурация уровня
                </summary>
                <pre className="p-4 bg-slate-950 text-[11px] text-emerald-400 overflow-auto max-h-60 font-mono">
                  {JSON.stringify(selectedLevel, null, 2)}
                </pre>
              </details>

              {/* Кнопки публикации */}
              <div className="flex gap-3">
                <button
                  onClick={() => togglePublish(selectedLevel.level_id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    selectedLevel.status === 'published'
                      ? 'bg-slate-800 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
                  }`}
                >
                  {selectedLevel.status === 'published' ? (
                    <><EyeOff size={15} /> Снять с публикации</>
                  ) : (
                    <><Globe size={15} /> Опубликовать</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ВКЛАДКА: Модерация ── */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-amber-300/80 text-sm flex items-start gap-2">
            <Globe size={16} className="shrink-0 mt-0.5" />
            <p>
              В зоне модерации отображаются все уровни. Опубликованные уровни видят студенты и преподаватели.
              Черновики доступны только администраторам.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">ID</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Название</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Сетка</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Тема</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Статус</th>
                  <th className="text-left text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Обновлён</th>
                  <th className="text-right text-xs text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level, idx) => (
                  <tr key={level.level_id} className={`border-b border-slate-800/50 ${idx % 2 === 0 ? 'bg-slate-900/20' : 'bg-slate-900/40'}`}>
                    <td className="px-5 py-4 text-slate-400 font-mono">#{level.level_id}</td>
                    <td className="px-5 py-4">
                      <div className="text-white font-semibold">{level.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{level.description}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                      {level.grid_size.rows}×{level.grid_size.cols}
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-xs">
                      {level.theme || 'default'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`
                        px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                        ${level.status === 'published'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-slate-400 bg-slate-800 border-slate-700'}
                      `}>
                        {level.status === 'published' ? 'Опубликован' : 'Черновик'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">
                      {new Date(level.updatedAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedLevelId(level.level_id); setActiveTab('editor'); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-violet-400 hover:bg-violet-500/10 transition-all"
                          title="Редактировать"
                        >
                          <Settings2 size={14} />
                        </button>
                        <button
                          onClick={() => togglePublish(level.level_id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            level.status === 'published'
                              ? 'text-emerald-400 hover:text-slate-400 hover:bg-slate-800'
                              : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={level.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}
                        >
                          {level.status === 'published' ? <EyeOff size={14} /> : <Globe size={14} />}
                        </button>
                        <button
                          onClick={() => deleteLevel(level.level_id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
