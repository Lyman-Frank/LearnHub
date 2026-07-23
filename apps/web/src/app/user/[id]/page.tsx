'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, ArrowLeft, GraduationCap, Shield, Trophy, Flame, BookOpen, ShoppingBag, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    api.getUserProfile(userId)
      .then(setProfile)
      .catch((e) => setError(e.message || 'Ошибка загрузки профиля'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1b262c]">
        <Loader2 className="animate-spin text-violet-500" size={32} />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1b262c] text-white">
        <p className="text-rose-400 mb-4">{error || 'Пользователь не найден'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700">Назад</button>
      </div>
    );
  }

  const { user, stats, badges } = profile;
  const isTeacher = user.role === 'TEACHER' || user.role === 'ADMIN';
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-[#1b262c] text-slate-200">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Назад
        </button>

        {/* User Card */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 via-slate-950 to-slate-950 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-60 h-60 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-violet-500/30 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-violet-600/20 shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {user.firstName} {user.lastName}
              </h1>
              {user.email && <p className="text-slate-400 text-sm">{user.email}</p>}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
                  {isTeacher ? <Shield size={14} /> : <GraduationCap size={14} />}
                  {isTeacher ? 'Преподаватель' : 'Студент'}
                </span>
                
                {user.institutionName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold tracking-wider">
                    <GraduationCap size={14} /> {user.institutionName}
                  </span>
                )}
                
                {!isTeacher && stats && (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold tracking-wider">
                      <Trophy size={14} /> {stats.xp} XP
                    </span>
                    {stats.streak > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wider">
                        <Flame size={14} /> {stats.streak} Дней подряд
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        {!isTeacher && badges && badges.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-950/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy size={20} className="text-violet-400" /> Достижения
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((b: any) => (
                <div key={b.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-slate-800/50 flex items-center justify-center p-2">
                    {b.iconUrl ? <img src={b.iconUrl} alt={b.name} className="w-full h-full object-contain" /> : <Trophy size={24} className="text-slate-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{b.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 leading-tight">{b.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Courses Section */}
        {user.enrollments && user.enrollments.filter((e: any) => e.isCompleted).length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-950/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen size={20} className="text-blue-400" /> Пройденные курсы
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user.enrollments.filter((e: any) => e.isCompleted).map((enr: any) => (
                <div key={enr.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{enr.course.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{enr.course.description?.substring(0, 50) || ''}...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Purchased Items Section */}
        {user.ownedItems && user.ownedItems.length > 0 && (
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-950/50 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-400" /> Инвентарь
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {user.ownedItems.map((oi: any) => (
                <div key={oi.id} className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center text-center gap-3 relative">
                  <div className="w-16 h-16 rounded-xl bg-slate-800/50 flex items-center justify-center p-2">
                    {oi.item.imageUrl ? <img src={oi.item.imageUrl} alt={oi.item.name} className="w-full h-full object-contain" /> : <ShoppingBag size={24} className="text-slate-500" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-200">{oi.item.name}</div>
                    {oi.isEquipped && <div className="text-[10px] text-emerald-400 mt-1 font-bold">НАДЕТО</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
