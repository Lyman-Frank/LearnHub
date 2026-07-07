'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { 
  ShoppingBag, Award, Sparkles, AlertCircle, Check, Loader2, 
  Coins, HeartHandshake, Eye, UserCheck, ShieldCheck 
} from 'lucide-react';

interface ShopItem {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  type: string; // AVATAR_FRAME, BADGE, THEME
  imageUrl: string | null;
  metadata: string | null;
  isOwned: boolean;
  isEquipped: boolean;
  purchaseId: string | null;
}

export default function StudentShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchShopAndUserStats = async () => {
    try {
      const [shopItems, stats] = await Promise.all([
        api.getShopItems(),
        api.getUserStats(),
      ]);
      setItems(shopItems);
      setUserXp(stats?.xp ?? 0);
    } catch (err) {
      console.error('Error fetching shop items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopAndUserStats();
  }, []);

  const handleBuyItem = async (itemId: string) => {
    setError(null);
    setSuccess(null);
    setActionLoading(itemId);
    try {
      const res = await api.buyShopItem(itemId);
      setSuccess(res.message || 'Предмет успешно приобретен!');
      await fetchShopAndUserStats();
    } catch (err: any) {
      setError(err.message || 'Ошибка при покупке предмета');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEquipItem = async (itemId: string) => {
    setError(null);
    setSuccess(null);
    setActionLoading(itemId);
    try {
      const res = await api.equipShopItem(itemId);
      setSuccess(res.message || 'Предмет успешно экипирован!');
      await fetchShopAndUserStats();
    } catch (err: any) {
      setError(err.message || 'Не удалось экипировать предмет');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnequipItem = async (itemId: string) => {
    setError(null);
    setSuccess(null);
    setActionLoading(itemId);
    try {
      const res = await api.unequipShopItem(itemId);
      setSuccess(res.message || 'Предмет снят');
      await fetchShopAndUserStats();
    } catch (err: any) {
      setError(err.message || 'Не удалось снять предмет');
    } finally {
      setActionLoading(null);
    }
  };

  const getMetadata = (metaStr: string | null) => {
    if (!metaStr) return {};
    try {
      return JSON.parse(metaStr);
    } catch {
      return {};
    }
  };

  const frames = items.filter(item => item.type === 'AVATAR_FRAME');
  const badges = items.filter(item => item.type === 'BADGE');

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Title Header / XP indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <ShoppingBag size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Магазин наград LearnHub</h1>
            <p className="text-sm text-slate-400 mt-1">Тратьте заработанные XP на украшение своего профиля</p>
          </div>
        </div>

        {/* Current XP Indicator */}
        <div className="px-5 py-3 rounded-2xl border border-violet-500/20 bg-violet-950/30 backdrop-blur-md flex items-center gap-3 self-start md:self-auto shadow-md">
          <Coins className="text-yellow-400 w-5 h-5 animate-pulse" />
          <div>
            <div className="text-xs font-semibold text-slate-400">Ваш баланс XP:</div>
            <div className="text-lg font-black text-violet-400">{userXp} XP</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-sm text-rose-450 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-sm text-emerald-400 flex items-start gap-3">
          <Check size={18} className="shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <Loader2 className="animate-spin text-violet-500" size={32} />
          <span className="text-sm text-slate-500">Загружаем витрину магазина...</span>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Avatar Frames Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-900 pb-2 flex items-center gap-2">
              <UserCheck size={18} className="text-violet-400" />
              <span>Рамки аватара</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {frames.map((item) => {
                const meta = getMetadata(item.metadata);
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm flex flex-col justify-between h-[280px] relative overflow-hidden group hover:border-slate-800 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Preview Demonstration */}
                      <div className="flex items-center justify-center relative">
                        <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 relative z-10">
                          <span className="text-lg font-black text-slate-500">XP</span>
                          {/* Equipped Frame Render */}
                          {item.isEquipped && (
                            <div className={`absolute inset-0 rounded-full ${meta.borderClass}`} />
                          )}
                          {!item.isEquipped && item.isOwned && (
                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-violet-500/40" />
                          )}
                        </div>
                      </div>

                      <div className="text-center space-y-1.5">
                        <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-violet-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-450 leading-relaxed px-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between mt-4">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Coins size={14} className="text-yellow-500" />
                        <span>{item.cost} XP</span>
                      </span>

                      {/* Buy / Equip buttons */}
                      {item.isEquipped ? (
                        <button
                          onClick={() => handleUnequipItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/20 text-xs font-bold transition-all"
                        >
                          {actionLoading === item.id ? '...' : 'Снять'}
                        </button>
                      ) : item.isOwned ? (
                        <button
                          onClick={() => handleEquipItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all"
                        >
                          {actionLoading === item.id ? '...' : 'Экипировать'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyItem(item.id)}
                          disabled={actionLoading === item.id || userXp < item.cost}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-900 disabled:to-slate-900 disabled:border disabled:border-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                          {actionLoading === item.id ? '...' : 'Купить'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Profile Badges Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-900 pb-2 flex items-center gap-2">
              <Award size={18} className="text-violet-400" />
              <span>Значки профиля</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badges.map((item) => {
                const meta = getMetadata(item.metadata);
                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm flex flex-col justify-between h-[280px] relative overflow-hidden group hover:border-slate-800 transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Badge Icon demonstration */}
                      <div className="flex items-center justify-center">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border relative z-10 transition-transform duration-300 group-hover:scale-105"
                          style={{ 
                            backgroundColor: `${meta.color}15`, 
                            borderColor: item.isEquipped ? meta.color : '#1e293b' 
                          }}
                        >
                          <Award size={32} style={{ color: meta.color }} />
                          {item.isEquipped && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border border-slate-950">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-center space-y-1.5">
                        <h3 className="font-extrabold text-sm text-slate-100 group-hover:text-violet-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-450 leading-relaxed px-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between mt-4">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Coins size={14} className="text-yellow-500" />
                        <span>{item.cost} XP</span>
                      </span>

                      {/* Buy / Equip buttons */}
                      {item.isEquipped ? (
                        <button
                          onClick={() => handleUnequipItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-500/20 text-xs font-bold transition-all"
                        >
                          {actionLoading === item.id ? '...' : 'Снять'}
                        </button>
                      ) : item.isOwned ? (
                        <button
                          onClick={() => handleEquipItem(item.id)}
                          disabled={actionLoading === item.id}
                          className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all"
                        >
                          {actionLoading === item.id ? '...' : 'Экипировать'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBuyItem(item.id)}
                          disabled={actionLoading === item.id || userXp < item.cost}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:from-slate-900 disabled:to-slate-900 disabled:border disabled:border-slate-800 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all active:scale-[0.98]"
                        >
                          {actionLoading === item.id ? '...' : 'Купить'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
