'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AuthorProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = auth.getUser();
    setUser(u);
    api.getUserStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Аватар и имя */}
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-950/30 via-slate-950 to-slate-950 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-60 h-60 bg-fuchsia-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.firstName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-fuchsia-500/30"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-fuchsia-600/20">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-slate-400 text-sm mt-1">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold uppercase tracking-wider">
              Преподаватель
            </span>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/60 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
            <BookOpen size={20} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-500 mx-auto" size={20} />
          ) : (
            <div className="text-3xl font-black text-white">{stats?.coursesCount ?? 0}</div>
          )}
          <div className="text-xs text-slate-400 font-medium">Курсов создано</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/60 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <GraduationCap size={20} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-500 mx-auto" size={20} />
          ) : (
            <div className="text-3xl font-black text-white">{stats?.enrollments ?? 0}</div>
          )}
          <div className="text-xs text-slate-400 font-medium">Студентов обучается</div>
        </div>
      </div>

      {/* Информация об аккаунте */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/50 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Данные аккаунта</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-900">
            <span className="text-sm text-slate-400">Email</span>
            <span className="text-sm font-medium text-slate-200">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-900">
            <span className="text-sm text-slate-400">Имя</span>
            <span className="text-sm font-medium text-slate-200">{user.firstName}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-400">Фамилия</span>
            <span className="text-sm font-medium text-slate-200">{user.lastName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
