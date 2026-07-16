// ═══════════════════════════════════════════════════════════
// ТИПЫ ДАННЫХ — v2.0 (абсолютное движение)
// ═══════════════════════════════════════════════════════════

/** Базовые команды движения (абсолютные направления) */
export type MovementCommand = 'move_up' | 'move_down' | 'move_left' | 'move_right';

/** Все типы команд */
export type CommandType = MovementCommand | 'loop';

/** Позиция на сетке */
export interface Position {
  x: number; // колонка (0 = левая)
  y: number; // строка  (0 = верхняя)
}

/** Состояние робота (без направления — движение абсолютное) */
export interface RobotState extends Position {
  lastMove?: MovementCommand;
}

/** JSON-конфигурация уровня */
export interface LevelConfig {
  level_id: number;
  title: string;
  description: string;
  grid_size: { rows: number; cols: number };
  start_position: { x: number; y: number; direction?: string };
  finish_position: Position;
  obstacles: Position[];
  coins?: Position[];
  allowed_commands: CommandType[];
}

/** Команда в алгоритме */
export interface Command {
  id: string;
  type: CommandType;
  /** Только для loop: вложенные команды */
  children?: Command[];
  /** Только для loop: количество повторений */
  repeat?: number;
}

/** Результат одного шага */
export interface StepResult {
  state: RobotState;
  collectedCoins: string[];
  error?: string;
  finished: boolean;
}

/** Статус выполнения */
export type RunStatus = 'idle' | 'running' | 'success' | 'error';

/** Карточка игры в каталоге */
export interface GameMeta {
  id: string;
  title: string;
  description: string;
  href: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  available: boolean;
}

/** Статус публикации (Admin) */
export type LevelPublishStatus = 'draft' | 'published' | 'archived';

/** Уровень с метаданными для Admin */
export interface ManagedLevel extends LevelConfig {
  status: LevelPublishStatus;
  createdAt: string;
  updatedAt: string;
}

/** Информация о перетаскивании */
export interface DragInfo {
  source: 'panel' | 'list';
  commandType?: CommandType;  // из панели
  commandId?: string;         // из списка
}

/** Цель сброса (drop target) */
export interface DropTarget {
  id: string;           // id целевой команды (или 'root-end')
  position: 'before' | 'after' | 'inside';
}
