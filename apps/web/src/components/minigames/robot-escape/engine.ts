// ═══════════════════════════════════════════════════════════
// ДВИЖОК v3.0 — Условия, Функции, Вложенные рекурсивные вызовы
// ═══════════════════════════════════════════════════════════
import { Command, LevelConfig, MovementCommand, Position, RobotState, StepResult, ColorType } from './types';

// ─── Вспомогательные функции движения ────────────────────────

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

function isOutOfBounds(pos: Position, level: LevelConfig): boolean {
  return pos.x < 0 || pos.y < 0 || pos.x >= level.grid_size.cols || pos.y >= level.grid_size.rows;
}

function isObstacle(pos: Position, level: LevelConfig): boolean {
  return level.obstacles.some(o => o.x === pos.x && o.y === pos.y);
}

export function isAtFinish(state: RobotState, level: LevelConfig): boolean {
  return state.x === level.finish_position.x && state.y === level.finish_position.y;
}

/** Возвращает цвет клетки под роботом */
export function getCellColor(pos: Position, level: LevelConfig): ColorType | null {
  const cell = level.colored_cells?.find(c => c.x === pos.x && c.y === pos.y);
  return cell ? cell.color : null;
}

// ─── Контекст выполнения ───────────────────────────────────

interface ExecCtx {
  state: RobotState;
  coins: string[];
  done: boolean;
  f1: Command[];
  f2: Command[];
  callStackDepth: number; // Ограничение глубины вызовов для защиты от вечного цикла
}

const MAX_CALL_STACK = 150;

// ─── Рекурсивный генератор шагов ───────────────────────────

async function* executeInner(
  commands: Command[],
  ctx: ExecCtx,
  level: LevelConfig,
  delayMs: number,
): AsyncGenerator<StepResult> {
  for (const cmd of commands) {
    if (ctx.done) return;

    // Проверка лимита рекурсии
    if (ctx.callStackDepth > MAX_CALL_STACK) {
      yield {
        state: ctx.state,
        collectedCoins: [...ctx.coins],
        finished: false,
        error: '🚨 Превышена глубина вызовов функций (вечный цикл)!',
      };
      ctx.done = true;
      return;
    }

    // 1. Обработка Цикла (loop)
    if (cmd.type === 'loop') {
      const repeat = cmd.repeat ?? 3;
      for (let i = 0; i < repeat; i++) {
        if (ctx.done) return;
        ctx.callStackDepth++;
        yield* executeInner(cmd.children ?? [], ctx, level, delayMs);
        ctx.callStackDepth--;
      }
      continue;
    }

    // 2. Обработка Условия (if_color)
    if (cmd.type === 'if_color') {
      const robotColor = getCellColor(ctx.state, level);
      // Если робот на нужном цвете — выполняем вложенные команды
      if (robotColor && robotColor === cmd.conditionColor) {
        ctx.callStackDepth++;
        yield* executeInner(cmd.children ?? [], ctx, level, delayMs);
        ctx.callStackDepth--;
      }
      continue;
    }

    // 3. Вызов функции F1
    if (cmd.type === 'call_f1') {
      ctx.callStackDepth++;
      yield* executeInner(ctx.f1, ctx, level, delayMs);
      ctx.callStackDepth--;
      continue;
    }

    // 4. Вызов функции F2
    if (cmd.type === 'call_f2') {
      ctx.callStackDepth++;
      yield* executeInner(ctx.f2, ctx, level, delayMs);
      ctx.callStackDepth--;
      continue;
    }

    // 5. Движение
    await new Promise(r => setTimeout(r, delayMs));
    if (ctx.done) return;

    const next = applyMovement(ctx.state, cmd.type as MovementCommand);

    if (isOutOfBounds(next, level)) {
      yield { state: ctx.state, collectedCoins: [...ctx.coins], finished: false, error: '🤖 Робот вышел за пределы поля!' };
      ctx.done = true;
      return;
    }

    if (isObstacle(next, level)) {
      yield { state: ctx.state, collectedCoins: [...ctx.coins], finished: false, error: '🧱 Столкновение со стеной!' };
      ctx.done = true;
      return;
    }

    ctx.state = next;

    // Монеты
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

export async function* executeCommands(
  mainCommands: Command[],
  f1Commands: Command[],
  f2Commands: Command[],
  initState: RobotState,
  level: LevelConfig,
  delayMs = 450,
): AsyncGenerator<StepResult> {
  const ctx: ExecCtx = {
    state: { ...initState },
    coins: [],
    done: false,
    f1: f1Commands,
    f2: f2Commands,
    callStackDepth: 0,
  };

  yield* executeInner(mainCommands, ctx, level, delayMs);

  if (!ctx.done) {
    yield {
      state: ctx.state,
      collectedCoins: ctx.coins,
      finished: false,
      error: '🤔 Команды закончились, а финиш не достигнут!',
    };
  }
}

// ─── Tree Helper Functions (поддержка вложенных деревьев во всех списках) ───

export function findCommand(commands: Command[], id: string): Command | null {
  for (const c of commands) {
    if (c.id === id) return c;
    if ((c.type === 'loop' || c.type === 'if_color') && c.children) {
      const found = findCommand(c.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function removeCommand(commands: Command[], id: string): Command[] {
  return commands
    .filter(c => c.id !== id)
    .map(c =>
      (c.type === 'loop' || c.type === 'if_color') && c.children
        ? { ...c, children: removeCommand(c.children, id) }
        : c
    );
}

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
    (c.type === 'loop' || c.type === 'if_color') && c.children
      ? { ...c, children: insertNear(c.children, targetId, position, newCmd) }
      : c
  );
}

export function insertInContainer(
  commands: Command[],
  containerId: string,
  newCmd: Command,
): Command[] {
  return commands.map(c => {
    if (c.id === containerId && (c.type === 'loop' || c.type === 'if_color')) {
      return { ...c, children: [...(c.children ?? []), newCmd] };
    }
    if ((c.type === 'loop' || c.type === 'if_color') && c.children) {
      return { ...c, children: insertInContainer(c.children, containerId, newCmd) };
    }
    return c;
  });
}

export function moveCommand(
  commands: Command[],
  draggedId: string,
  target: { id: string; position: 'before' | 'after' | 'inside' },
): Command[] {
  const dragged = findCommand(commands, draggedId);
  if (!dragged || dragged.id === target.id) return commands;

  const withoutDragged = removeCommand(commands, draggedId);

  if (target.position === 'inside') {
    return insertInContainer(withoutDragged, target.id, dragged);
  }
  return insertNear(withoutDragged, target.id, target.position, dragged);
}
