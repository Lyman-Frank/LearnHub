// ═══════════════════════════════════════════════════════════
// ТИПЫ ДАННЫХ — Игра «Побег Робота»
// ═══════════════════════════════════════════════════════════

/** Направление, куда смотрит робот */
export type Direction = 'right' | 'down' | 'left' | 'up';

/** Позиция на сетке */
export interface Position {
  x: number; // колонка (0 = левая)
  y: number; // строка  (0 = верхняя)
}

/** Полное состояние робота */
export interface RobotState extends Position {
  direction: Direction;
}

/** JSON-конфигурация одного уровня */
export interface LevelConfig {
  level_id: number;
  title: string;
  description: string;
  grid_size: { rows: number; cols: number };
  start_position: { x: number; y: number; direction: Direction };
  finish_position: Position;
  obstacles: Position[];
  /** Монеты-бонусы (опционально) */
  coins?: Position[];
  /** Разрешённые команды для этого уровня */
  allowed_commands: CommandType[];
}

/** Типы базовых команд */
export type CommandType = 'forward' | 'turn_left' | 'turn_right' | 'loop';

/** Команда в алгоритме пользователя */
export interface Command {
  id: string;        // уникальный ID для DnD и React key
  type: CommandType;
  /** Только для loop: вложенные команды */
  children?: Command[];
  /** Только для loop: количество повторений */
  repeat?: number;
}

/** Результат одного шага выполнения */
export interface StepResult {
  state: RobotState;
  collectedCoins: string[]; // IDs монет
  error?: string;
  finished: boolean;
}

/** Статус выполнения алгоритма */
export type RunStatus = 'idle' | 'running' | 'success' | 'error';

/** Мета-описание карточки игры */
export interface GameMeta {
  id: string;
  title: string;
  description: string;
  href: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  available: boolean;
}

/** Статус публикации уровня (для Admin) */
export type LevelPublishStatus = 'draft' | 'published' | 'archived';

/** Уровень с мета-данными для Admin */
export interface ManagedLevel extends LevelConfig {
  status: LevelPublishStatus;
  createdAt: string;
  updatedAt: string;
}
