'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Shield, Settings, Key, BookOpen, Images, MessageSquare, ShoppingBag, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Loading } from '@/components/ui/loading';
import { NotificationBell } from '@/components/notification-bell';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = auth.getUser();
    if (!auth.isAuthenticated() || !user || user.role !== 'ADMIN') {
      auth.clearAuth();
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setUserName(`${user.firstName} ${user.lastName}`);
    }
  }, [router]);

  const handleLogout = () => {
    auth.clearAuth();
    router.push('/login');
  };

  if (!isAuthenticated) {
    return <Loading fullPage text="Проверка прав администратора..." />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Шапка */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/10">
                <span className="font-extrabold text-sm tracking-tighter">L</span>
              </div>
              <span className="font-black text-lg">LearnHub</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/admin/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/dashboard'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield size={14} />
                <span>Панель управления</span>
              </Link>
              <Link
                href="/admin/courses"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname?.startsWith('/admin/courses')
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <BookOpen size={14} />
                <span>Модерация</span>
              </Link>
              <Link
                href="/admin/gallery"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname?.startsWith('/admin/gallery')
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Images size={14} />
                <span>Галерея</span>
              </Link>
              <Link
                href="/admin/chat"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/chat'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <MessageSquare size={14} />
                <span>Чат</span>
              </Link>
              <Link
                href="/admin/shop"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/shop'
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShoppingBag size={14} />
                <span>Магазин</span>
              </Link>
              <Link
                href="/admin/minigames"
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname?.startsWith('/admin/minigames')
                    ? 'text-violet-400 bg-violet-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Gamepad2 size={14} />
                <span>Мини-игры</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-900 bg-slate-950">
              <Shield size={16} className="text-violet-400" />
              <span className="text-sm font-medium text-slate-300">{userName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-400 font-extrabold uppercase tracking-wider">
                Admin
              </span>
            </div>

            <PwaInstallPrompt />
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
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
