'use client';

import React, { Suspense } from 'react';
import { ChatView } from '@/components/chat-view';
import { Loader2 } from 'lucide-react';

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Чат и общение</h1>
        <p className="text-xs text-slate-450 mt-1">
          Панель связи администратора: общайтесь с пользователями, преподавателями и студентами
        </p>
      </div>
      <Suspense fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-violet-500" size={32} />
          <span className="text-slate-400 text-xs">Загрузка интерфейса сообщений...</span>
        </div>
      }>
        <ChatView />
      </Suspense>
    </div>
  );
}
