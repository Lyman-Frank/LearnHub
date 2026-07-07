'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Users, BarChart3, PlusCircle, GraduationCap, ClipboardList, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

export default function AuthorDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Форма создания курса
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAuthorCourses();
      setCourses(data);
    } catch (err) {
      console.error('Не удалось загрузить курсы:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      const newCourse = await api.createCourse({
        title,
        description: description || undefined,
        coverUrl: coverUrl || undefined,
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setCoverUrl('');
      // Редирект или обновление списка
      fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании курса');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Приветственный баннер */}
      <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-r from-fuchsia-950/30 via-slate-950 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-fuchsia-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-xs font-semibold text-fuchsia-300">
              <GraduationCap size={14} className="animate-pulse" />
              <span>Панель автора</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Кабинет автора 🎓
            </h1>
            <p className="text-slate-300 text-base leading-relaxed">
              Создавайте увлекательные уроки, добавляйте тесты, квизы и интерактивные шаги. Делитесь знаниями и отслеживайте прогресс студентов.
            </p>
          </div>
          <div className="shrink-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20 hover:shadow-fuchsia-500/30 transition-all duration-200"
            >
              <PlusCircle size={18} />
              <span>Создать новый курс</span>
            </button>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">{courses.length}</div>
            <div className="text-xs text-slate-400 font-medium">Созданных курсов</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-xs text-slate-400 font-medium">Студентов обучается</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/60 backdrop-blur-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
            <BarChart3 size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-xs text-slate-400 font-medium">Процент прохождения</div>
          </div>
        </div>
      </div>

      {/* Мои курсы */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Мои курсы</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            {courses.length}
          </span>
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="animate-spin text-fuchsia-500" size={36} />
            <span className="text-slate-450 text-sm">Загрузка курсов...</span>
          </div>
        ) : courses.length === 0 ? (
          /* Пустое состояние */
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-850">
              <ClipboardList size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-200">Вы пока не опубликовали ни одного курса</h3>
              <p className="text-sm text-slate-400">
                Нажмите кнопку выше, чтобы запустить конструктор курсов и поделиться своими уникальными знаниями со студентами!
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mx-auto px-4 py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-850 text-sm font-medium text-slate-300 transition-all duration-200"
            >
              Начать создание курса
            </button>
          </div>
        ) : (
          /* Сетка курсов */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="group p-6 rounded-2xl border border-slate-900 hover:border-fuchsia-500/30 bg-slate-950/50 hover:bg-slate-950 transition-all duration-300 flex flex-col justify-between h-48 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-fuchsia-500/5 rounded-full filter blur-xl pointer-events-none group-hover:bg-fuchsia-500/10 transition-colors duration-300" />
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                      course.status === 'PUBLISHED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : course.status === 'PENDING_REVIEW'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {course.status === 'PUBLISHED' 
                        ? 'Опубликован' 
                        : course.status === 'PENDING_REVIEW' 
                        ? 'На проверке' 
                        : 'Черновик'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-100 group-hover:text-fuchsia-400 transition-colors duration-200 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">
                    {course.description || 'Описание отсутствует.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-900/50 flex items-center justify-end">
                  <Link 
                    href={`/author/course/${course.id}`}
                    className="text-xs font-semibold text-fuchsia-400 flex items-center gap-1 hover:text-fuchsia-300 transition-colors duration-150"
                  >
                    <span>Редактировать</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно создания курса */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl border border-slate-900 bg-slate-950 shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-6">Создать новый курс</h3>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  Название курса *
                </label>
                <input
                  type="text"
                  placeholder="Например: Основы Pascal и Алгоритмы"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-650 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all duration-200 text-sm"
                  required
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  Описание курса
                </label>
                <textarea
                  placeholder="Краткое описание курса для студентов"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-650 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all duration-200 text-sm resize-none"
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">
                  URL обложки курса (опционально)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white font-medium placeholder-slate-650 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all duration-200 text-sm"
                  disabled={isCreating}
                />
              </div>

              <div className="flex items-center gap-3 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold text-sm transition-all duration-200"
                  disabled={isCreating}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-fuchsia-600/20 transition-all duration-200"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Создание...</span>
                    </>
                  ) : (
                    <span>Создать</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
