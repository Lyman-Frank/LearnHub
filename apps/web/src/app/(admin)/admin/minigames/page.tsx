'use client';
// ═══════════════════════════════════════════════════════════
// СТРАНИЦА МИНИ-ИГР — Админ (Хаб)
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Settings, PenTool, Save, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminMinigamesHub() {
  const [xpConfig, setXpConfig] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getMinigameConfig().then((data) => {
      setXpConfig(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.updateMinigameConfig(xpConfig);
      window.customAlert('Настройки XP успешно сохранены!');
    } catch (e: any) {
      window.customAlert(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Gamepad2 size={24} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Конструктор Мини-игр</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Управление уровнями и контентом обучающих игр</p>
          </div>
        </div>
      </div>

      {/* Сетка игр */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Карточка 1: Побег Робота */}
        <div className="card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                <Settings size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Побег Робота</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Редактор 2D лабиринтов. Добавляйте стены, монеты, угрозы, телепорты и настраивайте стартовые условия для обучения алгоритмике.
            </p>
            <div className="pt-4 flex justify-end">
              <Link
                href="/admin/minigames/robot-escape"
                className="btn-primary"
              >
                Открыть конструктор
              </Link>
            </div>
          </div>
        </div>

        {/* Карточка 2: 2D Майнкрафт */}
        <div className="card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <PenTool size={24} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">2D Майнкрафт (Крафт)</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Настройка рецептов и уровней для игры в крафт. Студенты должны собирать ресурсы в функции для прохождения испытаний.
            </p>
            <div className="pt-4 flex justify-end">
              <Link
                href="/admin/minigames/minecraft-crafting"
                className="btn-primary"
              >
                Открыть конструктор
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* Настройки XP */}
      <div className="mt-12 p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Gamepad2 size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Настройки наград (XP)</h2>
            <p className="text-sm text-slate-400">Настройте количество опыта, которое студенты получают за первое прохождение уровней.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin" size={20} /> Загрузка настроек...
          </div>
        ) : (
          <div className="space-y-6 max-w-md">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">XP за уровень "Побег Робота"</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={xpConfig.ROBOT_ESCAPE ?? 25}
                    onChange={(e) => setXpConfig({ ...xpConfig, ROBOT_ESCAPE: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">XP</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">XP за уровень "2D Майнкрафт"</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={xpConfig.MINECRAFT_CRAFTING ?? 30}
                    onChange={(e) => setXpConfig({ ...xpConfig, MINECRAFT_CRAFTING: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">XP</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-6 py-3 w-full bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Сохранить настройки
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
