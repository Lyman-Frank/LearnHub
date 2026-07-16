// ═══════════════════════════════════════════════════════════
// УРОВНИ v3.0 — 10 Прогрессивных уровней с Условиями и Функциями
// ═══════════════════════════════════════════════════════════
import { LevelConfig } from './types';

export const DEFAULT_LEVELS: LevelConfig[] = [
  {
    level_id: 1,
    title: 'Первые шаги',
    description: 'Двигайся вправо до финиша. Собери монету на пути!',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 2 },
    finish_position: { x: 4, y: 2 },
    obstacles: [],
    coins: [{ x: 2, y: 2 }],
    allowed_commands: ['move_right', 'move_down', 'move_left', 'move_up'],
    tutorial: {
      title: 'Добро пожаловать в Побег Робота!',
      content: 'Твоя цель — провести робота к финишу 🏁 с помощью алгоритма из команд движения. Кликай по кнопкам или перетаскивай их прямо в поле алгоритма справа!'
    }
  },
  {
    level_id: 2,
    title: 'Зигзаг',
    description: 'Обойди стены на пути к цели.',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 4, y: 4 },
    obstacles: [
      { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 },
      { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 3, y: 4 }
    ],
    coins: [{ x: 0, y: 4 }, { x: 4, y: 0 }],
    allowed_commands: ['move_right', 'move_down', 'move_left', 'move_up'],
  },
  {
    level_id: 3,
    title: 'В петле',
    description: 'Используй Цикл, чтобы оптимизировать код.',
    grid_size: { rows: 6, cols: 6 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 5, y: 5 },
    obstacles: [
      { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 2 }, { x: 4, y: 4 }
    ],
    coins: [{ x: 2, y: 2 }, { x: 4, y: 2 }],
    allowed_commands: ['move_right', 'move_down', 'loop'],
    tutorial: {
      title: '🔄 Использование Циклов',
      content: 'Цикл повторяет вложенные в него команды несколько раз. Перетащи нужные движения внутрь блока Цикла и настрой количество повторений с помощью кнопок − и +.'
    }
  },
  {
    level_id: 4,
    title: 'Цветной светофор',
    description: 'Познакомься с условиями по цвету плиток.',
    grid_size: { rows: 5, cols: 5 },
    start_position: { x: 0, y: 2 },
    finish_position: { x: 4, y: 2 },
    obstacles: [
      { x: 2, y: 1 }, { x: 2, y: 3 }
    ],
    colored_cells: [
      { x: 1, y: 2, color: 'red' },
      { x: 3, y: 2, color: 'green' }
    ],
    coins: [{ x: 2, y: 2 }],
    allowed_commands: ['move_right', 'move_down', 'move_up', 'if_color'],
    tutorial: {
      title: '❓ Блоки Условий (Если)',
      content: 'Блок "Если на цвете..." проверяет, стоит ли робот на плитке выбранного цвета (красный, синий, зелёный, жёлтый). Если цвет совпадает, робот выполнит все команды внутри этого блока!'
    }
  },
  {
    level_id: 5,
    title: 'Красный коридор',
    description: 'Используй условие на красном цвете, чтобы обойти препятствия.',
    grid_size: { rows: 5, cols: 6 },
    start_position: { x: 0, y: 2 },
    finish_position: { x: 5, y: 2 },
    obstacles: [
      { x: 2, y: 2 } // Стена по центру пути
    ],
    colored_cells: [
      { x: 1, y: 2, color: 'red' }
    ],
    coins: [{ x: 2, y: 1 }, { x: 2, y: 3 }],
    allowed_commands: ['move_right', 'move_down', 'move_up', 'if_color', 'loop'],
  },
  {
    level_id: 6,
    title: 'Цветной выбор',
    description: 'На синей плитке иди вверх, на жёлтой — вниз.',
    grid_size: { rows: 5, cols: 6 },
    start_position: { x: 0, y: 2 },
    finish_position: { x: 5, y: 2 },
    obstacles: [
      { x: 2, y: 2 }, { x: 4, y: 2 }
    ],
    colored_cells: [
      { x: 1, y: 2, color: 'blue' },
      { x: 3, y: 2, color: 'yellow' }
    ],
    coins: [{ x: 2, y: 1 }, { x: 4, y: 3 }],
    allowed_commands: ['move_right', 'move_down', 'move_up', 'if_color'],
  },
  {
    level_id: 7,
    title: 'Знакомство с Функциями',
    description: 'Упакуй повторяющиеся шаги в функцию F1.',
    grid_size: { rows: 6, cols: 6 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 5, y: 5 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 3 }
    ],
    coins: [{ x: 1, y: 2 }, { x: 4, y: 4 }],
    allowed_commands: ['move_right', 'move_down', 'call_f1'],
    tutorial: {
      title: '📦 Что такое Функции?',
      content: 'Функция (F1) — это вспомогательный список команд. Когда вы вызываете F1 в основном алгоритме, робот выполняет все команды из ячейки функции F1. Вы можете переименовать её, нажав кнопку редактирования имени!'
    }
  },
  {
    level_id: 8,
    title: 'Супер-повторитель',
    description: 'Используй F1 и F2 для структурирования кода.',
    grid_size: { rows: 6, cols: 6 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 5, y: 5 },
    obstacles: [
      { x: 1, y: 1 }, { x: 3, y: 3 }, { x: 4, y: 4 }
    ],
    coins: [{ x: 0, y: 3 }, { x: 3, y: 0 }],
    allowed_commands: ['move_right', 'move_down', 'move_left', 'move_up', 'call_f1', 'call_f2'],
  },
  {
    level_id: 9,
    title: 'Функции и Условия',
    description: 'Используй условия внутри функций для гибкого поведения.',
    grid_size: { rows: 6, cols: 6 },
    start_position: { x: 0, y: 3 },
    finish_position: { x: 5, y: 3 },
    obstacles: [
      { x: 2, y: 3 }, { x: 4, y: 3 }
    ],
    colored_cells: [
      { x: 1, y: 3, color: 'green' },
      { x: 3, y: 3, color: 'red' }
    ],
    coins: [{ x: 2, y: 1 }, { x: 4, y: 5 }],
    allowed_commands: ['move_right', 'move_down', 'move_up', 'if_color', 'call_f1'],
  },
  {
    level_id: 10,
    title: 'Выпускной экзамен',
    description: 'Объедини всё: Движение, Циклы, Условия и Функции!',
    grid_size: { rows: 8, cols: 8 },
    start_position: { x: 0, y: 0 },
    finish_position: { x: 7, y: 7 },
    obstacles: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
      { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 3, y: 4 }, { x: 4, y: 3 }
    ],
    colored_cells: [
      { x: 1, y: 3, color: 'blue' },
      { x: 4, y: 1, color: 'yellow' },
      { x: 6, y: 4, color: 'green' }
    ],
    coins: [{ x: 3, y: 1 }, { x: 6, y: 2 }, { x: 1, y: 6 }],
    allowed_commands: ['move_right', 'move_down', 'move_left', 'move_up', 'loop', 'if_color', 'call_f1', 'call_f2'],
  }
];
