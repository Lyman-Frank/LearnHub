'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Flame, Loader2, Award, Zap, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import Link from 'next/link';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  xp: number;
  streak: number;
  ownedItems?: any[];
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'users' | 'groups'>('users');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    setCurrentUser(auth.getUser());
    loadLeaderboard();
  }, [tab]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      if (tab === 'users') {
        const data = await api.getLeaderboard();
        setUsers(data || []);
      } else {
        const data = await api.getGroupsLeaderboard();
        setGroups(data || []);
      }
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setError('Не удалось загрузить таблицу лидеров. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={40} />
        <span className="text-slate-400 text-sm">Вычисляем лучших студентов...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20">
          ⚠️
        </div>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={loadLeaderboard}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all"
        >
          Повторить попытку
        </button>
      </div>
    );
  }

  // Разделение на ТОП-3 и остальных
  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  // Для правильного отображения на пьедестале: 2-й (слева), 1-й (по центру), 3-й (справа)
  const pedestalOrder = [
    top3[1] ? { user: top3[1], rank: 2 } : null,
    top3[0] ? { user: top3[0], rank: 1 } : null,
    top3[2] ? { user: top3[2], rank: 3 } : null,
  ].filter(Boolean);

  const getRankBadgeStyles = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-amber-500/20 border-amber-500/40 text-amber-300 ring-amber-500/20';
      case 2:
        return 'bg-slate-300/20 border-slate-300/40 text-slate-300 ring-slate-300/20';
      case 3:
        return 'bg-amber-700/20 border-amber-700/40 text-amber-500 ring-amber-700/20';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const getUsernameColorClass = (user: any) => {
    const equippedNC = user.ownedItems?.find((oi: any) => oi.item.type === 'USERNAME_COLOR')?.item;
    if (!equippedNC) return '';
    try {
      const meta = JSON.parse(equippedNC.metadata || '{}');
      return meta.colorClass || '';
    } catch (e) {
      return '';
    }
  };

  const getPedestalHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-40 sm:h-48 border-amber-500/20 bg-gradient-to-t from-amber-500/5 to-amber-500/20';
      case 2:
        return 'h-32 sm:h-38 border-slate-400/20 bg-gradient-to-t from-slate-400/5 to-slate-400/15';
      case 3:
        return 'h-24 sm:h-30 border-amber-700/20 bg-gradient-to-t from-amber-700/5 to-amber-700/15';
      default:
        return 'h-20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Заголовок страницы */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-400 text-xs font-bold uppercase tracking-wider">
          <Trophy size={12} />
          Рейтинг LearnHub
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Таблица Лидеров
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Получайте XP за чтение лекций и правильные ответы в тестах, чтобы подняться на вершину!
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center gap-2 border-b border-slate-900 pb-1 max-w-xs mx-auto">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            tab === 'users'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Личный зачет
        </button>
        <button
          onClick={() => setTab('groups')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
            tab === 'groups'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Командный зачет (Классы)
        </button>
      </div>

      {tab === 'users' ? (
        users.length === 0 ? (
          <div className="p-8 border border-slate-900 bg-slate-950/40 rounded-2xl text-center text-slate-450 text-sm">
            Пока никто не набрал очки опыта. Будьте первым!
          </div>
        ) : (
          <>
            {/* Пьедестал почета ТОП-3 */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 items-end pt-12 max-w-2xl mx-auto select-none">
              {pedestalOrder.map((item) => {
                if (!item) return null;
                const { user, rank } = item;
                const isMe = currentUser?.id === user.id;

                const equippedFrame = user.ownedItems?.find((oi: any) => oi.item.type === 'AVATAR_FRAME')?.item;
                const frameMeta = equippedFrame ? JSON.parse(equippedFrame.metadata || '{}') : null;

                return (
                  <div key={user.id} className="flex flex-col items-center group">
                    {/* Аватар и Корона */}
                    <Link href={`/user/${user.id}`} className="relative mb-3 flex flex-col items-center cursor-pointer group-hover:opacity-90">
                      {rank === 1 && (
                        <span className="text-2xl sm:text-3xl animate-bounce duration-1000 mb-0.5">👑</span>
                      )}
                      <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-black border-2 relative overflow-hidden transition-transform duration-300 group-hover:scale-105 shadow-2xl ${
                        frameMeta?.borderClass
                          ? frameMeta.borderClass
                          : rank === 1 
                          ? 'border-amber-400 shadow-amber-500/20 bg-amber-950/40' 
                          : rank === 2 
                          ? 'border-slate-300 shadow-slate-300/10 bg-slate-900' 
                          : 'border-amber-700 shadow-amber-700/10 bg-amber-950/20'
                      } ${isMe ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-slate-950' : ''}`}>
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className={rank === 1 ? 'text-amber-300' : rank === 2 ? 'text-slate-300' : 'text-amber-500'}>
                            {user.firstName[0]}
                          </span>
                        )}
                      </div>
                      {/* Номер ранга поверх аватара */}
                      <span className={`absolute -bottom-1.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black border ring-4 ring-slate-950 ${getRankBadgeStyles(rank)}`}>
                        {rank}
                      </span>
                    </Link>

                    {/* Информация о пользователе */}
                    <div className="text-center w-full px-1 mb-2">
                      <Link href={`/user/${user.id}`} className={`block font-bold text-xs sm:text-sm truncate hover:underline ${isMe && !getUsernameColorClass(user) ? 'text-violet-400' : 'text-white'} ${getUsernameColorClass(user)}`}>
                        {user.firstName} {user.lastName}
                      </Link>
                      <div className="flex items-center justify-center gap-1 mt-0.5">
                        <Flame size={12} className={user.streak > 0 ? 'text-amber-400' : 'text-slate-600'} />
                        <span className="text-[10px] font-semibold text-slate-400">{user.streak} дн.</span>
                      </div>
                    </div>

                    {/* Тумба пьедестала */}
                    <div className={`w-full rounded-t-xl border border-b-0 flex flex-col items-center justify-center ${getPedestalHeight(rank)}`}>
                      <span className="text-xs sm:text-sm font-black text-white">{user.xp} XP</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-500 mt-0.5">Опыт</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Список ТОП 4-10 */}
            {rest.length > 0 && (
              <div className="space-y-2 max-w-2xl mx-auto">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-3 pb-1 border-b border-slate-900">
                  Рейтинговый список
                </p>
                <div className="space-y-2">
                  {rest.map((user, idx) => {
                    const rank = idx + 4;
                    const isMe = currentUser?.id === user.id;

                    const equippedFrame = user.ownedItems?.find((oi: any) => oi.item.type === 'AVATAR_FRAME')?.item;
                    const frameMeta = equippedFrame ? JSON.parse(equippedFrame.metadata || '{}') : null;

                    return (
                      <div
                        key={user.id}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 hover:translate-x-1 ${
                          isMe
                            ? 'border-violet-500/40 bg-violet-500/5 text-violet-300'
                            : 'border-slate-900 bg-slate-950/40 hover:bg-slate-900/20 text-slate-300 hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Позиция */}
                          <span className="w-6 text-center text-xs font-black text-slate-500">
                            {rank}
                          </span>

                          {/* Аватар */}
                          <Link href={`/user/${user.id}`} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border overflow-hidden bg-slate-900 cursor-pointer transition-transform hover:scale-105 ${
                            frameMeta?.borderClass ? frameMeta.borderClass : isMe ? 'border-violet-500' : 'border-slate-800'
                          }`}>
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{user.firstName[0]}</span>
                            )}
                          </Link>

                          {/* Имя */}
                          <Link href={`/user/${user.id}`} className={`text-xs sm:text-sm font-semibold hover:underline cursor-pointer ${isMe && !getUsernameColorClass(user) ? 'text-violet-400 font-bold' : 'text-slate-300'} ${getUsernameColorClass(user)}`}>
                            {user.firstName} {user.lastName} {isMe && '(Вы)'}
                          </Link>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Стрик */}
                          {user.streak > 0 && (
                            <div className="flex items-center gap-0.5 text-xs text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                              <Flame size={12} />
                              <span className="font-bold">{user.streak}</span>
                            </div>
                          )}
                          {/* XP */}
                          <span className="text-xs sm:text-sm font-extrabold text-white">
                            {user.xp} XP
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )
      ) : (
        groups.length === 0 ? (
          <div className="p-8 border border-slate-900 bg-slate-950/40 rounded-2xl text-center text-slate-400 text-sm max-w-2xl mx-auto">
            Учебные группы пока отсутствуют или не имеют набранного опыта.
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-3 pb-1 border-b border-slate-900">
              Рейтинг учебных групп (Классов)
            </p>
            <div className="space-y-2 animate-fade-in">
              {groups.map((group, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between px-4 py-4 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/20 text-slate-300 hover:border-slate-800 transition-all duration-200 hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border ${
                        rank === 1 
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                          : rank === 2 
                          ? 'bg-slate-300/20 border-slate-300/40 text-slate-300' 
                          : rank === 3 
                          ? 'bg-amber-700/20 border-amber-700/40 text-amber-500' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}>
                        {rank}
                      </span>
                      
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-100">{group.name}</span>
                        <span className="text-[10px] text-slate-500">{group.memberCount} участников</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-right">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase block">Всего</span>
                        <span className="text-xs font-bold text-slate-400">{group.totalXp} XP</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-semibold text-slate-500 uppercase block">В среднем на ученика</span>
                        <span className="text-sm font-extrabold text-violet-400">{group.averageXp} XP</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
