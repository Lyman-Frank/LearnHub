'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, FolderOpen, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';

const MAX_SIZE_MB = 3;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface GalleryImage {
  id: string;
  url: string;
  label: string;
  category: string;
  isCustom: boolean;
}

interface MediaPickerModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  title?: string;
}

export function MediaPickerModal({ onSelect, onClose, title = 'Выберите изображение' }: MediaPickerModalProps) {
  const [tab, setTab] = useState<'upload' | 'gallery'>('upload');

  // === ЗАГРУЗКА ===
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === ГАЛЕРЕЯ ===
  const [galleryData, setGalleryData] = useState<Record<string, GalleryImage[]>>({});
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);

  const loadGallery = useCallback(async () => {
    setGalleryLoading(true);
    setGalleryError(null);
    try {
      const data = await api.getGallery();
      setGalleryData(data.categories || {});
      const cats = Object.keys(data.categories || {});
      if (cats.length > 0 && !activeCategory) {
        setActiveCategory(cats[0]);
      }
    } catch (e: any) {
      setGalleryError('Не удалось загрузить галерею');
    } finally {
      setGalleryLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    if (tab === 'gallery') {
      loadGallery();
    }
  }, [tab]);

  // === ЗАГРУЗКА ФАЙЛА ===
  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Поддерживаются только: JPG, PNG, WebP, GIF');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setUploadError(`Файл слишком большой. Максимум ${MAX_SIZE_MB} МБ (ваш: ${(file.size / 1024 / 1024).toFixed(1)} МБ)`);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setUploading(true);

    try {
      const result = await api.uploadImage(file);
      setUploadSuccess(`Загружено! (${(file.size / 1024).toFixed(0)} КБ)`);
      const fullUrl = `http://localhost:3001${result.url}`;
      onSelect(fullUrl);
    } catch (e: any) {
      setUploadError(e.message || 'Ошибка при загрузке на сервер');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  }, [onSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const categories = Object.keys(galleryData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <ImageIcon size={16} className="text-white" />
            </div>
            <h2 className="text-base font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-900 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-slate-900">
          {(['upload', 'gallery'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                tab === t
                  ? 'text-violet-400 border-b-2 border-violet-500 bg-violet-500/5'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'upload' ? <><Upload size={14} /> Загрузить</> : <><FolderOpen size={14} /> Галерея</>}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* === ВКЛАДКА ЗАГРУЗКИ === */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-800 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-900/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif"
                  className="hidden"
                  onChange={handleFileInput}
                />

                {previewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={previewUrl}
                      alt="Предпросмотр"
                      className="mx-auto max-h-40 rounded-xl object-contain border border-slate-700"
                    />
                    {uploading && (
                      <div className="flex items-center justify-center gap-2 text-violet-400 text-sm">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Загружаем на сервер...</span>
                      </div>
                    )}
                    {uploadSuccess && (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-medium">
                        <CheckCircle size={16} />
                        <span>{uploadSuccess}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Upload size={24} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-300">Перетащите изображение сюда</p>
                      <p className="text-xs text-slate-500 mt-1">или нажмите, чтобы выбрать файл</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                      <span>JPG, PNG, WebP, GIF</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-500">Макс. {MAX_SIZE_MB} МБ</span>
                    </div>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 text-center">
                После загрузки изображение будет автоматически добавлено в нужное поле
              </p>
            </div>
          )}

          {/* === ВКЛАДКА ГАЛЕРЕИ === */}
          {tab === 'gallery' && (
            <div className="space-y-4">
              {galleryLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 size={28} className="animate-spin text-violet-400" />
                  <p className="text-sm text-slate-500">Загрузка галереи...</p>
                </div>
              ) : galleryError ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <AlertCircle size={28} className="text-rose-400" />
                  <p className="text-sm text-slate-400">{galleryError}</p>
                  <button
                    onClick={loadGallery}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-400 text-sm hover:bg-violet-600/30 transition-all"
                  >
                    <RefreshCw size={14} />
                    Повторить
                  </button>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Галерея пуста. Попросите администратора добавить изображения.
                </div>
              ) : (
                <>
                  {/* Категории */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          activeCategory === cat
                            ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300'
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                        <span className="ml-1.5 text-[10px] opacity-60">
                          {galleryData[cat]?.length || 0}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Сетка изображений */}
                  {activeCategory && (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                      {(galleryData[activeCategory] || []).length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
                          В этой категории нет изображений
                        </div>
                      ) : (
                        (galleryData[activeCategory] || []).map((img) => (
                          <button
                            key={img.id}
                            onClick={() => onSelect(img.url)}
                            className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-violet-500/50 transition-all duration-200"
                          >
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIj48cmVjdCBmaWxsPSIjMWUxYjRiIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIvPjx0ZXh0IGZpbGw9IiM2ZDI4ZDkiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjE1MCIgeT0iMTA4Ij7QndC10YIg0LfQsNCz0YDRg9C30LjQu9GB0Y/QtzwvdGV4dD48L3N2Zz4=';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end justify-start p-2">
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-white bg-violet-600/80 px-2 py-1 rounded-lg">
                                {img.label}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                                <CheckCircle size={12} className="text-white" />
                              </div>
                            </div>
                            {img.isCustom && (
                              <div className="absolute top-2 left-2">
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-fuchsia-600/80 text-white font-bold uppercase tracking-wider">
                                  своё
                                </span>
                              </div>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}

              <p className="text-xs text-slate-600 text-center">
                Нажмите на изображение, чтобы использовать его
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
