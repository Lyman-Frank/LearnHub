'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, BookOpen, CheckCircle, Circle,
  AlertCircle, Loader2, ArrowLeft, Layers, Award
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { MatchingQuiz } from '@/components/matching-quiz';
import { ParsonsQuiz } from '@/components/parsons-quiz';
import { CodeQuiz } from '@/components/code-quiz';

interface Step {
  id: string;
  title: string;
  type: string;
  position: number;
  content: any;
  xp?: number | null;
}

interface Lesson {
  id: string;
  title: string;
  position: number;
  steps: Step[];
}

interface Module {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  modules: Module[];
}

interface PageProps {
  params: Promise<{ id: string; stepId: string }>;
}

export default function LearnStepPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { id: courseId, stepId } = resolvedParams;

  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [earnedXpToast, setEarnedXpToast] = useState<{ xp: number; streak: number } | null>(null);
  const [earnedBadgesToast, setEarnedBadgesToast] = useState<{ name: string; description: string; iconUrl?: string }[] | null>(null);

  const dispatchXpEvent = (res: any) => {
    if (res && res.xpEarned > 0) {
      setEarnedXpToast({ xp: res.xpEarned, streak: res.newStreak });
      window.dispatchEvent(new CustomEvent('learnhub-xp-earned', { 
        detail: { xp: res.totalXp, streak: res.newStreak } 
      }));
      setTimeout(() => setEarnedXpToast(null), 4000);

      if (res.moduleBonusXp > 0) {
        alert(`🎉 Раздел "${res.completedModuleTitle}" успешно завершен! Вы получили бонус +${res.moduleBonusXp} XP!`);
      }
      if (res.courseBonusXp > 0) {
        alert(`🏆 Поздравляем! Курс "${res.completedCourseTitle}" полностью завершен! Вы получили супер-бонус +${res.courseBonusXp} XP!`);
      }
    }
    if (res && res.newEarnedBadges && res.newEarnedBadges.length > 0) {
      setEarnedBadgesToast(res.newEarnedBadges);
      setTimeout(() => setEarnedBadgesToast(null), 6000);
    }
  };

  // Собираем плоский список всех шагов для навигации
  const allSteps: Step[] = [];
  course?.modules.forEach(m => m.lessons.forEach(l => l.steps.forEach(s => allSteps.push(s))));
  const currentIdx = allSteps.findIndex(s => s.id === stepId);
  const prevStep = currentIdx > 0 ? allSteps[currentIdx - 1] : null;
  const nextStep = currentIdx < allSteps.length - 1 ? allSteps[currentIdx + 1] : null;

  const startTimeRef = React.useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [stepId]);

  const getElapsedTime = () => {
    const elapsed = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
    startTimeRef.current = Date.now();
    return elapsed;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getCourse(courseId);
        setCourse(data);
        // Находим нужный шаг
        for (const mod of data.modules) {
          for (const les of mod.lessons) {
            const found = les.steps.find((s: Step) => s.id === stepId);
            if (found) {
              setCurrentStep(found);
              setExpandedModules(new Set([mod.id]));
              break;
            }
          }
        }
        // Загружаем прогресс по курсу
        try {
          const progress = await api.getCourseProgress(courseId);
          if (progress?.completedStepIds) {
            setCompletedSteps(new Set(progress.completedStepIds));
          }
        } catch {
          // Прогресс необязателен
        }
      } catch {
        router.push(`/student/course/${courseId}`);
      } finally {
        setLoading(false);
      }
    };
    load();
    setQuizAnswer(null);
    setQuizSubmitted(false);
  }, [courseId, stepId]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleCompleteStep = async () => {
    if (!currentStep || completing) return;
    setCompleting(true);
    const elapsed = getElapsedTime();
    try {
      const res = await api.completeStep(currentStep.id, undefined, undefined, elapsed);
      setCompletedSteps(prev => new Set([...prev, currentStep.id]));
      dispatchXpEvent(res);
    } catch (e) {
      console.error('Ошибка отметки шага:', e);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async (optionId: string, isCorrect: boolean) => {
    setQuizSubmitted(true);
    const elapsed = getElapsedTime();
    try {
      const res = await api.completeStep(currentStep!.id, optionId, isCorrect, elapsed);
      if (isCorrect) {
        setCompletedSteps(prev => new Set([...prev, currentStep!.id]));
        dispatchXpEvent(res);
      }
    } catch {
      // ignore
    }
  };

  const handleMatchingComplete = async (isCorrect: boolean, answer: string) => {
    setQuizSubmitted(isCorrect);
    const elapsed = getElapsedTime();
    try {
      const res = await api.completeStep(currentStep!.id, answer, isCorrect, elapsed);
      if (isCorrect) {
        setCompletedSteps(prev => new Set([...prev, currentStep!.id]));
        dispatchXpEvent(res);
      }
    } catch (e) {
      setQuizSubmitted(false);
      console.error('Ошибка сопоставления:', e);
    }
  };

  const handleParsonsComplete = async (isCorrect: boolean, answer: string) => {
    setQuizSubmitted(isCorrect);
    const elapsed = getElapsedTime();
    try {
      const res = await api.completeStep(currentStep!.id, answer, isCorrect, elapsed);
      if (isCorrect) {
        setCompletedSteps(prev => new Set([...prev, currentStep!.id]));
        dispatchXpEvent(res);
      }
    } catch (e) {
      setQuizSubmitted(false);
      console.error('Ошибка сборки кода:', e);
    }
  };

  const handleCodeSubmit = async (code: string) => {
    setQuizSubmitted(true);
    const elapsed = getElapsedTime();
    try {
      const res = await api.completeStep(currentStep!.id, code, undefined, elapsed);
      if (res && res.progress && res.progress.isCompleted) {
        setCompletedSteps(prev => new Set([...prev, currentStep!.id]));
        dispatchXpEvent(res);
      } else {
        setQuizSubmitted(false);
      }
      return res;
    } catch (e) {
      setQuizSubmitted(false);
      console.error('Ошибка отправки кода:', e);
      throw e;
    }
  };

  const renderTextContent = () => {
    if (!currentStep?.content) {
      return <p className="text-slate-400 italic">Содержимое не добавлено.</p>;
    }
    const content = currentStep.content;
    if (typeof content === 'string') {
      return <div className="prose-step" dangerouslySetInnerHTML={{ __html: content }} />;
    }
    // Если JSON объект с полем text
    if (content.text) {
      return (
        <div
          className="text-slate-300 leading-relaxed text-base space-y-4"
          dangerouslySetInnerHTML={{ __html: content.text }}
        />
      );
    }
    return <p className="text-slate-400 italic">Содержимое в неизвестном формате.</p>;
  };

  const renderQuizContent = () => {
    if (!currentStep?.content) {
      return <p className="text-slate-400 italic">Вопрос не добавлен.</p>;
    }
    const content = currentStep.content;
    const question = content.question || 'Вопрос';
    const questionImage: string | null = content.questionImage || null;
    const options: { id: string; text: string; isCorrect: boolean; imageUrl?: string }[] = content.options || [];

    const isMultiple = currentStep.type === 'MULTIPLE_CHOICE';
    const selectedList = quizAnswer ? quizAnswer.split(',') : [];

    const correctOptionIds = options.filter(o => o.isCorrect).map(o => o.id);
    const isAnswerCorrect = selectedList.length === correctOptionIds.length &&
                            selectedList.every(id => correctOptionIds.includes(id));

    const handleOptionClick = (optId: string) => {
      if (isMultiple) {
        const isSelected = selectedList.includes(optId);
        const newList = isSelected
          ? selectedList.filter(id => id !== optId)
          : [...selectedList, optId];
        setQuizAnswer(newList.length > 0 ? newList.join(',') : null);
      } else {
        setQuizAnswer(optId);
      }
    };

    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-violet-950/30 border border-violet-500/20 space-y-3">
          <p className="text-lg font-bold text-white flex items-center justify-between">
            <span>{question}</span>
            {isMultiple && (
              <span className="text-xs px-2 py-1 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30 font-semibold uppercase tracking-wider">
                Несколько вариантов
              </span>
            )}
          </p>
          {questionImage && (
            <img
              src={questionImage}
              alt="Иллюстрация к вопросу"
              className="w-full max-h-56 object-contain rounded-xl border border-violet-900/30"
            />
          )}
        </div>
        <div className="space-y-3">
          {options.map(opt => {
            const isSelected = selectedList.includes(opt.id);
            const isWrong = quizSubmitted && isSelected && !opt.isCorrect;
            const isRight = quizSubmitted && opt.isCorrect;
            return (
              <button
                key={opt.id}
                disabled={quizSubmitted}
                onClick={() => handleOptionClick(opt.id)}
                className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 flex items-start gap-4 ${
                  isRight
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : isWrong
                    ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                    : isSelected
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex-1">
                  {opt.imageUrl && (
                    <div className="w-full h-32 flex items-center justify-center bg-slate-950/60 rounded-lg border border-slate-800/80 mb-2 overflow-hidden">
                      <img
                        src={opt.imageUrl}
                        alt=""
                        className="max-w-full max-h-full object-contain p-1"
                      />
                    </div>
                  )}
                  <span>{opt.text}</span>
                </div>
                <div className="shrink-0 mt-0.5">
                  {isRight && <CheckCircle size={16} className="text-emerald-400" />}
                  {isWrong && <AlertCircle size={16} className="text-rose-400" />}
                  {!quizSubmitted && isSelected && (
                    isMultiple
                      ? <CheckCircle size={16} className="text-violet-400 fill-violet-400" />
                      : <Circle size={16} className="text-violet-400 fill-violet-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {!quizSubmitted ? (
          <button
            disabled={!quizAnswer}
            onClick={() => handleQuizSubmit(quizAnswer!, isAnswerCorrect)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold disabled:opacity-40 disabled:pointer-events-none transition-all"
          >
            Проверить ответ
          </button>
        ) : (
          <div className={`p-4 rounded-xl border text-sm font-medium ${
            isAnswerCorrect
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {isAnswerCorrect
              ? '✅ Верно! Отличная работа.'
              : '❌ Неверно. Попробуйте ещё раз или изучите материал выше.'}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={40} />
        <span className="text-slate-400 text-sm">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-0 lg:gap-6 min-h-[80vh]">
      {/* Боковая панель — структура курса */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-6 space-y-2">
          <Link
            href={`/student/course/${courseId}`}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 mb-4 transition-colors"
          >
            <ArrowLeft size={14} />
            К описанию курса
          </Link>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-900">
            {course?.title}
          </p>
          <div className="space-y-1 max-h-[calc(100vh-140px)] overflow-y-auto pr-1 scrollbar-thin">
            {course?.modules.map((mod) => {
              const isOpen = expandedModules.has(mod.id);
              return (
                <div key={mod.id}>
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 transition-colors"
                  >
                    <ChevronRight size={12} className={`shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    <span className="truncate">{mod.title}</span>
                  </button>
                  {isOpen && (
                    <div className="pl-5 space-y-0.5">
                      {mod.lessons.map(les => (
                        <div key={les.id}>
                          <p className="py-1 px-2 text-[10px] text-slate-600 font-semibold truncate">{les.title}</p>
                          {les.steps.map(st => (
                            <Link
                              key={st.id}
                              href={`/student/course/${courseId}/learn/${st.id}`}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] transition-colors ${
                                st.id === stepId
                                  ? 'bg-violet-600/15 text-violet-300 font-semibold'
                                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                              }`}
                            >
                              {completedSteps.has(st.id)
                                ? <CheckCircle size={10} className="shrink-0 text-emerald-400" />
                                : st.type === 'TEXT'
                                  ? <BookOpen size={10} className="shrink-0" />
                                  : <Circle size={10} className="shrink-0" />
                              }
                              <span className="truncate">{st.title}</span>
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Основной контент */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Хлебные крошки / прогресс */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Layers size={13} />
            <span>Шаг {currentIdx + 1} из {allSteps.length}</span>
          </div>
          <div className="h-1.5 flex-1 mx-6 rounded-full bg-slate-900 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 transition-all duration-500"
              style={{ width: `${allSteps.length > 0 ? ((currentIdx + 1) / allSteps.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{Math.round(allSteps.length > 0 ? ((currentIdx + 1) / allSteps.length) * 100 : 0)}%</span>
        </div>

        {/* Контент шага */}
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-950/50 backdrop-blur-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-violet-400">
                {currentStep?.type === 'TEXT' ? '📖 Материал' : currentStep?.type === 'MATCHING' ? '🧩 Сопоставление' : currentStep?.type === 'PARSONS' ? '💻 Кодовый пазл' : '❓ Тест'}
              </div>
              {currentStep && (
                <span className="text-xs font-extrabold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2.5 py-1 rounded-md">
                  +{currentStep.xp !== null && currentStep.xp !== undefined
                    ? currentStep.xp
                    : (currentStep.type === 'TEXT' ? 10 : currentStep.type === 'SINGLE_CHOICE' || currentStep.type === 'MULTIPLE_CHOICE' ? 20 : currentStep.type === 'MATCHING' ? 30 : currentStep.type === 'PARSONS' ? 40 : 50)
                  } XP
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-white">{currentStep?.title}</h1>
          </div>

          <div className="min-h-32">
            {currentStep?.type === 'TEXT' ? (
              renderTextContent()
            ) : currentStep?.type === 'MATCHING' ? (
              <MatchingQuiz
                content={currentStep.content}
                submitted={completedSteps.has(currentStep.id) || quizSubmitted}
                onComplete={handleMatchingComplete}
                onReset={() => setQuizSubmitted(false)}
              />
            ) : currentStep?.type === 'PARSONS' ? (
              <ParsonsQuiz
                content={currentStep.content}
                submitted={completedSteps.has(currentStep.id) || quizSubmitted}
                onComplete={handleParsonsComplete}
                onReset={() => setQuizSubmitted(false)}
              />
            ) : currentStep?.type === 'CODE' ? (
              <CodeQuiz
                stepId={currentStep.id}
                content={currentStep.content}
                xp={currentStep.xp}
                submitted={completedSteps.has(currentStep.id) || quizSubmitted}
                onSubmit={handleCodeSubmit}
                onReset={() => setQuizSubmitted(false)}
              />
            ) : (
              renderQuizContent()
            )}
          </div>

          {/* Кнопка "Отметить как прочитано" — только для TEXT шагов */}
          {currentStep?.type === 'TEXT' && (
            <div className="pt-2 border-t border-slate-900">
              {completedSteps.has(currentStep.id) ? (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle size={16} />
                  <span>Шаг пройден</span>
                </div>
              ) : (
                <button
                  onClick={handleCompleteStep}
                  disabled={completing}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-sm font-semibold transition-all duration-200"
                >
                  {completing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                  Отметить как прочитано
                </button>
              )}
            </div>
          )}
        </div>

        {/* Навигация */}
        <div className="flex items-center justify-between pt-2">
          {prevStep ? (
            <Link
              href={`/student/course/${courseId}/learn/${prevStep.id}`}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-900 bg-slate-950/60 text-slate-400 hover:text-white hover:border-slate-700 transition-all text-sm font-medium"
            >
              <ChevronLeft size={16} />
              Назад
            </Link>
          ) : (
            <div />
          )}
          {nextStep ? (
            <Link
              href={`/student/course/${courseId}/learn/${nextStep.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-600/20 transition-all text-sm"
            >
              Далее
              <ChevronRight size={16} />
            </Link>
          ) : (
            <Link
              href={`/student/course/${courseId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all text-sm"
            >
              <CheckCircle size={16} />
              Завершить курс
            </Link>
          )}
        </div>
      </div>

      {/* Анимированный XP-Toast */}
      {earnedXpToast && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-violet-500 bg-slate-900/90 text-white shadow-2xl shadow-violet-500/25 animate-bounce backdrop-blur-md">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white font-bold">
              <Award size={20} />
            </div>
            <div>
              <div className="text-sm font-black text-white">Вы получили +{earnedXpToast.xp} XP!</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Стрик-активность: {earnedXpToast.streak} дн. 🔥
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Анимированный Badge-Toast */}
      {earnedBadgesToast && (
        <div className="fixed bottom-28 right-6 z-50 flex flex-col gap-3 pointer-events-none">
          {earnedBadgesToast.map((b, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500 bg-slate-900/90 text-white shadow-2xl shadow-amber-500/25 animate-in slide-in-from-right fade-in duration-500 backdrop-blur-md">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                {b.iconUrl ? <img src={b.iconUrl} alt={b.name} className="w-6 h-6" /> : <Award size={20} />}
              </div>
              <div>
                <div className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Новое достижение!</div>
                <div className="text-sm font-bold text-white">{b.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
