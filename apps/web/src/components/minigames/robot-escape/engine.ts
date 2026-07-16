// ═══════════════════════════════════════════════════════════
// ДВИЖОК v2.0 — абсолютное движение, вложенные циклы
// ═══════════════════════════════════════════════════════════
import { Command, LevelConfig, MovementCommand, Position, RobotState, StepResult } from './types';

// ─── Движение ──────────────────────────────────────────────

/** Применяет абсолютную команду движения к состоянию */
function applyMovement(state: RobotState, cmd: MovementCommand): RobotState {
  const delta: Record<MovementCommand, Position> = {
    move_up:    { x: 0,  y: -1 },
    move_down:  { x: 0,  y:  1 },
    move_left:  { x: -1, y:  0 },
    move_right: { x: 1,  y:  0 },
  };
  const d = delta[cmd];
  return { x: state.x + d.x, y: state.y + d.y, lastMove: cmd };
}

/** Выход за пределы поля */
function isOutOfBounds(pos: Position, level: LevelConfig): boolean {
  return pos.x < 0 || pos.y < 0 || pos.x >= level.grid_size.cols || pos.y >= level.grid_size.rows;
}

/** Столкновение со стеной */
function isObstacle(pos: Position, level: LevelConfig): boolean {
  return level.obstacles.some(o => o.x === pos.x && o.y === pos.y);
}

/** Достигнут финиш */
export function isAtFinish(state: RobotState, level: LevelConfig): boolean {
  return state.x === level.finish_position.x && state.y === level.finish_position.y;
}

// ─── Контекст выполнения (разделяемое мутируемое состояние) ──

interface ExecCtx {
  state: RobotState;
  coins: string[];
  done: boolean;  // true если выполнение завершено (успех или ошибка)
}

// ─── Рекурсивный генератор шагов ───────────────────────────

/**
 * Выполняет список команд (включая вложенные loop) с задержкой.
 * Использует общий контекст ctx для передачи состояния между рекурсивными вызовами.
 * Делегирует вложенные команды через yield*, что позволяет обрабатывать loop в loop.
 */
async function* executeInner(
  commands: Command[],
  ctx: ExecCtx,
  level: LevelConfig,
  delayMs: number,
): AsyncGenerator<StepResult> {
  for (const cmd of commands) {
    if (ctx.done) return;

    if (cmd.type === 'loop') {
      // Рекурсивно выполняем дочерние команды N раз
      const repeat = cmd.repeat ?? 3;
      for (let i = 0; i < repeat; i++) {
        if (ctx.done) return;
        yield* executeInner(cmd.children ?? [], ctx, level, delayMs);
      }
      continue;
    }

    // Задержка перед каждым атомарным шагом
    await new Promise(r => setTimeout(r, delayMs));
    if (ctx.done) return;

    const next = applyMovement(ctx.state, cmd.type as MovementCommand);

    // Проверка выхода за границу
    if (isOutOfBounds(next, level)) {
      yield { state: ctx.state, collectedCoins: [...ctx.coins], finished: false, error: '🤖 Робот вышел за пределы поля!' };
      ctx.done = true;
      return;
    }

    // Проверка столкновения со стеной
    if (isObstacle(next, level)) {
      yield { state: ctx.state, collectedCoins: [...ctx.coins], finished: false, error: '🧱 Столкновение со стеной!' };
      ctx.done = true;
      return;
    }

    ctx.state = next;

    // Подбор монеты
    const coinKey = `${next.x}:${next.y}`;
    if (!ctx.coins.includes(coinKey) && level.coins?.some(c => c.x === next.x && c.y === next.y)) {
      ctx.coins.push(coinKey);
    }

    const finished = isAtFinish(ctx.state, level);
    yield { state: { ...ctx.state }, collectedCoins: [...ctx.coins], finished };

    if (finished) {
      ctx.done = true;
      return;
    }
  }
}

/**
 * Главный генератор выполнения. Вызывает рекурсивный executeInner.
 * После завершения всех команд (без финиша) — возвращает сообщение об ошибке.
 */
export async function* executeCommands(
  commands: Command[],
  initState: RobotState,
  level: LevelConfig,
  delayMs = 450,
): AsyncGenerator<StepResult> {
  const ctx: ExecCtx = {
    state: { ...initState },
    coins: [],
    done: false,
  };

  yield* executeInner(commands, ctx, level, delayMs);

  // Если завершили без ошибки И без финиша
  if (!ctx.done) {
    yield {
      state: ctx.state,
      collectedCoins: ctx.coins,
      finished: false,
      error: '🤔 Команды закончились, а финиш не достигнут!',
    };
  }
}

// ─── Вспомогательные функции для работы с деревом команд ───

/** Найти команду в дереве */
export function findCommand(commands: Command[], id: string): Command | null {
  for (const c of commands) {
    if (c.id === id) return c;
    if (c.type === 'loop' && c.children) {
      const found = findCommand(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Удалить команду из дерева по id */
export function removeCommand(commands: Command[], id: string): Command[] {
  return commands
    .filter(c => c.id !== id)
    .map(c =>
      c.type === 'loop' && c.children
        ? { ...c, children: removeCommand(c.children, id) }
        : c
    );
}

/** Вставить команду рядом с targetId (before/after) */
export function insertNear(
  commands: Command[],
  targetId: string,
  position: 'before' | 'after',
  newCmd: Command,
): Command[] {
  const rootIdx = commands.findIndex(c => c.id === targetId);
  if (rootIdx !== -1) {
    const result = [...commands];
    const at = position === 'before' ? rootIdx : rootIdx + 1;
    result.splice(at, 0, newCmd);
    return result;
  }
  return commands.map(c =>
    c.type === 'loop' && c.children
      ? { ...c, children: insertNear(c.children, targetId, position, newCmd) }
      : c
  );
}

/** Добавить команду в loop-контейнер */
export function insertInLoop(
  commands: Command[],
  loopId: string,
  newCmd: Command,
): Command[] {
  return commands.map(c => {
    if (c.id === loopId && c.type === 'loop') {
      return { ...c, children: [...(c.children ?? []), newCmd] };
    }
    if (c.type === 'loop' && c.children) {
      return { ...c, children: insertInLoop(c.children, loopId, newCmd) };
    }
    return c;
  });
}

/** Переместить команду в дереве */
export function moveCommand(
  commands: Command[],
  draggedId: string,
  target: { id: string; position: 'before' | 'after' | 'inside' },
): Command[] {
  const dragged = findCommand(commands, draggedId);
  if (!dragged || dragged.id === target.id) return commands;

  const withoutDragged = removeCommand(commands, draggedId);

  if (target.position === 'inside') {
    return insertInLoop(withoutDragged, target.id, dragged);
  }
  return insertNear(withoutDragged, target.id, target.position, dragged);
}
