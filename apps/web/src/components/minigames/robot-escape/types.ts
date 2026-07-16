// ═══════════════════════════════════════════════════════════
// ТИПЫ ДАННЫХ — v3.0 (Условия и Функции)
// ═══════════════════════════════════════════════════════════

export type MovementCommand = 'move_up' | 'move_down' | 'move_left' | 'move_right';

export type ColorType = 'red' | 'blue' | 'green' | 'yellow';

export type CommandType = MovementCommand | 'loop' | 'if_color' | 'call_f1' | 'call_f2' | 'while' | 'if_advanced';

export type ThemeType = 'default' | 'zombie' | 'space';

export type ConditionOperator = 'AND' | 'OR';
export type ConditionType = 'color' | 'resource_gte' | 'free_ahead';

export interface ConditionClause {
  type: ConditionType;
  value?: string | number; // Для цвета ('red'), для ресурсов (число >=)
}

export interface AdvancedCondition {
  operator: ConditionOperator;
  clauses: ConditionClause[];
}

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
  theme?: ThemeType;
  resources?: Position[]; // Предметы на карте, которые нужно собирать
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
  conditionColor?: ColorType; // Для простых условий (if_color)
  advancedCondition?: AdvancedCondition; // Для сложных условий (if_advanced)
  whileCondition?: ConditionClause; // Для цикла while
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
  collectedResources: string[]; // Позиции собранных ресурсов ("x:y")
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
