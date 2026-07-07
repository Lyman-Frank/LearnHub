'use client';

import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Trash2, Tag, Key, AlertCircle, Check, Sparkles, Trophy, Calendar, Upload, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ShopItem {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  type: string;
  imageUrl: string | null;
  metadata: string | null;
  requiredCoursesCount: number;
  requiredStreakDays: number;
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(100);
  const [type, setType] = useState('AVATAR_FRAME');
  const [imageUrl, setImageUrl] = useState('');
  const [requiredCourses, setRequiredCourses] = useState<number>(0);
  const [requiredStreak, setRequiredStreak] = useState<number>(0);

  // Metadata sub-states
  const [frameClass, setFrameClass] = useState('ring-4 ring-violet-500 ring-offset-2 ring-offset-slate-950 animate-pulse');
  const [colorClass, setColorClass] = useState('text-fuchsia-400 font-extrabold');
  const [badgeIcon, setBadgeIcon] = useState('Award');
  const [badgeColor, setBadgeColor] = useState('#a855f7');

  const fetchItems = async () => {
    try {
      setLoading(true);
      // We can pass a dummy userId or empty string since we are just getting items for list. 
      // api.getShopItems() gets items with ownership information relative to the current user
      const data = await api.getShopItems();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError('Не удалось загрузить товары магазина');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActionLoading(true);
    setError(null);
    try {
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
      setSuccess('Изображение успешно загружено!');
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки изображения');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError(null);
    setSuccess(null);

    // Build metadata based on type
    let metadataStr = '';
    if (type === 'AVATAR_FRAME') {
      metadataStr = JSON.stringify({ borderClass: frameClass });
    } else if (type === 'USERNAME_COLOR') {
      metadataStr = JSON.stringify({ colorClass: colorClass });
    } else if (type === 'BADGE') {
      metadataStr = JSON.stringify({ icon: badgeIcon, color: badgeColor });
    }

    try {
      await api.createShopItem({
        title,
        description: description || undefined,
        cost,
        type,
        imageUrl: imageUrl || undefined,
        metadata: metadataStr || undefined,
        requiredCoursesCount: requiredCourses,
        requiredStreakDays: requiredStreak,
      });

      setSuccess('Товар успешно добавлен в магазин!');
      setTitle('');
      setDescription('');
      setCost(100);
      setImageUrl('');
      setRequiredCourses(0);
      setRequiredStreak(0);
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать товар');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар из магазина?')) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.deleteShopItem(id);
      setSuccess('Товар успешно удален');
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении товара');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Шапка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ShoppingBag className="text-violet-500 animate-pulse" size={32} />
            <span>Управление магазином наград</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Добавляйте и редактируйте товары, которые студенты могут купить за заработанные XP.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-sm text-rose-400">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-start gap-3 text-sm text-emerald-400">
          <Check className="shrink-0 mt-0.5" size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма добавления */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus size={20} className="text-violet-400" />
            <span>Добавить товар</span>
          </h2>

          <form onSubmit={handleCreateItem} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Название товара</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Неоново-красный никнейм"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Описание</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание товара"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all text-sm h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Стоимость (XP)</label>
                <input
                  type="number"
                  min="0"
                  value={cost}
                  onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white focus:outline-none focus:border-violet-500 transition-all text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Тип товара</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white focus:outline-none focus:border-violet-500 transition-all text-sm"
                >
                  <option value="AVATAR_FRAME">Рамка аватара</option>
                  <option value="BADGE">Иконка-значок</option>
                  <option value="USERNAME_COLOR">Стиль никнейма</option>
                  <option value="THEME">Тема оформления</option>
                </select>
              </div>
            </div>

            {/* Изображение */}
            <div className="space-y-2 border-t border-slate-900 pt-4">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Изображение (URL или файл)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Ссылка или загрузите файл"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all text-sm"
                />
                <label className="cursor-pointer px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5 text-xs font-bold">
                  <Upload size={14} />
                  <span>Файл</span>
                  <input type="file" onChange={handleFileUpload} accept="image/*" className="hidden" />
                </label>
              </div>
            </div>

            {/* Условия покупки */}
            <div className="space-y-3 border-t border-slate-900 pt-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Условия открытия</h3>
              
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Минимум пройденных курсов</label>
                  <input
                    type="number"
                    min="0"
                    value={requiredCourses}
                    onChange={(e) => setRequiredCourses(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-slate-950 text-white focus:outline-none focus:border-violet-500 transition-all text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Минимум дней ударного режима (стрик)</label>
                  <input
                    type="number"
                    min="0"
                    value={requiredStreak}
                    onChange={(e) => setRequiredStreak(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-slate-950 text-white focus:outline-none focus:border-violet-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Метаданные в зависимости от типа */}
            <div className="space-y-3 border-t border-slate-900 pt-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Настройка внешнего вида</h3>

              {type === 'AVATAR_FRAME' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Классы рамки (CSS classes)</label>
                  <input
                    type="text"
                    value={frameClass}
                    onChange={(e) => setFrameClass(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-slate-950 font-mono text-xs text-white"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setFrameClass('ring-4 ring-violet-500 ring-offset-2 ring-offset-slate-950 animate-pulse')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Фиолетовый неон
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameClass('ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-950 animate-pulse')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Синий неон
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameClass('ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-amber-500/25')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Золотая
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameClass('ring-4 ring-rose-500 ring-offset-2 ring-offset-slate-950 shadow-lg shadow-rose-500/30')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Красный импульс
                    </button>
                  </div>
                </div>
              )}

              {type === 'USERNAME_COLOR' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Классы стиля никнейма (CSS classes)</label>
                  <input
                    type="text"
                    value={colorClass}
                    onChange={(e) => setColorClass(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-slate-950 font-mono text-xs text-white"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setColorClass('text-red-500 font-extrabold')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Красный
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorClass('text-emerald-400 font-extrabold')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Изумрудный
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorClass('text-cyan-400 font-extrabold')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Голубой
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorClass('bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-black')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Фиолетовый градиент
                    </button>
                    <button
                      type="button"
                      onClick={() => setColorClass('bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-black animate-rainbow')}
                      className="text-[10px] px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      Радужный перелив
                    </button>
                  </div>
                </div>
              )}

              {type === 'BADGE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Иконка (Lucide)</label>
                    <select
                      value={badgeIcon}
                      onChange={(e) => setBadgeIcon(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-900 bg-slate-950 text-sm text-white"
                    >
                      <option value="Award">Награда</option>
                      <option value="Sparkles">Искры</option>
                      <option value="Code">Код</option>
                      <option value="ShieldAlert">Щит</option>
                      <option value="Trophy">Кубок</option>
                      <option value="Flame">Пламя</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider block">Цвет иконки</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={badgeColor}
                        onChange={(e) => setBadgeColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={badgeColor}
                        onChange={(e) => setBadgeColor(e.target.value)}
                        className="flex-1 px-2 py-1.5 rounded border border-slate-900 bg-slate-950 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Создать товар</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Список товаров */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" />
            <span>Текущие товары ({items.length})</span>
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mr-2" />
              <span>Загрузка товаров...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-slate-900 text-slate-500 text-sm">
              Магазин пуст. Добавьте первый товар с помощью формы слева.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                        {item.type === 'AVATAR_FRAME' ? 'Рамка аватара' : 
                         item.type === 'BADGE' ? 'Значок' : 
                         item.type === 'USERNAME_COLOR' ? 'Цвет ника' : 
                         item.type === 'THEME' ? 'Тема оформления' : item.type}
                      </span>
                      
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                        <span>{item.cost}</span>
                        <span className="text-[10px] text-amber-500">XP</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-extrabold text-white text-base leading-snug">{item.title}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.description || 'Описание отсутствует'}</p>
                    </div>

                    {/* Условия */}
                    {(item.requiredCoursesCount > 0 || item.requiredStreakDays > 0) && (
                      <div className="space-y-1 border-t border-slate-900/50 pt-2 text-[10px] text-slate-500">
                        <span className="font-semibold block uppercase text-[8px] text-slate-600">Требования:</span>
                        {item.requiredCoursesCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Trophy size={10} className="text-amber-500/50" />
                            <span>Пройти курсов: {item.requiredCoursesCount}</span>
                          </div>
                        )}
                        {item.requiredStreakDays > 0 && (
                          <div className="flex items-center gap-1">
                            <Calendar size={10} className="text-rose-500/50" />
                            <span>Дней стрика: {item.requiredStreakDays}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900/50 pt-3">
                    <span className="text-[10px] text-slate-600 font-mono">ID: {item.id.substring(0, 8)}...</span>
                    
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={actionLoading}
                      className="p-2 rounded-xl border border-slate-900 bg-slate-950/60 hover:bg-rose-950/20 text-slate-500 hover:text-rose-400 border border-slate-900 hover:border-rose-950/30 transition-all duration-200"
                      title="Удалить товар"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
