'use client';
// ═══════════════════════════════════════════════════════════
// SVG-СПРАЙТЫ — Все игровые объекты с анимацией
// ═══════════════════════════════════════════════════════════

// ─── Робот ─────────────────────────────────────────────────
export function RobotSprite({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .robot-eye { animation: blink 3s ease-in-out infinite; }
        .robot-antenna { animation: wiggle 2s ease-in-out infinite; }
        .robot-leg-l { animation: legL 0.8s ease-in-out infinite; }
        .robot-leg-r { animation: legR 0.8s ease-in-out infinite; }
        @keyframes blink {
          0%, 92%, 100% { opacity: 1; } 95% { opacity: 0; }
        }
        @keyframes wiggle {
          0%, 100% { transform-origin: bottom center; transform: rotate(-8deg); }
          50% { transform-origin: bottom center; transform: rotate(8deg); }
        }
        @keyframes legL {
          0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-2px); }
        }
        @keyframes legR {
          0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(0px); }
        }
      `}</style>
      {/* Антенна */}
      <g className="robot-antenna">
        <line x1="20" y1="5" x2="20" y2="1" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="1" r="1.5" fill="#c4b5fd"/>
      </g>
      {/* Голова */}
      <rect x="11" y="5" width="18" height="14" rx="4" fill="#7c3aed"/>
      <rect x="12" y="6" width="16" height="12" rx="3" fill="#8b5cf6"/>
      {/* Глаза */}
      <g className="robot-eye">
        <circle cx="16" cy="12" r="3" fill="#1e1b4b"/>
        <circle cx="24" cy="12" r="3" fill="#1e1b4b"/>
        <circle cx="16" cy="12" r="1.5" fill="#60a5fa"/>
        <circle cx="24" cy="12" r="1.5" fill="#60a5fa"/>
        <circle cx="16.8" cy="11.2" r="0.7" fill="white"/>
        <circle cx="24.8" cy="11.2" r="0.7" fill="white"/>
      </g>
      {/* Тело */}
      <rect x="12" y="20" width="16" height="12" rx="3" fill="#6d28d9"/>
      {/* Панель на теле */}
      <rect x="15" y="23" width="4" height="3" rx="1" fill="#4c1d95"/>
      <rect x="21" y="23" width="4" height="3" rx="1" fill="#4c1d95"/>
      <circle cx="20" cy="28" r="1.5" fill="#a78bfa"/>
      {/* Руки */}
      <rect x="7" y="21" width="4" height="8" rx="2" fill="#7c3aed"/>
      <rect x="29" y="21" width="4" height="8" rx="2" fill="#7c3aed"/>
      {/* Ноги */}
      <g className="robot-leg-l">
        <rect x="13" y="32" width="5" height="6" rx="2" fill="#5b21b6"/>
        <rect x="12" y="36" width="7" height="3" rx="1.5" fill="#4c1d95"/>
      </g>
      <g className="robot-leg-r">
        <rect x="22" y="32" width="5" height="6" rx="2" fill="#5b21b6"/>
        <rect x="21" y="36" width="7" height="3" rx="1.5" fill="#4c1d95"/>
      </g>
    </svg>
  );
}

// ─── Стена / Препятствие ────────────────────────────────────
export function WallSprite({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Тень */}
      <rect x="4" y="6" width="34" height="30" rx="3" fill="#1e1b4b" opacity="0.3"/>
      {/* Основная стена */}
      <rect x="2" y="4" width="34" height="30" rx="3" fill="#374151"/>
      <rect x="2" y="4" width="34" height="30" rx="3" fill="url(#wallGrad)"/>
      <defs>
        <linearGradient id="wallGrad" x1="2" y1="4" x2="36" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4b5563"/>
          <stop offset="1" stopColor="#1f2937"/>
        </linearGradient>
      </defs>
      {/* Кирпичный узор — ряд 1 */}
      <rect x="3" y="5" width="15" height="8" rx="1" fill="#6b7280" opacity="0.5"/>
      <rect x="20" y="5" width="15" height="8" rx="1" fill="#6b7280" opacity="0.5"/>
      {/* Ряд 2 */}
      <rect x="3" y="15" width="9" height="8" rx="1" fill="#6b7280" opacity="0.4"/>
      <rect x="14" y="15" width="11" height="8" rx="1" fill="#6b7280" opacity="0.4"/>
      <rect x="27" y="15" width="8" height="8" rx="1" fill="#6b7280" opacity="0.4"/>
      {/* Ряд 3 */}
      <rect x="3" y="25" width="15" height="8" rx="1" fill="#6b7280" opacity="0.5"/>
      <rect x="20" y="25" width="15" height="8" rx="1" fill="#6b7280" opacity="0.5"/>
      {/* Трещины */}
      <line x1="10" y1="5" x2="12" y2="13" stroke="#9ca3af" strokeWidth="0.7" opacity="0.5"/>
      <line x1="25" y1="15" x2="23" y2="25" stroke="#9ca3af" strokeWidth="0.7" opacity="0.4"/>
    </svg>
  );
}

// ─── Финишный знак ──────────────────────────────────────────
export function FinishSprite({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        .flag-wave { animation: flagWave 1.5s ease-in-out infinite; transform-origin: 8px 4px; }
        .finish-glow { animation: finishGlow 2s ease-in-out infinite; }
        @keyframes flagWave {
          0%, 100% { transform: skewX(0deg); }
          30% { transform: skewX(-6deg); }
          70% { transform: skewX(4deg); }
        }
        @keyframes finishGlow {
          0%, 100% { opacity: 0.4; } 50% { opacity: 0.9; }
        }
      `}</style>
      {/* Сияние */}
      <circle cx="20" cy="20" r="18" fill="#fbbf24" className="finish-glow" opacity="0.3"/>
      {/* Столб */}
      <rect x="8" y="4" width="3" height="32" rx="1.5" fill="#d97706"/>
      <rect x="8" y="34" width="8" height="4" rx="2" fill="#92400e"/>
      {/* Флаг */}
      <g className="flag-wave">
        {/* Шахматный узор */}
        <rect x="11" y="4" width="20" height="16" rx="2" fill="#fbbf24"/>
        <rect x="11" y="4" width="10" height="8" fill="#1e1b4b"/>
        <rect x="21" y="12" width="10" height="8" fill="#1e1b4b"/>
        <rect x="11" y="12" width="10" height="8" fill="#fbbf24"/>
        <rect x="21" y="4" width="10" height="8" fill="#fbbf24"/>
        {/* Рамка флага */}
        <rect x="11" y="4" width="20" height="16" rx="2" fill="none" stroke="#f59e0b" strokeWidth="1"/>
      </g>
      {/* Звёздочки */}
      <circle cx="33" cy="8" r="2" fill="#fcd34d" opacity="0.8"/>
      <circle cx="36" cy="16" r="1.5" fill="#fcd34d" opacity="0.6"/>
      <circle cx="30" cy="22" r="1" fill="#fcd34d" opacity="0.5"/>
    </svg>
  );
}

// ─── Монета / Звезда ────────────────────────────────────────
export function CoinSprite({ size = 24, collected = false }: { size?: number; collected?: boolean }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: collected ? 0.2 : 1, transition: 'opacity 0.3s' }}
    >
      <style>{`
        .coin-spin { animation: coinSpin 2s linear infinite; transform-origin: 12px 12px; }
        .coin-shine { animation: coinShine 1.5s ease-in-out infinite; }
        @keyframes coinSpin {
          0% { transform: scaleX(1); } 
          25% { transform: scaleX(0.2); } 
          50% { transform: scaleX(1); }
          75% { transform: scaleX(0.2); }
          100% { transform: scaleX(1); }
        }
        @keyframes coinShine {
          0%, 100% { opacity: 0.6; } 50% { opacity: 1; }
        }
      `}</style>
      <g className="coin-spin">
        <circle cx="12" cy="12" r="10" fill="#fbbf24"/>
        <circle cx="12" cy="12" r="8" fill="#f59e0b"/>
        <circle cx="12" cy="12" r="8" fill="url(#coinGrad)"/>
        <defs>
          <radialGradient id="coinGrad" cx="0.35" cy="0.35" r="0.65">
            <stop stopColor="#fde68a"/>
            <stop offset="1" stopColor="#d97706"/>
          </radialGradient>
        </defs>
        {/* Символ звезды */}
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold" className="coin-shine">★</text>
      </g>
    </svg>
  );
}

// ─── Стартовая клетка ───────────────────────────────────────
export function StartSprite({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="16" fill="#10b981" opacity="0.15"/>
      <circle cx="20" cy="20" r="12" fill="#10b981" opacity="0.25"/>
      <circle cx="20" cy="20" r="7" fill="#34d399"/>
      <path d="M17 16L25 20L17 24V16Z" fill="white"/>
    </svg>
  );
}
