'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, ChevronUp, ChevronDown } from 'lucide-react';

interface CodeLine {
  id: string;
  code: string;
  indent: number;
}

interface ParsonsQuizProps {
  content: any; // Распарсенный JSON: { description: string, lines: CodeLine[] }
  onComplete: (isCorrect: boolean, answer: string) => void;
  submitted: boolean;
  onReset?: () => void;
}

export function ParsonsQuiz({ content, onComplete, submitted, onReset }: ParsonsQuizProps) {
  const [description, setDescription] = useState('');
  const [correctLines, setCorrectLines] = useState<CodeLine[]>([]);
  
  // Строки, которые студент уже разместил (с текущим порядком и сдвигами)
  const [placedLines, setPlacedLines] = useState<CodeLine[]>([]);
  // Строки, которые еще доступны для размещения (перемешаны)
  const [availableLines, setAvailableLines] = useState<CodeLine[]>([]);

  // Инициализация при смене задачи
  useEffect(() => {
    if (content && Array.isArray(content.lines)) {
      setDescription(content.description || 'Соберите программу в правильном порядке:');
      setCorrectLines(content.lines);

      if (submitted) {
        // Если уже решено/отправлено, показываем правильное решение сразу
        setPlacedLines(content.lines);
        setAvailableLines([]);
      } else {
        setPlacedLines([]);
        // Перемешиваем строки, сбрасывая их отступы в 0 для усложнения
        const shuffled = content.lines
          .map((l: CodeLine) => ({ ...l, indent: 0 }))
          .sort(() => Math.random() - 0.5);
        setAvailableLines(shuffled);
      }
    }
  }, [content]);

  // Сброс задачи
  const handleReset = () => {
    setPlacedLines([]);
    const shuffled = correctLines
      .map(l => ({ ...l, indent: 0 }))
      .sort(() => Math.random() - 0.5);
    setAvailableLines(shuffled);
    onReset?.();
  };

  // Клик по доступной строке (переместить в сборочную зону)
  const handleSelectLine = (line: CodeLine) => {
    if (submitted) return;
    setAvailableLines(prev => prev.filter(l => l.id !== line.id));
    setPlacedLines(prev => [...prev, line]);
  };

  // Клик по размещенной строке (вернуть обратно в доступные)
  const handleDeselectLine = (line: CodeLine) => {
    if (submitted) return;
    setPlacedLines(prev => prev.filter(l => l.id !== line.id));
    // Возвращаем строку, сбрасывая её отступ в 0
    setAvailableLines(prev => [...prev, { ...line, indent: 0 }]);
  };

  // Изменение отступа размещенной строки
  const handleIndentChange = (id: string, action: 'inc' | 'dec') => {
    if (submitted) return;
    setPlacedLines(prev =>
      prev.map(l => {
        if (l.id === id) {
          const newIndent = action === 'inc' 
            ? Math.min(l.indent + 1, 8) 
            : Math.max(l.indent - 1, 0);
          return { ...l, indent: newIndent };
        }
        return l;
      })
    );
  };

  // Перемещение строки вверх/вниз в зоне сборки
  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    if (submitted) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === placedLines.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...placedLines];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setPlacedLines(updated);
  };

  // Драг-н-дроп хэндлеры
  const handleDragStart = (e: React.DragEvent, id: string, source: 'available' | 'placed') => {
    if (submitted) return;
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, source }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToPlaced = (e: React.DragEvent) => {
    e.preventDefault();
    if (submitted) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { id, source } = JSON.parse(dataStr);

      if (source === 'available') {
        const line = availableLines.find(l => l.id === id);
        if (line) handleSelectLine(line);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropToAvailable = (e: React.DragEvent) => {
    e.preventDefault();
    if (submitted) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { id, source } = JSON.parse(dataStr);

      if (source === 'placed') {
        const line = placedLines.find(l => l.id === id);
        if (line) handleDeselectLine(line);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Проверка правильности
  const handleSubmit = () => {
    if (placedLines.length !== correctLines.length) return;

    // Сверяем порядок и отступы с эталонными строками
    const isAllCorrect = correctLines.every((correctLine, idx) => {
      const placed = placedLines[idx];
      return placed && placed.id === correctLine.id && placed.indent === correctLine.indent;
    });

    onComplete(isAllCorrect, JSON.stringify(placedLines));
  };

  const allPlaced = placedLines.length === correctLines.length;

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Описание задания */}
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 text-sm font-semibold text-slate-100 leading-relaxed">
        {description}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ЗОНА СБОРКИ КОДА (7/12) */}
        <div 
          className="lg:col-span-7 space-y-3"
          onDragOver={handleDragOver}
          onDrop={handleDropToPlaced}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Зона сборки программы</p>
          
          <div className="p-4 rounded-2xl border-2 border-dashed border-slate-900 bg-slate-950/40 min-h-[250px] space-y-2">
            {placedLines.length === 0 ? (
              <div className="min-h-[220px] flex items-center justify-center text-xs text-slate-650 italic text-center">
                Перетащите строки кода сюда или кликайте по карточкам справа, чтобы начать сборку.
              </div>
            ) : (
              placedLines.map((line, index) => {
                let statusColor = 'border-slate-800 bg-slate-950/80 hover:border-slate-700';
                if (submitted) {
                  // Для вывода результатов проверяем, стоит ли строка на правильном индексе с правильным отступом
                  const isLineCorrect = correctLines[index]?.id === line.id && correctLines[index]?.indent === line.indent;
                  statusColor = isLineCorrect 
                    ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' 
                    : 'border-rose-500/30 bg-rose-500/5 text-rose-400';
                }

                return (
                  <div
                    key={line.id}
                    draggable={!submitted}
                    onDragStart={(e) => handleDragStart(e, line.id, 'placed')}
                    className="flex items-center gap-2 group"
                  >
                    {/* Кнопки перемещения по высоте */}
                    {!submitted && (
                      <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleMoveLine(index, 'up')}
                          disabled={index === 0}
                          className="text-slate-600 hover:text-violet-400 disabled:opacity-10"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveLine(index, 'down')}
                          disabled={index === placedLines.length - 1}
                          className="text-slate-600 hover:text-violet-400 disabled:opacity-10"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    )}

                    {/* Кнопки управления отступами */}
                    {!submitted && (
                      <div className="flex items-center gap-0.5 shrink-0 bg-slate-900/40 border border-slate-900 px-1 py-0.5 rounded-lg select-none">
                        <button
                          type="button"
                          onClick={() => handleIndentChange(line.id, 'dec')}
                          disabled={line.indent === 0}
                          className="w-4 h-4 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-20"
                        >
                          «
                        </button>
                        <button
                          type="button"
                          onClick={() => handleIndentChange(line.id, 'inc')}
                          disabled={line.indent >= 8}
                          className="w-4 h-4 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-800 hover:text-white disabled:opacity-20"
                        >
                          »
                        </button>
                      </div>
                    )}

                    {/* Сама строка кода с динамическим отступом */}
                    <div
                      onClick={() => handleDeselectLine(line)}
                      className={`flex-1 p-3 rounded-xl border text-xs font-mono font-semibold cursor-pointer select-none transition-all flex items-center ${statusColor}`}
                      style={{ marginLeft: `${line.indent * 16}px` }}
                    >
                      <span className="flex-1 min-w-0 truncate">{line.code}</span>
                      {!submitted && (
                        <span className="text-[9px] font-bold text-slate-600 group-hover:text-rose-400/80 transition-colors uppercase select-none pr-1">
                          ✕ вернуть
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ПЕРЕМЕШАННЫЙ ПУЛ СТРОК (5/12) */}
        <div 
          className="lg:col-span-5 space-y-3"
          onDragOver={handleDragOver}
          onDrop={handleDropToAvailable}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Доступные строки кода</p>
            {!submitted && placedLines.length > 0 && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold"
              >
                <RefreshCw size={10} />
                Сбросить
              </button>
            )}
          </div>

          <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 min-h-[250px] space-y-2">
            {availableLines.length === 0 ? (
              <div className="min-h-[220px] flex items-center justify-center text-xs text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/10 font-bold uppercase select-none text-center">
                Все строки распределены!
              </div>
            ) : (
              availableLines.map(line => (
                <div
                  key={line.id}
                  draggable={!submitted}
                  onDragStart={(e) => handleDragStart(e, line.id, 'available')}
                  onClick={() => handleSelectLine(line)}
                  className="p-3 rounded-xl border border-slate-850 bg-slate-900 hover:border-slate-700 hover:bg-slate-850 text-xs font-mono font-semibold text-slate-200 cursor-grab active:cursor-grabbing shadow-sm transition-all"
                >
                  {line.code}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Кнопка проверки */}
      <div className="flex justify-end pt-4 border-t border-slate-900/60">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!allPlaced}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-violet-600/10"
          >
            Проверить программу
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {placedLines.every((l, idx) => correctLines[idx]?.id === l.id && correctLines[idx]?.indent === l.indent) ? (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                <CheckCircle size={16} />
                Программа работает! +40 XP
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                  <AlertCircle size={16} />
                  Ошибка компиляции. Проверьте порядок и отступы.
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
