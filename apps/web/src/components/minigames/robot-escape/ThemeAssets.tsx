'use client';
// ═══════════════════════════════════════════════════════════
// СИСТЕМА ТЕМ v1.0 — Поддержка разных визуальных стилей
// ═══════════════════════════════════════════════════════════
import React from 'react';
import { ThemeType } from './types';
import { RobotSprite as DefaultRobot, WallSprite as DefaultWall, FinishSprite as DefaultFinish, CoinSprite as DefaultCoin, StartSprite as DefaultStart } from './Sprites';

export interface SpriteProps {
  size?: number;
  collected?: boolean;
}

// ─── ZOMBIE THEME ──────────────────────────────────────────
export function ZombieRobot({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .z-eye { animation: blink 3s infinite; }
        .z-arm-r { animation: zArm 2s ease-in-out infinite; transform-origin: 28px 20px; }
        @keyframes zArm {
          0%, 100% { transform: rotate(-20deg); } 50% { transform: rotate(10deg); }
        }
      `}</style>
      {/* Тело (Ржавый грязный цвет) */}
      <rect x="12" y="16" width="16" height="14" rx="4" fill="#4a5568"/>
      <rect x="12" y="16" width="16" height="14" rx="4" fill="#653c28" opacity="0.4"/>
      {/* Голова */}
      <rect x="11" y="4" width="18" height="13" rx="4" fill="#4a5568"/>
      {/* Глаза: один выключен, другой моргает */}
      <circle cx="16" cy="10" r="3" fill="#1a202c"/>
      <circle cx="24" cy="10" r="3" fill="#e53e3e" className="z-eye"/>
      {/* Руки */}
      <rect x="7" y="18" width="4" height="8" rx="2" fill="#2d3748"/>
      <g className="z-arm-r">
        <rect x="29" y="18" width="4" height="10" rx="2" fill="#2d3748"/>
        {/* Кровь/Грязь на руке */}
        <circle cx="31" cy="26" r="2" fill="#742a2a"/>
      </g>
      {/* Ноги */}
      <rect x="14" y="30" width="4" height="8" rx="2" fill="#1a202c"/>
      <rect x="22" y="30" width="4" height="8" rx="2" fill="#1a202c"/>
      {/* Дефекты */}
      <line x1="13" y1="20" x2="19" y2="25" stroke="#1a202c" strokeWidth="1"/>
      <circle cx="15" cy="6" r="1" fill="#1a202c"/>
    </svg>
  );
}

export function ZombieWall({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Разрушенный забор из колючей проволоки */}
      <rect x="6" y="2" width="4" height="36" fill="#718096"/>
      <rect x="30" y="2" width="4" height="36" fill="#718096"/>
      {/* Перекладины */}
      <line x1="4" y1="10" x2="36" y2="15" stroke="#4a5568" strokeWidth="2"/>
      <line x1="4" y1="25" x2="20" y2="28" stroke="#4a5568" strokeWidth="2"/>
      <line x1="25" y1="30" x2="36" y2="28" stroke="#4a5568" strokeWidth="2"/>
      {/* Колючки */}
      <path d="M 12 12 L 10 9 M 14 12 L 16 9" stroke="#cbd5e0" strokeWidth="1"/>
      <path d="M 28 14 L 26 11 M 30 14 L 32 11" stroke="#cbd5e0" strokeWidth="1"/>
      {/* Пятна крови на земле */}
      <circle cx="20" cy="34" r="3" fill="#742a2a" opacity="0.6"/>
      <circle cx="24" cy="36" r="1.5" fill="#742a2a" opacity="0.5"/>
    </svg>
  );
}

export function ZombieFinish({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .b-light { animation: bLight 2s infinite; }
        @keyframes bLight { 0%, 100% { fill: #f56565; } 50% { fill: #9b2c2c; } }
      `}</style>
      {/* Бункер */}
      <path d="M 4 36 Q 20 10 36 36 Z" fill="#4a5568"/>
      <path d="M 6 36 Q 20 14 34 36 Z" fill="#2d3748"/>
      {/* Дверь */}
      <rect x="15" y="26" width="10" height="10" fill="#1a202c"/>
      <rect x="23" y="30" width="2" height="2" fill="#718096"/>
      {/* Сигнальная лампа */}
      <circle cx="20" cy="18" r="3" fill="#c53030"/>
      <circle cx="20" cy="18" r="1.5" className="b-light"/>
    </svg>
  );
}

export function ZombieResource({ size = 24, collected }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: collected ? 0.2 : 1 }}>
      {/* Аптечка */}
      <rect x="4" y="6" width="16" height="12" rx="2" fill="#f56565"/>
      <rect x="10" y="4" width="4" height="2" fill="#c53030"/>
      {/* Бест крест */}
      <rect x="11" y="9" width="2" height="6" fill="white"/>
      <rect x="9" y="11" width="6" height="2" fill="white"/>
    </svg>
  );
}

export function ZombieHazard({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .zh-head { animation: zhHead 2s infinite alternate; transform-origin: 20px 20px; }
        @keyframes zhHead { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
      `}</style>
      <g className="zh-head">
        {/* Голова зомби */}
        <path d="M 10 20 Q 10 5 20 5 Q 30 5 30 20 L 28 35 L 12 35 Z" fill="#4ade80" />
        <path d="M 10 20 Q 10 5 20 5 Q 30 5 30 20 L 28 35 L 12 35 Z" fill="#064e3b" opacity="0.4" />
        {/* Глаза (пустые/красные) */}
        <circle cx="15" cy="18" r="3" fill="#000" />
        <circle cx="25" cy="18" r="3" fill="#000" />
        <circle cx="15" cy="18" r="1" fill="#ef4444" />
        {/* Рот */}
        <path d="M 14 28 Q 20 25 26 28 L 25 32 L 15 32 Z" fill="#000" />
        {/* Зубы */}
        <rect x="16" y="28" width="2" height="2" fill="#fff" />
        <rect x="20" y="28" width="2" height="3" fill="#fff" />
        <rect x="23" y="28" width="2" height="2" fill="#fff" />
      </g>
    </svg>
  );
}

// ─── SPACE THEME ───────────────────────────────────────────
export function SpaceRobot({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .s-float { animation: sFloat 3s ease-in-out infinite; }
        @keyframes sFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
      <g className="s-float">
        {/* Купол лунохода */}
        <path d="M 10 20 A 10 10 0 0 1 30 20" fill="#bee3f8" opacity="0.6"/>
        <path d="M 12 20 A 8 8 0 0 1 28 20" fill="#ebf8ff" opacity="0.8"/>
        {/* База */}
        <rect x="8" y="20" width="24" height="8" rx="4" fill="#cbd5e0"/>
        {/* Антенна */}
        <line x1="20" y1="10" x2="20" y2="4" stroke="#718096" strokeWidth="1.5"/>
        <circle cx="20" cy="4" r="1.5" fill="#f6e05e"/>
        {/* Колеса (гусеницы) */}
        <rect x="6" y="26" width="8" height="6" rx="2" fill="#2d3748"/>
        <rect x="26" y="26" width="8" height="6" rx="2" fill="#2d3748"/>
      </g>
    </svg>
  );
}

export function SpaceWall({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Метеорит */}
      <path d="M 8 20 Q 5 10 15 6 Q 25 2 32 10 Q 38 20 30 32 Q 20 38 10 30 Z" fill="#718096"/>
      {/* Кратеры */}
      <circle cx="15" cy="15" r="3" fill="#4a5568"/>
      <circle cx="25" cy="22" r="4" fill="#4a5568"/>
      <circle cx="14" cy="28" r="2" fill="#4a5568"/>
    </svg>
  );
}

export function SpaceFinish({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .r-flame { animation: rFlame 0.5s infinite alternate; }
        @keyframes rFlame { 0% { transform: scaleY(1); } 100% { transform: scaleY(1.3); } }
      `}</style>
      {/* Ракета */}
      <path d="M 20 4 L 26 16 L 26 30 L 14 30 L 14 16 Z" fill="#e2e8f0"/>
      {/* Нос */}
      <path d="M 20 4 L 26 16 L 14 16 Z" fill="#e53e3e"/>
      {/* Окно */}
      <circle cx="20" cy="20" r="3" fill="#3182ce"/>
      <circle cx="20" cy="20" r="2" fill="#90cdf4"/>
      {/* Крылья */}
      <path d="M 14 24 L 10 32 L 14 30 Z" fill="#e53e3e"/>
      <path d="M 26 24 L 30 32 L 26 30 Z" fill="#e53e3e"/>
      {/* Огонь */}
      <g className="r-flame" transform-origin="20 30">
        <path d="M 16 30 L 20 38 L 24 30 Z" fill="#ed8936"/>
        <path d="M 18 30 L 20 34 L 22 30 Z" fill="#fbd38d"/>
      </g>
    </svg>
  );
}

export function SpaceResource({ size = 24, collected }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: collected ? 0.2 : 1 }}>
      <style>{`
        .c-shine { animation: cShine 2s infinite; }
        @keyframes cShine { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
      `}</style>
      {/* Кристалл */}
      <path d="M 12 2 L 18 10 L 12 22 L 6 10 Z" fill="#805ad5" className="c-shine"/>
      <path d="M 12 2 L 12 22 L 6 10 Z" fill="#9f7aea" opacity="0.6"/>
      <path d="M 12 2 L 18 10 L 15 10 Z" fill="#d6bcfa"/>
    </svg>
  );
}

export function SpaceHazard({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .sh-spin { animation: shSpin 8s linear infinite; transform-origin: 20px 20px; }
        @keyframes shSpin { 100% { transform: rotate(360deg); } }
      `}</style>
      <g className="sh-spin">
        {/* Астероид (Огненный метеорит) */}
        <path d="M 20 4 Q 30 5 36 15 Q 38 25 30 35 Q 20 38 10 32 Q 2 25 6 12 Q 10 2 20 4 Z" fill="#7c2d12" />
        <path d="M 22 6 Q 28 8 32 16 Q 34 24 28 32 Q 20 34 12 28 Q 6 22 8 14 Q 14 6 22 6 Z" fill="#b45309" />
        {/* Огненный след (кратеры) */}
        <circle cx="16" cy="14" r="3" fill="#451a03" opacity="0.8" />
        <circle cx="26" cy="22" r="4" fill="#451a03" opacity="0.8" />
        <circle cx="18" cy="28" r="2" fill="#451a03" opacity="0.8" />
      </g>
    </svg>
  );
}

export function DefaultResource({ size = 24, collected }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ opacity: collected ? 0.2 : 1 }}>
      {/* Шестеренка */}
      <circle cx="12" cy="12" r="6" fill="#94a3b8"/>
      <circle cx="12" cy="12" r="3" fill="#cbd5e1"/>
      <path d="M 12 2 L 14 6 L 10 6 Z M 12 22 L 14 18 L 10 18 Z M 2 12 L 6 10 L 6 14 Z M 22 12 L 18 10 L 18 14 Z" fill="#94a3b8"/>
    </svg>
  );
}

export function DefaultHazard({ size = 40 }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .dh-pulse { animation: dhPulse 1s infinite alternate; transform-origin: 20px 20px; }
        @keyframes dhPulse { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
      `}</style>
      {/* Ловушка / Шипы */}
      <rect x="6" y="6" width="28" height="28" rx="4" fill="#1e293b" />
      <g className="dh-pulse">
        <path d="M 12 30 L 16 10 L 20 30 Z" fill="#ef4444" />
        <path d="M 20 30 L 24 10 L 28 30 Z" fill="#ef4444" />
        <path d="M 8 20 L 32 20 L 20 28 Z" fill="#dc2626" />
      </g>
    </svg>
  );
}

// ─── РЕЕСТР ТЕМ ────────────────────────────────────────────

export const THEME_REGISTRY = {
  default: {
    Robot: DefaultRobot,
    Wall: DefaultWall,
    Finish: DefaultFinish,
    Coin: DefaultCoin,
    Start: DefaultStart,
    Resource: DefaultResource,
    Hazard: DefaultHazard,
    Background: 'linear-gradient(135deg, #0b0718 0%, #130a2a 100%)',
    GridColor: 'rgba(139,92,246,0.08)'
  },
  zombie: {
    Robot: ZombieRobot,
    Wall: ZombieWall,
    Finish: ZombieFinish,
    Coin: DefaultCoin,
    Start: DefaultStart,
    Resource: ZombieResource,
    Hazard: ZombieHazard,
    Background: 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)',
    GridColor: 'rgba(226,232,240,0.05)'
  },
  space: {
    Robot: SpaceRobot,
    Wall: SpaceWall,
    Finish: SpaceFinish,
    Coin: DefaultCoin,
    Start: DefaultStart,
    Resource: SpaceResource,
    Hazard: SpaceHazard,
    Background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    GridColor: 'rgba(255,255,255,0.03)'
  }
};
