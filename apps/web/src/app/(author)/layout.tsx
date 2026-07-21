'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, GraduationCap, LayoutDashboard, PlusCircle, MessageSquare, Key, AlertCircle, Loader2, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Loading } from '@/components/ui/loading';
import { NotificationBell } from '@/components/notification-bell';


export default function AuthorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.getUser();
    if (!auth.isAuthenticated() || !user || (user.role !== 'TEACHER' && user.role !== 'ADMIN')) {
      auth.clearAuth();
      router.push('/login');
      return;
    }

    setIsAuthenticated(true);
    setUserName(`${user.firstName} ${user.lastName}`);

    if (user.role === 'TEACHER') {
      api.getUserProfile(user.id)
        .then((profile) => {
          const expiresAt = profile.user.subscriptionExpiresAt;
          const expired = !expiresAt || new Date(expiresAt) < new Date();
          setIsExpired(expired);
        })
        .catch((e) => {
          console.error('Failed to load user subscription info:', e);
        });
    }
  }, [router]);

  const handleLogout = () => {
    auth.clearAuth();
    router.push('/login');
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) return;
    setActivating(true);
    setActivationError(null);

    try {
      await api.activateInviteKey(activationCode.trim());
      setIsExpired(false);
      alert('Лицензионный ключ успешно активирован! Доступ предоставлен.');
      window.location.reload();
    } catch (err: any) {
      setActivationError(err.message || 'Неверный или просроченный ключ доступа');
    } finally {
      setActivating(false);
    }
  };

  if (!isAuthenticated) {
    return <Loading fullPage text="Проверка прав преподавателя..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Шапка */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/author/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/10">
                <span className="font-extrabold text-sm tracking-tighter">L</span>
              </div>
              <span className="font-black text-lg">LearnHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              <Link
                href="/author/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/author/dashboard' || pathname?.startsWith('/author/course')
                    ? 'text-fuchsia-400 bg-fuchsia-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Панель Автора
              </Link>
              <Link
                href="/author/groups"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname?.startsWith('/author/groups')
                    ? 'text-fuchsia-400 bg-fuchsia-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                Мои Классы
              </Link>
              <Link
                href="/author/minigames"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname?.startsWith('/author/minigames')
                    ? 'text-fuchsia-400 bg-fuchsia-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Gamepad2 size={14} />
                Мини-игры
              </Link>
              <Link
                href="/author/chat"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === '/author/chat'
                    ? 'text-fuchsia-400 bg-fuchsia-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare size={14} />
                Чат
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/author/profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900 hover:border-slate-800 transition-all"
            >
              <GraduationCap size={16} className="text-fuchsia-400" />
              <span className="text-sm font-medium text-slate-300">{userName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-fuchsia-500/10 text-fuchsia-400 font-semibold uppercase tracking-wider">
                Преподаватель
              </span>
            </Link>

            <NotificationBell />
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400 hover:text-rose-400 transition-all duration-200"
              title="Выйти из аккаунта"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 relative">
        {isExpired ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 select-none animate-fade-in">
            <div className="max-w-md w-full p-6 rounded-2xl border border-slate-900 bg-slate-950 space-y-6 shadow-2xl">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 flex items-center justify-center shadow-lg shadow-rose-500/10">
                  <Key size={24} className="animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-white">Доступ заблокирован</h2>
                <p className="text-xs text-slate-400">
                  Срок действия вашего лицензионного ключа истек. Пожалуйста, введите новый инвайт-код для продления доступа.
                </p>
              </div>

              {activationError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-2.5 text-xs text-rose-400 animate-shake">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{activationError}</span>
                </div>
              )}

              <form onSubmit={handleActivate} className="space-y-4">
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="TEACH-XXXX-XXXX"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-center font-mono font-bold uppercase placeholder-slate-700 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all tracking-wider"
                    disabled={activating}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={activating}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20 hover:shadow-fuchsia-500/30 transition-all duration-200 disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Активация...</span>
                    </>
                  ) : (
                    <span>Активировать доступ</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
