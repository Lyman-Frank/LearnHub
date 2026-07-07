'use client';

import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden font-sans text-white">
      {/* Фоновые радиальные градиенты для эффекта глубины */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Левая панель - Бренд-зона (скрыта на мобильных) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 border-r border-slate-900/50 bg-slate-950/40 backdrop-blur-3xl overflow-hidden">
        {/* Декоративная фоновая сетка */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#182830_1px,transparent_1px),linear-gradient(to_bottom,#182830_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />
        
        {/* Анимированный градиентный круг за текстом */}
        <div className="absolute w-[400px] h-[400px] bg-gradient-to-tr from-violet-600/20 to-fuchsia-600/20 rounded-full filter blur-[80px] animate-pulse" />

        <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
          {/* Логотип */}
          <Link href="/" className="group flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25 border border-violet-400/25 transform group-hover:rotate-12 transition-transform duration-300">
              <span className="font-extrabold text-2xl tracking-tighter text-white">L</span>
            </div>
            <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
              LearnHub
            </span>
          </Link>

          {/* Заголовок */}
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight mb-4 text-white">
            Интерактивное обучение <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-300 bg-clip-text text-transparent">
              нового поколения
            </span>
          </h2>

          {/* Описание */}
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            Создавайте увлекательные уроки с интерактивными тестами, кодом и карточками. Учитесь в игровом формате, отслеживайте прогресс и достигайте большего.
          </p>

          {/* Интерактивные мини-карточки */}
          <div className="grid grid-cols-2 gap-4 w-full text-left">
            <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl hover:border-violet-500/30 transition-all duration-300">
              <div className="text-violet-400 font-bold mb-1">🎮 Геймификация</div>
              <p className="text-xs text-slate-500 leading-relaxed">Система наград, достижений и мгновенная обратная связь, как в Duolingo.</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-xl hover:border-fuchsia-500/30 transition-all duration-300">
              <div className="text-fuchsia-400 font-bold mb-1">📝 Конструктор</div>
              <p className="text-xs text-slate-500 leading-relaxed">Мощный визуальный редактор тестов, кода и курсов любой сложности.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Правая панель - Область формы */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative z-10 overflow-y-auto">
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          {/* Мобильный логотип */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="font-extrabold text-xl tracking-tighter">L</span>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                LearnHub
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
