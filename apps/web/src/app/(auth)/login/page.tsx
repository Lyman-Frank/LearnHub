'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Валидация
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError('Введите адрес электронной почты');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Неверный формат электронной почты');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Введите пароль');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const response = await api.login(email, password);
      // Сохраняем токены
      auth.setAuth(response);

      // Перенаправляем в зависимости от роли
      const { role } = response.user;
      if (role === 'STUDENT') {
        router.push('/student/dashboard');
      } else if (role === 'TEACHER') {
        router.push('/author/dashboard');
      } else if (role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка авторизации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative z-10 animate-fade-in">
      <div className="p-8 sm:p-10 rounded-3xl border border-slate-900 bg-slate-950/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Декоративное свечение в углу карточки */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full filter blur-xl pointer-events-none" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
            Добро пожаловать!
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Войдите в свой аккаунт для продолжения
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-sm text-rose-400">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            id="email-input"
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            error={emailError}
            disabled={isLoading}
            required
            autoComplete="email"
          />

          <div className="relative">
            <Input
              id="password-input"
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              error={passwordError}
              disabled={isLoading}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[44px] text-slate-400 hover:text-slate-200 transition-colors duration-200"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            id="btn-login-submit"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <span>Войти в аккаунт</span>
                <LogIn size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-900 pt-6">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors duration-200">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
