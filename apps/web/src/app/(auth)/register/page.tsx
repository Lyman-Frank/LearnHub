'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, User, Ticket, Rocket, AlertCircle, GraduationCap, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [institutionType, setInstitutionType] = useState('Школа');
  const [institutionName, setInstitutionName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Валидация
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = 'Введите имя';
    if (!lastName) newErrors.lastName = 'Введите фамилию';

    if (!email) {
      newErrors.email = 'Введите Email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Неверный формат электронной почты';
    }

    if (!password) {
      newErrors.password = 'Введите пароль';
    } else if (password.length < 6) {
      newErrors.password = 'Пароль должен быть не менее 6 символов';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (role === 'TEACHER' && !inviteCode) {
      newErrors.inviteCode = 'Введите инвайт-код преподавателя';
    }

    if (role === 'STUDENT') {
      if (institutionType !== 'Уже работает' && !institutionName) {
        newErrors.institutionName = 'Введите название учебного заведения';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register({
        email,
        password,
        firstName,
        lastName,
        role,
        inviteCode: role === 'TEACHER' ? inviteCode : undefined,
        institutionType: role === 'STUDENT' ? institutionType : undefined,
        institutionName: role === 'STUDENT' ? institutionName : undefined,
      });

      // Сохраняем состояние авторизации
      auth.setAuth(response);

      // Перенаправляем
      if (role === 'STUDENT') {
        router.push('/student/dashboard');
      } else {
        router.push('/author/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full relative z-10 animate-fade-in">
      <div className="p-8 sm:p-10 rounded-3xl border border-slate-900 bg-slate-950/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        {/* Декоративное свечение в углу */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full filter blur-xl pointer-events-none" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-violet-300 bg-clip-text text-transparent">
            Создать аккаунт
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Присоединяйтесь к образовательной платформе LearnHub
          </p>
        </div>

        {/* Переключатель ролей */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-slate-900/40 border border-slate-900 mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('STUDENT');
              setError(null);
            }}
            disabled={isLoading}
            className={`
              flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300
              ${role === 'STUDENT'
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-lg shadow-violet-500/5'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <Users size={16} />
            <span>Участник</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('TEACHER');
              setError(null);
            }}
            disabled={isLoading}
            className={`
              flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300
              ${role === 'TEACHER'
                ? 'bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/5'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            <GraduationCap size={16} />
            <span>Преподаватель</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-start gap-3 text-sm text-rose-400">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first-name-input"
              label="Имя"
              placeholder="Иван"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              icon={User}
              error={errors.firstName}
              disabled={isLoading}
              required
            />
            <Input
              id="last-name-input"
              label="Фамилия"
              placeholder="Иванов"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              icon={User}
              error={errors.lastName}
              disabled={isLoading}
              required
            />
          </div>

          <Input
            id="email-input"
            label="Email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            error={errors.email}
            disabled={isLoading}
            required
            autoComplete="email"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                id="password-input"
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                error={errors.password}
                disabled={isLoading}
                required
                autoComplete="new-password"
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

            <Input
              id="confirm-password-input"
              label="Повторите пароль"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={Lock}
              error={errors.confirmPassword}
              disabled={isLoading}
              required
              autoComplete="new-password"
            />
          </div>

          {/* Учебное заведение для студента */}
          {role === 'STUDENT' && (
            <div className="space-y-4 border-t border-slate-950/40 pt-4">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Где вы учитесь или работаете?</label>
                <div className="relative">
                  <select
                    value={institutionType}
                    onChange={(e) => {
                      setInstitutionType(e.target.value);
                      setInstitutionName('');
                    }}
                    disabled={isLoading}
                    className="w-full bg-slate-950/80 text-white rounded-xl border border-slate-900 px-4 py-3 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Школа" className="bg-slate-950">Школа</option>
                    <option value="Колледж" className="bg-slate-950">Колледж</option>
                    <option value="Универ" className="bg-slate-950">Универ</option>
                    <option value="Частная школа" className="bg-slate-950">Частная школа</option>
                    <option value="Уже работает" className="bg-slate-950">Уже работает</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    ▼
                  </div>
                </div>
              </div>

              <div className="transition-all duration-300">
                <Input
                  id="institution-name-input"
                  label={institutionType === 'Уже работает' ? 'Название компании (необязательно)' : 'Название учебного заведения'}
                  placeholder={institutionType === 'Уже работает' ? 'ООО Рога и Копыта' : 'Школа №123 / МГУ'}
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  icon={GraduationCap}
                  error={errors.institutionName}
                  disabled={isLoading}
                  required={institutionType !== 'Уже работает'}
                />
              </div>
            </div>
          )}

          {/* Плавно появляющееся поле Инвайт-кода */}
          <div className={`transition-all duration-500 overflow-hidden ${role === 'TEACHER' ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'}`}>
            <Input
              id="invite-code-input"
              label="Инвайт-код преподавателя"
              placeholder="TEACH-XXXX-XXXX"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              icon={Ticket}
              error={errors.inviteCode}
              disabled={isLoading || role !== 'TEACHER'}
            />
          </div>

          <button
            type="submit"
            id="btn-register-submit"
            disabled={isLoading}
            className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30 transform active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            ) : (
              <>
                <span>Зарегистрироваться</span>
                <Rocket size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-900 pt-6">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold text-violet-400 hover:text-violet-300 transition-colors duration-200">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
