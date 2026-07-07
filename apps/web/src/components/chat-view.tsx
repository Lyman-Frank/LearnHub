'use client';

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Send, Loader2, MessageSquare, Shield, User as UserIcon, 
  Search, ArrowLeft, Clock, AlertCircle, CheckCircle2 
} from 'lucide-react';

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatarUrl: string | null;
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: ChatUser;
}

interface DirectMessage {
  id: string;
  message: string;
  createdAt: string;
  senderId: string;
  recipientId: string;
  isRead: boolean;
  sender: ChatUser;
  recipient: ChatUser;
}

interface Conversation {
  user: ChatUser;
  unreadCount: number;
  lastMessage: {
    id: string;
    message: string;
    createdAt: string;
    senderId: string;
    recipientId: string;
    isRead: boolean;
  };
}

export function ChatView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialRecipientId = searchParams.get('dm');

  const currentUser = auth.getUser();
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [globalInput, setGlobalInput] = useState('');
  
  // DM states
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<ChatUser | null>(null);
  const [dmHistory, setDmHistory] = useState<DirectMessage[]>([]);
  const [dmInput, setDmInput] = useState('');
  
  // Cooldown & Loading states
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0); // seconds remaining
  const [error, setError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dmEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const scrollDmToBottom = () => {
    dmEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Cooldown countdown
  useEffect(() => {
    if (cooldownTime <= 0) return;
    const timer = setTimeout(() => setCooldownTime(p => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownTime]);

  // Load initial data
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        // Fetch global messages
        const globalMsgs = await api.getGlobalMessages();
        setMessages(globalMsgs);

        // Fetch DM conversations
        const convs = await api.getConversations();
        setConversations(convs);

        // Handle initial DM redirection from profile button
        if (initialRecipientId && currentUser) {
          // If we are trying to DM ourselves, ignore
          if (initialRecipientId === currentUser.id) return;

          // Find if conversation already exists or query user details
          const existing = convs.find(c => c.user.id === initialRecipientId);
          if (existing) {
            setActiveConversation(existing.user);
            setActiveTab('dm');
            await loadDmHistory(existing.user.id);
          } else {
            // It's a new conversation, fetch direct message history (which will be empty but initializes)
            // To get user's details, let's look for user in global messages or fetch it.
            // Let's create a temporary user object or find it in recent chat history
            let otherUser: ChatUser | null = null;
            for (const m of globalMsgs) {
              if (m.user.id === initialRecipientId) {
                otherUser = m.user;
                break;
              }
            }

            if (!otherUser) {
              // If not found in chat, let's create a minimal user object (it will fill when history returns or messages send)
              otherUser = {
                id: initialRecipientId,
                firstName: 'Собеседник',
                lastName: '',
                role: 'STUDENT',
                avatarUrl: null
              };
            }

            setActiveConversation(otherUser);
            setActiveTab('dm');
            await loadDmHistory(initialRecipientId);
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации чата:', err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Poll chat updates every 4 seconds
    const interval = setInterval(async () => {
      try {
        if (activeTab === 'global') {
          const globalMsgs = await api.getGlobalMessages();
          setMessages(globalMsgs);
        } else {
          const convs = await api.getConversations();
          setConversations(convs);
          if (activeConversation) {
            const history = await api.getDirectMessagesHistory(activeConversation.id);
            setDmHistory(history);
          }
        }
      } catch (err) {
        // ignore background errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab, activeConversation, initialRecipientId]);

  // Scroll on new messages
  useEffect(() => {
    if (activeTab === 'global') {
      scrollToBottom();
    } else {
      scrollDmToBottom();
    }
  }, [messages, dmHistory, activeTab]);

  const loadDmHistory = async (otherUserId: string) => {
    setLoadingHistory(true);
    try {
      const history = await api.getDirectMessagesHistory(otherUserId);
      setDmHistory(history);
      // Mark as read immediately on client
      setConversations(prev => prev.map(c => c.user.id === otherUserId ? { ...c, unreadCount: 0 } : c));
    } catch (err) {
      console.error('Ошибка загрузки переписки:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalInput.trim() || cooldownTime > 0) return;

    setError('');
    const msgText = globalInput;
    setGlobalInput('');
    setCooldownTime(3); // Start client side antispam cooldown

    try {
      const sent = await api.sendGlobalMessage(msgText);
      setMessages(prev => [...prev, sent]);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки сообщения');
      setGlobalInput(msgText); // Restore input on failure
      setCooldownTime(0);
    }
  };

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !dmInput.trim() || cooldownTime > 0) return;

    setError('');
    const msgText = dmInput;
    setDmInput('');
    setCooldownTime(3); // Start cooldown

    try {
      const sent = await api.sendDirectMessage(activeConversation.id, msgText);
      setDmHistory(prev => [...prev, sent]);

      // Update conversations list locally
      setConversations(prev => {
        const existing = prev.find(c => c.user.id === activeConversation.id);
        const filtered = prev.filter(c => c.user.id !== activeConversation.id);
        const updatedConv: Conversation = {
          user: activeConversation,
          unreadCount: 0,
          lastMessage: {
            id: sent.id,
            message: sent.message,
            createdAt: sent.createdAt,
            senderId: sent.senderId,
            recipientId: sent.recipientId,
            isRead: false
          }
        };
        return [updatedConv, ...filtered];
      });
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки сообщения');
      setDmInput(msgText);
      setCooldownTime(0);
    }
  };

  const selectConversation = async (user: ChatUser) => {
    setActiveConversation(user);
    await loadDmHistory(user.id);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-rose-500/10 border border-rose-500/30 text-rose-400">
            Администратор
          </span>
        );
      case 'TEACHER':
        return (
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-violet-500/10 border border-violet-500/30 text-violet-400">
            Преподаватель
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-500/10 border border-amber-500/30 text-amber-400">
            Студент
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={36} />
        <span className="text-slate-400 text-xs">Загружаем чат и сообщения...</span>
      </div>
    );
  }

  return (
    <div className="h-[75vh] border border-slate-900 rounded-3xl bg-slate-950/80 backdrop-blur-md shadow-2xl flex overflow-hidden text-white relative">
      {/* Sidebar: Dialogs List / Navigation */}
      <div className={`w-full md:w-80 border-r border-slate-900 flex flex-col ${
        activeTab === 'dm' && activeConversation ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950">
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-300">Сообщество</h3>
          <div className="flex gap-1 p-0.5 rounded-lg border border-slate-900 bg-slate-950">
            <button
              onClick={() => setActiveTab('global')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'global' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Общий
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === 'dm' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Личные
              {conversations.some(c => c.unreadCount > 0) && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* List of active direct conversations */}
        {activeTab === 'dm' ? (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <MessageSquare className="mx-auto text-slate-800" size={24} />
                <p>У вас пока нет активных переписок.</p>
                <p className="text-[10px]">Нажмите «Написать сообщение» в профиле пользователя, чтобы начать диалог.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.user.id}
                  onClick={() => selectConversation(conv.user)}
                  className={`p-3.5 flex items-center justify-between hover:bg-slate-900/30 transition-all cursor-pointer ${
                    activeConversation?.id === conv.user.id ? 'bg-violet-500/10 border-l-2 border-violet-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                      {conv.user.avatarUrl ? (
                        <img src={conv.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-violet-400 uppercase">
                          {conv.user.firstName[0]}{conv.user.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-250 truncate">
                          {conv.user.lastName} {conv.user.firstName}
                        </span>
                        {getRoleBadge(conv.user.role)}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {conv.lastMessage.senderId === currentUser?.id ? 'Вы: ' : ''}
                        {conv.lastMessage.message}
                      </p>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          /* List of recent global chatters or shortcut buttons can go here, but for global we want to focus on chat itself. We can display recent participants or info */
          <div className="p-4 space-y-4 text-xs text-slate-400 flex-1 overflow-y-auto">
            <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/20 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Правила чата</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                <li>Уважайте других участников</li>
                <li>Не публикуйте спам и ссылки</li>
                <li>Задержка сообщений — 3 секунды</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/20 space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[10px]">Личные сообщения</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Вы можете кликнуть на имя или аватар любого пользователя в общем чате, чтобы сразу открыть с ним личный диалог.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col h-full ${
        activeTab === 'dm' && !activeConversation ? 'hidden md:flex bg-slate-950/20' : 'flex'
      }`}>
        {activeTab === 'global' ? (
          /* ================= GLOBAL CHAT ================= */
          <>
            <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950">
              <div>
                <h3 className="font-bold text-sm text-slate-200">Общий чат сообщества</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Сообщения видны всем пользователям платформы</p>
              </div>
            </div>

            {/* Messages history */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>В чате пока нет сообщений. Будьте первым!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-3 text-sm animate-fade-in group">
                    <div 
                      onClick={() => currentUser?.id !== msg.user.id && selectConversation(msg.user)}
                      className="w-9 h-9 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-violet-500 transition-colors"
                      title="Написать личное сообщение"
                    >
                      {msg.user.avatarUrl ? (
                        <img src={msg.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-violet-400 uppercase">
                          {msg.user.firstName[0]}{msg.user.lastName[0]}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span 
                          onClick={() => currentUser?.id !== msg.user.id && selectConversation(msg.user)}
                          className="font-bold text-slate-200 cursor-pointer hover:text-violet-400 transition-colors"
                          title="Написать личное сообщение"
                        >
                          {msg.user.lastName} {msg.user.firstName}
                        </span>
                        {getRoleBadge(msg.user.role)}
                        <span className="text-[9px] text-slate-600">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300 break-words leading-relaxed">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSendGlobal} className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 items-center">
              <input
                type="text"
                value={globalInput}
                onChange={e => setGlobalInput(e.target.value)}
                placeholder={cooldownTime > 0 ? `Пожалуйста, подождите ${cooldownTime} сек...` : "Введите ваше сообщение..."}
                disabled={cooldownTime > 0}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={cooldownTime > 0 || !globalInput.trim()}
                className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-violet-600 shrink-0"
              >
                {cooldownTime > 0 ? (
                  <Clock size={16} className="animate-pulse" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </>
        ) : (
          /* ================= DIRECT MESSAGES ================= */
          <>
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="p-1 rounded hover:bg-slate-900 md:hidden text-slate-400"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div className="w-9 h-9 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden">
                      {activeConversation.avatarUrl ? (
                        <img src={activeConversation.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-violet-400 uppercase">
                          {activeConversation.firstName[0]}{activeConversation.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">
                        {activeConversation.lastName} {activeConversation.firstName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {getRoleBadge(activeConversation.role)}
                        <span className="text-[9px] text-slate-500">Личный диалог</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DM Message history */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingHistory ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-violet-500" size={24} />
                      <span className="text-slate-450 text-[11px]">Загружаем диалог...</span>
                    </div>
                  ) : dmHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                      <p>Начните переписку, отправив первое сообщение.</p>
                    </div>
                  ) : (
                    dmHistory.map((msg) => {
                      const isMe = msg.senderId === currentUser?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-2.5 max-w-[85%] ${
                            isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                            {msg.sender.avatarUrl ? (
                              <img src={msg.sender.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-violet-400 uppercase">
                                {msg.sender.firstName[0]}{msg.sender.lastName[0]}
                              </span>
                            )}
                          </div>
                          <div className={`p-3 rounded-2xl text-xs space-y-1 ${
                            isMe 
                              ? 'bg-violet-600 text-white rounded-tr-none' 
                              : 'bg-slate-900 text-slate-200 rounded-tl-none'
                          }`}>
                            <p className="break-words leading-relaxed font-medium">{msg.message}</p>
                            <div className={`text-[8px] text-right ${isMe ? 'text-violet-300' : 'text-slate-500'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={dmEndRef} />
                </div>

                {/* Input bar */}
                <form onSubmit={handleSendDirect} className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2 items-center">
                  <input
                    type="text"
                    value={dmInput}
                    onChange={e => setDmInput(e.target.value)}
                    placeholder={cooldownTime > 0 ? `Пожалуйста, подождите ${cooldownTime} сек...` : "Введите личное сообщение..."}
                    disabled={cooldownTime > 0}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-all disabled:opacity-40"
                  />
                  <button
                    type="submit"
                    disabled={cooldownTime > 0 || !dmInput.trim()}
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-all disabled:opacity-40 disabled:hover:bg-violet-600 shrink-0"
                  >
                    {cooldownTime > 0 ? (
                      <Clock size={16} className="animate-pulse" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
                <MessageSquare className="text-slate-800 mb-2" size={32} />
                <p>Выберите собеседника из списка слева</p>
                <p className="text-[10px] mt-1">Или перейдите в профиль пользователя и нажмите «Написать сообщение».</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Error Alert */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-rose-500/90 backdrop-blur text-white text-xs font-bold shadow-lg flex items-center gap-1.5 animate-bounce z-50">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
