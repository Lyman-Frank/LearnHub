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
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleSubmitItem = async (e: React.FormEvent) => {
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
      const payload = {
        title,
        description: description || undefined,
        cost,
        type,
        imageUrl: imageUrl || undefined,
        metadata: metadataStr || undefined,
        requiredCoursesCount: requiredCourses,
        requiredStreakDays: requiredStreak,
      };

      if (editingId) {
        await api.request(`/shop/admin/update/${editingId}`, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccess('Товар успешно обновлен!');
      } else {
        await api.createShopItem(payload);
        setSuccess('Товар успешно добавлен в магазин!');
      }

      setEditingId(null);
      setTitle('');
      setDescription('');
      setCost(100);
      setImageUrl('');
      setRequiredCourses(0);
      setRequiredStreak(0);
      fetchItems();
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить товар');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description || '');
    setCost(item.cost);
    setType(item.type);
    setImageUrl(item.imageUrl || '');
    setRequiredCourses(item.requiredCoursesCount || 0);
    setRequiredStreak(item.requiredStreakDays || 0);

    if (item.metadata) {
      try {
        const meta = JSON.parse(item.metadata);
        if (item.type === 'AVATAR_FRAME') setFrameClass(meta.borderClass || '');
        if (item.type === 'USERNAME_COLOR') setColorClass(meta.colorClass || '');
        if (item.type === 'BADGE') {
          setBadgeIcon(meta.icon || 'Award');
          setBadgeColor(meta.color || '#a855f7');
        }
      } catch (e) {}
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (id: string) => {
    if (!(await window.customConfirm())) return;

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
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
          
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Plus className="text-violet-400" size={24} />
              {editingId ? 'Редактировать товар' : 'Создать новый товар'}
            </h2>
            {editingId && (
              <button 
                onClick={() => {
                  setEditingId(null);
                  setTitle('');
                  setDescription('');
                }}
                className="text-xs px-3 py-1 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Отменить редактирование
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmitItem} className="space-y-6">
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
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-full h-8 rounded border border-slate-800 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold shadow-lg shadow-violet-600/20 disabled:opacity-50 transition-all active:scale-[0.98] w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>{editingId ? 'Сохранить изменения' : 'Создать товар'}</span>
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
                    
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-2 bg-slate-900/80 hover:bg-violet-500 rounded-lg text-slate-300 hover:text-white transition-colors"
                        title="Редактировать товар"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 bg-slate-900/80 hover:bg-rose-500 rounded-lg text-rose-400 hover:text-white transition-colors"
                        title="Удалить товар"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
