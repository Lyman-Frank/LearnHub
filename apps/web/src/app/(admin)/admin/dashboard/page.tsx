'use client';

import React, { useEffect, useState } from 'react';
import { Shield, Key, Ticket, Plus, Trash2, Check, AlertCircle, Calendar, Users, Layers } from 'lucide-react';
import { api } from '@/lib/api';

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  durationDays: number;
  createdAt: string;
  expiresAt: string | null;
}

export default function AdminDashboardPage() {
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [maxUses, setMaxUses] = useState<number>(1);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const fetchInvites = async () => {
    try {
      const data = await api.getInvites();
      setInvites(data);
    } catch (err: any) {
      console.error('Failed to fetch invites:', err);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessCode(null);

    try {
      const result = await api.createInvite({
        maxUses,
        expiresInDays: expiresInDays || undefined,
        durationDays: durationDays || undefined,
      });
      setSuccessCode(result.code);
      fetchInvites();
    } catch (err: any) {
      setError(err.message || 'Не удалось создать инвайт-код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await api.deactivateInvite(id);
      fetchInvites();
    } catch (err: any) {
      alert(err.message || 'Ошибка деактивации');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Приветствие */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-slate-900 via-violet-950/20 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300">
            <Shield size={14} />
            <span>Панель управления администратора</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Административная панель LearnHub 🛡️
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Управляйте инвайт-кодами для преподавателей, контролируйте статус пользователей и модерируйте курсы.
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{invites.length > 0 ? 'Активна' : '1'}</div>
            <div className="text-xs text-slate-400 font-medium">Пользователи</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
            <Ticket size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{invites.length}</div>
            <div className="text-xs text-slate-400 font-medium">Всего инвайт-кодов</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-slate-400 font-medium">Курсов создано</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Форма генерации инвайтов */}
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Key size={18} className="text-violet-400" />
            <span>Генерация инвайтов</span>
          </h2>

          {error && (
            <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-400">
              <AlertCircle className="shrink-0 mt-0.5" size={16} />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {successCode && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Check size={16} />
                <span>Код успешно создан!</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 text-center font-mono font-bold text-white text-base select-all tracking-wider">
                {successCode}
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Скопируйте этот код и передайте преподавателю
              </p>
            </div>
          )}

          <form onSubmit={handleCreateInvite} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Использований (макс)
              </label>
              <input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Срок активации (дней, после чего ключ сгорит)
              </label>
              <input
                type="number"
                min="1"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Срок службы ключа (дней доступа после активации)
              </label>
              <input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all duration-200"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all duration-200 disabled:opacity-50"
            >
              <Plus size={16} />
              <span>Создать инвайт</span>
            </button>
          </form>
        </div>

        {/* Список инвайтов */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-6">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Ticket size={18} className="text-fuchsia-400" />
            <span>Существующие инвайты</span>
          </h2>

          {invites.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Инвайт-коды отсутствуют. Создайте первый в форме слева.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pr-4">Код</th>
                    <th className="pb-3 pr-4">Использование</th>
                    <th className="pb-3 pr-4">Срок службы</th>
                    <th className="pb-3 pr-4">Срок активации</th>
                    <th className="pb-3 pr-4">Статус</th>
                    <th className="pb-3 pr-4">Создан</th>
                    <th className="pb-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm">
                  {invites.map((invite) => {
                    const isExpired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                    const isActive = invite.isActive && !isExpired && invite.currentUses < invite.maxUses;
                    return (
                      <tr key={invite.id} className="group">
                        <td className="py-3.5 pr-4 font-mono font-bold text-white tracking-wider">
                          {invite.code}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-300">
                          {invite.currentUses} / {invite.maxUses}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-300 font-medium">
                          {invite.durationDays} дн.
                        </td>
                        <td className="py-3.5 pr-4 text-slate-400 text-xs">
                          {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : 'Бессрочно'}
                        </td>
                        <td className="py-3.5 pr-4">
                          {isActive ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Активен
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Неактивен
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-400 text-xs">
                          {new Date(invite.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-right">
                          {isActive && (
                            <button
                              onClick={() => handleDeactivate(invite.id)}
                              className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-950 bg-slate-900 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 transition-all duration-200"
                              title="Деактивировать инвайт"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
