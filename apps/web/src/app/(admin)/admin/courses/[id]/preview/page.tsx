'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, XCircle, ArrowLeft, Loader2, BookOpen, Layers, 
  HelpCircle, Play, FileText, ChevronDown, ChevronRight, Eye 
} from 'lucide-react';
import { api } from '@/lib/api';

interface Step {
  id: string;
  title: string;
  type: string;
  position: number;
  content: any;
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
  description: string | null;
  coverUrl: string | null;
  status: string;
  modules: Module[];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const REJECTION_TEMPLATES = [
  {
    id: 'policy',
    label: 'Нарушение политики платформы',
    text: 'К сожалению, при проверке вашего курса мы пришли к выводу отклонить публикацию вашего курса, так как курс нарушает нашу политику.'
  },
  {
    id: 'incomplete',
    label: 'Недоработанные материалы',
    text: 'К сожалению, при проверке вашего курса мы пришли к выводу отклонить публикацию, так как курс содержит пустые уроки или недоработанные шаги.'
  },
  {
    id: 'errors',
    label: 'Опечатки или ошибки в коде/тестах',
    text: 'К сожалению, ваш курс отклонен. В вопросах или тестовых заданиях содержатся ошибки. Пожалуйста, перепроверьте формулировки и правильные ответы.'
  }
];

export default function AdminCoursePreviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('policy');
  const [customReason, setCustomReason] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Active step preview
  const [selectedPreviewStep, setSelectedPreviewStep] = useState<Step | null>(null);

  const fetchCourse = async () => {
    try {
      // Admins fetch course structure (bypassing restrictions on backend)
      const data = await api.getCourse(courseId);
      setCourse(data);
      if (data.modules?.length > 0) {
        setExpandedModules(new Set([data.modules[0].id]));
      }
    } catch (err) {
      console.error('Ошибка загрузки курса для проверки:', err);
      router.push('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleApprove = async () => {
    if (actionLoading) return;
    if (!(await window.customConfirm())) return;

    setActionLoading(true);
    try {
      await api.adminUpdateCourseStatus(courseId, 'PUBLISHED');
      window.customAlert('Курс успешно утвержден и опубликован! 🎉');
      router.push('/admin/courses');
    } catch (err: any) {
      window.customAlert(err.message || 'Ошибка одобрения курса');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actionLoading) return;

    const finalReason = isCustomMode 
      ? customReason.trim() 
      : REJECTION_TEMPLATES.find(t => t.id === selectedTemplate)?.text;

    if (!finalReason) {
      window.customAlert('Пожалуйста, укажите причину отклонения');
      return;
    }

    setActionLoading(true);
    try {
      await api.adminRejectCourse(courseId, finalReason);
      window.customAlert('Курс отклонен, автору отправлено уведомление.');
      router.push('/admin/courses');
    } catch (err: any) {
      window.customAlert(err.message || 'Ошибка отклонения курса');
    } finally {
      setActionLoading(false);
      setIsRejectModalOpen(false);
    }
  };

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-violet-500" size={40} />
        <span className="text-slate-400 text-sm">Загрузка материалов для модерации...</span>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6 text-white relative min-h-[80vh] flex flex-col pb-12">
      {/* Top Fixed Control Bar */}
      <div className="p-4 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-950 to-slate-950 shadow-xl flex flex-wrap items-center justify-between gap-4 sticky top-16 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/courses')}
            className="p-2 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900 transition-colors"
            title="Назад к списку"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/25 px-2 py-0.5 rounded-full">
              Режим модерации
            </span>
            <h1 className="text-sm sm:text-base font-black text-white line-clamp-1 mt-0.5">
              {course.title}
            </h1>
          </div>
        </div>


        <div className="flex items-center gap-2">
          {(course.status === 'UNDER_REVIEW' || course.status === 'PENDING_REVIEW') ? (
            <>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <CheckCircle size={14} />
                Опубликовать
              </button>
              <button
                onClick={() => setIsRejectModalOpen(true)}
                disabled={actionLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/10 flex items-center gap-1.5 transition-all disabled:opacity-40"
              >
                <XCircle size={14} />
                Отклонить
              </button>
            </>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
              {course.status === 'PUBLISHED' ? '✅ Опубликован' : course.status === 'DRAFT' ? 'Черновик' : course.status}
            </span>
          )}
        </div>
      </div>

      {/* Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start mt-4">
        {/* Left Side: Course Structure */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm space-y-4 max-h-[70vh] overflow-y-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-2.5">
            Программа курса
          </h3>

          <div className="space-y-2">
            {course.modules.map((mod, mi) => {
              const isExpanded = expandedModules.has(mod.id);
              return (
                <div key={mod.id} className="rounded-xl border border-slate-900/50 bg-slate-950/30 overflow-hidden">
                  <button
                    onClick={() => toggleModule(mod.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900/25 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-200 text-left">
                      {mi + 1}. {mod.title}
                    </span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-900 divide-y divide-slate-900/40">
                      {mod.lessons.map((les, li) => (
                        <div key={les.id} className="p-3 space-y-1.5 bg-slate-950/50">
                          <div className="text-[11px] font-bold text-slate-400">
                            Урок {mi + 1}.{li + 1}: {les.title}
                          </div>
                          <div className="space-y-1">
                            {les.steps.map((step) => {
                              const isSelected = selectedPreviewStep?.id === step.id;
                              return (
                                <button
                                  key={step.id}
                                  onClick={() => setSelectedPreviewStep(step)}
                                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                                    isSelected 
                                      ? 'bg-indigo-650/20 border border-indigo-500/35 text-indigo-300' 
                                      : 'bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <Eye size={12} />
                                  <span className="truncate">{step.title}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Viewer */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-sm min-h-[50vh] flex flex-col justify-between">
          {selectedPreviewStep ? (
            <div className="space-y-6">
              <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    Тип шага: {selectedPreviewStep.type}
                  </span>
                  <h2 className="text-base font-bold text-white mt-1">
                    {selectedPreviewStep.title}
                  </h2>
                </div>
              </div>

              {/* Step Content Render */}
              <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                {selectedPreviewStep.type === 'TEXT' && (
                  <div className="prose prose-invert max-w-none text-xs sm:text-sm">
                    <div className="whitespace-pre-wrap">
                      {typeof selectedPreviewStep.content === 'string'
                        ? selectedPreviewStep.content
                        : selectedPreviewStep.content?.text || JSON.stringify(selectedPreviewStep.content)}
                    </div>
                  </div>
                )}

                {/* SINGLE_CHOICE / MULTIPLE_CHOICE */}
                {(selectedPreviewStep.type === 'SINGLE_CHOICE' || selectedPreviewStep.type === 'MULTIPLE_CHOICE') && (() => {
                  const c = selectedPreviewStep.content || {};
                  const question = c.question || 'Без вопроса';
                  const questionImage = c.questionImage;
                  const options: { id?: string; text?: string; isCorrect?: boolean; imageUrl?: string }[] = c.options || [];
                  return (
                    <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/60 space-y-4">
                      <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle size={14} />
                        <span>{selectedPreviewStep.type === 'SINGLE_CHOICE' ? 'Один правильный ответ' : 'Несколько правильных ответов'}</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{question}</h3>
                      {questionImage && (
                        <img src={questionImage} alt="Иллюстрация вопроса" className="max-h-48 rounded-lg border border-slate-800" />
                      )}
                      <div className="space-y-2 pt-1">
                        {options.map((opt, i) => (
                          <div
                            key={opt.id || i}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                              opt.isCorrect
                                ? 'border-emerald-500/40 bg-emerald-500/5'
                                : 'border-slate-800 bg-slate-900/40'
                            }`}
                          >
                            <div className={`mt-0.5 w-5 h-5 rounded-${selectedPreviewStep.type === 'SINGLE_CHOICE' ? 'full' : 'md'} border-2 flex items-center justify-center shrink-0 ${
                              opt.isCorrect
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                                : 'border-slate-700 bg-slate-900'
                            }`}>
                              {opt.isCorrect && <CheckCircle size={12} />}
                            </div>
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${opt.isCorrect ? 'text-emerald-300' : 'text-slate-300'}`}>
                                {opt.text || `Вариант ${i + 1}`}
                              </span>
                              {opt.imageUrl && (
                                <img src={opt.imageUrl} alt={`Вариант ${i + 1}`} className="mt-2 max-h-32 rounded-lg border border-slate-800" />
                              )}
                            </div>
                            {opt.isCorrect && (
                              <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                                Верный
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* CODE */}
                {selectedPreviewStep.type === 'CODE' && (() => {
                  const c = selectedPreviewStep.content || {};
                  const description = c.description || c.question || 'Без описания';
                  const language = c.language || 'pascal';
                  const starterCode = c.starterCode || c.template || '';
                  const testCases: { input?: string; expectedOutput?: string; hidden?: boolean }[] = c.testCases || [];
                  return (
                    <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/60 space-y-4">
                      <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Play size={14} />
                        <span>Задача на программирование · {language.toUpperCase()}</span>
                      </div>
                      <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{description}</div>
                      {starterCode && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Шаблон кода:</span>
                          <pre className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono text-cyan-300 overflow-x-auto max-h-48 leading-relaxed">
                            {starterCode}
                          </pre>
                        </div>
                      )}
                      {testCases.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Тест-кейсы ({testCases.length}):</span>
                          {testCases.map((tc, i) => (
                            <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-900/50 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">Тест #{i + 1}</span>
                                {tc.hidden && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold">Скрытый</span>}
                              </div>
                              {tc.input !== undefined && (
                                <div className="text-xs"><span className="text-slate-500">Ввод:</span> <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{tc.input || '(пустой)'}</code></div>
                              )}
                              <div className="text-xs"><span className="text-slate-500">Ожидаемый вывод:</span> <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded">{tc.expectedOutput}</code></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* MATCHING */}
                {selectedPreviewStep.type === 'MATCHING' && (() => {
                  const c = selectedPreviewStep.content || {};
                  const question = c.question || 'Сопоставьте элементы';
                  const pairs: { left?: string; right?: string }[] = c.pairs || [];
                  return (
                    <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/60 space-y-4">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} />
                        <span>Задание на сопоставление</span>
                      </div>
                      <h3 className="text-base font-bold text-white">{question}</h3>
                      <div className="space-y-2">
                        {pairs.map((pair, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="flex-1 p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs text-slate-200 font-medium text-center">
                              {pair.left}
                            </div>
                            <ArrowLeft size={14} className="text-amber-500 rotate-180 shrink-0" />
                            <div className="flex-1 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 font-medium text-center">
                              {pair.right}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* PARSONS */}
                {selectedPreviewStep.type === 'PARSONS' && (() => {
                  const c = selectedPreviewStep.content || {};
                  const question = c.question || c.description || 'Расставьте строки кода в правильном порядке';
                  const lines: { text?: string; indent?: number }[] = c.lines || c.codeLines || [];
                  return (
                    <div className="p-5 rounded-xl border border-slate-900 bg-slate-950/60 space-y-4">
                      <div className="text-xs font-bold text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText size={14} />
                        <span>Кодовый пазл (Parsons Problem)</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{question}</h3>
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Правильный порядок строк:</span>
                        {lines.map((line, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 w-5 text-right shrink-0">{i + 1}.</span>
                            <pre
                              className="flex-1 text-xs bg-slate-900 px-3 py-1.5 rounded border border-slate-800 font-mono text-fuchsia-300"
                              style={{ paddingLeft: `${12 + (line.indent || 0) * 20}px` }}
                            >
                              {line.text || (typeof line === 'string' ? line : '')}
                            </pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Fallback for unknown types */}
                {!['TEXT', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'CODE', 'MATCHING', 'PARSONS'].includes(selectedPreviewStep.type) && (
                  <div className="p-4 rounded-xl border border-slate-900 bg-slate-950/60 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-indigo-400" />
                      <span>Параметры вопроса / задания</span>
                    </div>
                    <pre className="text-xs bg-slate-900 p-3 rounded-lg border border-slate-850 font-mono text-slate-400 overflow-x-auto max-h-80 leading-relaxed">
                      {JSON.stringify(selectedPreviewStep.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm text-center py-20">
              <BookOpen className="text-slate-800 mb-2 animate-pulse" size={36} />
              <p>Выберите интересующий шаг в левой панели для предпросмотра контента.</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal dialog */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <XCircle className="text-rose-500" size={20} />
                <span>Отклонить публикацию курса</span>
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRejectSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Шаблонные причины:</label>
                <div className="space-y-2">
                  {REJECTION_TEMPLATES.map((tmpl) => (
                    <label
                      key={tmpl.id}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        !isCustomMode && selectedTemplate === tmpl.id
                          ? 'border-indigo-500 bg-indigo-500/5 text-slate-200'
                          : 'border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400'
                      }`}
                      onClick={() => {
                        setIsCustomMode(false);
                        setSelectedTemplate(tmpl.id);
                      }}
                    >
                      <input
                        type="radio"
                        name="rejectionTemplate"
                        checked={!isCustomMode && selectedTemplate === tmpl.id}
                        onChange={() => {}}
                        className="mt-1 accent-indigo-650"
                      />
                      <div>
                        <div className="text-xs font-bold">{tmpl.label}</div>
                        <div className="text-[10px] text-slate-500 mt-1 leading-normal">{tmpl.text}</div>
                      </div>
                    </label>
                  ))}

                  <label
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isCustomMode
                        ? 'border-indigo-500 bg-indigo-500/5 text-slate-200'
                        : 'border-slate-900 bg-slate-950 hover:bg-slate-900/50 text-slate-400'
                    }`}
                    onClick={() => setIsCustomMode(true)}
                  >
                    <input
                      type="radio"
                      name="rejectionTemplate"
                      checked={isCustomMode}
                      onChange={() => {}}
                      className="accent-indigo-650"
                    />
                    <span className="text-xs font-bold">Написать самим (свой вариант)</span>
                  </label>
                </div>
              </div>

              {isCustomMode && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Свой текст причины:</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    rows={4}
                    placeholder="Напишите подробные замечания для автора курса..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-900 bg-slate-950 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none placeholder-slate-700"
                    required
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold transition-all hover:bg-slate-850"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold transition-all hover:from-rose-500 hover:to-red-500 flex items-center justify-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="animate-spin" size={12} />}
                  Отклонить публикацию
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
