'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Layers, Users, ArrowRight, CheckCircle, Lock, ChevronDown, ChevronRight, Loader2, Award, Download
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';

interface Step {
  id: string;
  title: string;
  type: string;
  position: number;
}

interface Lesson {
  id: string;
  title: string;
  position: number;
  steps: Step[];
  availableAt?: string | null;
  deadlineAt?: string | null;
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
  isLocked?: boolean;
  isPrivate?: boolean;
  availableAt?: string | null;
  deadlineAt?: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: string;
  author: { id: string; firstName: string; lastName: string };
  modules: Module[];
  _count: { enrollments: number };
  isLocked?: boolean;
  isPrivate?: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [progressData, setProgressData] = useState<{ percentage: number } | null>(null);

  // Состояния для разблокировки курса
  const [coursePassword, setCoursePassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Состояния для разблокировки разделов
  const [unlockingModuleId, setUnlockingModuleId] = useState<string | null>(null);
  const [modulePassword, setModulePassword] = useState('');
  const [moduleUnlockError, setModuleUnlockError] = useState('');
  const [unlockingModule, setUnlockingModule] = useState(false);

  const user = auth.getUser();

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getCourse(courseId);
        setCourse(data);

        // Раскрываем первый модуль по умолчанию, если он не заблокирован
        if (data.modules?.length > 0 && !data.modules[0].isLocked) {
          setExpandedModules(new Set([data.modules[0].id]));
        }

        // Проверяем, записан ли пользователь
        if (user && !data.isLocked) {
          const enr = await api.getEnrollment(courseId);
          setEnrollment(enr);
          if (enr) {
            const prog = await api.getCourseProgress(courseId);
            setProgressData(prog);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки курса:', err);
        router.push('/student/catalog');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const handleUnlockCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlocking(true);
    setUnlockError('');
    try {
      await api.unlockCourse(courseId, coursePassword);
      // После успешной разблокировки перезагружаем данные курса
      const data = await api.getCourse(courseId);
      setCourse(data);

      if (user) {
        const enr = await api.getEnrollment(courseId);
        setEnrollment(enr);
        if (enr) {
          const prog = await api.getCourseProgress(courseId);
          setProgressData(prog);
        }
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Неверный пароль курса');
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockingModuleId) return;
    setUnlockingModule(true);
    setModuleUnlockError('');
    try {
      await api.unlockModule(unlockingModuleId, modulePassword);
      const data = await api.getCourse(courseId);
      setCourse(data);
      setExpandedModules(prev => new Set([...prev, unlockingModuleId]));
      setUnlockingModuleId(null);
    } catch (err: any) {
      setModuleUnlockError(err.message || 'Неверный пароль раздела');
    } finally {
      setUnlockingModule(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setEnrolling(true);
    try {
      const res = await api.enrollCourse(courseId);
      setEnrollment(res.enrollment);
      alert('Вы успешно записались на курс! 🎉');
    } catch (err: any) {
      alert(err.message || 'Ошибка записи на курс');
    } finally {
      setEnrolling(false);
    }
  };

  const toggleModule = (mod: Module) => {
    if (mod.isLocked) {
      setUnlockingModuleId(mod.id);
      setModulePassword('');
      setModuleUnlockError('');
      return;
    }
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(mod.id) ? next.delete(mod.id) : next.add(mod.id);
      return next;
    });
  };

  const handleDownloadCert = async () => {
    try {
      if (!course) return;
      const blob = await api.downloadCertificate(courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${course.title.replace(/\\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Не удалось скачать сертификат');
    }
  };

  const totalLessons = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const totalSteps = course?.modules.reduce(
    (acc, m) => acc + m.lessons.reduce((a, l) => a + l.steps.length, 0), 0
  ) ?? 0;

  // Находим первый шаг курса для кнопки "Начать обучение"
  let firstStepId: string | undefined = undefined;
  if (course) {
    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (les.steps.length > 0) {
          firstStepId = les.steps[0].id;
          break;
        }
      }
      if (firstStepId) break;
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={40} />
        <span className="text-slate-400 text-sm">Загрузка курса...</span>
      </div>
    );
  }

  if (!course) return null;

  if (course.isLocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-3xl border border-amber-500/20 bg-slate-950/80 shadow-2xl space-y-6 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Частный курс</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Этот курс защищен паролем. Пожалуйста, введите пароль для доступа к материалам курса.
            </p>
          </div>
          <form onSubmit={handleUnlockCourse} className="space-y-4">
            <input
              type="password"
              placeholder="Пароль курса"
              value={coursePassword}
              onChange={(e) => setCoursePassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm text-center focus:outline-none focus:border-amber-500 transition-all placeholder-slate-700"
            />
            {unlockError && <p className="text-xs text-rose-500">{unlockError}</p>}
            <button
              type="submit"
              disabled={unlocking}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2"
            >
              {unlocking ? <Loader2 className="animate-spin" size={16} /> : null}
              Разблокировать
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Hero курса */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 via-slate-950 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />

        {course.coverUrl && (
          <div className="mb-6 w-full max-h-48 rounded-2xl overflow-hidden border border-slate-900">
            <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative z-10 space-y-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-slate-300 leading-relaxed">{course.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pt-1">
            <span className="flex items-center gap-1.5">
              <BookOpen size={15} /> {course.modules.length} разделов
            </span>
            <span className="flex items-center gap-1.5">
              <Layers size={15} /> {totalLessons} уроков
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={15} /> {course._count?.enrollments ?? 0} студентов
            </span>
            <span className="text-slate-500">
              {course.author ? `Автор: ${course.author.firstName} ${course.author.lastName}` : ''}
            </span>
          </div>

          <div className="pt-2">
            {enrollment ? (
              <div className="flex items-center gap-4">
                <span className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold">
                  ✓ Вы записаны на курс
                </span>
                {firstStepId && (
                  <Link
                    href={`/student/course/${courseId}/learn/${firstStepId}`}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all duration-200"
                  >
                    <span>Начать обучение</span>
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all duration-200"
              >
                {enrolling ? (
                  <><Loader2 className="animate-spin" size={18} /><span>Записываемся...</span></>
                ) : (
                  <><span>Записаться на курс</span><ArrowRight size={18} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {progressData?.percentage === 100 && (
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 p-6 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Поздравляем! Курс завершен!</h2>
              <p className="text-slate-300 text-sm">Вы успешно прошли все шаги этого курса.</p>
            </div>
          </div>
          <button
            onClick={handleDownloadCert}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold flex items-center gap-2 shadow-lg transition-colors"
          >
            <Download size={18} />
            <span>Скачать сертификат</span>
          </button>
        </div>
      )}

      {/* Программа курса */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Программа курса</h2>
        <p className="text-slate-400 text-sm">{course.modules.length} разделов · {totalLessons} уроков · {totalSteps} шагов</p>

        <div className="space-y-3">
          {course.modules.map((mod, mi) => {
            const isExpanded = expandedModules.has(mod.id);
            const lessonCount = mod.lessons.length;
            const isModuleReleased = !mod.availableAt || new Date(mod.availableAt) <= new Date();

            return (
              <div key={mod.id} className="rounded-2xl border border-slate-900 bg-slate-950/50 overflow-hidden">
                <button
                  onClick={() => toggleModule(mod)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-900/30 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3 text-left flex-wrap">
                    <span className="text-xs font-bold text-slate-600 w-5 text-right">{mi + 1}</span>
                    <span className="font-bold text-slate-200">{mod.title}</span>
                    {mod.isPrivate && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                        <Lock size={8} /> {mod.isLocked ? 'Заблокирован' : 'Доступно'}
                      </span>
                    )}
                    {!isModuleReleased && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 text-[9px] font-bold text-rose-450 uppercase tracking-wider">
                        Доступно с {new Date(mod.availableAt!).toLocaleDateString()}
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{lessonCount} ур.</span>
                  </div>
                  {isExpanded
                    ? <ChevronDown size={16} className="text-slate-500 shrink-0" />
                    : <ChevronRight size={16} className="text-slate-500 shrink-0" />
                  }
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-900 divide-y divide-slate-900/50">
                    {mod.lessons.map((les, li) => {
                      const hasSteps = les.steps.length > 0;
                      const isLessonReleased = isModuleReleased && (!les.availableAt || new Date(les.availableAt) <= new Date());
                      const isDeadlinePassed = les.deadlineAt && new Date(les.deadlineAt) < new Date();

                      const content = (
                        <>
                          <span className="text-xs font-medium text-slate-600 w-6 text-right">{li + 1}</span>
                          <div className="flex-1 text-sm text-slate-300 group-hover:text-violet-400 transition-colors flex items-center gap-2 flex-wrap">
                            <span>{les.title}</span>
                            {!isLessonReleased && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[8px] font-extrabold text-rose-450 uppercase tracking-wide">
                                Доступ с {new Date(les.availableAt!).toLocaleDateString()}
                              </span>
                            )}
                            {les.deadlineAt && (
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded bg-slate-900 border text-[8px] font-extrabold uppercase tracking-wide ${isDeadlinePassed ? 'border-rose-500/20 text-rose-450' : 'border-violet-500/20 text-violet-400'}`}>
                                Дедлайн: {new Date(les.deadlineAt).toLocaleDateString()} {isDeadlinePassed && '(Истек)'}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-600">{les.steps.length} шаг.</span>
                          {enrollment && isLessonReleased ? (
                            <CheckCircle size={14} className="text-emerald-500/50 shrink-0" />
                          ) : (
                            <Lock size={14} className="text-slate-700 shrink-0" />
                          )}
                        </>
                      );

                      if (enrollment && hasSteps && isLessonReleased) {
                        return (
                          <Link
                            key={les.id}
                            href={`/student/course/${courseId}/learn/${les.steps[0].id}`}
                            className="px-6 py-3 flex items-center gap-3 hover:bg-slate-900/40 group transition-colors cursor-pointer"
                          >
                            {content}
                          </Link>
                        );
                      }

                      return (
                        <div key={les.id} className="px-6 py-3 flex items-center gap-3 opacity-60">
                          {content}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Модальное окно разблокировки раздела */}
      {unlockingModuleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-sm w-full p-6 rounded-2xl border border-amber-500/20 bg-slate-950 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
              <Lock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Раздел защищен паролем</h3>
              <p className="text-slate-400 text-xs">
                Введите пароль, установленный преподавателем для открытия этого раздела.
              </p>
            </div>
            <form onSubmit={handleUnlockModule} className="space-y-3">
              <input
                type="password"
                placeholder="Пароль раздела"
                value={modulePassword}
                onChange={(e) => setModulePassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm text-center focus:outline-none focus:border-amber-500 transition-all placeholder-slate-700"
              />
              {moduleUnlockError && <p className="text-xs text-rose-500">{moduleUnlockError}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockingModuleId(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold transition-all hover:bg-slate-850"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={unlockingModule}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-bold transition-all hover:from-amber-500 hover:to-yellow-500 flex items-center justify-center gap-1.5"
                >
                  {unlockingModule && <Loader2 className="animate-spin" size={12} />}
                  Открыть
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
