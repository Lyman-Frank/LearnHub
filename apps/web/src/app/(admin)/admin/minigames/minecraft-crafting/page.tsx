'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Globe, EyeOff, Layers, LayoutGrid, Settings2 } from 'lucide-react';
import { CraftingLevel, ItemId, ObstacleType, InventoryItem } from '@/components/minigames/minecraft-crafting/types';
import { DEFAULT_MC_LEVELS } from '@/components/minigames/minecraft-crafting/levels';

const ITEM_OPTIONS: { id: ItemId; label: string }[] = [
  { id: 'wood', label: 'Дерево' },
  { id: 'stick', label: 'Палка' },
  { id: 'iron', label: 'Железо' },
  { id: 'diamond', label: 'Алмаз' },
  { id: 'stone', label: 'Камень' },
];

const OBSTACLE_OPTIONS: { id: ObstacleType; label: string }[] = [
  { id: 'wood_block', label: 'Блок Дерева' },
  { id: 'dirt_block', label: 'Блок Земли' },
  { id: 'diamond_ore', label: 'Алмазная Руда' },
  { id: 'zombie', label: 'Зомби' },
];

const TOOL_OPTIONS: { id: ItemId; label: string }[] = [
  { id: 'iron_pickaxe', label: 'Железная Кирка' },
  { id: 'iron_sword', label: 'Железный Меч' },
  { id: 'iron_axe', label: 'Железный Топор' },
  { id: 'iron_shovel', label: 'Железная Лопата' },
];

function createEmptyLevel(id: number): CraftingLevel {
  return {
    id,
    title: `Новый Уровень ${id}`,
    taskText: 'Описание задачи...',
    initialInventory: [],
    obstacle: 'wood_block',
    requiredTool: 'iron_axe',
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function MinecraftCraftingAdminPage() {
  const [levels, setLevels] = useState<CraftingLevel[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'moderation'>('editor');
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);

  useEffect(() => {
    const saved = localStorage.getItem('minecraft_crafting_levels');
    if (saved) {
      try {
        setLevels(JSON.parse(saved));
      } catch (e) {}
    } else {
      setLevels(DEFAULT_MC_LEVELS.map(l => ({ ...l })));
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('minecraft_crafting_levels', JSON.stringify(levels));
    }
  }, [levels, isLoaded]);

  const selectedLevel = levels.find(l => l.id === selectedLevelId) || levels[0];

  const updateLevel = useCallback((updated: CraftingLevel) => {
    setLevels(prev => prev.map(l => l.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : l));
  }, []);

  const addLevel = () => {
    const maxId = Math.max(...levels.map(l => l.id), 0);
    const newLevel = createEmptyLevel(maxId + 1);
    setLevels(prev => [...prev, newLevel]);
    setSelectedLevelId(newLevel.id);
  };

  const deleteLevel = (id: number) => {
    setLevels(prev => prev.filter(l => l.id !== id));
    if (selectedLevelId === id) setSelectedLevelId(levels[0]?.id ?? -1);
  };

  const togglePublish = (id: number) => {
    setLevels(prev => prev.map(l =>
      l.id === id
        ? { ...l, status: l.status === 'published' ? 'draft' : 'published', updatedAt: new Date().toISOString() }
        : l
    ));
  };

  const addInventoryItem = () => {
    if (!selectedLevel) return;
    const newInv = [...selectedLevel.initialInventory, { id: 'wood' as ItemId, label: 'Дерево', count: 1 }];
    updateLevel({ ...selectedLevel, initialInventory: newInv });
  };

  const updateInventoryItem = (index: number, field: keyof InventoryItem, value: any) => {
    if (!selectedLevel) return;
    const newInv = [...selectedLevel.initialInventory];
    if (field === 'id') {
      const option = ITEM_OPTIONS.find(o => o.id === value);
      newInv[index] = { ...newInv[index], id: value as ItemId, label: option?.label || value };
    } else {
      newInv[index] = { ...newInv[index], [field]: value };
    }
    updateLevel({ ...selectedLevel, initialInventory: newInv });
  };

  const removeInventoryItem = (index: number) => {
    if (!selectedLevel) return;
    const newInv = selectedLevel.initialInventory.filter((_, i) => i !== index);
    updateLevel({ ...selectedLevel, initialInventory: newInv });
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/minigames" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers size={24} className="text-emerald-500" />
              Конструктор: 2D Майнкрафт
            </h1>
            <p className="text-sm text-slate-500">Настройка рецептов и уровней</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'editor' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
            Редактор
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'moderation' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe size={15} />
            Модерация
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-[10px]">
              {levels.filter(l => l.status === 'published').length}
            </span>
          </button>
        </div>
      </div>

      {/* ── ВКЛАДКА: Редактор ── */}
      {activeTab === 'editor' && (
        <div className="flex flex-col md:flex-row gap-5 items-start">
          {/* Список уровней */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">Уровни</span>
              <button
                onClick={addLevel}
                className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity"
              >
                <Plus size={13} />
                Добавить
              </button>
            </div>
            {levels.map(l => (
              <div
                key={l.id}
                onClick={() => setSelectedLevelId(l.id)}
                className={`
                  flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all
                  ${selectedLevelId === l.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'}
                `}
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">Уровень {l.id}</div>
                  <div className="text-[10px] truncate mt-0.5 opacity-80">{l.title}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${l.status === 'published' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  <button
                    onClick={e => { e.stopPropagation(); deleteLevel(l.id); }}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Редактор уровня */}
          {selectedLevel && (
            <div className="flex-1 space-y-4 w-full">
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
                
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Название уровня</label>
                  <input
                    value={selectedLevel.title}
                    onChange={e => updateLevel({ ...selectedLevel, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Текст задачи для студента</label>
                  <textarea
                    rows={3}
                    value={selectedLevel.taskText}
                    onChange={e => updateLevel({ ...selectedLevel, taskText: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Препятствие / Угроза</label>
                    <select
                      value={selectedLevel.obstacle}
                      onChange={e => updateLevel({ ...selectedLevel, obstacle: e.target.value as ObstacleType })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                    >
                      {OBSTACLE_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1 font-semibold">Требуемый инструмент для победы</label>
                    <select
                      value={selectedLevel.requiredTool}
                      onChange={e => updateLevel({ ...selectedLevel, requiredTool: e.target.value as ItemId })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                    >
                      {TOOL_OPTIONS.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

              </div>

              {/* Инвентарь */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Начальный инвентарь</h3>
                  <button onClick={addInventoryItem} className="text-xs flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:opacity-80">
                    <Plus size={14} /> Добавить ресурс
                  </button>
                </div>
                
                {selectedLevel.initialInventory.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Инвентарь пуст. Игрок не сможет ничего скрафтить.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedLevel.initialInventory.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                        <select
                          value={item.id}
                          onChange={e => updateInventoryItem(idx, 'id', e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white outline-none"
                        >
                          {ITEM_OPTIONS.map(o => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Кол-во:</span>
                        <input
                          type="number" min={1} max={64}
                          value={item.count}
                          onChange={e => updateInventoryItem(idx, 'count', Number(e.target.value))}
                          className="w-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-900 dark:text-white outline-none"
                        />
                        <button onClick={() => removeInventoryItem(idx)} className="ml-auto text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-1 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Кнопки публикации */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => togglePublish(selectedLevel.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    selectedLevel.status === 'published'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'
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
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300/80 text-sm flex items-start gap-2">
            <Globe size={16} className="shrink-0 mt-0.5" />
            <p>
              В зоне модерации отображаются все уровни. Опубликованные уровни видят студенты.
              Черновики доступны только вам.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">ID</th>
                  <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Название</th>
                  <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Препятствие</th>
                  <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Инструмент</th>
                  <th className="text-left text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Статус</th>
                  <th className="text-right text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider px-5 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((level, idx) => (
                  <tr key={level.id} className={`border-b border-slate-100 dark:border-slate-800/50 ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900/20' : 'bg-slate-50 dark:bg-slate-900/40'}`}>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono">#{level.id}</td>
                    <td className="px-5 py-4">
                      <div className="text-slate-900 dark:text-white font-semibold">{level.title}</div>
                      <div className="text-slate-500 text-xs mt-0.5 truncate max-w-[200px]">{level.taskText}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs">
                      {OBSTACLE_OPTIONS.find(o => o.id === level.obstacle)?.label || level.obstacle}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs">
                      {TOOL_OPTIONS.find(o => o.id === level.requiredTool)?.label || level.requiredTool}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`
                        px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                        ${level.status === 'published'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
                          : 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
                      `}>
                        {level.status === 'published' ? 'Опубликован' : 'Черновик'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedLevelId(level.id); setActiveTab('editor'); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                          title="Редактировать"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button
                          onClick={() => togglePublish(level.id)}
                          className={`p-1.5 rounded-lg transition-all ${
                            level.status === 'published'
                              ? 'text-emerald-500 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'
                          }`}
                          title={level.status === 'published' ? 'Снять с публикации' : 'Опубликовать'}
                        >
                          {level.status === 'published' ? <EyeOff size={16} /> : <Globe size={16} />}
                        </button>
                        <button
                          onClick={() => deleteLevel(level.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
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
