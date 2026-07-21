'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, BookOpen, User as UserIcon, Search, Trophy, MessageSquare, ShoppingBag, Gamepad2, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Loading } from '@/components/ui/loading';
import { api } from '@/lib/api';
import { NotificationBell } from '@/components/notification-bell';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';


export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userStats, setUserStats] = useState({ xp: 0, streak: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = auth.getUser();
    if (!auth.isAuthenticated() || !user || user.role !== 'STUDENT') {
      auth.clearAuth();
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setUserName(`${user.firstName} ${user.lastName}`);
      
      // Загружаем статистику для геймификации
      api.getUserStats()
        .then(res => {
          if (res) {
            setUserStats({ xp: res.xp || 0, streak: res.streak || 0 });
          }
        })
        .catch(err => console.error('Ошибка загрузки статистики:', err));
    }
  }, [router]);

  useEffect(() => {
    const handleXpEarned = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setUserStats({ xp: detail.xp, streak: detail.streak });
      }
    };
    window.addEventListener('learnhub-xp-earned', handleXpEarned);
    return () => window.removeEventListener('learnhub-xp-earned', handleXpEarned);
  }, []);

  const handleLogout = () => {
    auth.clearAuth();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <Loading fullPage text="Проверка авторизации..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Шапка */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/student/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <span className="font-extrabold text-sm tracking-tighter">L</span>
              </div>
              <span className="font-black text-lg">LearnHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/student/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/student/dashboard'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Обучение
              </Link>
              <Link
                href="/student/catalog"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/student/catalog') || pathname?.startsWith('/student/course')
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Search size={14} />
                Каталог
              </Link>
              <Link
                href="/student/leaderboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/student/leaderboard'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Trophy size={14} />
                Лидерборд
              </Link>
              <Link
                href="/student/shop"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/student/shop'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShoppingBag size={14} />
                Магазин
              </Link>
              <Link
                href="/student/chat"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/student/chat'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare size={14} />
                Чат
              </Link>
              <Link
                href="/student/minigames"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/student/minigames')
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Gamepad2 size={14} />
                Мини-игры
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Стрик и XP */}
            <div className="flex items-center gap-3 mr-1 select-none">
              {/* Стрик 🔥 */}
              <div 
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-all ${
                  userStats.streak > 0 
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse' 
                    : 'border-slate-800 bg-slate-950 text-slate-500'
                }`}
                title={userStats.streak > 0 ? `Активность: ${userStats.streak} дн.` : 'Серия дней не активна'}
              >
                <span className={userStats.streak > 0 ? 'text-amber-400 font-bold' : 'grayscale text-slate-600'}>🔥</span>
                <span className="text-xs font-semibold">{userStats.streak} дн.</span>
              </div>

              {/* Уровень & XP */}
              <div className="hidden xs:flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span>Уровень</span>
                  <span className="font-bold text-violet-400">{Math.floor(userStats.xp / 100) + 1}</span>
                </div>
                <div className="w-16 h-1 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                    style={{ width: `${userStats.xp % 100}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              href="/student/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900 hover:border-slate-800 transition-all"
            >
              <UserIcon size={16} className="text-violet-400" />
              <span className="text-sm font-medium text-slate-300">{userName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 font-semibold uppercase tracking-wider">
                Студент
              </span>
            </Link>

            <PwaInstallPrompt />
            <NotificationBell />
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400 transition-all duration-200"
            >
              <Menu size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:flex p-2.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400 hover:text-rose-400 transition-all duration-200"
              title="Выйти из аккаунта"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
          <div className="h-16 border-b border-slate-900 px-4 flex items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <span className="font-extrabold text-sm tracking-tighter">L</span>
              </div>
              <span className="font-black text-lg">LearnHub</span>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-4">
            <Link href="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <BookOpen size={18} className="text-violet-400" /> Обучение
            </Link>
            <Link href="/student/catalog" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <Search size={18} className="text-violet-400" /> Каталог
            </Link>
            <Link href="/student/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <Trophy size={18} className="text-violet-400" /> Лидерборд
            </Link>
            <Link href="/student/shop" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <ShoppingBag size={18} className="text-violet-400" /> Магазин
            </Link>
            <Link href="/student/chat" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <MessageSquare size={18} className="text-violet-400" /> Чат
            </Link>
            <Link href="/student/minigames" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
              <Gamepad2 size={18} className="text-violet-400" /> Мини-игры
            </Link>
            
            <div className="mt-auto pt-4 border-t border-slate-900 flex flex-col gap-2">
              <Link href="/student/profile" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl border border-slate-900 bg-slate-900/50 flex items-center gap-3">
                <UserIcon size={18} className="text-violet-400" /> Профиль ({userName})
              </Link>
              <button onClick={handleLogout} className="px-4 py-3 rounded-xl border border-rose-900/30 bg-rose-500/10 text-rose-400 flex items-center gap-3 text-left">
                <LogOut size={18} /> Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
