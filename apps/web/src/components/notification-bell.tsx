'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Bell, Loader2, Award, Shield, Info, Check, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'BADGE' | 'MODERATION';
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Ошибка загрузки уведомлений:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Опрашиваем новые уведомления каждые 10 секунд
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BADGE':
        return <Award className="text-amber-400" size={16} />;
      case 'MODERATION':
        return <Shield className="text-rose-400" size={16} />;
      default:
        return <Info className="text-blue-400" size={16} />;
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400 hover:text-white transition-all duration-200 relative shrink-0"
        title="Уведомления"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-600 border border-slate-950 text-[9px] font-black text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-slate-900 bg-slate-950/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden text-left animate-fade-in">
          {/* Header */}
          <div className="p-3 border-b border-slate-900 flex justify-between items-center bg-slate-950">
            <span className="font-bold text-xs text-slate-200 uppercase tracking-wider">Уведомления</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-900/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Уведомлений пока нет
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 flex items-start gap-2.5 hover:bg-slate-900/20 transition-all ${
                    !notif.isRead ? 'bg-violet-650/5' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getTypeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className={`font-bold text-xs leading-tight ${
                        !notif.isRead ? 'text-white' : 'text-slate-350'
                      }`}>
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          className="p-0.5 rounded bg-slate-900 text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                          title="Отметить как прочитанное"
                        >
                          <Check size={10} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed break-words">
                      {notif.message}
                    </p>
                    <div className="text-[8px] text-slate-500 pt-0.5">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
