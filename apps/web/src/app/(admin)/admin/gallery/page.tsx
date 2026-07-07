'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Images, Plus, Trash2, Loader2, AlertCircle, CheckCircle,
  FolderPlus, Upload, Link as LinkIcon, X, RefreshCw, ImagePlus
} from 'lucide-react';
import { api } from '@/lib/api';

interface GalleryImage {
  id: string;
  url: string;
  label: string;
  category: string;
  isCustom: boolean;
}

type UploadMode = 'file' | 'url';

export default function AdminGalleryPage() {
  const [categories, setCategories] = useState<Record<string, GalleryImage[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Состояния добавления
  const [addMode, setAddMode] = useState<UploadMode>('file');
  const [newImageLabel, setNewImageLabel] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояние новой категории
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const loadGallery = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGallery();
      setCategories(data.categories || {});
      const cats = Object.keys(data.categories || {});
      if (cats.length > 0) {
        setActiveCategory((prev) => cats.includes(prev) ? prev : cats[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка загрузки галереи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGallery(); }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!activeCategory) {
      setUploadMsg({ type: 'error', text: 'Сначала выберите категорию' });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      await api.addGalleryImageUpload(file, activeCategory, newImageLabel || file.name);
      setUploadMsg({ type: 'success', text: 'Изображение добавлено в галерею!' });
      setNewImageLabel('');
      await loadGallery();
    } catch (e: any) {
      setUploadMsg({ type: 'error', text: e.message || 'Ошибка загрузки' });
    } finally {
      setUploading(false);
    }
  }, [activeCategory, newImageLabel]);

  const handleUrlAdd = async () => {
    if (!newImageUrl || !activeCategory) {
      setUploadMsg({ type: 'error', text: 'Укажите URL и выберите категорию' });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      await api.addGalleryImageByUrl(activeCategory, newImageUrl, newImageLabel || 'Изображение');
      setUploadMsg({ type: 'success', text: 'Изображение добавлено!' });
      setNewImageUrl('');
      setNewImageLabel('');
      await loadGallery();
    } catch (e: any) {
      setUploadMsg({ type: 'error', text: e.message || 'Ошибка' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Удалить это изображение из галереи?')) return;
    try {
      await api.deleteGalleryImage(id);
      await loadGallery();
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      await api.addGalleryCategory(newCatName.trim());
      setNewCatName('');
      setShowNewCat(false);
      await loadGallery();
      setActiveCategory(newCatName.trim());
    } catch (e: any) {
      alert(e.message || 'Ошибка создания категории');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    const count = categories[cat]?.length || 0;
    if (!confirm(`Удалить категорию «${cat}»${count > 0 ? ` и все ${count} изображений в ней` : ''}?`)) return;
    try {
      await api.deleteGalleryCategory(cat);
      await loadGallery();
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления категории');
    }
  };

  const catList = Object.keys(categories);
  const activeImages = activeCategory ? (categories[activeCategory] || []) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Images size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Управление галереей</h1>
            <p className="text-sm text-slate-500">Добавляйте и удаляйте изображения для тестов</p>
          </div>
        </div>
        <button
          onClick={loadGallery}
          className="p-2.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400 hover:text-violet-400 transition-all"
          title="Обновить"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 size={36} className="animate-spin text-violet-500" />
          <p className="text-slate-500">Загрузка галереи...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle size={36} className="text-rose-400" />
          <p className="text-slate-400">{error}</p>
          <button onClick={loadGallery} className="px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-600/30 flex items-center gap-2">
            <RefreshCw size={14} /> Повторить
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ===== ЛЕВАЯ ПАНЕЛЬ: Категории ===== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Категории</h2>
              <button
                onClick={() => setShowNewCat(!showNewCat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-400 border border-violet-700/40 bg-violet-900/20 hover:bg-violet-800/30 transition-all"
              >
                <FolderPlus size={13} />
                <span>Новая</span>
              </button>
            </div>

            {/* Форма новой категории */}
            {showNewCat && (
              <div className="flex gap-2 p-3 rounded-xl border border-violet-700/40 bg-violet-900/10">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Название категории"
                  autoFocus
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-slate-600"
                />
                <button
                  onClick={handleAddCategory}
                  disabled={savingCat || !newCatName.trim()}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                >
                  {savingCat ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                </button>
                <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} className="p-1.5 text-slate-500 hover:text-rose-400">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Список категорий */}
            <div className="space-y-1">
              {catList.length === 0 ? (
                <p className="text-sm text-slate-600 italic text-center py-4">Нет категорий</p>
              ) : (
                catList.map((cat) => (
                  <div
                    key={cat}
                    className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                      activeCategory === cat
                        ? 'bg-violet-600/15 border border-violet-500/30 text-violet-300'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
                    }`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold truncate">{cat}</span>
                      <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-500 font-bold">
                        {categories[cat]?.length || 0}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-400 transition-all rounded"
                      title="Удалить категорию"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== ПРАВАЯ ПАНЕЛЬ: Изображения ===== */}
          <div className="lg:col-span-2 space-y-4">
            {/* Форма добавления */}
            {activeCategory && (
              <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-300">Добавить в «{activeCategory}»</h3>
                  <div className="flex rounded-xl border border-slate-800 overflow-hidden text-xs font-semibold">
                    <button
                      onClick={() => setAddMode('file')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${addMode === 'file' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Upload size={12} /> Файл
                    </button>
                    <button
                      onClick={() => setAddMode('url')}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${addMode === 'url' ? 'bg-violet-600/20 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <LinkIcon size={12} /> URL
                    </button>
                  </div>
                </div>

                {/* Название */}
                <div>
                  <input
                    type="text"
                    value={newImageLabel}
                    onChange={(e) => setNewImageLabel(e.target.value)}
                    placeholder="Название изображения (необязательно)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>

                {addMode === 'file' ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      dragOver ? 'border-violet-500 bg-violet-500/10' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.gif"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-violet-400 text-sm">
                        <Loader2 size={18} className="animate-spin" />
                        <span>Загружаем...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <ImagePlus size={24} className="mx-auto text-slate-600" />
                        <p className="text-sm text-slate-500">Перетащите или нажмите для выбора</p>
                        <p className="text-xs text-slate-700">JPG, PNG, WebP, GIF • Макс. 3 МБ</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-white text-sm focus:outline-none focus:border-violet-500 transition-all"
                    />
                    <button
                      onClick={handleUrlAdd}
                      disabled={uploading || !newImageUrl}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-2 transition-all"
                    >
                      {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Добавить
                    </button>
                  </div>
                )}

                {/* Сообщение */}
                {uploadMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                    uploadMsg.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}>
                    {uploadMsg.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {uploadMsg.text}
                  </div>
                )}
              </div>
            )}

            {/* Сетка изображений */}
            {!activeCategory ? (
              <div className="text-center py-16 text-slate-600">
                <Images size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">Выберите категорию слева</p>
              </div>
            ) : activeImages.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <ImagePlus size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm">В этой категории пока нет изображений</p>
                <p className="text-xs mt-1">Добавьте их через форму выше</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {activeImages.map((img) => (
                  <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-slate-900 bg-slate-950">
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden w-full h-32 flex items-center justify-center bg-slate-900 text-slate-600">
                      <AlertCircle size={24} />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col justify-between p-2">
                      <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white transition-all"
                          title="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-semibold text-white bg-black/60 px-2 py-1 rounded-lg truncate max-w-[80%]">
                          {img.label}
                        </span>
                        {img.isCustom && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-fuchsia-600/80 text-white font-bold uppercase tracking-wider">
                            своё
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
