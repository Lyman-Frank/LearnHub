'use client';
// ═══════════════════════════════════════════════════════════
// ИГРОВОЕ ПОЛЕ — Визуализация сетки с анимацией
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { LevelConfig, RobotState, Direction } from './types';
import { RobotSprite, WallSprite, FinishSprite, CoinSprite, StartSprite } from './Sprites';

interface GameGridProps {
  level: LevelConfig;
  robotState: RobotState;
  collectedCoins: string[];
  errorCell?: { x: number; y: number } | null;
}

/** Перевод направления в угол поворота CSS */
function directionToDeg(dir: Direction): number {
  return { right: 0, down: 90, left: 180, up: 270 }[dir];
}

const CELL_SIZE = 72; // px на одну клетку

export function GameGrid({ level, robotState, collectedCoins, errorCell }: GameGridProps) {
  const { rows, cols } = level.grid_size;
  const gridW = cols * CELL_SIZE;
  const gridH = rows * CELL_SIZE;

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-violet-500/20 shadow-2xl shadow-violet-900/30"
      style={{ width: gridW, height: gridH, background: 'linear-gradient(135deg, #0f0a1e 0%, #1a103a 100%)' }}
    >
      {/* Сетка фона */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width={gridW} height={gridH}
      >
        <defs>
          <pattern id="gameGrid" width={CELL_SIZE} height={CELL_SIZE} patternUnits="userSpaceOnUse">
            <path d={`M ${CELL_SIZE} 0 L 0 0 0 ${CELL_SIZE}`} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#gameGrid)"/>
      </svg>

      {/* Все клетки */}
      {Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => {
          const isStart = level.start_position.x === col && level.start_position.y === row;
          const isFinish = level.finish_position.x === col && level.finish_position.y === row;
          const isWall = level.obstacles.some(o => o.x === col && o.y === row);
          const isRobot = robotState.x === col && robotState.y === row;
          const coinKey = `${col}:${row}`;
          const hasCoin = level.coins?.some(c => c.x === col && c.y === row);
          const coinCollected = collectedCoins.includes(coinKey);
          const isError = errorCell?.x === col && errorCell?.y === row;

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
              {/* Подсветка финиша */}
              {isFinish && !isRobot && (
                <div className="absolute inset-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 animate-pulse" />
              )}

              {/* Старт */}
              {isStart && !isRobot && (
                <StartSprite size={CELL_SIZE * 0.6} />
              )}

              {/* Финиш */}
              {isFinish && !isRobot && (
                <FinishSprite size={CELL_SIZE * 0.85} />
              )}

              {/* Стена */}
              {isWall && (
                <WallSprite size={CELL_SIZE * 0.88} />
              )}

              {/* Монета */}
              {hasCoin && !isWall && !isFinish && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CoinSprite size={CELL_SIZE * 0.4} collected={coinCollected} />
                </div>
              )}

              {/* Ошибка — мигание красным */}
              {isError && (
                <div className="absolute inset-0 rounded-lg bg-rose-500/40 animate-pulse" />
              )}

              {/* Робот */}
              {isRobot && (
                <div
                  style={{
                    transform: `rotate(${directionToDeg(robotState.direction)}deg)`,
                    transition: 'transform 0.3s ease',
                    zIndex: 10,
                    position: 'relative',
                  }}
                >
                  <RobotSprite size={CELL_SIZE * 0.85} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
