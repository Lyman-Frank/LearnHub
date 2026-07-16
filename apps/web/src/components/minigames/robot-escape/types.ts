// ═══════════════════════════════════════════════════════════
// ТИПЫ ДАННЫХ — v3.0 (Условия и Функции)
// ═══════════════════════════════════════════════════════════

export type MovementCommand = 'move_up' | 'move_down' | 'move_left' | 'move_right';

export type ColorType = 'red' | 'blue' | 'green' | 'yellow';

export type CommandType = MovementCommand | 'loop' | 'if_color' | 'call_f1' | 'call_f2';

export interface Position {
  x: number;
  y: number;
}

export interface RobotState extends Position {
  lastMove?: MovementCommand;
}

export interface ColoredCell extends Position {
  color: ColorType;
}

export interface LevelConfig {
  level_id: number;
  title: string;
  description: string;
  grid_size: { rows: number; cols: number };
  start_position: { x: number; y: number };
  finish_position: Position;
  obstacles: Position[];
  coins?: Position[];
  colored_cells?: ColoredCell[];
  allowed_commands: CommandType[];
  /** Обучающее сообщение, показывающееся при старте уровня */
  tutorial?: {
    title: string;
    content: string;
  };
}

export interface Command {
  id: string;
  type: CommandType;
  children?: Command[];
  repeat?: number;          // Для циклов (loop)
  conditionColor?: ColorType; // Для условий (if_color)
}

/** Определение функции */
export interface FunctionDef {
  id: 'f1' | 'f2';
  name: string;
  color: string;
  commands: Command[];
}

export interface StepResult {
  state: RobotState;
  collectedCoins: string[];
  error?: string;
  finished: boolean;
}

export type RunStatus = 'idle' | 'running' | 'success' | 'error';

export interface GameMeta {
  id: string;
  title: string;
  description: string;
  href: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  available: boolean;
}

export type LevelPublishStatus = 'draft' | 'published' | 'archived';

export interface ManagedLevel extends LevelConfig {
  status: LevelPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DragInfo {
  source: 'panel' | 'list' | 'f1' | 'f2';
  commandType?: CommandType;
  commandId?: string;
  functionId?: 'f1' | 'f2';
}

export interface DropTarget {
  id: string; // id целевой команды, 'root-end', 'f1-end', 'f2-end'
  position: 'before' | 'after' | 'inside';
  functionId?: 'f1' | 'f2'; // если дроп идет внутрь функции
}
