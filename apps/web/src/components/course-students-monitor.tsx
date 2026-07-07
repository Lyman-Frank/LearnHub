'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Users, Clock, Award, X, CheckCircle2, AlertTriangle, Play, HelpCircle } from 'lucide-react';

interface StudentProgress {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  enrolledAt: string;
  percentage: number;
  xpEarned: number;
  lastActivity: string;
}

interface StepDetail {
  id: string;
  title: string;
  type: string;
  lessonTitle: string;
  moduleTitle: string;
  isCompleted: boolean;
  timeSpent: number;
  answer: string | null;
  isCorrect: boolean | null;
  attempts: number;
  completedAt: string | null;
}

interface DetailedReport {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  totalTimeSpent: number;
  steps: StepDetail[];
}

export function CourseStudentsMonitor({ courseId }: { courseId: string }) {
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentProgress | null>(null);
  const [detailedReport, setDetailedReport] = useState<DetailedReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await api.getCourseStudents(courseId);
      setStudents(data);
    } catch (err) {
      console.error('Ошибка загрузки студентов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const handleViewDetails = async (student: StudentProgress) => {
    setSelectedStudent(student);
    setLoadingReport(true);
    try {
      const report = await api.getStudentDetailedProgress(courseId, student.user.id);
      setDetailedReport(report);
    } catch (err) {
      console.error('Ошибка загрузки детального отчета:', err);
      alert('Не удалось загрузить отчет');
    } finally {
      setLoadingReport(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0 сек';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const parts = [];
    if (h > 0) parts.push(`${h} ч`);
    if (m > 0) parts.push(`${m} мин`);
    if (s > 0 || parts.length === 0) parts.push(`${s} сек`);
    return parts.join(' ');
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
        <Users className="text-violet-400" size={20} />
        <h2 className="text-lg font-bold">Студенты и прогресс</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="animate-spin text-violet-500" size={28} />
          <span className="text-slate-400 text-xs">Загружаем список студентов...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 space-y-2 border border-dashed border-slate-900 rounded-xl bg-slate-950/20">
          <Users className="mx-auto text-slate-700" size={32} />
          <p className="text-slate-400 text-sm">Студентов на этом курсе пока нет</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {students.map((student) => (
            <div
              key={student.user.id}
              onClick={() => handleViewDetails(student)}
              className="p-4 rounded-xl border border-slate-900 bg-slate-950/40 hover:bg-slate-900/30 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0">
                  {student.user.avatarUrl ? (
                    <img src={student.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-violet-400 uppercase">
                      {student.user.firstName[0]}
                      {student.user.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">
                    {student.user.lastName} {student.user.firstName}
                  </h4>
                  <p className="text-xs text-slate-500">{student.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-400">Прогресс</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-violet-600 to-fuchsia-600 h-full"
                        style={{ width: `${student.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-violet-400">{student.percentage}%</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-400">Опыт</span>
                  <div className="text-xs font-bold text-fuchsia-400">{student.xpEarned} XP</div>
                </div>

                <div className="text-right shrink-0 hidden md:block">
                  <span className="text-xs font-semibold text-slate-500">Активность</span>
                  <div className="text-[10px] text-slate-400">
                    {new Date(student.lastActivity).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно с детальным прогрессом */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="max-w-4xl w-full max-h-[85vh] p-6 rounded-2xl border border-slate-900 bg-slate-950 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full border border-violet-500/20 bg-slate-900 flex items-center justify-center overflow-hidden">
                  {selectedStudent.user.avatarUrl ? (
                    <img src={selectedStudent.user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-violet-400 uppercase">
                      {selectedStudent.user.firstName[0]}
                      {selectedStudent.user.lastName[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {selectedStudent.user.lastName} {selectedStudent.user.firstName}
                  </h3>
                  <p className="text-xs text-slate-450">{selectedStudent.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setDetailedReport(null);
                }}
                className="p-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-450 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {loadingReport ? (
                <div className="flex flex-col items-center justify-center py-20 gap-2">
                  <Loader2 className="animate-spin text-violet-500" size={32} />
                  <span className="text-slate-400 text-xs">Загружаем детальный отчет...</span>
                </div>
              ) : detailedReport ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/20 flex items-center gap-3">
                      <Clock className="text-violet-400 shrink-0" size={20} />
                      <div>
                        <div className="text-[10px] text-slate-450 font-semibold uppercase">Время на курсе</div>
                        <div className="text-sm font-bold text-white">
                          {formatTime(detailedReport.totalTimeSpent)}
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/20 flex items-center gap-3">
                      <Award className="text-fuchsia-400 shrink-0" size={20} />
                      <div>
                        <div className="text-[10px] text-slate-450 font-semibold uppercase">Завершено шагов</div>
                        <div className="text-sm font-bold text-white">
                          {detailedReport.steps.filter(s => s.isCompleted).length} из {detailedReport.steps.length}
                        </div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-900 bg-slate-900/20 flex items-center gap-3">
                      <Users className="text-emerald-400 shrink-0" size={20} />
                      <div>
                        <div className="text-[10px] text-slate-450 font-semibold uppercase">Запись на курс</div>
                        <div className="text-sm font-bold text-white">
                          {new Date(selectedStudent.enrolledAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Steps Timeline */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Детализация по шагам</h4>
                    <div className="space-y-2">
                      {detailedReport.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="p-4 rounded-xl border border-slate-900 bg-slate-950/80 space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="text-[10px] text-slate-500 font-medium">
                                Раздел: {step.moduleTitle} · Урок: {step.lessonTitle}
                              </div>
                              <h5 className="font-bold text-sm text-slate-200 mt-0.5">
                                {idx + 1}. {step.title}
                              </h5>
                            </div>
                            <div className="flex items-center gap-2">
                              {step.isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                  <CheckCircle2 size={11} /> Пройден
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-500">
                                  <HelpCircle size={11} /> В процессе
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                <Clock size={11} /> {formatTime(step.timeSpent)}
                              </span>
                              {step.attempts > 0 && (
                                <span className="text-[11px] text-slate-500">
                                  Попыток: {step.attempts}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Student Answers */}
                          {step.answer && (
                            <div className="p-3 rounded-lg border border-slate-900 bg-slate-950 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                  Ответ студента:
                                </span>
                                {step.isCorrect !== null && (
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    step.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                  }`}>
                                    {step.isCorrect ? 'Верно' : 'Неверно'}
                                  </span>
                                )}
                              </div>
                              {step.type === 'CODE' ? (
                                <pre className="text-xs bg-slate-900 p-2.5 rounded border border-slate-850 text-slate-300 font-mono overflow-x-auto max-h-40 leading-relaxed">
                                  {step.answer}
                                </pre>
                              ) : (
                                <div className="text-xs text-slate-300 break-words leading-relaxed font-semibold">
                                  {step.answer}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-900 pt-4 flex justify-end">
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setDetailedReport(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
