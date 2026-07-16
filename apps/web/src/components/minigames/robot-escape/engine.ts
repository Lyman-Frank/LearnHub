// ═══════════════════════════════════════════════════════════
// ДВИЖОК ИГРЫ — Логика выполнения команд (без UI)
// ═══════════════════════════════════════════════════════════
import { Command, Direction, LevelConfig, Position, RobotState, StepResult } from './types';

// ─── Вспомогательные функции ───────────────────────────────

/** Поворот налево (против часовой стрелки) */
function turnLeft(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    right: 'up', up: 'left', left: 'down', down: 'right',
  };
  return map[dir];
}

/** Поворот направо (по часовой стрелке) */
function turnRight(dir: Direction): Direction {
  const map: Record<Direction, Direction> = {
    right: 'down', down: 'left', left: 'up', up: 'right',
  };
  return map[dir];
}

/** Один шаг вперёд без проверки коллизий */
function stepForward(state: RobotState): RobotState {
  const delta: Record<Direction, Position> = {
    right: { x: 1, y: 0 },
    down:  { x: 0, y: 1 },
    left:  { x: -1, y: 0 },
    up:    { x: 0, y: -1 },
  };
  const d = delta[state.direction];
  return { ...state, x: state.x + d.x, y: state.y + d.y };
}

/** Проверяет, является ли позиция препятствием */
function isObstacle(pos: Position, level: LevelConfig): boolean {
  return level.obstacles.some(o => o.x === pos.x && o.y === pos.y);
}

/** Проверяет, выходит ли позиция за границы поля */
function isOutOfBounds(pos: Position, level: LevelConfig): boolean {
  return (
    pos.x < 0 || pos.y < 0 ||
    pos.x >= level.grid_size.cols ||
    pos.y >= level.grid_size.rows
  );
}

/** Проверяет, достиг ли робот финиша */
export function isAtFinish(state: RobotState, level: LevelConfig): boolean {
  return state.x === level.finish_position.x && state.y === level.finish_position.y;
}

// ─── Раскрытие команд ──────────────────────────────────────

/**
 * Преобразует дерево команд (с loop) в плоский список базовых операций.
 * Пример: loop(3, [forward, turnLeft]) → [forward, turnLeft, forward, turnLeft, forward, turnLeft]
 */
export function flattenCommands(commands: Command[]): Command[] {
  const result: Command[] = [];
  for (const cmd of commands) {
    if (cmd.type === 'loop' && cmd.children && cmd.repeat) {
      for (let i = 0; i < cmd.repeat; i++) {
        result.push(...flattenCommands(cmd.children));
      }
    } else {
      result.push(cmd);
    }
  }
  return result;
}

// ─── Асинхронный исполнитель ───────────────────────────────

/**
 * Выполняет плоский список команд шаг за шагом с задержкой.
 * Возвращает AsyncGenerator, который на каждом шаге отдаёт StepResult.
 * UI подписывается на него и анимирует каждое состояние.
 *
 * @param commands  - плоский список команд (после flattenCommands)
 * @param initState - начальное состояние робота
 * @param level     - конфигурация уровня (для проверок)
 * @param delayMs   - задержка между шагами (мс)
 */
export async function* executeCommands(
  commands: Command[],
  initState: RobotState,
  level: LevelConfig,
  delayMs = 450,
): AsyncGenerator<StepResult> {
  let state = { ...initState };
  const collectedCoins: string[] = [];

  for (const cmd of commands) {
    // Задержка для анимации
    await new Promise(r => setTimeout(r, delayMs));

    if (cmd.type === 'forward') {
      const next = stepForward(state);

      // Проверка выхода за границы
      if (isOutOfBounds(next, level)) {
        yield { state, collectedCoins, finished: false, error: '🤖 Робот вышел за пределы поля!' };
        return;
      }

      // Проверка столкновения со стеной
      if (isObstacle(next, level)) {
        yield { state, collectedCoins, finished: false, error: '🧱 Столкновение со стеной!' };
        return;
      }

      state = next;

      // Сбор монеты
      const coinKey = `${state.x}:${state.y}`;
      if (!collectedCoins.includes(coinKey) && level.coins?.some(c => c.x === state.x && c.y === state.y)) {
        collectedCoins.push(coinKey);
      }

    } else if (cmd.type === 'turn_left') {
      state = { ...state, direction: turnLeft(state.direction) };

    } else if (cmd.type === 'turn_right') {
      state = { ...state, direction: turnRight(state.direction) };
    }

    const finished = isAtFinish(state, level);
    yield { state, collectedCoins: [...collectedCoins], finished };

    if (finished) return;
  }

  // Все команды выполнены, но финиш не достигнут
  yield {
    state,
    collectedCoins,
    finished: false,
    error: '🤔 Команды закончились, а финиш не достигнут!',
  };
}
