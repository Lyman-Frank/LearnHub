'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Pair {
  id: string;
  left: string;
  right: string;
  leftImageUrl?: string;
  rightImageUrl?: string;
}

interface MatchingQuizProps {
  content: any; // В бэкенде это распарсенный JSON: { pairs: Pair[] }
  onComplete: (isCorrect: boolean, answer: string) => void;
  submitted: boolean;
  savedAnswer?: string | null;
  onReset?: () => void;
}

export function MatchingQuiz({ content, onComplete, submitted, savedAnswer, onReset }: MatchingQuizProps) {
  const [pairs, setPairs] = useState<Pair[]>([]);
  // Карта сопоставлений: { [leftId]: rightId }
  const [matches, setMatches] = useState<Record<string, string>>({});
  // Перемешанный список правых частей для перетаскивания: Pair[]
  const [shuffledRights, setShuffledRights] = useState<Pair[]>([]);
  
  // Состояния для ручного клик-сопоставления (для мобилок)
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);

  // Инициализация
  useEffect(() => {
    if (content && Array.isArray(content.pairs)) {
      const originalPairs: Pair[] = content.pairs;
      setPairs(originalPairs);

      // Если есть сохраненный ответ
      if (savedAnswer) {
        try {
          const parsed = JSON.parse(savedAnswer);
          setMatches(parsed);
        } catch {
          setMatches({});
        }
      } else if (submitted) {
        // Если шаг уже пройден, но сохраненного ответа нет, подставляем правильные пары автоматически!
        const correctMatches: Record<string, string> = {};
        originalPairs.forEach(p => {
          correctMatches[p.id] = p.id;
        });
        setMatches(correctMatches);
      } else {
        setMatches({});
      }

      // Перемешиваем правую колонку
      const rights = [...originalPairs].sort(() => Math.random() - 0.5);
      setShuffledRights(rights);
    }
  }, [content, savedAnswer]);

  // Драг-н-дроп хэндлеры
  const handleDragStart = (e: React.DragEvent, rightId: string) => {
    if (submitted) return;
    e.dataTransfer.setData('text/plain', rightId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, leftId: string) => {
    e.preventDefault();
    if (submitted) return;
    
    const rightId = e.dataTransfer.getData('text/plain');
    if (!rightId) return;

    placeMatch(leftId, rightId);
  };

  // Механика размещения соответствия
  const placeMatch = (leftId: string, rightId: string) => {
    setMatches(prev => {
      const next = { ...prev };
      
      // Если эта правая часть уже где-то стояла, убираем её оттуда
      Object.keys(next).forEach(key => {
        if (next[key] === rightId) {
          delete next[key];
        }
      });

      next[leftId] = rightId;
      return next;
    });

    // Сбрасываем выделение
    setSelectedLeftId(null);
  };

  // Клик-сопоставление (мобильная доступность)
  const handleLeftClick = (leftId: string) => {
    if (submitted) return;
    setSelectedLeftId(leftId === selectedLeftId ? null : leftId);
  };

  const handleRightClick = (rightId: string) => {
    if (submitted) return;
    
    if (selectedLeftId) {
      placeMatch(selectedLeftId, rightId);
    } else {
      // Ищем, с кем сопоставлено сейчас, и сбрасываем это сопоставление
      setMatches(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === rightId) {
            delete next[key];
          }
        });
        return next;
      });
    }
  };

  const handleReset = () => {
    setMatches({});
    setSelectedLeftId(null);
    onReset?.();
  };

  // Проверка результатов
  const handleSubmit = () => {
    // Проверяем, все ли пары сопоставлены
    const allMatched = pairs.every(p => matches[p.id] !== undefined);
    if (!allMatched) return;

    // Сверяем правильность
    const isAllCorrect = pairs.every(p => matches[p.id] === p.id);

    onComplete(isAllCorrect, JSON.stringify(matches));
  };

  const getMatchedRightText = (leftId: string) => {
    const rightId = matches[leftId];
    if (!rightId) return null;
    return pairs.find(p => p.id === rightId)?.right || null;
  };

  const getMatchedRightImage = (leftId: string) => {
    const rightId = matches[leftId];
    if (!rightId) return null;
    return pairs.find(p => p.id === rightId)?.rightImageUrl || null;
  };

  const isMatchedCorrect = (leftId: string) => {
    const rightId = matches[leftId];
    return rightId === leftId;
  };

  const allMatched = pairs.length > 0 && pairs.every(p => matches[p.id] !== undefined);

  return (
    <div className="space-y-6 animate-fade-in select-none">
      <div className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-violet-500 pl-3">
        Перетащите карточки ответов из правой колонки в пустые ячейки слева, либо нажимайте на них по очереди для сопоставления.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Левая фиксированная колонка со слотами */}
        <div className="space-y-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Пары сопоставления</p>
          {pairs.map(p => {
            const rightMatchedId = matches[p.id];
            const hasMatch = rightMatchedId !== undefined;
            const matchedRightText = getMatchedRightText(p.id);
            const matchedRightImage = getMatchedRightImage(p.id);
            const isSelected = selectedLeftId === p.id;
            
            let statusColor = 'border-slate-800 bg-slate-900/40 hover:border-slate-700';
            if (submitted) {
              statusColor = isMatchedCorrect(p.id) 
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                : 'border-rose-500/30 bg-rose-500/5 text-rose-300';
            } else if (isSelected) {
              statusColor = 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500';
            }

            return (
              <div 
                key={p.id} 
                className="flex items-stretch gap-2"
              >
                {/* Левая фиксированная карточка */}
                <div 
                  onClick={() => handleLeftClick(p.id)}
                  className={`flex-1 p-3.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer flex items-center bg-slate-950/60 ${
                    isSelected ? 'border-violet-500/50 animate-pulse' : 'border-slate-850'
                  }`}
                >
                  {p.leftImageUrl ? (
                    <div className="flex flex-col gap-2 w-full">
                      <img 
                        src={p.leftImageUrl} 
                        alt="" 
                        className="w-full h-16 object-contain rounded-lg border border-slate-900 bg-slate-950/40 p-0.5" 
                      />
                      {p.left && <span className="text-slate-200">{p.left}</span>}
                    </div>
                  ) : (
                    <span className="text-slate-200">{p.left}</span>
                  )}
                </div>

                {/* Стрелка перехода */}
                <div className="flex items-center text-slate-700 font-bold px-1 select-none">
                  →
                </div>

                {/* Зона сброса (Слот справа) */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, p.id)}
                  onClick={() => {
                    if (submitted) return;
                    if (selectedLeftId === p.id) {
                      setSelectedLeftId(null);
                    } else {
                      handleLeftClick(p.id);
                    }
                  }}
                  className={`flex-1 p-3.5 rounded-xl border-2 border-dashed transition-all duration-200 flex items-center justify-between text-sm cursor-pointer relative overflow-hidden ${statusColor}`}
                >
                  {hasMatch ? (
                    <div className="w-full flex items-center justify-between gap-2">
                      {matchedRightImage ? (
                        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                          <img 
                            src={matchedRightImage} 
                            alt="" 
                            className="w-full h-16 object-contain rounded-lg border border-slate-900 bg-slate-950/40 p-0.5" 
                          />
                          {matchedRightText && <span className="font-semibold text-slate-200 truncate">{matchedRightText}</span>}
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-200">{matchedRightText}</span>
                      )}
                      {!submitted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMatches(prev => {
                              const next = { ...prev };
                              delete next[p.id];
                              return next;
                            });
                          }}
                          className="text-slate-500 hover:text-rose-400 text-xs px-1 select-none z-10"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-655 italic text-xs">
                      {isSelected ? 'Выберите ответ справа...' : 'Перетащите ответ сюда'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Правая колонка с карточками для перетаскивания */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Варианты сопоставления</p>
            {!submitted && Object.keys(matches).length > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold"
              >
                <RefreshCw size={10} />
                Сбросить всё
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 p-4 rounded-xl border border-slate-900 bg-slate-950/45 min-h-32">
            {shuffledRights.map(item => {
              // Проверяем, использована ли уже эта карточка
              const isUsed = Object.values(matches).includes(item.id);

              if (isUsed) {
                return (
                  <div
                    key={item.id}
                    className="px-3 py-2.5 rounded-lg border border-slate-900 bg-slate-950/20 text-slate-700 text-sm font-semibold opacity-30 select-none line-through cursor-not-allowed flex flex-col gap-1.5 items-center w-28 text-center"
                  >
                    {item.rightImageUrl && (
                      <img 
                        src={item.rightImageUrl} 
                        alt="" 
                        className="w-full h-14 object-contain rounded bg-slate-950/10 grayscale p-0.5" 
                      />
                    )}
                    <span className="truncate w-full text-slate-550">{item.right || 'Картинка'}</span>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  draggable={!submitted}
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onClick={() => handleRightClick(item.id)}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-semibold cursor-grab active:cursor-grabbing shadow-sm transition-all select-none flex flex-col gap-1.5 items-center w-28 text-center ${
                    selectedLeftId 
                      ? 'border-violet-500/40 bg-violet-950/10 text-violet-300 hover:border-violet-500 animate-pulse animate-duration-1000'
                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {item.rightImageUrl && (
                    <img 
                      src={item.rightImageUrl} 
                      alt="" 
                      className="w-full h-14 object-contain rounded bg-slate-950/20 p-0.5" 
                    />
                  )}
                  <span className="truncate w-full">{item.right || 'Картинка'}</span>
                </div>
              );
            })}

            {shuffledRights.length > 0 && shuffledRights.every(item => Object.values(matches).includes(item.id)) && (
              <div className="w-full flex items-center justify-center py-4 text-xs text-emerald-400/80 font-semibold gap-1.5 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                <CheckCircle size={14} />
                Все элементы распределены!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Кнопка проверки */}
      <div className="flex justify-end pt-4 border-t border-slate-900/60">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allMatched}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-violet-600/10"
          >
            Проверить сопоставление
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {pairs.every(p => matches[p.id] === p.id) ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                <CheckCircle size={16} />
                Верно! +30 XP заработано
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                  <AlertCircle size={16} />
                  Неверно. Попробуйте еще раз!
                </div>
                <button
                  onClick={handleReset}
                  className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                  title="Попробовать снова"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
