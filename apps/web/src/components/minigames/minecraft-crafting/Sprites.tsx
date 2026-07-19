import React from 'react';

export interface SpriteProps {
  size?: number;
  className?: string;
}

// ─── CHARACTERS ─────────────────────────────────────────────
export function Steve({ size = 64, className = '' }: SpriteProps) {
  // 16x32 pixel art layout (Steve proportions: 8 head + 12 body + 12 legs = 32 tall, 16 wide)
  return (
    <svg width={size / 2} height={size} viewBox="0 0 16 32" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* --- Head (8x8) --- */}
      {/* Face Base */}
      <rect x="4" y="0" width="8" height="8" fill="#B37E58" />
      {/* Hair */}
      <rect x="4" y="0" width="8" height="2" fill="#362310" />
      <rect x="4" y="2" width="1" height="1" fill="#362310" />
      <rect x="11" y="2" width="1" height="1" fill="#362310" />
      
      {/* Eyes (Green based on user image) */}
      <rect x="5" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="6" y="4" width="1" height="1" fill="#00AA00" /> {/* Green pupil */}
      <rect x="9" y="4" width="1" height="1" fill="#FFFFFF" />
      <rect x="10" y="4" width="1" height="1" fill="#00AA00" /> {/* Green pupil */}
      
      {/* Nose */}
      <rect x="7" y="5" width="2" height="1" fill="#805435" />
      
      {/* Beard/Mouth (U-shape) */}
      <rect x="6" y="5" width="1" height="1" fill="#543A2A" />
      <rect x="9" y="5" width="1" height="1" fill="#543A2A" />
      <rect x="6" y="6" width="4" height="2" fill="#543A2A" />
      {/* Lips/Mouth slit */}
      <rect x="7" y="6" width="2" height="1" fill="#402518" />
      
      {/* --- Body (8x12) --- */}
      <rect x="4" y="8" width="8" height="12" fill="#00BABA" />
      {/* Collar/Neck details */}
      <rect x="6" y="8" width="4" height="1" fill="#B37E58" />
      <rect x="7" y="9" width="2" height="1" fill="#B37E58" />
      
      {/* --- Left Arm (4x12) --- */}
      <rect x="0" y="8" width="4" height="4" fill="#00BABA" /> {/* T-shirt sleeve */}
      <rect x="0" y="12" width="4" height="8" fill="#996A4A" /> {/* Skin */}
      
      {/* --- Right Arm (4x12) --- */}
      <rect x="12" y="8" width="4" height="4" fill="#00BABA" /> {/* T-shirt sleeve */}
      <rect x="12" y="12" width="4" height="8" fill="#996A4A" /> {/* Skin */}
      
      {/* --- Legs (4x12 each) --- */}
      {/* Left Leg */}
      <rect x="4" y="20" width="4" height="10" fill="#494697" /> {/* Pants */}
      <rect x="4" y="30" width="4" height="2" fill="#585858" /> {/* Shoe */}
      {/* Right Leg */}
      <rect x="8" y="20" width="4" height="10" fill="#494697" /> {/* Pants */}
      <rect x="8" y="30" width="4" height="2" fill="#585858" /> {/* Shoe */}
    </svg>
  );
}

// ─── BLOCKS ─────────────────────────────────────────────────
export function DiamondOre({ size = 64, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect width="8" height="8" fill="#7D7D7D" />
      {/* Stone texture details */}
      <rect x="1" y="1" width="1" height="1" fill="#5A5A5A" />
      <rect x="6" y="2" width="1" height="1" fill="#5A5A5A" />
      <rect x="2" y="6" width="1" height="1" fill="#5A5A5A" />
      {/* Diamonds */}
      <rect x="2" y="2" width="2" height="2" fill="#53F2F2" />
      <rect x="5" y="4" width="2" height="2" fill="#53F2F2" />
      <rect x="1" y="5" width="1" height="1" fill="#53F2F2" />
    </svg>
  );
}

export function DirtBlock({ size = 64, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect width="8" height="8" fill="#8B5A2B" />
      <rect x="1" y="2" width="2" height="1" fill="#6B4226" />
      <rect x="5" y="1" width="1" height="1" fill="#6B4226" />
      <rect x="2" y="5" width="1" height="2" fill="#6B4226" />
      <rect x="6" y="6" width="2" height="1" fill="#6B4226" />
      <rect x="0" y="0" width="8" height="2" fill="#4CAF50" /> {/* Grass top */}
    </svg>
  );
}

export function WoodBlock({ size = 64, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect width="8" height="8" fill="#5C4033" />
      {/* Bark texture lines */}
      <rect x="1" y="0" width="1" height="8" fill="#3E2723" />
      <rect x="4" y="0" width="1" height="8" fill="#3E2723" />
      <rect x="7" y="0" width="1" height="8" fill="#3E2723" />
    </svg>
  );
}

// ─── ITEMS (INVENTORY) ──────────────────────────────────────
export function WoodItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="4" height="4" fill="#8B5A2B" />
      <rect x="3" y="3" width="2" height="2" fill="#A0522D" />
    </svg>
  );
}

export function StickItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(1, -1)">
        {/* Shadow/Border */}
        {Array.from({length: 10}).map((_, i) => (
          <rect key={`b-${i}`} x={12 - i - 1} y={3 + i - 1} width="4" height="4" fill="#3A2312" />
        ))}
        {/* Core Wood */}
        {Array.from({length: 10}).map((_, i) => (
          <rect key={`i1-${i}`} x={12 - i} y={3 + i} width="2" height="2" fill="#8A5A30" />
        ))}
        {/* Highlight/Shadow pixels for texture */}
        {Array.from({length: 10}).map((_, i) => (
          <rect key={`i2-${i}`} x={12 - i + 1} y={3 + i + 1} width="1" height="1" fill="#583918" />
        ))}
      </g>
    </svg>
  );
}

export function IronItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* Outer Outline */}
      <path fill="#3b3b3b" d="M6 4h4v1h2v1h2v3h1v3h-1v2h-2v1H7v-1H5v-1H3v-2H2V7h1V5h2V4z" />
      {/* White Highlight */}
      <path fill="#ffffff" d="M6 5h4v1h2v1H5V6h1V5z" />
      {/* Light Grey Core */}
      <path fill="#d9d9d9" d="M5 6h7v1h1v1h-5v1H4V7h1V6z" />
      {/* Mid Grey Lower */}
      <path fill="#a4a4a4" d="M3 8h1v1h4v1h5v1H8v1H6v-1H4v-1H3V8z" />
      {/* Dark Grey Bottom Shadow */}
      <path fill="#7c7c7c" d="M4 10h2v1h2v1h4v-2h1v2h-2v1H7v-1H5v-1H4v-1z" />
    </svg>
  );
}

export function IronPickaxeItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="2" y="5" width="1" height="1" fill="#8B5A2B" />
      <rect x="3" y="4" width="1" height="1" fill="#8B5A2B" />
      <rect x="4" y="3" width="1" height="1" fill="#8B5A2B" />
      {/* Pickaxe Head */}
      <rect x="5" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="6" y="2" width="1" height="1" fill="#D8D8D8" />
      <rect x="4" y="1" width="1" height="1" fill="#FFFFFF" />
      <rect x="3" y="1" width="1" height="1" fill="#D8D8D8" />
      <rect x="2" y="2" width="1" height="1" fill="#A0A0A0" />
      <rect x="5" y="1" width="2" height="1" fill="#A0A0A0" />
    </svg>
  );
}

export function TrashItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="4" height="4" fill="#333333" />
      <rect x="3" y="4" width="2" height="2" fill="#555555" />
      <rect x="1" y="2" width="6" height="1" fill="#222222" />
      <rect x="3" y="1" width="2" height="1" fill="#222222" />
    </svg>
  );
}
