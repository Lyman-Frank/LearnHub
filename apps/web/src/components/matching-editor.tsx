'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, ArrowRightLeft, ImagePlus, X } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(2, 11);

interface Pair {
  id: string;
  left: string;
  right: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

interface MatchingEditorProps {
  content: string | null;
  onChange: (newContent: string) => void;
  onPickImage: (pairId: string, side: 'left' | 'right') => void;
}

export function MatchingEditor({ content, onChange, onPickImage }: MatchingEditorProps) {
  const [pairs, setPairs] = useState<Pair[]>([]);

  // Инициализация данных при изменении внешнего content
  useEffect(() => {
    try {
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.pairs)) {
          setPairs(parsed.pairs);
          return;
        }
      }
    } catch (e) {
      console.error('Ошибка парсинга контента сопоставления', e);
    }
    // Если пусто или ошибка — создаем дефолтную пару
    setPairs([{ id: generateId(), left: '', right: '' }]);
  }, [content]);

  // Вспомогательная функция для сохранения изменений
  const saveChanges = (updatedPairs: Pair[]) => {
    setPairs(updatedPairs);
    onChange(JSON.stringify({ pairs: updatedPairs }));
  };

  const handleAddPair = () => {
    const newPair = { id: generateId(), left: '', right: '' };
    saveChanges([...pairs, newPair]);
  };

  const handleRemovePair = (id: string) => {
    // Не даем удалить последнюю оставшуюся пару
    if (pairs.length <= 1) return;
    const filtered = pairs.filter((p) => p.id !== id);
    saveChanges(filtered);
  };

  const handleUpdatePair = (id: string, field: keyof Pair, value: any) => {
    const updated = pairs.map((p) => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    });
    saveChanges(updated);
  };

  const handleRemoveImage = (pairId: string, side: 'left' | 'right') => {
    handleUpdatePair(pairId, side === 'left' ? 'leftImageUrl' : 'rightImageUrl', '');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/30 text-xs text-violet-300/90 leading-relaxed flex items-start gap-3">
        <HelpCircle size={16} className="shrink-0 text-violet-400 mt-0.5" />
        <div>
          <span className="font-bold text-violet-200">Создание интерактивного сопоставления:</span>
          <p className="mt-1">
            Для каждого элемента вы можете ввести текст, загрузить изображение или использовать и то, и другое одновременно.
            Элементы справа будут автоматически перемешаны для студента.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 px-3">
          <div className="col-span-5">Левый элемент</div>
          <div className="col-span-1 text-center flex items-center justify-center">
            <ArrowRightLeft size={12} />
          </div>
          <div className="col-span-5">Правый элемент (соответствие)</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-2">
          {pairs.map((pair, index) => (
            <div
              key={pair.id}
              className="grid grid-cols-12 gap-3 items-center p-3 rounded-xl border border-slate-900 bg-slate-950/60 hover:border-slate-800 transition-all group"
            >
              {/* Левый элемент */}
              <div className="col-span-5 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair.left}
                    onChange={(e) => handleUpdatePair(pair.id, 'left', e.target.value)}
                    placeholder={`Текст ${index + 1}`}
                    className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => onPickImage(pair.id, 'left')}
                    title="Загрузить картинку для левой части"
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-900 transition-all shrink-0"
                  >
                    <ImagePlus size={16} />
                  </button>
                </div>

                {pair.leftImageUrl && (
                  <div className="relative w-full h-16 flex items-center justify-center bg-slate-950 border border-slate-900 rounded-lg overflow-hidden group/img">
                    <img src={pair.leftImageUrl} alt="" className="max-w-full max-h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(pair.id, 'left')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-850 text-slate-400 hover:text-rose-400 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Соединитель */}
              <div className="col-span-1 text-center font-bold text-slate-700 select-none">
                →
              </div>

              {/* Правый элемент */}
              <div className="col-span-5 space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={pair.right}
                    onChange={(e) => handleUpdatePair(pair.id, 'right', e.target.value)}
                    placeholder={`Соответствие ${index + 1}`}
                    className="flex-1 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => onPickImage(pair.id, 'right')}
                    title="Загрузить картинку для правой части"
                    className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-900 transition-all shrink-0"
                  >
                    <ImagePlus size={16} />
                  </button>
                </div>

                {pair.rightImageUrl && (
                  <div className="relative w-full h-16 flex items-center justify-center bg-slate-950 border border-slate-900 rounded-lg overflow-hidden group/img">
                    <img src={pair.rightImageUrl} alt="" className="max-w-full max-h-full object-contain p-1" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(pair.id, 'right')}
                      className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-850 text-slate-400 hover:text-rose-400 z-10 opacity-0 group-hover/img:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Удалить пару */}
              <div className="col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleRemovePair(pair.id)}
                  disabled={pairs.length <= 1}
                  className="p-2 text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors"
                  title="Удалить пару"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddPair}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/10 text-slate-400 hover:text-violet-300 rounded-xl text-sm font-semibold transition-all"
      >
        <Plus size={16} />
        Добавить пару соответствия
      </button>
    </div>
  );
}
