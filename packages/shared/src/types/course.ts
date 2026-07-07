export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum StepType {
  TEXT = 'TEXT',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TEXT_INPUT = 'TEXT_INPUT',
  CODE = 'CODE',
  FLASHCARD = 'FLASHCARD',
  MATCHING = 'MATCHING',
  PARSONS = 'PARSONS',
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  status: CourseStatus;
  xp?: number | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Module {
  id: string;
  title: string;
  position: number;
  xp?: number | null;
  courseId: string;
}

export interface Lesson {
  id: string;
  title: string;
  position: number;
  moduleId: string;
}

export interface Step {
  id: string;
  title: string;
  content: any;
  type: StepType;
  xp?: number | null;
  position: number;
  lessonId: string;
}

export interface SingleChoiceContent {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface MultipleChoiceContent {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
}

export interface TextInputContent {
  question: string;
  correctAnswers: string[];
  caseSensitive: boolean;
}

export interface CodeContent {
  description: string;
  starterCode: string;
  language: string;
  testCases: { input: string; expected: string }[];
}

export interface FlashcardContent {
  cards: { front: string; back: string }[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
}

export interface StepProgress {
  id: string;
  userId: string;
  stepId: string;
  isCompleted: boolean;
  isCorrect: boolean | null;
  answer: any;
  attempts: number;
  completedAt: Date | null;
}
