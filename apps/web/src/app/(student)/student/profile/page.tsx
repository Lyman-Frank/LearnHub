'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { User as UserIcon, BookOpen, CheckCircle, Award, Edit3, Loader2, Download, Shield, MessageSquare } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';

function ProfileContent() {
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get('id') || searchParams.get('userId');

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const currentUser = auth.getUser();
      const targetUserId = queryUserId || currentUser?.id;
      if (!targetUserId) {
        setLoading(false);
        return;
      }
      setIsOwnProfile(targetUserId === currentUser?.id);

      try {
        const data = await api.getUserProfile(targetUserId);
        setUser(data.user);
        setStats(data.stats);
        setBadges(data.badges);
        
        if (targetUserId === currentUser?.id) {
          const certs = await api.getMyCertificates().catch(() => []);
          setCertificates(certs);
        }
      } catch (err) {
        console.error('Ошибка загрузки профиля:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [queryUserId]);

  const handleDownloadCert = async (courseId: string, courseTitle: string) => {
    try {
      const blob = await api.downloadCertificate(courseId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert('Не удалось скачать сертификат');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-violet-500" size={32} />
        <span className="text-slate-400 text-xs">Загрузка профиля...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 text-slate-450">
        Пользователь не найден
      </div>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

  const equippedFrame = user.ownedItems?.find((oi: any) => oi.item.type === 'AVATAR_FRAME')?.item;
  const frameMeta = equippedFrame ? JSON.parse(equippedFrame.metadata || '{}') : null;
  const equippedBadges = user.ownedItems?.filter((oi: any) => oi.item.type === 'BADGE') || [];
  const equippedNameColor = user.ownedItems?.find((oi: any) => oi.item.type === 'USERNAME_COLOR')?.item;
  const nameColorMeta = equippedNameColor ? JSON.parse(equippedNameColor.metadata || '{}') : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Аватар и имя */}
      <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-r from-violet-950/30 via-slate-950 to-slate-950 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-60 h-60 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.firstName}
                className={`w-20 h-20 rounded-2xl object-cover border-2 border-violet-500/30 ${frameMeta?.borderClass || ''}`}
              />
            ) : (
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-600/20 ${frameMeta?.borderClass || ''}`}>
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2 flex-wrap">
                  <span className={nameColorMeta?.colorClass || ''}>{user.firstName} {user.lastName}</span>
                  {equippedBadges.map((oi: any) => {
                    const bMeta = JSON.parse(oi.item.metadata || '{}');
                    return (
                      <span
                        key={oi.id}
                        title={oi.item.title}
                        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] border font-extrabold uppercase tracking-wide bg-slate-950/80"
                        style={{ borderColor: bMeta.color, color: bMeta.color }}
                      >
                        {oi.item.title.split(': ')[1] || oi.item.title}
                      </span>
                    );
                  })}
                </h1>
                <p className="text-slate-400 text-sm mt-1">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase tracking-wider">
                  {user.role === 'ADMIN' ? 'Администратор' : user.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                </span>
              </div>
              
              {!isOwnProfile && (
                <Link
                  href={`/student/chat?dm=${user.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all duration-200"
                >
                  <MessageSquare size={14} />
                  <span>Написать сообщение</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/60 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400">
            <BookOpen size={20} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-500 mx-auto" size={20} />
          ) : (
            <div className="text-3xl font-black text-white">{stats?.enrollments ?? 0}</div>
          )}
          <div className="text-xs text-slate-400 font-medium">Курсов записано</div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/60 text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle size={20} />
          </div>
          {loading ? (
            <Loader2 className="animate-spin text-slate-500 mx-auto" size={20} />
          ) : (
            <div className="text-3xl font-black text-white">{stats?.completedSteps ?? 0}</div>
          )}
          <div className="text-xs text-slate-400 font-medium">Шагов пройдено</div>
        </div>
      </div>

      {/* Информация об аккаунте */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/50 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Данные аккаунта</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-900">
            <span className="text-sm text-slate-400">Email</span>
            <span className="text-sm font-medium text-slate-200">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-900">
            <span className="text-sm text-slate-400">Имя</span>
            <span className="text-sm font-medium text-slate-200">{user.firstName}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-400">Фамилия</span>
            <span className="text-sm font-medium text-slate-200">{user.lastName}</span>
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/50 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          Мои Достижения
        </h2>
        {badges.length === 0 ? (
          <div className="text-slate-500 text-sm">Достижений пока нет.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {badges.map((item) => {
              const badge = item.badge ? item.badge : item;
              const badgeId = item.id || badge.id;
              return (
                <div key={badgeId} className="group rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-slate-950/80 overflow-hidden hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300">
                  {badge.iconUrl ? (
                    <div className="w-full aspect-square overflow-hidden">
                      <img src={badge.iconUrl} alt={badge.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-amber-500/10 flex items-center justify-center text-amber-400">
                      <Shield size={36} />
                    </div>
                  )}
                  <div className="p-3 text-center">
                    <div className="text-sm font-bold text-slate-200">{badge.name || 'Достижение'}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-tight">{badge.description || ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Сертификаты */}
      {isOwnProfile && (
        <div className="p-6 rounded-2xl border border-slate-900 bg-slate-950/50 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Award size={16} className="text-violet-500" />
            Мои Сертификаты
          </h2>
          {certificates.length === 0 ? (
            <div className="text-slate-500 text-sm">Завершите курс на 100%, чтобы получить сертификат.</div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
                  <div className="flex items-center gap-4">
                    {cert.course?.coverUrl ? (
                      <img src={cert.course.coverUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                        <BookOpen size={20} />
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-200">{cert.course?.title || 'Курс'}</div>
                      <div className="text-xs text-slate-400">Выдан: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : ''}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadCert(cert.courseId, cert.course?.title || 'Course')}
                    className="p-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white transition-colors flex items-center gap-2 text-sm font-medium"
                  >
                    <Download size={16} />
                    <span className="hidden sm:inline">Скачать</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-violet-500" size={32} />
        <span className="text-slate-400 text-xs">Загрузка профиля...</span>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
