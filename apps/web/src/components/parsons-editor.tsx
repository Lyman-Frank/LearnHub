'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, AlignLeft, HelpCircle } from 'lucide-react';

interface CodeLine {
  id: string;
  code: string;
  indent: number; // 0, 1, 2, 3... (где 1 уровень = 2 пробела)
}

interface ParsonsEditorProps {
  content: string | null;
  onChange: (newContent: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export function ParsonsEditor({ content, onChange }: ParsonsEditorProps) {
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState<CodeLine[]>([]);

  // Инициализация при первой загрузке или смене контента
  useEffect(() => {
    try {
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed) {
          setDescription(parsed.description || '');
          if (Array.isArray(parsed.lines)) {
            setLines(parsed.lines);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Ошибка парсинга Parsons-контента', e);
    }
    // Дефолтное состояние
    setDescription('');
    setLines([
      { id: generateId(), code: 'program MyProgram;', indent: 0 },
      { id: generateId(), code: 'begin', indent: 0 },
      { id: generateId(), code: "  writeln('Hello!');", indent: 1 },
      { id: generateId(), code: 'end.', indent: 0 }
    ]);
  }, [content]);

  // Хелпер для сохранения
  const saveChanges = (updatedDesc: string, updatedLines: CodeLine[]) => {
    setDescription(updatedDesc);
    setLines(updatedLines);
    onChange(JSON.stringify({ description: updatedDesc, lines: updatedLines }));
  };

  const handleAddLine = () => {
    const newLine: CodeLine = { id: generateId(), code: '', indent: 0 };
    saveChanges(description, [...lines, newLine]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    const filtered = lines.filter(l => l.id !== id);
    saveChanges(description, filtered);
  };

  const handleUpdateLineField = (id: string, field: keyof CodeLine, value: any) => {
    const updated = lines.map(l => {
      if (l.id === id) {
        return { ...l, [field]: value };
      }
      return l;
    });
    saveChanges(description, updated);
  };

  const handleMoveLine = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === lines.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...lines];
    
    // Меняем местами
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    saveChanges(description, updated);
  };

  const handleIndentChange = (id: string, action: 'inc' | 'dec') => {
    const line = lines.find(l => l.id === id);
    if (!line) return;
    
    let newIndent = line.indent;
    if (action === 'inc') {
      newIndent = Math.min(line.indent + 1, 8); // макс 8 уровней (16 пробелов)
    } else if (action === 'dec') {
      newIndent = Math.max(line.indent - 1, 0); // мин 0
    }

    handleUpdateLineField(id, 'indent', newIndent);
  };

  return (
    <div className="space-y-6">
      {/* Подсказка */}
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/30 text-xs text-violet-300/90 leading-relaxed flex items-start gap-3">
        <HelpCircle size={16} className="shrink-0 text-violet-400 mt-0.5" />
        <div>
          <span className="font-bold text-violet-200">Создание кодового пазла (Parsons Problems):</span>
          <p className="mt-1">
            Запишите программу на Pascal строка за строкой **в правильном порядке** и укажите правильные отступы.
            Для студента строчки будут перемешаны, и ему потребуется восстановить правильный порядок и структуру отступов.
          </p>
        </div>
      </div>

      {/* Описание задачи */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Инструкция / Задание для студента</label>
        <input
          type="text"
          value={description}
          onChange={(e) => saveChanges(e.target.value, lines)}
          placeholder="Например: Соберите программу, выводящую 'Привет, LearnHub!' на экран"
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all placeholder-slate-650"
        />
      </div>

      {/* Список строк кода */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-3">
          <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
            <AlignLeft size={14} />
            Строки кода (по порядку)
          </label>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Всего строк: {lines.length}</span>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {lines.map((line, index) => {
            return (
              <div
                key={line.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-900 bg-slate-950/60 hover:border-slate-800 transition-all group"
              >
                {/* Сортировка */}
                <div className="flex flex-col gap-0.5 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => handleMoveLine(index, 'up')}
                    disabled={index === 0}
                    className="p-0.5 text-slate-600 hover:text-violet-400 disabled:opacity-20 transition-colors"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveLine(index, 'down')}
                    disabled={index === lines.length - 1}
                    className="p-0.5 text-slate-600 hover:text-violet-400 disabled:opacity-20 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>

                {/* Настройка отступа */}
                <div className="flex items-center gap-1 shrink-0 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleIndentChange(line.id, 'dec')}
                    disabled={line.indent === 0}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-25"
                    title="Уменьшить отступ"
                  >
                    «
                  </button>
                  <span className="text-xs font-mono font-bold text-violet-400 w-8 text-center" title="Уровень отступа (1 ур = 2 пробела)">
                    {line.indent * 2}п
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIndentChange(line.id, 'inc')}
                    disabled={line.indent >= 8}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-25"
                    title="Увеличить отступ"
                  >
                    »
                  </button>
                </div>

                {/* Ввод строки кода */}
                <div className="flex-1 min-w-0" style={{ paddingLeft: `${line.indent * 12}px` }}>
                  <input
                    type="text"
                    value={line.code}
                    onChange={(e) => handleUpdateLineField(line.id, 'code', e.target.value)}
                    placeholder="Например: writeln('Pascal');"
                    className="w-full bg-slate-900/50 border border-slate-850 rounded-lg px-3.5 py-2 text-sm font-mono text-emerald-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all placeholder-slate-700"
                  />
                </div>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line.id)}
                  disabled={lines.length <= 1}
                  className="p-2 text-slate-600 hover:text-rose-400 disabled:opacity-20 disabled:hover:text-slate-600 transition-colors shrink-0"
                  title="Удалить строку"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddLine}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-slate-800 hover:border-violet-500/50 hover:bg-violet-950/10 text-slate-400 hover:text-violet-300 rounded-xl text-sm font-semibold transition-all"
      >
        <Plus size={16} />
        Добавить строку кода
      </button>
    </div>
  );
}
