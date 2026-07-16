// ═══════════════════════════════════════════════════════════
// УРОВНИ ПО УМОЛЧАНИЮ — Игра «Побег Робота»
// ═══════════════════════════════════════════════════════════
import { LevelConfig } from './types';

export const DEFAULT_LEVELS: LevelConfig[] = [
  {
    level_id: 1,
    title: 'Первые шаги',
    description: 'Доведи робота до финиша — двигайся прямо!',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 0, direction: 'right' },
    finish_position: { x: 4, y: 0 },
    obstacles: [],
    coins: [{ x: 2, y: 0 }],
    allowed_commands: ['forward', 'turn_left', 'turn_right'],
  },
  {
    level_id: 2,
    title: 'Поворот',
    description: 'Научись поворачивать! Огибай препятствия.',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 0, direction: 'right' },
    finish_position: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 2 },
    ],
    coins: [{ x: 0, y: 2 }, { x: 4, y: 2 }],
    allowed_commands: ['forward', 'turn_left', 'turn_right'],
  },
  {
    level_id: 3,
    title: 'Лабиринт',
    description: 'Используй цикл, чтобы не писать одно и то же дважды.',
    grid_size: { rows: 6, cols: 6 },
    start_position: { x: 0, y: 0, direction: 'right' },
    finish_position: { x: 5, y: 5 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
      { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 4, y: 4 },
    ],
    coins: [{ x: 1, y: 2 }, { x: 5, y: 2 }, { x: 3, y: 5 }],
    allowed_commands: ['forward', 'turn_left', 'turn_right', 'loop'],
  },
];
