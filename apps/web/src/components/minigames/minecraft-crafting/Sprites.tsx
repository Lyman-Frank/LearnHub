import React from 'react';

export interface SpriteProps {
  size?: number;
  className?: string;
}

// ─── CHARACTERS ─────────────────────────────────────────────
export function Steve({ size = 64, className = '' }: SpriteProps) {
  // Simple 8x8 pixel art scaled up
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <rect x="2" y="0" width="4" height="4" fill="#E2C096" />
      {/* Hair */}
      <rect x="2" y="0" width="4" height="1" fill="#4A3424" />
      <rect x="2" y="1" width="1" height="1" fill="#4A3424" />
      <rect x="5" y="1" width="1" height="1" fill="#4A3424" />
      {/* Eyes */}
      <rect x="3" y="2" width="1" height="1" fill="#FFFFFF" />
      <rect x="4" y="2" width="1" height="1" fill="#3D2980" />
      {/* Body */}
      <rect x="2" y="4" width="4" height="3" fill="#00A8A8" />
      {/* Arms */}
      <rect x="1" y="4" width="1" height="3" fill="#E2C096" />
      <rect x="6" y="4" width="1" height="3" fill="#E2C096" />
      {/* Legs */}
      <rect x="2" y="7" width="1" height="1" fill="#3A3A98" />
      <rect x="5" y="7" width="1" height="1" fill="#3A3A98" />
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
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="1" width="2" height="2" fill="#8B5A2B" />
      <rect x="3" y="3" width="2" height="2" fill="#8B5A2B" />
      <rect x="1" y="5" width="2" height="2" fill="#8B5A2B" />
    </svg>
  );
}

export function IronItem({ size = 32, className = '' }: SpriteProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 8 8" className={`pixelated ${className}`} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="4" height="3" fill="#D8D8D8" />
      <rect x="3" y="2" width="2" height="1" fill="#FFFFFF" />
      <rect x="2" y="5" width="4" height="1" fill="#A0A0A0" />
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
