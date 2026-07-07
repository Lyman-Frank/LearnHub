'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FolderPlus, Plus, Edit2, Trash2, Save, FileText, CheckSquare, 
  HelpCircle, Eye, ChevronRight, Settings, ArrowLeft, Loader2, Sparkles, PlusCircle, Trash, ImagePlus, X, Users
} from 'lucide-react';
import { api } from '@/lib/api';
import { CourseStudentsMonitor } from '@/components/course-students-monitor';
import { MediaPickerModal } from '@/components/ui/media-picker-modal';
import { MatchingEditor } from '@/components/matching-editor';
import { ParsonsEditor } from '@/components/parsons-editor';
import { CodeEditorAuthor } from '@/components/code-editor-author';
import { CodeQuiz } from '@/components/code-quiz';

interface Step {
  id: string;
  title: string;
  type: string;
  position: number;
  content: any;
  lessonId: string;
  xp?: number | null;
  isArchived?: boolean;
}

interface Lesson {
  id: string;
  title: string;
  position: number;
  moduleId: string;
  steps: Step[];
  isArchived?: boolean;
  availableAt?: string | null;
  deadlineAt?: string | null;
}

interface Module {
  id: string;
  title: string;
  position: number;
  courseId: string;
  lessons: Lesson[];
  xp?: number | null;
  password?: string | null;
  isArchived?: boolean;
  availableAt?: string | null;
  deadlineAt?: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: string;
  modules: Module[];
  xp?: number | null;
  publishedId?: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CourseBuilderPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'step' | 'students'>('settings');

  // Развёрнутые модули в дереве структуры
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Выбранный шаг для редактирования
  const [selectedStep, setSelectedStep] = useState<Step | null>(null);
  const [stepTitle, setStepTitle] = useState('');
  const [stepType, setStepType] = useState('TEXT');
  const [stepText, setStepText] = useState(''); // Для типа TEXT
  const [quizQuestion, setQuizQuestion] = useState(''); // Для тестов
  const [quizQuestionImage, setQuizQuestionImage] = useState<string | null>(null); // Картинка к вопросу
  const [quizOptions, setQuizOptions] = useState<{ id: string; text: string; isCorrect: boolean; imageUrl?: string }[]>([]);
  const [matchingContent, setMatchingContent] = useState<string | null>(null);
  const [parsonsContent, setParsonsContent] = useState<string | null>(null);
  const [codeContent, setCodeContent] = useState<string | null>(null);
  const [stepXp, setStepXp] = useState<number | null>(null);
  const [stepIsArchived, setStepIsArchived] = useState(false);

  // Медиапикер
  const [mediaPicker, setMediaPicker] = useState<{
    open: boolean;
    target: 'question' | 'option' | 'matching-left' | 'matching-right';
    optionId?: string;
    pairId?: string;
  } | null>(null);

  // Для настроек курса
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseCover, setCourseCover] = useState('');
  const [courseStatus, setCourseStatus] = useState('DRAFT');
  const [courseXp, setCourseXp] = useState<number | null>(null);
  const [coursePassword, setCoursePassword] = useState('');

  // Режим предпросмотра
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const loadCourse = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.getCourse(courseId);
      setCourse(data);
      setCourseTitle(data.title);
      setCourseDesc(data.description || '');
      setCourseCover(data.coverUrl || '');
      setCourseStatus(data.status);
      setCourseXp(data.xp || null);
      setCoursePassword(data.password || '');
    } catch (err) {
      console.error('Ошибка загрузки курса:', err);
      alert('Не удалось загрузить курс.');
      router.push('/author/dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  // Выбор шага для редактирования
  const handleSelectStep = (step: Step) => {
    setSelectedStep(step);
    setStepTitle(step.title);
    setStepType(step.type);
    setStepXp(step.xp || null);
    setStepIsArchived(step.isArchived || false);
    setIsPreviewMode(false);
    setActiveTab('step');

    const content = step.content || {};
    if (step.type === 'TEXT') {
      setStepText(content.body || '');
    } else if (step.type === 'MATCHING') {
      setMatchingContent(typeof content === 'string' ? content : JSON.stringify(content));
    } else if (step.type === 'PARSONS') {
      setParsonsContent(typeof content === 'string' ? content : JSON.stringify(content));
    } else if (step.type === 'CODE') {
      setCodeContent(typeof content === 'string' ? content : JSON.stringify(content));
    } else {
      setQuizQuestion(content.question || '');
      setQuizQuestionImage(content.questionImage || null);
      setQuizOptions(content.options || []);
    }
  };

  // Сохранение настроек курса
  const handleSaveCourseSettings = async () => {
    setSaving(true);
    try {
      await api.updateCourse(courseId, {
        title: courseTitle,
        description: courseDesc,
        coverUrl: courseCover,
        status: courseStatus,
        xp: courseXp,
        password: coursePassword || null,
      });
      await loadCourse(true);
      alert('Настройки курса успешно сохранены!');
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // Сохранение текущего шага
  const handleSaveStep = async () => {
    if (!selectedStep) return;
    setSaving(true);

    let content: any = {};
    if (stepType === 'TEXT') {
      content = { body: stepText };
    } else if (stepType === 'MATCHING') {
      try {
        content = matchingContent ? JSON.parse(matchingContent) : { pairs: [] };
      } catch (e) {
        content = { pairs: [] };
      }
    } else if (stepType === 'PARSONS') {
      try {
        content = parsonsContent ? JSON.parse(parsonsContent) : { description: '', lines: [] };
      } catch (e) {
        content = { description: '', lines: [] };
      }
    } else if (stepType === 'CODE') {
      try {
        content = codeContent ? JSON.parse(codeContent) : { description: '', starterCode: '', language: 'pascal', testCases: [] };
      } catch (e) {
        content = { description: '', starterCode: '', language: 'pascal', testCases: [] };
      }
    } else {
      content = { question: quizQuestion, questionImage: quizQuestionImage, options: quizOptions };
    }

    try {
      await api.updateStep(selectedStep.id, {
        title: stepTitle,
        type: stepType,
        content,
        xp: stepXp,
        isArchived: stepIsArchived,
      });
      await loadCourse(true);
      // Обновляем локальное состояние выбранного шага
      setSelectedStep(prev => prev ? { ...prev, title: stepTitle, type: stepType, content, xp: stepXp, isArchived: stepIsArchived } : null);
      alert('Шаг сохранен!');
    } catch (err: any) {
      alert(err.message || 'Ошибка при сохранении шага');
    } finally {
      setSaving(false);
    }
  };

  // Добавление структуры
  const handleAddModule = async () => {
    const title = prompt('Введите название раздела (модуля):');
    if (!title) return;
    try {
      const position = (course?.modules.length || 0) + 1;
      await api.createModule({ title, position, courseId });
      loadCourse(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddLesson = async (moduleId: string, currentLessonsCount: number) => {
    const title = prompt('Введите название урока:');
    if (!title) return;
    try {
      await api.createLesson({ title, position: currentLessonsCount + 1, moduleId });
      loadCourse(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddStep = async (lessonId: string, currentStepsCount: number) => {
    try {
      const newStep = await api.createStep({
        title: `Новый шаг ${currentStepsCount + 1}`,
        type: 'TEXT',
        position: currentStepsCount + 1,
        lessonId,
        content: { body: '' },
      });
      await loadCourse(true);
      handleSelectStep(newStep);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Переименование структуры и редактирование настроек приватности/архивации
  const handleRenameModule = async (
    id: string,
    currentTitle: string,
    currentXp: number | null | undefined,
    currentPassword: string | null | undefined,
    currentIsArchived: boolean,
    currentAvailableAt: string | null | undefined,
    currentDeadlineAt: string | null | undefined,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newTitle = prompt('Введите новое название раздела (модуля):', currentTitle);
    if (newTitle === null) return;
    
    const xpStr = prompt('Введите бонус за прохождение раздела (XP) или оставьте пустым:', currentXp !== null && currentXp !== undefined ? String(currentXp) : '');
    if (xpStr === null) return;
    const xpVal = xpStr === '' ? null : parseInt(xpStr, 10);

    const passwordVal = prompt('Введите пароль раздела (или оставьте пустым для публичного раздела):', currentPassword || '');
    if (passwordVal === null) return;
    const finalPassword = passwordVal === '' ? null : passwordVal;

    const availVal = prompt(
      'Введите дату публикации раздела (ГГГГ-ММ-ДД ЧЧ:ММ) или оставьте пустым для немедленной публикации:',
      currentAvailableAt ? new Date(currentAvailableAt).toISOString().substring(0, 16).replace('T', ' ') : ''
    );
    if (availVal === null) return;
    let finalAvailable: string | null = null;
    if (availVal.trim() !== '') {
      const parsed = Date.parse(availVal.trim());
      if (isNaN(parsed)) {
        alert('Неверный формат даты! Дата публикации не установлена.');
      } else {
        finalAvailable = new Date(parsed).toISOString();
      }
    }

    const deadVal = prompt(
      'Введите дедлайн сдачи раздела (ГГГГ-ММ-ДД ЧЧ:ММ) или оставьте пустым:',
      currentDeadlineAt ? new Date(currentDeadlineAt).toISOString().substring(0, 16).replace('T', ' ') : ''
    );
    if (deadVal === null) return;
    let finalDeadline: string | null = null;
    if (deadVal.trim() !== '') {
      const parsed = Date.parse(deadVal.trim());
      if (isNaN(parsed)) {
        alert('Неверный формат даты! Дедлайн не установлен.');
      } else {
        finalDeadline = new Date(parsed).toISOString();
      }
    }

    const archiveConfirm = confirm(currentIsArchived ? 'Раздел сейчас заархивирован. Разархивировать его?' : 'Хотите заархивировать этот раздел (скрыть от студентов)?');
    const isArchivedVal = currentIsArchived ? !archiveConfirm : archiveConfirm;

    try {
      await api.updateModule(id, {
        title: newTitle || currentTitle,
        xp: xpVal,
        password: finalPassword,
        isArchived: isArchivedVal,
        availableAt: finalAvailable,
        deadlineAt: finalDeadline,
      });
      await loadCourse(true);
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления раздела');
    }
  };

  const handleRenameLesson = async (
    id: string,
    currentTitle: string,
    currentIsArchived: boolean | undefined,
    currentAvailableAt: string | null | undefined,
    currentDeadlineAt: string | null | undefined,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const newTitle = prompt('Введите новое название урока:', currentTitle);
    if (newTitle === null) return;

    const availVal = prompt(
      'Введите дату публикации урока (ГГГГ-ММ-ДД ЧЧ:ММ) или оставьте пустым для немедленной публикации:',
      currentAvailableAt ? new Date(currentAvailableAt).toISOString().substring(0, 16).replace('T', ' ') : ''
    );
    if (availVal === null) return;
    let finalAvailable: string | null = null;
    if (availVal.trim() !== '') {
      const parsed = Date.parse(availVal.trim());
      if (isNaN(parsed)) {
        alert('Неверный формат даты! Дата публикации не установлена.');
      } else {
        finalAvailable = new Date(parsed).toISOString();
      }
    }

    const deadVal = prompt(
      'Введите дедлайн сдачи урока (ГГГГ-ММ-ДД ЧЧ:ММ) или оставьте пустым:',
      currentDeadlineAt ? new Date(currentDeadlineAt).toISOString().substring(0, 16).replace('T', ' ') : ''
    );
    if (deadVal === null) return;
    let finalDeadline: string | null = null;
    if (deadVal.trim() !== '') {
      const parsed = Date.parse(deadVal.trim());
      if (isNaN(parsed)) {
        alert('Неверный формат даты! Дедлайн не установлен.');
      } else {
        finalDeadline = new Date(parsed).toISOString();
      }
    }

    const archiveConfirm = confirm(currentIsArchived ? 'Урок сейчас заархивирован. Разархивировать его?' : 'Хотите заархивировать этот урок (скрыть от студентов)?');
    const isArchivedVal = currentIsArchived ? !archiveConfirm : archiveConfirm;

    try {
      await api.updateLesson(id, {
        title: newTitle || currentTitle,
        isArchived: isArchivedVal,
        availableAt: finalAvailable,
        deadlineAt: finalDeadline,
      });
      await loadCourse(true);
    } catch (err: any) {
      alert(err.message || 'Ошибка обновления урока');
    }
  };

  // Удаление структуры
  const handleDeleteModule = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Вы действительно хотите удалить этот раздел со всеми его уроками?')) return;
    try {
      await api.deleteModule(id);
      loadCourse();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteLesson = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот урок?')) return;
    try {
      await api.deleteLesson(id);
      loadCourse();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteStep = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить этот шаг?')) return;
    try {
      await api.deleteStep(id);
      if (selectedStep?.id === id) {
        setSelectedStep(null);
        setActiveTab('settings');
      }
      loadCourse();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Управление вариантами ответов в тестах
  const handleAddQuizOption = () => {
    const id = Math.random().toString(36).substring(2, 9);
    setQuizOptions([...quizOptions, { id, text: '', isCorrect: false }]);
  };

  const handleUpdateQuizOption = (id: string, field: 'text' | 'isCorrect' | 'imageUrl', value: any) => {
    setQuizOptions(
      quizOptions.map((opt) => {
        if (opt.id !== id) return opt;
        if (field === 'isCorrect' && stepType === 'SINGLE_CHOICE') {
          // Если один ответ, сбрасываем остальные
          return { ...opt, isCorrect: value };
        }
        return { ...opt, [field]: value };
      }).map((opt) => {
        if (stepType === 'SINGLE_CHOICE' && field === 'isCorrect' && opt.id !== id && value === true) {
          return { ...opt, isCorrect: false };
        }
        return opt;
      })
    );
  };

  const handleRemoveQuizOption = (id: string) => {
    setQuizOptions(quizOptions.filter((opt) => opt.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-fuchsia-500" size={48} />
        <span className="text-slate-400 text-sm">Загрузка структуры конструктора...</span>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {/* Навигация */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-3">
          <Link 
            href="/author/dashboard" 
            className="p-2 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white transition-all duration-200"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-white line-clamp-1">{course?.title}</h1>
            <p className="text-xs text-slate-450">Конструктор образовательного контента</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedStep(null);
              setActiveTab('settings');
            }}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'settings' 
                ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400' 
                : 'border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Settings size={15} />
            <span>Настройки курса</span>
          </button>
          <button
            onClick={() => {
              setSelectedStep(null);
              setActiveTab('students');
            }}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
              activeTab === 'students' 
                ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400' 
                : 'border-slate-900 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Users size={15} />
            <span>Студенты и прогресс</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Левая панель: дерево структуры */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Структура курса</h3>
            <button 
              onClick={handleAddModule}
              className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
            >
              <FolderPlus size={14} />
              <span>Раздел</span>
            </button>
          </div>

          {course?.modules.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Курс пуст. Добавьте ваш первый раздел.
            </div>
          ) : (
            <div className="space-y-2">
              {course?.modules.map((mod) => {
                const isExpanded = expandedModules.has(mod.id);
                return (
                  <div key={mod.id} className="rounded-xl border border-slate-900 bg-slate-950/80 overflow-hidden">
                    {/* Заголовок модуля — кликабельный для раскрытия */}
                    <div className="flex items-center justify-between px-3 py-2.5 group">
                      <button
                        onClick={() => toggleModule(mod.id)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
                        <ChevronRight
                          size={14}
                          className={`shrink-0 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                        <span className={`font-bold text-sm truncate flex items-center gap-1.5 ${mod.isArchived ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          <span>{mod.title}</span>
                          {mod.isArchived && (
                            <span className="text-[8px] px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-500 rounded shrink-0">Архив</span>
                          )}
                          {mod.password && (
                            <span className="text-amber-400 text-xs shrink-0" title="Приватный раздел (пароль)">🔒</span>
                          )}
                        </span>
                        <span className="ml-1 text-[10px] text-slate-500 shrink-0">
                          {mod.lessons.length > 0 ? `${mod.lessons.length} ур.` : 'пусто'}
                        </span>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleAddLesson(mod.id, mod.lessons.length)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded"
                          title="Добавить урок"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={(e) => handleRenameModule(mod.id, mod.title, mod.xp, mod.password, mod.isArchived || false, mod.availableAt, mod.deadlineAt, e)}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-900 rounded"
                          title="Редактировать раздел"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteModule(mod.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded"
                          title="Удалить раздел"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Раскрытый список уроков */}
                    {isExpanded && (
                      <div className="border-t border-slate-900 pl-5 pr-2 py-2 space-y-2">
                        {mod.lessons.length === 0 ? (
                          <p className="text-[10px] text-slate-600 italic py-1">Уроков нет. Нажмите + чтобы добавить.</p>
                        ) : (
                          mod.lessons.map((les) => (
                            <div key={les.id} className="space-y-1">
                              <div className="flex items-center justify-between group">
                                <span className={`text-xs font-semibold truncate flex items-center gap-1.5 ${les.isArchived ? 'text-slate-550 line-through' : 'text-slate-400'}`}>
                                  <span>📄 {les.title}</span>
                                  {les.isArchived && (
                                    <span className="text-[8px] px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-500 rounded shrink-0">Архив</span>
                                  )}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <button
                                    onClick={() => handleAddStep(les.id, les.steps.length)}
                                    className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-900 rounded"
                                    title="Добавить шаг"
                                  >
                                    <Plus size={10} />
                                  </button>
                                  <button
                                    onClick={(e) => handleRenameLesson(les.id, les.title, les.isArchived || false, les.availableAt, les.deadlineAt, e)}
                                    className="p-0.5 text-slate-500 hover:text-white hover:bg-slate-900 rounded"
                                    title="Редактировать урок"
                                  >
                                    <Edit2 size={10} />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteLesson(les.id, e)}
                                    className="p-0.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded"
                                    title="Удалить урок"
                                  >
                                    <Trash size={10} />
                                  </button>
                                </div>
                              </div>

                              {les.steps.length > 0 && (
                                <div className="pl-3 space-y-0.5">
                                  {les.steps.map((st) => (
                                    <button
                                      key={st.id}
                                      onClick={() => handleSelectStep(st)}
                                      className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium flex items-center justify-between group transition-all duration-150 ${
                                        selectedStep?.id === st.id
                                          ? 'bg-fuchsia-600/10 text-fuchsia-400 font-bold'
                                          : 'text-slate-500 hover:text-slate-355 hover:bg-slate-900/30'
                                      }`}
                                    >
                                      <span className={`truncate flex items-center gap-1.5 ${st.isArchived ? 'text-slate-550 line-through' : ''}`}>
                                        <span>{st.type === 'TEXT' ? '📖 ' : '❓ '}</span>
                                        <span className="truncate">{st.title}</span>
                                        {st.isArchived && (
                                          <span className="text-[8px] px-1 py-0.2 bg-slate-900 border border-slate-800 text-slate-500 rounded shrink-0">Архив</span>
                                        )}
                                      </span>
                                      <Trash2
                                        size={10}
                                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity duration-150 shrink-0"
                                        onClick={(e) => handleDeleteStep(st.id, e)}
                                      />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Правая панель: Рабочая область редактора */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur-md">
          {activeTab === 'students' && (
            <CourseStudentsMonitor courseId={courseId} />
          )}

          {activeTab === 'settings' ? (
            /* НАСТРОЙКИ КУРСА */
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                <Settings size={18} className="text-fuchsia-400" />
                <span>Настройки курса</span>
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Название курса</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Описание</label>
                  <textarea
                    value={courseDesc}
                    onChange={(e) => setCourseDesc(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">URL обложки</label>
                  <input
                    type="text"
                    value={courseCover}
                    onChange={(e) => setCourseCover(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Бонусные очки опыта (XP) за прохождение курса</label>
                  <input
                    type="number"
                    value={courseXp || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCourseXp(val === '' ? null : parseInt(val, 10));
                    }}
                    placeholder="По умолчанию (0 XP)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all placeholder-slate-700"
                  />
                </div>

                {/* Статус публикации — преподаватель может только отправить на проверку или вернуть в черновик */}
                <div className="p-4 rounded-xl border border-slate-900 bg-slate-900/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Статус публикации</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      courseStatus === 'PUBLISHED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : courseStatus === 'PENDING_REVIEW'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {courseStatus === 'PUBLISHED' ? 'Опубликован'
                        : courseStatus === 'PENDING_REVIEW' ? 'На проверке у администратора'
                        : courseStatus === 'ARCHIVED' ? 'Архив'
                        : 'Черновик'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    После отправки на проверку администратор рассмотрит курс и примет решение об одобрении или отклонении.
                  </p>
                  {courseStatus === 'DRAFT' && course?.publishedId && (
                    <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs font-bold leading-relaxed">
                      ⚠️ В черновике есть неопубликованные изменения! Отправьте курс на проверку для обновления версии для студентов.
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {courseStatus === 'DRAFT' || courseStatus === 'ARCHIVED' ? (
                      <button
                        type="button"
                        onClick={() => setCourseStatus('PENDING_REVIEW')}
                        className="px-4 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-all duration-200"
                      >
                        Отправить на проверку →
                      </button>
                    ) : courseStatus === 'PENDING_REVIEW' ? (
                      <button
                        type="button"
                        onClick={() => setCourseStatus('DRAFT')}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all duration-200"
                      >
                        Отозвать в черновик
                      </button>
                    ) : (
                      <p className="text-xs text-emerald-400 font-medium">✅ Курс опубликован администратором</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveCourseSettings}
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-fuchsia-600/20"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    <span>Сохранить настройки</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* РЕДАКТОР ШАГА */
            selectedStep && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    {stepType === 'TEXT' ? <FileText size={18} className="text-violet-400" /> : <HelpCircle size={18} className="text-fuchsia-400" />}
                    <span>Редактор шага</span>
                  </h2>
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-3 py-1.5 rounded-lg border border-slate-900 bg-slate-950 hover:bg-slate-900 text-xs font-medium text-slate-300 flex items-center gap-1"
                  >
                    <Eye size={14} />
                    <span>{isPreviewMode ? 'Конструктор' : 'Предпросмотр'}</span>
                  </button>
                </div>

                {isPreviewMode ? (
                  /* РЕЖИМ ПРЕДПРОСМОТРА */
                  <div className="space-y-6 p-6 rounded-2xl border border-slate-900 bg-slate-950/80">
                    <h3 className="text-xl font-bold text-white">{stepTitle}</h3>
                    
                    {stepType === 'TEXT' ? (
                      <div className="prose prose-invert text-slate-300 max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                        {stepText || <p className="italic text-slate-500">Контент шага пуст.</p>}
                      </div>
                    ) : stepType === 'MATCHING' ? (
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Предпросмотр: Сопоставление пар</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500">Левая колонка (фиксированная)</p>
                            {(() => {
                              try {
                                const parsed = matchingContent ? JSON.parse(matchingContent) : { pairs: [] };
                                return parsed.pairs?.map((p: any, idx: number) => (
                                  <div key={p.id || idx} className="p-3 rounded-lg border border-slate-900 bg-slate-950 text-xs text-slate-300">
                                    {p.left || 'Пусто'}
                                  </div>
                                ));
                              } catch {
                                return <p className="text-xs text-rose-400">Ошибка парсинга пар</p>;
                              }
                            })()}
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-500">Правая колонка (будет перемешана)</p>
                            {(() => {
                              try {
                                const parsed = matchingContent ? JSON.parse(matchingContent) : { pairs: [] };
                                return parsed.pairs?.map((p: any, idx: number) => (
                                  <div key={p.id || idx} className="p-3 rounded-lg border border-slate-900 bg-slate-950 text-xs text-slate-300">
                                    {p.right || 'Пусто'}
                                  </div>
                                ));
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        </div>
                      </div>
                    ) : stepType === 'PARSONS' ? (
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Предпросмотр: Кодовый пазл</p>
                        {(() => {
                          try {
                            const parsed = parsonsContent ? JSON.parse(parsonsContent) : { description: '', lines: [] };
                            return (
                              <div className="space-y-3">
                                <p className="text-sm text-slate-200">{parsed.description || 'Условие отсутствует'}</p>
                                <div className="p-4 rounded-xl border border-slate-900 bg-slate-950 font-mono text-sm space-y-1 select-none">
                                  {parsed.lines?.map((l: any, idx: number) => (
                                    <div key={l.id || idx} className="text-emerald-400" style={{ paddingLeft: `${l.indent * 16}px` }}>
                                      {l.code}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          } catch {
                            return <p className="text-xs text-rose-400">Ошибка парсинга кодовых строк</p>;
                          }
                        })()}
                      </div>
                    ) : stepType === 'CODE' ? (
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Предпросмотр: Задача по программированию</p>
                        {(() => {
                          try {
                            const parsed = codeContent ? JSON.parse(codeContent) : { description: '', starterCode: '', language: 'pascal', testCases: [] };
                            return (
                              <CodeQuiz
                                stepId={selectedStep?.id || ''}
                                content={parsed}
                                submitted={false}
                                onSubmit={async (cd) => {
                                  alert(`Вы отправляете код:\n${cd}`);
                                  return { testCaseResults: parsed.testCases.map(() => ({ passed: true })), xpEarned: 50 };
                                }}
                                onReset={() => {}}
                              />
                            );
                          } catch {
                            return <p className="text-xs text-rose-400">Ошибка парсинга условий задачи</p>;
                          }
                        })()}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-semibold text-slate-200">{quizQuestion || 'Вопрос отсутствует?'}</p>
                        {quizQuestionImage && (
                          <img
                            src={quizQuestionImage}
                            alt="Иллюстрация к вопросу"
                            className="w-full max-h-48 object-contain rounded-xl border border-slate-900"
                          />
                        )}
                        <div className="space-y-2">
                          {quizOptions.map((opt) => (
                            <div key={opt.id} className="p-3.5 rounded-xl border border-slate-900 bg-slate-950 hover:bg-slate-900/40 flex items-center gap-3 text-sm cursor-pointer transition-colors">
                              <input
                                type={stepType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                name="preview-quiz"
                                className="accent-fuchsia-500"
                                readOnly
                              />
                              {opt.imageUrl && (
                                <img src={opt.imageUrl} alt="" className="w-12 h-8 object-cover rounded-lg border border-slate-800" />
                              )}
                              <span className="text-slate-300">{opt.text || 'Вариант ответа...'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* РЕЖИМ КОНСТРУКТОРА */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Название шага</label>
                      <input
                        type="text"
                        value={stepTitle}
                        onChange={(e) => setStepTitle(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all"
                      />
                    </div>

                    {stepType !== 'CODE' && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Очки опыта (XP) за шаг</label>
                        <input
                          type="number"
                          value={stepXp || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStepXp(val === '' ? null : parseInt(val, 10));
                          }}
                          placeholder="По умолчанию (на основе типа)"
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-fuchsia-500 transition-all placeholder-slate-700"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Тип шага</label>
                      <select
                        value={stepType}
                        onChange={(e) => {
                          setStepType(e.target.value);
                          if (e.target.value !== 'TEXT' && e.target.value !== 'MATCHING' && e.target.value !== 'PARSONS' && e.target.value !== 'CODE' && quizOptions.length === 0) {
                            setQuizOptions([
                              { id: '1', text: 'Вариант 1', isCorrect: true },
                              { id: '2', text: 'Вариант 2', isCorrect: false }
                            ]);
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all"
                      >
                        <option value="TEXT">Теория (Текст)</option>
                        <option value="SINGLE_CHOICE">Тест (Один выбор)</option>
                        <option value="MULTIPLE_CHOICE">Тест (Множественный выбор)</option>
                        <option value="MATCHING">Сопоставление (Matching Puzzle)</option>
                        <option value="PARSONS">Кодовый пазл (Parsons Problems)</option>
                        <option value="CODE">Задача по программированию (Code Sandbox)</option>
                      </select>
                    </div>

                    {stepType === 'TEXT' ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Текст теории (Markdown / HTML)</label>
                        <textarea
                          value={stepText}
                          onChange={(e) => setStepText(e.target.value)}
                          rows={8}
                          placeholder="Введите теоретический материал..."
                          className="w-full px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all font-mono"
                        />
                      </div>
                    ) : stepType === 'MATCHING' ? (
                      <MatchingEditor
                        content={matchingContent}
                        onChange={(newContent) => setMatchingContent(newContent)}
                        onPickImage={(pairId, side) => setMediaPicker({
                          open: true,
                          target: side === 'left' ? 'matching-left' : 'matching-right',
                          pairId
                        })}
                      />
                    ) : stepType === 'PARSONS' ? (
                      <ParsonsEditor
                        content={parsonsContent}
                        onChange={(newContent) => setParsonsContent(newContent)}
                      />
                    ) : stepType === 'CODE' ? (
                      <CodeEditorAuthor
                        content={codeContent}
                        onChange={(newContent) => setCodeContent(newContent)}
                        xp={stepXp}
                        onXpChange={(newXp) => setStepXp(newXp)}
                      />
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Вопрос</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={quizQuestion}
                              onChange={(e) => setQuizQuestion(e.target.value)}
                              placeholder="Введите вопрос..."
                              className="flex-1 px-4 py-3 rounded-xl border border-slate-900 bg-slate-950 text-white text-sm focus:outline-none focus:border-fuchsia-500 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setMediaPicker({ open: true, target: 'question' })}
                              title="Добавить картинку к вопросу"
                              className="px-3 py-2 rounded-xl border border-violet-700/40 bg-violet-900/20 hover:bg-violet-800/30 text-violet-400 hover:text-violet-300 transition-all"
                            >
                              <ImagePlus size={16} />
                            </button>
                          </div>
                          {quizQuestionImage && (
                            <div className="relative mt-2">
                              <img
                                src={quizQuestionImage}
                                alt="Картинка вопроса"
                                className="w-full max-h-40 object-contain rounded-xl border border-violet-900/30"
                              />
                              <button
                                type="button"
                                onClick={() => setQuizQuestionImage(null)}
                                className="absolute top-2 right-2 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-rose-400"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-450 uppercase tracking-wider">Варианты ответов</label>
                            <button
                              type="button"
                              onClick={handleAddQuizOption}
                              className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1"
                            >
                              <PlusCircle size={14} />
                              <span>Добавить вариант</span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            {quizOptions.map((opt) => (
                              <div key={opt.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-900 bg-slate-950/80">
                                <input
                                  type={stepType === 'SINGLE_CHOICE' ? 'radio' : 'checkbox'}
                                  name="quiz-correct"
                                  checked={opt.isCorrect}
                                  onChange={(e) => handleUpdateQuizOption(opt.id, 'isCorrect', e.target.checked)}
                                  className="accent-fuchsia-500 mt-3"
                                  title="Правильный ответ"
                                />
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    value={opt.text}
                                    onChange={(e) => handleUpdateQuizOption(opt.id, 'text', e.target.value)}
                                    placeholder="Текст ответа"
                                    className="w-full bg-transparent text-white text-sm focus:outline-none"
                                  />
                                  {opt.imageUrl && (
                                    <div className="relative w-full h-24 flex items-center justify-center bg-slate-950/40 rounded-xl border border-violet-900/30 overflow-hidden">
                                      <img
                                        src={opt.imageUrl}
                                        alt=""
                                        className="max-w-full max-h-full object-contain p-1"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateQuizOption(opt.id, 'imageUrl', '')}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-rose-400 z-10"
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setMediaPicker({ open: true, target: 'option', optionId: opt.id })}
                                    title="Добавить картинку к ответу"
                                    className="p-1.5 text-violet-500 hover:text-violet-300 hover:bg-violet-900/20 rounded-lg transition-all"
                                  >
                                    <ImagePlus size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuizOption(opt.id)}
                                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSaveStep}
                        disabled={saving}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-fuchsia-600/20"
                      >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>Сохранить шаг</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>

    {/* МЕДИАПИКЕР */}
    {mediaPicker?.open && (
      <MediaPickerModal
        title={
          mediaPicker.target === 'question' 
            ? 'Картинка к вопросу' 
            : mediaPicker.target === 'option' 
            ? 'Картинка к ответу'
            : mediaPicker.target === 'matching-left'
            ? 'Картинка левого элемента'
            : 'Картинка правого элемента'
        }
        onClose={() => setMediaPicker(null)}
        onSelect={(url) => {
          if (mediaPicker.target === 'question') {
            setQuizQuestionImage(url);
          } else if (mediaPicker.target === 'option' && mediaPicker.optionId) {
            setQuizOptions((prev) =>
              prev.map((opt) =>
                opt.id === mediaPicker.optionId ? { ...opt, imageUrl: url } : opt
              )
            );
          } else if ((mediaPicker.target === 'matching-left' || mediaPicker.target === 'matching-right') && mediaPicker.pairId) {
            try {
              const currentData = matchingContent ? JSON.parse(matchingContent) : { pairs: [] };
              const updatedPairs = currentData.pairs.map((p: any) => {
                if (p.id === mediaPicker.pairId) {
                  return mediaPicker.target === 'matching-left'
                    ? { ...p, leftImageUrl: url }
                    : { ...p, rightImageUrl: url };
                }
                return p;
              });
              setMatchingContent(JSON.stringify({ pairs: updatedPairs }));
            } catch (e) {
              console.error('Ошибка добавления изображения к сопоставлению', e);
            }
          }
          setMediaPicker(null);
        }}
      />
    )}
    </>
  );
}
