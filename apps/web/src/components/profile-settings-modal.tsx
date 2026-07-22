'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Lock, User, Upload, Settings } from 'lucide-react';
import { api } from '@/lib/api';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose, currentUser, onUpdate }: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy'>('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Profile data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [institutionName, setInstitutionName] = useState('');

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    badges: true,
    certificates: true,
    courses: true,
    shop: true,
    institution: true,
    stats: true
  });

  useEffect(() => {
    if (isOpen && currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setInstitutionType(currentUser.institutionType || '');
      setInstitutionName(currentUser.institutionName || '');

      if (currentUser.privacySettings) {
        try {
          const parsed = JSON.parse(currentUser.privacySettings);
          setPrivacy({ ...privacy, ...parsed });
        } catch (e) {
          // default
        }
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.updateProfile({ firstName, lastName, email, institutionType, institutionName });
      window.customAlert('Профиль успешно обновлен!');
      onUpdate();
    } catch (e: any) {
      window.customAlert(e.message || 'Ошибка обновления профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    setLoading(true);
    try {
      await api.updatePrivacy({ privacySettings: JSON.stringify(privacy) });
      window.customAlert('Настройки приватности сохранены!');
      onUpdate();
    } catch (e: any) {
      window.customAlert(e.message || 'Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      window.customAlert('Размер файла не должен превышать 2 МБ');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${api.baseUrl}/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${api.getToken()}`
        },
        body: formData
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      window.customAlert('Аватар успешно обновлен!');
      onUpdate();
    } catch (err: any) {
      window.customAlert(err.message || 'Ошибка при загрузке аватара');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-500/20 text-violet-400 rounded-lg">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">Настройки профиля</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'profile' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <User size={16} /> Основные данные
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-4 px-4 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'privacy' ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <Lock size={16} /> Приватность
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden relative group">
                    {currentUser?.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                        <User size={40} />
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload size={20} className="text-white mb-1" />
                      <span className="text-[10px] text-white font-bold">Изменить</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                  </div>
                  {uploading && <span className="text-xs text-violet-400 animate-pulse">Загрузка...</span>}
                </div>
                
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Имя</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Фамилия</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Тип заведения</label>
                      <select value={institutionType} onChange={e => setInstitutionType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors">
                        <option value="">Не указано</option>
                        <option value="school">Школа</option>
                        <option value="college">Колледж/Техникум</option>
                        <option value="university">Университет</option>
                        <option value="other">Другое</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Название</label>
                      <input value={institutionName} onChange={e => setInstitutionName(e.target.value)} placeholder="Например: Школа №1" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button onClick={handleSaveProfile} disabled={loading} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-white flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={18} /> Сохранить профиль
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm mb-4">Настройте, какая информация будет видна другим пользователям, когда они заходят в ваш профиль.</p>
              
              <div className="space-y-3">
                {[
                  { key: 'badges', label: 'Достижения и бейджи' },
                  { key: 'certificates', label: 'Сертификаты' },
                  { key: 'courses', label: 'Пройденные курсы' },
                  { key: 'shop', label: 'Купленные товары из магазина' },
                  { key: 'institution', label: 'Учебное заведение' },
                  { key: 'stats', label: 'Статистика (XP, уровень, стрик)' }
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-colors">
                    <span className="font-medium text-slate-200">{item.label}</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={(privacy as any)[item.key]}
                        onChange={(e) => setPrivacy({ ...privacy, [item.key]: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500"></div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
                <button onClick={handleSavePrivacy} disabled={loading} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-white flex items-center gap-2 transition-colors disabled:opacity-50">
                  <Save size={18} /> Сохранить настройки
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
