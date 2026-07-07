'use client';

import React, { useEffect, useState } from 'react';
import { Search, BookOpen, Users, Layers, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface CatalogCourse {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  author: { id: string; firstName: string; lastName: string };
  _count: { modules: number; enrollments: number };
  isPrivate?: boolean;
}

export default function CatalogPage() {
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCatalog = async (searchQuery: string, currentPage: number) => {
    setLoading(true);
    try {
      const data = await api.getCatalog({ search: searchQuery || undefined, page: currentPage, limit: 12 });
      setCourses(data.courses);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Ошибка загрузки каталога:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog(search, page);
  }, [search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 via-slate-950 to-slate-950 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-semibold text-violet-300">
            <Sparkles size={14} className="animate-pulse" />
            <span>Каталог курсов</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Найдите свой курс
          </h1>
          <p className="text-slate-300 leading-relaxed">
            {total > 0 ? `${total} курсов доступно` : 'Исследуйте знания по вашему запросу'}
          </p>
          {/* Поиск */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Поиск по названию..."
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-900 bg-slate-950/80 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-200"
            >
              Найти
            </button>
          </form>
        </div>
      </div>

      {/* Список курсов */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-violet-500" size={36} />
          <span className="text-slate-400 text-sm">Загружаем курсы...</span>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <BookOpen className="text-slate-500" size={24} />
          </div>
          <p className="text-slate-300 font-semibold">Курсов не найдено</p>
          <p className="text-slate-500 text-sm">
            {search ? `По запросу "${search}" ничего не нашлось.` : 'Пока нет опубликованных курсов.'}
          </p>
          {search && (
            <button
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium"
            >
              Сбросить фильтр
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/student/course/${course.id}`}
                className="group p-6 rounded-2xl border border-slate-900 hover:border-violet-500/30 bg-slate-950/50 hover:bg-slate-950 transition-all duration-300 flex flex-col justify-between min-h-52 shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full filter blur-xl group-hover:bg-violet-500/10 transition-colors duration-300 pointer-events-none" />

                <div className="space-y-3">
                  {/* Обложка */}
                  {course.coverUrl ? (
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-900 relative">
                      <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-28 rounded-xl bg-gradient-to-br from-violet-950/50 to-fuchsia-950/30 flex items-center justify-center border border-slate-900 relative">
                      <BookOpen className="text-violet-600/40" size={32} />
                    </div>
                  )}

                  <div className="flex items-center pt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      course.isPrivate
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    }`}>
                      {course.isPrivate ? 'Частный курс' : 'Публичный курс'}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-100 group-hover:text-violet-300 transition-colors duration-200 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-slate-500 text-xs line-clamp-2">{course.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-900/50 flex items-center justify-between mt-4">
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers size={11} />
                      {course._count.modules} разд.
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {course._count.enrollments} студ.
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {course.author?.firstName} {course.author?.lastName}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Пагинация */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg border border-slate-900 bg-slate-950 text-slate-400 text-sm hover:bg-slate-900 disabled:opacity-40 disabled:pointer-events-none"
              >
                ← Назад
              </button>
              <span className="text-slate-400 text-sm px-2">
                Страница {page} из {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg border border-slate-900 bg-slate-950 text-slate-400 text-sm hover:bg-slate-900 disabled:opacity-40 disabled:pointer-events-none"
              >
                Вперёд →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
