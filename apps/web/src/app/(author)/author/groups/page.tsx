'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  Users, Plus, Trash2, Copy, Check, BookOpen, GraduationCap, Calendar, 
  Search, ArrowRight, UserCheck, Clock, Award, X, Sparkles, Loader2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
  } | null;
  _count: {
    members: number;
  };
}

interface MemberDetail {
  id: string;
  joinedAt: string;
  percentage: number;
  lastActivity: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
    xp: number;
    institutionType: string | null;
    institutionName: string | null;
  };
}

interface GroupDetail {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  course?: {
    id: string;
    title: string;
  } | null;
  members: MemberDetail[];
}

export default function AuthorGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Detail Modal States
  const [selectedGroup, setSelectedGroup] = useState<GroupDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState<'students' | 'realtime'>('students');
  const [realtimeActivity, setRealtimeActivity] = useState<any[]>([]);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  // Clipboard copy feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchRealtimeActivity = async (groupId: string) => {
    try {
      const data = await api.getGroupRealtimeActivity(groupId);
      setRealtimeActivity(data);
    } catch (err) {
      console.error('Error fetching realtime activity:', err);
    }
  };

  useEffect(() => {
    if (!selectedGroup || modalTab !== 'realtime') {
      setRealtimeActivity([]);
      return;
    }

    setLoadingRealtime(true);
    fetchRealtimeActivity(selectedGroup.id).finally(() => setLoadingRealtime(false));

    const interval = setInterval(() => {
      fetchRealtimeActivity(selectedGroup.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedGroup, modalTab]);

  const fetchGroupsAndCourses = async () => {
    setLoading(true);
    try {
      const [groupsData, coursesData] = await Promise.all([
        api.getTeacherGroups(),
        api.getAuthorCourses(),
      ]);
      setGroups(groupsData);
      setCourses(coursesData.filter(c => c.status === 'PUBLISHED'));
    } catch (err) {
      console.error('Error fetching teacher data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupsAndCourses();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Пожалуйста, введите название группы/класса');
      return;
    }

    setCreateLoading(true);
    try {
      await api.createGroup(name, courseId || undefined);
      setName('');
      setCourseId('');
      await fetchGroupsAndCourses();
    } catch (err: any) {
      setFormError(err.message || 'Ошибка создания группы');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteGroup = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы уверены, что хотите удалить эту группу? Все привязанные студенты будут исключены из класса.')) {
      return;
    }

    try {
      await api.deleteGroup(id);
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
      await fetchGroupsAndCourses();
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('Не удалось удалить группу');
    }
  };

  const handleViewGroupDetails = async (group: Group) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getTeacherGroup(group.id);
      setSelectedGroup(detail);
    } catch (err) {
      console.error('Error loading group details:', err);
      alert('Не удалось загрузить сведения о классе');
    } finally {
      setLoadingDetail(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 сек';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} ч`);
    if (m > 0) parts.push(`${m} мин`);
    if (s > 0 || parts.length === 0) parts.push(`${s} сек`);
    return parts.join(' ');
  };

  return (
    <div className="space-y-8 animate-fade-in text-white">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/10">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Управление классами</h1>
            <p className="text-sm text-slate-400 mt-1">Создавайте группы, назначайте курсы и отслеживайте успеваемость</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create Group Form */}
        <div className="lg:col-span-4 p-6 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="text-fuchsia-400 w-5 h-5 animate-pulse" />
            <h3 className="font-bold text-base">Создать новый класс</h3>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-xs text-rose-400 font-semibold leading-relaxed">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="space-y-4">
            <Input
              id="group-name-input"
              label="Название класса / группы"
              placeholder="например, 9Б класс или Менеджеры 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createLoading}
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Назначить курс группе</label>
              <div className="relative">
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  disabled={createLoading}
                  className="w-full bg-slate-950/80 text-white rounded-xl border border-slate-900 px-4 py-3 text-sm focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950">Без привязки к курсу</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id} className="bg-slate-950">{course.title}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">При вступлении в группу студенты будут автоматически записаны на этот курс.</p>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {createLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <>
                  <Plus size={18} />
                  <span>Создать группу</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Active Groups List */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-bold text-base border-b border-slate-900 pb-2 flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <span>Ваши классы и когорты ({groups.length})</span>
          </h3>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin" />
              <span className="text-xs text-slate-500">Загружаем список классов...</span>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20 space-y-3 border border-dashed border-slate-900 rounded-2xl bg-slate-950/20">
              <Users className="mx-auto text-slate-700" size={36} />
              <p className="text-slate-400 text-sm">Вы ещё не создали ни одной учебной группы</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleViewGroupDetails(group)}
                  className="p-5 rounded-2xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/30 transition-all duration-250 cursor-pointer flex flex-col justify-between h-[210px] relative overflow-hidden group/card"
                >
                  {/* Decorative glowing gradient border */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-fuchsia-500 to-violet-500 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-lg text-slate-100 group-hover/card:text-fuchsia-400 transition-colors">
                        {group.name}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteGroup(group.id, e)}
                        className="p-2 rounded-lg border border-slate-900 bg-slate-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all shrink-0"
                        title="Удалить класс"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <BookOpen size={14} className="text-fuchsia-400" />
                      <span className="truncate">
                        {group.course ? `Курс: ${group.course.title}` : 'Курс не назначен'}
                      </span>
                    </div>

                    {/* Invite Code Bar */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-900 mt-2 select-all">
                      <span className="text-xs font-mono font-bold tracking-wider text-fuchsia-400">{group.code}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(group.code);
                        }}
                        className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white transition-colors"
                        title="Копировать код инвайта"
                      >
                        {copiedCode === group.code ? (
                          <Check size={14} className="text-emerald-400" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-xs text-slate-500 font-semibold mt-4">
                    <span className="flex items-center gap-1">
                      <UserCheck size={14} className="text-slate-400" /> {group._count.members} учеников
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {new Date(group.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Class Students / Performance Details Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-4xl w-full max-h-[85vh] p-6 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-900 pb-4">
              <div>
                <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                  <Users className="text-fuchsia-400" size={22} />
                  <span>Детализация: {selectedGroup.name}</span>
                </h3>
                <p className="text-xs text-slate-450 mt-1.5 flex items-center gap-3">
                  <span>Код вступления: <code className="font-mono text-fuchsia-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">{selectedGroup.code}</code></span>
                  <span>·</span>
                  <span>Курс: <strong className="text-white">{selectedGroup.course?.title || 'не назначен'}</strong></span>
                </p>
              </div>
              <button
                onClick={() => { setSelectedGroup(null); setModalTab('students'); }}
                className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-900 mt-2">
              <button
                onClick={() => setModalTab('students')}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 ${
                  modalTab === 'students'
                    ? 'border-fuchsia-500 text-fuchsia-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Список учеников
              </button>
              <button
                onClick={() => setModalTab('realtime')}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                  modalTab === 'realtime'
                    ? 'border-fuchsia-500 text-fuchsia-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span>Реал-тайм активность</span>
              </button>
            </div>

            {/* Students List Content */}
            {modalTab === 'students' && (
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-slate-300">
                {selectedGroup.members.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Users className="mx-auto text-slate-700" size={32} />
                    <p className="text-slate-400 text-sm">Студентов в этой группе пока нет</p>
                    <p className="text-xs text-slate-500">Поделитесь инвайт-кодом <code className="font-mono text-fuchsia-450">{selectedGroup.code}</code> со своими студентами для вступления.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Список учеников класса ({selectedGroup.members.length})</h4>
                    <div className="space-y-2.5">
                      {selectedGroup.members.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 rounded-xl border border-slate-900 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-800 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full border border-fuchsia-500/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                              {member.user.avatarUrl ? (
                                <img src={member.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-bold text-fuchsia-400 uppercase">
                                  {member.user.firstName[0]}{member.user.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-100">
                                {member.user.lastName} {member.user.firstName}
                              </h5>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-450">
                                <span>{member.user.email}</span>
                                {member.user.institutionType && (
                                  <>
                                    <span>·</span>
                                    <span className="text-fuchsia-400 font-semibold flex items-center gap-1">
                                      <GraduationCap size={12} /> {member.user.institutionType} ({member.user.institutionName || 'не указано'})
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Student Progress and Stats */}
                          <div className="flex items-center gap-6 self-end md:self-auto">
                            {selectedGroup.course && (
                              <div className="text-right shrink-0">
                                <div className="text-[10px] font-semibold text-slate-500 uppercase">Прогресс курса</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <div className="w-20 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800">
                                    <div
                                      className="bg-gradient-to-r from-fuchsia-600 to-violet-600 h-full"
                                      style={{ width: `${member.percentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-fuchsia-400">{member.percentage}%</span>
                                </div>
                              </div>
                            )}

                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Опыт</span>
                              <div className="text-xs font-bold text-violet-400 mt-0.5">{member.user.xp} XP</div>
                            </div>

                            <div className="text-right shrink-0 hidden sm:block">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase">Активность</span>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock size={11} className="text-slate-500" />
                                {new Date(member.lastActivity).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Realtime Activity Content */}
            {modalTab === 'realtime' && (
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-slate-300">
                {loadingRealtime ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-2">
                    <Loader2 className="animate-spin text-fuchsia-500" size={28} />
                    <span className="text-xs text-slate-500">Загружаем статус активности...</span>
                  </div>
                ) : realtimeActivity.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-500">
                    Активность не обнаружена за последние 2 часа
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-450">Текущая активность студентов</h4>
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">Обновляется автоматически каждые 5с</span>
                    </div>

                    <div className="space-y-2.5">
                      {realtimeActivity.map((activity) => (
                        <div
                          key={activity.user.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                            activity.status === 'stuck'
                              ? 'border-rose-500/30 bg-rose-500/5'
                              : activity.status === 'working'
                              ? 'border-sky-500/30 bg-sky-500/5'
                              : activity.status === 'completed'
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-slate-900 bg-slate-950/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full border bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 ${
                              activity.status === 'stuck' ? 'border-rose-500' : 'border-slate-800'
                            }`}>
                              {activity.user.avatarUrl ? (
                                <img src={activity.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className={`text-sm font-bold uppercase ${
                                  activity.status === 'stuck' ? 'text-rose-450' : 'text-slate-400'
                                }`}>
                                  {activity.user.firstName[0]}{activity.user.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h5 className="font-bold text-sm text-slate-100">
                                {activity.user.lastName} {activity.user.firstName}
                              </h5>
                              <p className="text-xs text-slate-500">
                                {activity.status === 'inactive' ? 'Неактивен' : `Активность: ${new Date(activity.updatedAt).toLocaleTimeString()}`}
                              </p>
                            </div>
                          </div>

                          {/* Activity Status Details */}
                          <div className="flex flex-col sm:items-end gap-1">
                            {activity.status === 'stuck' && (
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 border border-rose-500/30 text-rose-400 animate-pulse">
                                  ⚠️ Нужна помощь! (Застрял)
                                </span>
                                <p className="text-xs text-slate-355 mt-1">Шаг: <strong>{activity.stepTitle}</strong></p>
                                <p className="text-[10px] text-slate-500">Попыток: {activity.attempts} · Время: {formatTime(activity.timeSpent)}</p>
                              </div>
                            )}
                            {activity.status === 'working' && (
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 border border-sky-500/30 text-sky-450">
                                  ⚡ В процессе
                                </span>
                                <p className="text-xs text-slate-355 mt-1">Изучает: <strong>{activity.stepTitle}</strong></p>
                                <p className="text-[10px] text-slate-500">Урок: {activity.lessonTitle} · Попыток: {activity.attempts}</p>
                              </div>
                            )}
                            {activity.status === 'completed' && (
                              <div className="text-left sm:text-right">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-450">
                                  ✅ Прошел шаг
                                </span>
                                <p className="text-xs text-slate-355 mt-1">Завершил: <strong>{activity.stepTitle}</strong></p>
                                <p className="text-[10px] text-slate-500 font-semibold">Урок: {activity.lessonTitle}</p>
                              </div>
                            )}
                            {activity.status === 'inactive' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-905 border border-slate-900 text-slate-600">
                                Вне сети
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-900 pt-4 flex justify-end">
              <button
                onClick={() => { setSelectedGroup(null); setModalTab('students'); }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
