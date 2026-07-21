'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, BookOpen, Search, Filter, Eye } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Черновик', color: 'bg-slate-800 text-slate-400 border-slate-700' },
  PENDING_REVIEW: { label: 'Ожидает проверки', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  UNDER_REVIEW: { label: 'На проверке', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  PUBLISHED: { label: 'Опубликован', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  ARCHIVED: { label: 'Архив', color: 'bg-slate-900 text-slate-500 border-slate-800' },
};

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    api.adminGetAllCourses()
      .then(setCourses)
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const updated = await api.adminUpdateCourseStatus(id, status);
      setCourses(prev => prev.map(c => c.id === id ? { ...c, status: updated.status } : c));
    } catch (err: any) {
      window.customAlert(err.message || 'Ошибка обновления статуса');
    } finally {
      setUpdating(null);
    }
  };

  const handleStartReview = async (id: string) => {
    setUpdating(id);
    try {
      await api.adminUpdateCourseStatus(id, 'UNDER_REVIEW');
      router.push(`/admin/courses/${id}/preview`);
    } catch (err: any) {
      window.customAlert(err.message || 'Ошибка запуска проверки');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = courses.filter(c => {
    const matchFilter = filter === 'ALL' || c.status === filter;
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.author?.firstName.toLowerCase().includes(search.toLowerCase()) ||
      c.author?.lastName.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = courses.filter(c => c.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Модерация курсов</h1>
          <p className="text-sm text-slate-400 mt-1">Управление публикацией курсов преподавателей</p>
        </div>
        {pendingCount > 0 && (
          <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-bold">
            ⏳ {pendingCount} на проверке
          </span>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию / автору..."
            className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-900 bg-slate-950 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-fuchsia-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-900">
          {['ALL', 'PENDING_REVIEW', 'UNDER_REVIEW', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === s
                  ? 'bg-fuchsia-600/20 text-fuchsia-400 border border-fuchsia-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'ALL' ? 'Все' : (STATUS_LABELS[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Таблица */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-fuchsia-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <BookOpen className="mx-auto text-slate-700" size={32} />
          <p className="text-slate-400 font-medium">Курсов не найдено</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/60 border-b border-slate-900">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Курс</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Автор</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Разд.</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Студ.</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Статус</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filtered.map(course => (
                <tr key={course.id} className="hover:bg-slate-900/20 transition-colors group">
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-200 line-clamp-1 max-w-xs">{course.title}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {course.author?.firstName} {course.author?.lastName}
                  </td>
                  <td className="px-5 py-4 text-slate-400">{course._count?.modules ?? 0}</td>
                  <td className="px-5 py-4 text-slate-400">{course._count?.enrollments ?? 0}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] px-2 py-1 rounded-full border font-bold uppercase tracking-wider ${
                      STATUS_LABELS[course.status]?.color ?? 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}>
                      {STATUS_LABELS[course.status]?.label ?? course.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {updating === course.id ? (
                        <Loader2 className="animate-spin text-fuchsia-400" size={16} />
                      ) : (
                        <>
                          {(course.status === 'PENDING_REVIEW' || course.status === 'UNDER_REVIEW') && (
                            <button
                              onClick={() => handleStartReview(course.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 text-xs font-semibold transition-all"
                            >
                              <Eye size={13} />
                              <span>Проверить</span>
                            </button>
                          )}
                          {course.status === 'PUBLISHED' && (
                            <button
                              onClick={() => handleStatusChange(course.id, 'ARCHIVED')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 text-xs font-semibold transition-all"
                            >
                              Архивировать
                            </button>
                          )}
                          {course.status === 'ARCHIVED' && (
                            <button
                              onClick={() => handleStatusChange(course.id, 'PUBLISHED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all"
                            >
                              Восстановить
                            </button>
                          )}
                          {/* Черновик — не показываем кнопку "Опубликовать", автор должен сам отправить на проверку */}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
