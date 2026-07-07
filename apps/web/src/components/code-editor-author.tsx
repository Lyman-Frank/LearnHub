'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, Code2, PlusCircle } from 'lucide-react';

interface TestCase {
  input: string;
  expected: string;
}

interface CodeEditorAuthorProps {
  content: string | null;
  onChange: (newContent: string) => void;
  xp: number | null;
  onXpChange: (newXp: number | null) => void;
}

export function CodeEditorAuthor({ content, onChange, xp, onXpChange }: CodeEditorAuthorProps) {
  const [description, setDescription] = useState('');
  const [starterCode, setStarterCode] = useState('');
  const [language, setLanguage] = useState('pascal');
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Инициализация при первой загрузке или смене контента
  useEffect(() => {
    try {
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed) {
          setDescription(parsed.description || '');
          setStarterCode(parsed.starterCode || '');
          setLanguage(parsed.language || 'pascal');
          setTestCases(parsed.testCases || []);
          return;
        }
      }
    } catch (e) {
      console.error('Ошибка парсинга Code-контента', e);
    }
    // Дефолтное состояние
    setDescription('');
    setStarterCode('program Solution;\nbegin\n  \nend.');
    setLanguage('pascal');
    setTestCases([{ input: '', expected: '' }]);
  }, [content]);

  // Сохранение изменений
  const saveChanges = (desc: string, starter: string, lang: string, cases: TestCase[]) => {
    setDescription(desc);
    setStarterCode(starter);
    setLanguage(lang);
    setTestCases(cases);
    onChange(JSON.stringify({
      description: desc,
      starterCode: starter,
      language: lang,
      testCases: cases,
    }));
  };

  const handleLanguageChange = (newLang: string) => {
    // Подставляем дефолтные шаблоны для разных языков при смене, если поле пустое
    let newStarter = starterCode;
    if (!starterCode || starterCode.trim() === '' || starterCode.includes('program Solution') || starterCode.includes('def solve') || starterCode.includes('class Solution')) {
      if (newLang === 'pascal') {
        newStarter = 'program Solution;\nbegin\n  \nend.';
      } else if (newLang === 'python') {
        newStarter = '# Решение задачи\ndef solve():\n    # Считываем данные и пишем вывод\n    pass\n\nif __name__ == "__main__":\n    solve()';
      } else if (newLang === 'cpp') {
        newStarter = '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Введите ваш код здесь\n    return 0;\n}';
      } else if (newLang === 'csharp') {
        newStarter = 'using System;\n\nclass Program {\n    static void Main() {\n        // Введите ваш код здесь\n    }\n}';
      } else if (newLang === 'java') {
        newStarter = 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Класс должен называться Main\n    }\n}';
      } else if (newLang === 'javascript') {
        newStarter = 'const fs = require(\'fs\');\n// Ввод считывается через stdin\nconst input = fs.readFileSync(\'/dev/stdin\', \'utf-8\');\n';
      }
    }
    saveChanges(description, newStarter, newLang, testCases);
  };

  const handleAddTestCase = () => {
    saveChanges(description, starterCode, language, [...testCases, { input: '', expected: '' }]);
  };

  const handleRemoveTestCase = (index: number) => {
    const updated = testCases.filter((_, idx) => idx !== index);
    saveChanges(description, starterCode, language, updated);
  };

  const handleUpdateTestCase = (index: number, field: keyof TestCase, value: string) => {
    const updated = testCases.map((tc, idx) => {
      if (idx === index) {
        return { ...tc, [field]: value };
      }
      return tc;
    });
    saveChanges(description, starterCode, language, updated);
  };

  return (
    <div className="space-y-6">
      {/* Подсказка */}
      <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-900/30 text-xs text-violet-300/90 leading-relaxed flex items-start gap-3">
        <HelpCircle size={16} className="shrink-0 text-violet-400 mt-0.5" />
        <div>
          <span className="font-bold text-violet-200">Создание задачи по программированию:</span>
          <p className="mt-1">
            Задайте описание задачи, выберите язык, напишите стартовый шаблон кода и добавьте тест-кейсы.
            Решение студента будет автоматически компилироваться и тестироваться на бэкенде.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Язык программирования */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Язык программирования</label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all"
          >
            <option value="pascal">Pascal (FPC 3.2.2)</option>
            <option value="python">Python (CPython 3.13.8)</option>
            <option value="cpp">C++ (GCC 13.2.0)</option>
            <option value="csharp">C# (.NET 8.0)</option>
            <option value="java">Java (OpenJDK 21)</option>
            <option value="javascript">JavaScript (Node.js 20)</option>
          </select>
        </div>

        {/* Настройка кастомного XP */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Очки опыта (XP) за шаг</label>
          <input
            type="number"
            value={xp || ''}
            onChange={(e) => {
              const val = e.target.value;
              onXpChange(val === '' ? null : parseInt(val, 10));
            }}
            placeholder="По умолчанию (50 XP)"
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all placeholder-slate-650"
          />
        </div>
      </div>

      {/* Описание задачи */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Условие задачи (Описание)</label>
        <textarea
          value={description}
          onChange={(e) => saveChanges(e.target.value, starterCode, language, testCases)}
          placeholder="Опишите задачу, входные и выходные данные (поддерживается Markdown)..."
          rows={4}
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all placeholder-slate-650 font-sans leading-relaxed"
        />
      </div>

      {/* Стартовый код */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Стартовый шаблон кода</label>
        <textarea
          value={starterCode}
          onChange={(e) => saveChanges(description, e.target.value, language, testCases)}
          placeholder="Напишите начальный шаблон программы для студента..."
          rows={6}
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-emerald-400 focus:outline-none focus:border-fuchsia-500 transition-all placeholder-slate-700 font-mono leading-relaxed"
        />
      </div>

      {/* Тест-кейсы */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Тест-кейсы (Автопроверка)</label>
          <button
            type="button"
            onClick={handleAddTestCase}
            className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 uppercase transition-colors"
          >
            <Plus size={14} />
            Добавить тест
          </button>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {testCases.map((tc, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-900 bg-slate-950/40 relative group"
            >
              <span className="text-[10px] font-bold text-slate-600 bg-slate-900/60 w-5 h-5 rounded-full flex items-center justify-center mt-2">
                {index + 1}
              </span>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Входные данные (stdin)</span>
                  <textarea
                    value={tc.input}
                    onChange={(e) => handleUpdateTestCase(index, 'input', e.target.value)}
                    placeholder="Например: 2 3\n"
                    rows={2}
                    className="w-full bg-slate-900/50 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-violet-500 transition-all placeholder-slate-700 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ожидаемый вывод (stdout)</span>
                  <textarea
                    value={tc.expected}
                    onChange={(e) => handleUpdateTestCase(index, 'expected', e.target.value)}
                    placeholder="Например: 5\n"
                    rows={2}
                    className="w-full bg-slate-900/50 border border-slate-850 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-violet-500 transition-all placeholder-slate-700 resize-none"
                  />
                </div>
              </div>

              {testCases.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveTestCase(index)}
                  className="p-2 text-slate-600 hover:text-rose-400 transition-colors mt-2"
                  title="Удалить тест-кейс"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
