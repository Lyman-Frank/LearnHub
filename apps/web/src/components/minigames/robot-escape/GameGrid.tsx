'use client';
// ═══════════════════════════════════════════════════════════
// ИГРОВОЕ ПОЛЕ v2.0 — большие клетки, без поворота робота
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { LevelConfig, RobotState } from './types';
import { RobotSprite, WallSprite, FinishSprite, CoinSprite, StartSprite } from './Sprites';

interface GameGridProps {
  level: LevelConfig;
  robotState: RobotState;
  collectedCoins: string[];
  errorCell?: { x: number; y: number } | null;
}

const CELL_SIZE = 90; // px — увеличено с 72

export function GameGrid({ level, robotState, collectedCoins, errorCell }: GameGridProps) {
  const { rows, cols } = level.grid_size;
  const gridW = cols * CELL_SIZE;
  const gridH = rows * CELL_SIZE;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-900/30"
      style={{
        width: gridW,
        height: gridH,
        background: 'linear-gradient(135deg, #0f0a1e 0%, #1a103a 100%)',
        flexShrink: 0,
      }}
    >
      {/* Сетка фона */}
      <svg className="absolute inset-0 pointer-events-none" width={gridW} height={gridH}>
        <defs>
          <pattern id="gameGrid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="1"/>
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

          return (
            <div
              key={`${col}-${row}`}
              className="absolute flex items-center justify-center"
              style={{ left: col * CELL_SIZE, top: row * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
            >
              {/* Финиш-подсветка */}
              {isFinish && !isRobot && (
                <div className="absolute inset-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-pulse" />
              )}

              {/* Старт */}
              {isStart && !isRobot && !isWall && (
                <StartSprite size={CELL_SIZE * 0.55} />
              )}

              {/* Финиш */}
              {isFinish && !isRobot && (
                <FinishSprite size={CELL_SIZE * 0.82} />
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
                <div className="absolute inset-0 rounded-lg bg-rose-500/40 animate-pulse" />
              )}

              {/* Робот — без поворота! Маленькая стрелка показывает направление последнего шага */}
              {isRobot && (
                <div className="relative z-10 flex items-center justify-center" style={{ width: CELL_SIZE * 0.9, height: CELL_SIZE * 0.9 }}>
                  <RobotSprite size={CELL_SIZE * 0.82} />
                  {/* Маленькая стрелка направления */}
                  {robotState.lastMove && (
                    <div
                      className="absolute text-white text-xs font-black drop-shadow-lg"
                      style={{
                        top: robotState.lastMove === 'move_up' ? 0 : robotState.lastMove === 'move_down' ? 'auto' : '50%',
                        bottom: robotState.lastMove === 'move_down' ? 0 : 'auto',
                        left: robotState.lastMove === 'move_left' ? 0 : robotState.lastMove === 'move_right' ? 'auto' : '50%',
                        right: robotState.lastMove === 'move_right' ? 0 : 'auto',
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
