'use client';
// ═══════════════════════════════════════════════════════════
// ИГРОВОЕ ПОЛЕ v3.0 — Цветные ячейки, увеличенный масштаб
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { LevelConfig, RobotState, ColorType } from './types';
import { RobotSprite, WallSprite, FinishSprite, CoinSprite, StartSprite } from './Sprites';

interface GameGridProps {
  level: LevelConfig;
  robotState: RobotState;
  collectedCoins: string[];
  errorCell?: { x: number; y: number } | null;
}

const CELL_SIZE = 90; // px

/** Оформление цветных ячеек на поле */
const COLOR_CELL_CLASSES: Record<ColorType, string> = {
  red:    'bg-rose-500/25 border-2 border-rose-500/70 shadow-lg shadow-rose-500/25 text-rose-200',
  blue:   'bg-sky-500/25 border-2 border-sky-500/70 shadow-lg shadow-sky-500/25 text-sky-200',
  green:  'bg-emerald-500/25 border-2 border-emerald-500/70 shadow-lg shadow-emerald-500/25 text-emerald-200',
  yellow: 'bg-amber-500/25 border-2 border-amber-500/70 shadow-lg shadow-amber-500/25 text-amber-200',
};

export function GameGrid({ level, robotState, collectedCoins, errorCell }: GameGridProps) {
  const { rows, cols } = level.grid_size;
  const gridW = cols * CELL_SIZE;
  const gridH = rows * CELL_SIZE;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-900/30 select-none"
      style={{
        width: gridW,
        height: gridH,
        background: 'linear-gradient(135deg, #0b0718 0%, #130a2a 100%)',
        flexShrink: 0,
      }}
    >
      {/* Сетка фона */}
      <svg className="absolute inset-0 pointer-events-none" width={gridW} height={gridH}>
        <defs>
          <pattern id="gameGrid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gameGrid)"/>
      </svg>

      {/* Клетки */}
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const isStart   = level.start_position.x === col && level.start_position.y === row;
          const isFinish  = level.finish_position.x === col && level.finish_position.y === row;
          const isWall    = level.obstacles.some(o => o.x === col && o.y === row);
          const isRobot   = robotState.x === col && robotState.y === row;
          const coinKey   = `${col}:${row}`;
          const hasCoin   = level.coins?.some(c => c.x === col && c.y === row);
          const coinDone  = collectedCoins.includes(coinKey);
          const isError   = errorCell?.x === col && errorCell?.y === row;

          // Цветная подложка ячейки
          const coloredCell = level.colored_cells?.find(c => c.x === col && c.y === row);

          return (
            <div
              key={`${col}-${row}`}
              className="absolute flex items-center justify-center"
              style={{
                left: col * CELL_SIZE,
                top: row * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              {/* Рендеринг цветной плитки (занимает почти всю ячейку) */}
              {coloredCell && !isWall && (
                <div
                  className={`absolute inset-1.5 rounded-xl flex items-center justify-center transition-all ${
                    COLOR_CELL_CLASSES[coloredCell.color]
                  }`}
                >
                  {/* Фоновое обозначение цвета */}
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-20">
                    {coloredCell.color}
                  </span>
                </div>
              )}

              {/* Финиш-подсветка */}
              {isFinish && !isRobot && (
                <div className="absolute inset-2 rounded-2xl bg-yellow-500/10 border border-yellow-500/35 animate-pulse" />
              )}

              {/* Старт */}
              {isStart && !isRobot && !isWall && (
                <StartSprite size={CELL_SIZE * 0.55} />
              )}

              {/* Финиш */}
              {isFinish && !isRobot && (
                <FinishSprite size={CELL_SIZE * 0.8} />
              )}

              {/* Стена */}
              {isWall && <WallSprite size={CELL_SIZE * 0.88} />}

              {/* Монета */}
              {hasCoin && !isWall && !isFinish && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CoinSprite size={CELL_SIZE * 0.38} collected={coinDone} />
                </div>
              )}

              {/* Ошибка */}
              {isError && (
                <div className="absolute inset-0 rounded-xl bg-rose-500/40 animate-pulse z-20" />
              )}

              {/* Робот */}
              {isRobot && (
                <div className="relative z-10 flex items-center justify-center" style={{ width: CELL_SIZE * 0.9, height: CELL_SIZE * 0.9 }}>
                  <RobotSprite size={CELL_SIZE * 0.82} />
                  {/* Стрелочка направления последнего шага */}
                  {robotState.lastMove && (
                    <div
                      className="absolute text-white text-xs font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      style={{
                        top: robotState.lastMove === 'move_up' ? 2 : robotState.lastMove === 'move_down' ? 'auto' : '50%',
                        bottom: robotState.lastMove === 'move_down' ? 2 : 'auto',
                        left: robotState.lastMove === 'move_left' ? 2 : robotState.lastMove === 'move_right' ? 'auto' : '50%',
                        right: robotState.lastMove === 'move_right' ? 2 : 'auto',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 10,
                      }}
                    >
                      {{ move_up: '▲', move_down: '▼', move_left: '◀', move_right: '▶' }[robotState.lastMove]}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
