'use client';

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, AlertCircle, RefreshCw, Loader2, Code, Terminal, Award, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';

interface TestCase {
  input: string;
  expected: string;
}

interface CodeQuizProps {
  stepId: string;
  content: any; // { description: string, starterCode: string, language: string, testCases: TestCase[] }
  submitted: boolean;
  onSubmit: (code: string) => Promise<any>;
  onReset: () => void;
  xp?: number | null;
}

export function CodeQuiz({ stepId, content, submitted, onSubmit, onReset, xp }: CodeQuizProps) {
  const [code, setCode] = useState('');
  const [customStdin, setCustomStdin] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiHint, setAiHint] = useState<string>('');
  const [loadingHint, setLoadingHint] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    api.getAiStatus()
      .then(res => setAiEnabled(res.enabled))
      .catch(() => setAiEnabled(false));
  }, []);

  const handleRequestHint = async () => {
    if (running || submitting || loadingHint) return;
    setLoadingHint(true);
    setAiHint('ИИ-Наставник анализирует твою программу...');
    try {
      const res = await api.getAiHint(stepId, code);
      setAiHint(res.hint);
    } catch (e: any) {
      setAiHint(`🤖 **Не удалось получить подсказку.**\n\nОшибка: ${e.message}`);
    } finally {
      setLoadingHint(false);
    }
  };
  
  // Результаты запусков
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [consoleError, setConsoleError] = useState<string>('');
  const [consoleCompiler, setConsoleCompiler] = useState<string>('');
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [isAllPassed, setIsAllPassed] = useState<boolean | null>(null);

  const [xpEarned, setXpEarned] = useState<number>(0);
  const [moduleBonus, setModuleBonus] = useState<{ title: string; xp: number } | null>(null);
  const [courseBonus, setCourseBonus] = useState<{ title: string; xp: number } | null>(null);

  // Инициализация стартового кода и очистка состояния при смене задачи
  useEffect(() => {
    if (content) {
      setCode(content.starterCode || '');
      setCustomStdin(content.testCases?.[0]?.input || '');
      setConsoleOutput('');
      setConsoleError('');
      setConsoleCompiler('');
      setTestResults(null);
      setIsAllPassed(null);
      setModuleBonus(null);
      setCourseBonus(null);
      setAiHint('');
    }
  }, [content]);

  // Запуск кода на первом тест-кейсе или кастомном вводе (кнопка Запустить)
  const handleRunCode = async () => {
    if (running) return;
    setRunning(true);
    setConsoleOutput('Выполнение...');
    setConsoleError('');
    setConsoleCompiler('');

    try {
      const res = await api.runCode(stepId, code, customStdin);
      
      if (res.status === 0) {
        setConsoleOutput(res.stdout || 'Программа выполнена и ничего не вывела в stdout.');
      } else {
        setConsoleOutput(res.stdout || '');
        setConsoleError(res.stderr || '');
        setConsoleCompiler(res.compilerMessage || '');
      }
    } catch (e: any) {
      setConsoleError(`Ошибка сети: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  // Проверка кода на сервере по всем тест-кейсам
  const handleSubmitCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setTestResults(null);
    setIsAllPassed(null);
    setModuleBonus(null);
    setCourseBonus(null);

    try {
      const res = await onSubmit(code);
      // res содержит: { progress, xpEarned, moduleBonusXp, courseBonusXp, completedModuleTitle, completedCourseTitle, testCaseResults }
      
      if (res && Array.isArray(res.testCaseResults)) {
        setTestResults(res.testCaseResults);
        const passed = res.testCaseResults.every((tc: any) => tc.passed);
        setIsAllPassed(passed);
        setXpEarned(res.xpEarned || 0);

        if (res.moduleBonusXp > 0) {
          setModuleBonus({ title: res.completedModuleTitle, xp: res.moduleBonusXp });
        }
        if (res.courseBonusXp > 0) {
          setCourseBonus({ title: res.completedCourseTitle, xp: res.courseBonusXp });
        }
      }
    } catch (e: any) {
      setConsoleError(`Ошибка отправки на проверку: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Сброс решения
  const handleResetClick = () => {
    setCode(content.starterCode || '');
    setTestResults(null);
    setIsAllPassed(null);
    setModuleBonus(null);
    setCourseBonus(null);
    onReset();
  };

  const getLanguageMode = (lang: string) => {
    const l = (lang || 'pascal').toLowerCase();
    if (l === 'pascal') return 'pascal';
    if (l === 'python') return 'python';
    if (l === 'cpp') return 'cpp';
    if (l === 'csharp') return 'csharp';
    if (l === 'java') return 'java';
    if (l === 'javascript') return 'javascript';
    return 'pascal';
  };

  const isSolved = submitted || isAllPassed === true;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* ЛЕВАЯ КОЛОНКА: Условие и тесты (40%) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Описание задачи */}
          <div className="flex-1 p-5 rounded-2xl bg-slate-950/40 border border-slate-900 space-y-3 overflow-y-auto max-h-[350px] scrollbar-thin">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <Code size={14} />
              Условие задачи
            </h3>
            <div 
              className="text-sm text-slate-300 leading-relaxed font-sans prose-step whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: content?.description || 'Инструкция отсутствует.' }}
            />
          </div>

          {/* Пример входных/выходных данных */}
          {content?.testCases && content.testCases.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-900/60 space-y-2.5">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Пример тестов</h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">
                  <span>Ввод (stdin)</span>
                  <span>Вывод (stdout)</span>
                </div>
                {content.testCases.slice(0, 2).map((tc: TestCase, idx: number) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/50">
                    <span className="text-slate-400 whitespace-pre-line">{tc.input || '(пусто)'}</span>
                    <span className="text-emerald-400 whitespace-pre-line">{tc.expected}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Monaco Editor & Консоль (60%) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Monaco Editor Container */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950 overflow-hidden shadow-2xl relative">
            <div className="bg-slate-950 border-b border-slate-900 px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Редактор кода ({content?.language || 'Pascal'})
              </span>
              {xp !== undefined && xp !== null ? (
                <span className="text-[10px] font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-md">
                  +{xp} XP
                </span>
              ) : (
                <span className="text-[10px] font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-md">
                  +50 XP
                </span>
              )}
            </div>

            <Editor
              height="340px"
              language={getLanguageMode(content?.language)}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                tabSize: 2,
                insertSpaces: true,
                readOnly: isSolved || submitting,
                automaticLayout: true,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                }
              }}
              loading={
                <div className="h-[340px] flex items-center justify-center bg-slate-950 text-xs text-slate-500 gap-2 font-semibold">
                  <Loader2 className="animate-spin text-violet-500" size={16} />
                  Загрузка редактора Monaco...
                </div>
              }
            />
          </div>

          {/* Ввод stdin и консоль */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Ручной ввод stdin */}
            <div className="md:col-span-4 space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Terminal size={12} />
                Тестовый ввод
              </label>
              <textarea
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                placeholder="Ввод программы (stdin)..."
                disabled={isSolved || running}
                rows={4}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-violet-500 transition-all placeholder-slate-700 resize-none h-[110px]"
              />
            </div>

            {/* Вывод консоли */}
            <div className="md:col-span-8 space-y-1">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Terminal size={12} />
                Результат выполнения (stdout)
              </label>
              <div className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 h-[110px] overflow-y-auto text-xs font-mono scrollbar-thin select-text">
                {consoleCompiler && (
                  <div className="text-yellow-500/80 mb-1 border-b border-yellow-500/10 pb-1 whitespace-pre-wrap">
                    {consoleCompiler}
                  </div>
                )}
                {consoleError && (
                  <div className="text-rose-500 whitespace-pre-wrap">{consoleError}</div>
                )}
                {consoleOutput && (
                  <div className="text-slate-300 whitespace-pre-wrap">{consoleOutput}</div>
                )}
                {!consoleOutput && !consoleError && !consoleCompiler && (
                  <span className="text-slate-700 italic select-none">Нажмите "Запустить", чтобы проверить вывод...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Панель результатов автопроверки */}
      {testResults && (
        <div className="p-5 rounded-2xl border border-slate-900 bg-slate-950/30 space-y-3 animate-fade-in">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Результаты автоматического тестирования</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {testResults.map((tc, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  tc.passed
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                    : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  tc.passed ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                }`}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <div className="font-bold flex items-center justify-between">
                    <span>Тест #{idx + 1}</span>
                    <span>{tc.passed ? 'Пройден' : 'Ошибка'}</span>
                  </div>
                  {!tc.passed && (
                    <div className="text-[10px] font-mono text-slate-400 space-y-0.5 truncate">
                      <div>Ожидалось: <span className="text-emerald-400 font-bold">{tc.expected.trim()}</span></div>
                      <div>Получено: <span className="text-rose-400 font-bold">{tc.output ? tc.output.trim() : '(нет вывода)'}</span></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Блок ИИ-Наставника */}
      {aiHint && aiEnabled && (
        <div className="p-5 rounded-2xl border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-slate-950/40 to-slate-950/40 space-y-3 animate-fade-in relative overflow-hidden shadow-lg shadow-violet-500/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
              <Sparkles size={16} className={loadingHint ? "animate-pulse" : ""} />
            </div>
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-violet-400">ИИ-Наставник</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Наводящие подсказки</p>
            </div>
          </div>
          <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-wrap prose-hint select-text">
            {aiHint}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-900/60">
        <div>
          {isSolved && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                <CheckCircle size={16} />
                Задание выполнено! +{xpEarned} XP
              </div>
              
              {/* Бонусы завершения */}
              <div className="flex flex-col gap-1 pl-1">
                {moduleBonus && (
                  <div className="text-xs text-violet-400 font-semibold flex items-center gap-1.5">
                    <Award size={14} />
                    Бонус за прохождение раздела "{moduleBonus.title}": +{moduleBonus.xp} XP!
                  </div>
                )}
                {courseBonus && (
                  <div className="text-xs text-fuchsia-400 font-semibold flex items-center gap-1.5">
                    <Award size={14} />
                    Бонус за прохождение курса "{courseBonus.title}": +{courseBonus.xp} XP!
                  </div>
                )}
              </div>
            </div>
          )}

          {!isSolved && isAllPassed === false && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-sm font-bold">
                <AlertCircle size={16} />
                Тестирование не пройдено. Проверьте крайние тест-кейсы.
              </div>
              <button
                onClick={handleResetClick}
                className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white transition-colors"
                title="Сбросить код"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isSolved && aiEnabled && (
            <button
              onClick={handleRequestHint}
              disabled={running || submitting || loadingHint || code.trim() === ''}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-violet-900 bg-violet-950/20 text-violet-400 hover:bg-violet-900/30 disabled:opacity-40 disabled:pointer-events-none transition-all font-semibold"
            >
              {loadingHint ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Подсказка ИИ
            </button>
          )}

          {!isSolved && (
            <button
              onClick={handleRunCode}
              disabled={running || submitting || loadingHint}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-40 transition-all font-semibold"
            >
              {running ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Запустить
            </button>
          )}

          {!isSolved ? (
            <button
              onClick={handleSubmitCode}
              disabled={running || submitting || loadingHint || code.trim() === ''}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all shadow-md shadow-violet-600/10"
            >
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              Отправить решение
            </button>
          ) : (
            <button
              onClick={handleResetClick}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-850 text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
            >
              <RefreshCw size={14} />
              Попробовать снова
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
