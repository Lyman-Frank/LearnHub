// ═══════════════════════════════════════════════════════════
// ДВИЖОК v3.0 — Условия, Функции, Вложенные рекурсивные вызовы
// ═══════════════════════════════════════════════════════════
import { Command, LevelConfig, MovementCommand, Position, RobotState, StepResult, ColorType, ConditionClause, AdvancedCondition } from './types';

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

export function isFreeAhead(state: RobotState, level: LevelConfig): boolean {
  const dir = state.lastMove ?? 'move_right';
  const delta: Record<MovementCommand, Position> = {
    move_up:    { x: 0,  y: -1 },
    move_down:  { x: 0,  y:  1 },
    move_left:  { x: -1, y:  0 },
    move_right: { x: 1,  y:  0 },
  };
  const next: Position = { x: state.x + delta[dir].x, y: state.y + delta[dir].y };
  
  if (isOutOfBounds(next, level)) return false;
  if (isObstacle(next, level)) return false;
  return true;
}

// ─── Контекст выполнения ───────────────────────────────────

interface ExecCtx {
  state: RobotState;
  coins: string[];
  resources: string[];
  done: boolean;
  f1: Command[];
  f2: Command[];
  callStackDepth: number; // Ограничение глубины вызовов для защиты от вечного цикла
}

const MAX_CALL_STACK = 150;

// ─── Оценка условий ────────────────────────────────────────

export function evaluateConditionClause(clause: ConditionClause, ctx: ExecCtx, level: LevelConfig): boolean {
  if (clause.type === 'free_ahead') {
    return isFreeAhead(ctx.state, level);
  }
  if (clause.type === 'color') {
    return getCellColor(ctx.state, level) === clause.value;
  }
  if (clause.type === 'resource_gte') {
    return ctx.resources.length >= Number(clause.value || 0);
  }
  return false;
}

export function evaluateAdvancedCondition(cond: AdvancedCondition, ctx: ExecCtx, level: LevelConfig): boolean {
  if (!cond.clauses || cond.clauses.length === 0) return false;
  
  if (cond.operator === 'AND') {
    return cond.clauses.every(c => evaluateConditionClause(c, ctx, level));
  } else {
    // OR
    return cond.clauses.some(c => evaluateConditionClause(c, ctx, level));
  }
}

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
        collectedResources: [...ctx.resources],
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
      if (robotColor && robotColor === cmd.conditionColor) {
        ctx.callStackDepth++;
        yield* executeInner(cmd.children ?? [], ctx, level, delayMs);
        ctx.callStackDepth--;
      }
      continue;
    }

    // 2a. Обработка сложного условия (if_advanced)
    if (cmd.type === 'if_advanced' && cmd.advancedCondition) {
      if (evaluateAdvancedCondition(cmd.advancedCondition, ctx, level)) {
        ctx.callStackDepth++;
        yield* executeInner(cmd.children ?? [], ctx, level, delayMs);
        ctx.callStackDepth--;
      }
      continue;
    }

    // 2b. Обработка цикла While
    if (cmd.type === 'while' && cmd.whileCondition) {
      let iterationCount = 0;
      while (evaluateConditionClause(cmd.whileCondition, ctx, level)) {
        if (ctx.done) return;
        iterationCount++;
        if (iterationCount > 1000) {
          yield {
            state: ctx.state,
            collectedCoins: [...ctx.coins],
            collectedResources: [...ctx.resources],
            finished: false,
            error: '🚨 Обнаружен бесконечный цикл (более 1000 итераций)!',
          };
          ctx.done = true;
          return;
        }
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
      yield { state: ctx.state, collectedCoins: [...ctx.coins], collectedResources: [...ctx.resources], finished: false, error: '🤖 Робот вышел за пределы поля!' };
      ctx.done = true;
      return;
    }

    if (isObstacle(next, level)) {
      yield { state: ctx.state, collectedCoins: [...ctx.coins], collectedResources: [...ctx.resources], finished: false, error: '🧱 Столкновение со стеной!' };
      ctx.done = true;
      return;
    }

    const isHazard = level.hazards?.some(h => h.x === next.x && h.y === next.y);
    if (isHazard) {
      let hazardError = '💥 Робот попал в ловушку!';
      if (level.theme === 'zombie') hazardError = '🧟 Зомби уничтожил вашего робота!';
      if (level.theme === 'space') hazardError = '☄️ Вашего робота сбил астероид!';
      
      // Выдаем состояние с ошибкой
      ctx.state = next;
      yield { state: ctx.state, collectedCoins: [...ctx.coins], collectedResources: [...ctx.resources], finished: false, error: hazardError };
      ctx.done = true;
      return;
    }

    ctx.state = next;

    // Телепорты
    if (level.teleports && level.teleports.length === 2) {
      const t1 = level.teleports[0];
      const t2 = level.teleports[1];
      if (next.x === t1.x && next.y === t1.y) {
        ctx.state = { ...next, x: t2.x, y: t2.y };
      } else if (next.x === t2.x && next.y === t2.y) {
        ctx.state = { ...next, x: t1.x, y: t1.y };
      }
    }

    // Монеты
    const cellKey = `${next.x}:${next.y}`;
    if (!ctx.coins.includes(cellKey) && level.coins?.some(c => c.x === next.x && c.y === next.y)) {
      ctx.coins.push(cellKey);
    }
    // Ресурсы
    if (!ctx.resources.includes(cellKey) && level.resources?.some(c => c.x === next.x && c.y === next.y)) {
      ctx.resources.push(cellKey);
    }

    const atFinish = isAtFinish(ctx.state, level);
    const hasEnoughResources = !level.required_resources || ctx.resources.length >= level.required_resources;
    const finished = atFinish && hasEnoughResources;
    
    yield { state: { ...ctx.state }, collectedCoins: [...ctx.coins], collectedResources: [...ctx.resources], finished };

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
    resources: [],
    done: false,
    f1: f1Commands,
    f2: f2Commands,
    callStackDepth: 0,
  };

  yield* executeInner(mainCommands, ctx, level, delayMs);

  if (!ctx.done) {
    const atFinish = isAtFinish(ctx.state, level);
    let errorMsg = '🤔 Команды закончились, а финиш не достигнут!';
    
    if (atFinish && level.required_resources && ctx.resources.length < level.required_resources) {
      errorMsg = `🚧 Не хватает ресурсов для финиша! Собрано ${ctx.resources.length}/${level.required_resources}`;
    }

    yield {
      state: ctx.state,
      collectedCoins: ctx.coins,
      collectedResources: ctx.resources,
      finished: false,
      error: errorMsg,
    };
  }
}

// ─── Tree Helper Functions (поддержка вложенных деревьев во всех списках) ───

export function findCommand(commands: Command[], id: string): Command | null {
  for (const c of commands) {
    if (c.id === id) return c;
    if ((c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children) {
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
      (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
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
    (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children
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
    if (c.id === containerId && (c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced')) {
      return { ...c, children: [...(c.children ?? []), newCmd] };
    }
    if ((c.type === 'loop' || c.type === 'if_color' || c.type === 'while' || c.type === 'if_advanced') && c.children) {
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
