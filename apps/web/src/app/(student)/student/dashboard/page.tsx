'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Award, Activity, Clock, ArrowRight, Sparkles, Layers, Loader2, Users, Check, AlertCircle, Play, GraduationCap, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function StudentDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [studentGroups, setStudentGroups] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Group join states
  const [groupCode, setGroupCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      api.getStudentMyCourses().catch(() => []),
      api.getUserStats().catch(() => null),
      api.getStudentGroups().catch(() => []),
    ]).then(([courses, userStats, groups]) => {
      setMyCourses(courses);
      setStats(userStats);
      setStudentGroups(groups);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const u = auth.getUser();
    setUser(u);
    loadDashboardData();
  }, []);

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    if (!groupCode.trim()) return;

    setJoining(true);
    try {
      const res = await api.joinGroup(groupCode);
      setJoinSuccess(res.message || 'Вы успешно присоединились к классу!');
      setGroupCode('');
      // Reload dashboard data to refresh courses and groups
      const [courses, groups] = await Promise.all([
        api.getStudentMyCourses().catch(() => []),
        api.getStudentGroups().catch(() => []),
      ]);
      setMyCourses(courses);
      setStudentGroups(groups);
    } catch (err: any) {
      setJoinError(err.message || 'Ошибка вступления в класс');
    } finally {
      setJoining(false);
    }
  };

  const name = user ? user.firstName : 'Студент';

  const formatTime = (seconds: number) => {
    if (!seconds) return '0 мин';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}ч ${m}мин`;
    return `${m} мин`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Приветственный баннер */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 via-fuchsia-950/20 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-fuchsia-600/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300">
            <Sparkles size={14} className="animate-pulse" />
            <span>Добро пожаловать в LearnHub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Привет, {name}! 👋
          </h1>
          <p className="text-slate-300 text-base leading-relaxed">
            Готов освоить новые навыки сегодня? Выбирай интерактивные курсы, выполняй практические задания!
          </p>
          <div className="pt-2">
            <Link
              href="/student/catalog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transition-all duration-200"
            >
              <span>Открыть каталог курсов</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{myCourses.length}</div>
            <div className="text-xs text-slate-400 font-medium">Курсов записано</div>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Award size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.completedSteps ?? 0}</div>
            <div className="text-xs text-slate-400 font-medium">Пройдено шагов</div>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats?.streak ?? 0} {
              (stats?.streak ?? 0) === 1 ? 'день' : 
              ((stats?.streak ?? 0) > 1 && (stats?.streak ?? 0) < 5) ? 'дня' : 'дней'
            }</div>
            <div className="text-xs text-slate-400 font-medium">Ударный режим 🔥</div>
          </div>
        </div>
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatTime(stats?.timeSpent ?? 0)}</div>
            <div className="text-xs text-slate-400 font-medium">Время обучения</div>
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: My Courses */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Моё обучение</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                {myCourses.length} курсов
              </span>
            </h2>
            {myCourses.length > 0 && (
              <Link href="/student/catalog" className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
                + Найти ещё курсы
              </Link>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-violet-500" size={28} />
            </div>
          ) : myCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
                <BookOpen size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-200">Вы ещё не начали ни одного курса</h3>
                <p className="text-sm text-slate-400">
                  В нашей базе собрано множество интерактивных материалов. Подберите что-нибудь интересное!
                </p>
              </div>
              <Link
                href="/student/catalog"
                className="inline-block px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-sm font-medium text-slate-300 transition-all duration-200"
              >
                Перейти в каталог
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myCourses.map((enr) => (
                <Link
                  key={enr.id}
                  href={`/student/course/${enr.course.id}`}
                  className="group p-5 rounded-2xl border border-slate-900 hover:border-violet-500/30 bg-slate-950/50 hover:bg-slate-950 transition-all duration-300 flex flex-col gap-3"
                >
                  <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-900">
                    {enr.course.coverUrl ? (
                      <img src={enr.course.coverUrl} alt={enr.course.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="text-slate-700" size={28} />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-slate-200 group-hover:text-violet-300 transition-colors line-clamp-2">
                    {enr.course.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-auto">
                    <span className="flex items-center gap-1">
                      <Layers size={10} />
                      {enr.course._count?.modules ?? 0} разд.
                    </span>
                    <span>
                      {enr.course.author?.firstName} {enr.course.author?.lastName}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Classes / Cohorts */}
        <div className="lg:col-span-4 space-y-6">
          {/* Shop Promotion Banner Card */}
          <div className="p-6 rounded-2xl border border-violet-500/20 bg-gradient-to-tr from-violet-950/20 to-fuchsia-950/20 backdrop-blur-sm space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full filter blur-xl pointer-events-none group-hover:bg-violet-500/20 transition-all duration-300" />
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <ShoppingBag size={16} className="text-violet-400" />
              <span>Магазин наград</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Потратьте накопленные очки опыта (XP) на покупку эксклюзивных рамок аватаров, значков и уникальных стилей никнейма!
            </p>
            <Link
              href="/student/shop"
              className="w-full py-2.5 px-4 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <span>Открыть магазин</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Join Group Card */}
          <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Users size={16} className="text-violet-400" />
              <span>Присоединиться к классу</span>
            </h3>
            
            {joinError && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-xs text-emerald-400 flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
            )}

            <form onSubmit={handleJoinGroup} className="flex gap-2">
              <input
                type="text"
                placeholder="Код: GRP-XXXX-XXXX"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value)}
                disabled={joining}
                className="flex-1 bg-slate-950/80 text-white rounded-xl border border-slate-900 px-3 py-2 text-xs font-mono tracking-wider focus:border-violet-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={joining}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all shrink-0"
              >
                {joining ? '...' : 'Войти'}
              </button>
            </form>
          </div>

          {/* Active Cohorts List */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-250 flex items-center gap-2">
              <GraduationCap size={16} className="text-slate-400" />
              <span>Ваши учебные группы ({studentGroups.length})</span>
            </h3>
            {studentGroups.length === 0 ? (
              <div className="p-5 rounded-2xl border border-dashed border-slate-900 text-center text-xs text-slate-500">
                Вы ещё не состоите ни в одной группе. Введите инвайт-код выше.
              </div>
            ) : (
              <div className="space-y-2">
                {studentGroups.map((membership) => (
                  <div key={membership.id} className="p-4 rounded-xl border border-slate-900 bg-slate-950/30 space-y-1.5 hover:border-slate-800 transition-colors">
                    <h4 className="font-bold text-xs text-slate-200">{membership.group.name}</h4>
                    <div className="text-[10px] text-slate-400 flex flex-col gap-0.5">
                      <span>Преподаватель: {membership.group.teacher.firstName} {membership.group.teacher.lastName}</span>
                      <span>Вступил: {new Date(membership.joinedAt).toLocaleDateString()}</span>
                    </div>
                    {membership.group.course && (
                      <Link 
                        href={`/student/course/${membership.group.course.id}`}
                        className="inline-flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 font-semibold pt-1 border-t border-slate-900/50 w-full"
                      >
                        <Play size={10} />
                        <span>Открыть курс: {membership.group.course.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
